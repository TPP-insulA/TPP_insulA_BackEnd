import sys
import json
import datetime
import numpy as np
import torch
import torch.nn as nn
import logging
from pathlib import Path
import pandas as pd
import pkg_resources

# Configure logging
logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants from training
MIN_BOLUS = 0.1
MAX_BOLUS_ABS = 25.0
CORRECTION_BG = 120.0
ICR = 10.0
ISF = 50.0

# Modelo global para evitar recargas innecesarias
_actors = {}
cgm_history = []
cgm_history_max = 12

class Actor(nn.Module):
    def __init__(self, state_dim=5, action_dim=3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, 512), nn.LayerNorm(512), nn.ReLU(),
            nn.Linear(512, 256), nn.LayerNorm(256), nn.ReLU(),
            nn.Linear(256, action_dim)
        )
        self._init_weights()

    def _init_weights(self):
        for module in self.net:
            if isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight)
                nn.init.constant_(module.bias, 0.0)
            elif isinstance(module, nn.LayerNorm):
                nn.init.constant_(module.weight, 1.0)
                nn.init.constant_(module.bias, 0.0)

    def forward(self, x):
        x = self.net(x)
        x = torch.relu(x)
        x = torch.sigmoid(x * 0.1)
        return x * 1.8 + 0.2

def load_actor_model(model_path, device='cpu'):
    global _actors
    model_path_str = str(model_path)
    if model_path_str not in _actors:
        try:
            actor = Actor()
            actor.load_state_dict(torch.load(model_path, map_location=device))
            actor.eval()  # Asegurar que esté en modo evaluación
            if device == 'cuda':
                actor = actor.cuda()
            _actors[model_path_str] = actor
            logger.info(f'Model loaded from {model_path_str}')
            logger.info(f'Model training mode: {actor.training}')
            
        except Exception as e:
            logger.error(f'Failed to load model from {model_path_str}: {str(e)}')
            raise
    return _actors[model_path_str]

def load_quest_params(patient_name):
    """Carga los parámetros del paciente desde Quest.csv."""
    quest_file = Path('C:/Users/ruso_/TPP_insulA_BackEnd/src/utils/Quest.csv')
    
    try:
        quest_df = pd.read_csv(quest_file)
        
        if any(quest_df.Name.str.match(patient_name)):
            params = quest_df[quest_df.Name.str.match(patient_name)].iloc[0]
            icr = params['CR'] 
            isf = params['CF']
        else:
            logger.warning(f'Patient {patient_name} not found in Quest.csv, using default parameters')
            icr = ICR
            isf = ISF
    except Exception as e:
        logger.warning(f'Error loading Quest.csv: {e}, using default parameters')
        icr = ICR
        isf = ISF
    
    return icr, isf

def calculate_trend_factor(cgm_history, current_cgm):
    """
    Calcula un factor de tendencia basado en:
    - Tendencia a corto plazo (15 min)
    - Tendencia a mediano plazo (30 min)
    - Aceleración (cambio en la tendencia)
    """
    if not cgm_history or len(cgm_history) < 6:
        return 1.0
    
    trend_15min = (current_cgm - cgm_history[-3]) / 15 if len(cgm_history) >= 3 else 0
    trend_30min = (current_cgm - cgm_history[-6]) / 30 if len(cgm_history) >= 6 else 0
    
    acceleration = 0
    if len(cgm_history) >= 9:
        trend_45min = (cgm_history[-6] - cgm_history[-9]) / 15
        acceleration = trend_15min - trend_45min
    
    if trend_30min > 3.0:
        base_factor = 1.3
    elif trend_30min > 2.0:
        base_factor = 1.2
    elif trend_30min > 1.0:
        base_factor = 1.1
    elif trend_30min < -3.0:
        base_factor = 0.6
    elif trend_30min < -2.0:
        base_factor = 0.75
    elif trend_30min < -1.0:
        base_factor = 0.9
    else:
        base_factor = 1.0
    
    if acceleration > 1.0:
        base_factor *= 1.1
    elif acceleration < -1.0:
        base_factor *= 0.9
    
    if abs(trend_15min) > abs(trend_30min) * 1.5:
        base_factor *= 1.1
    
    return np.clip(base_factor, 0.5, 2.0)

def update_cgm_history(cgm):
    """Actualiza el historial de CGM."""
    global cgm_history
    cgm_history.append(cgm)
    if len(cgm_history) > cgm_history_max:
        cgm_history.pop(0)
    return cgm_history

def apply_hypo_guard(cgm_value: float, bolus: float, threshold: float = 70.0) -> float:
    """
    Si el CGM está por debajo del umbral de hipoglucemia, se fuerza el bolo a 0.
    Implementa una reducción gradual del bolo cerca del umbral.
    """
    if cgm_value < threshold:
        if cgm_value < 50:  # Hipoglucemia severa
            return 0.0
        else:  # Zona de transición
            reduction_factor = (cgm_value - 50) / (threshold - 50)
            return bolus * reduction_factor
    return bolus

def apply_contextual_constraints(gains, cgm, cho):
    """
    Aplica restricciones contextuales a los gains basadas en el estado glucémico.
    """
    gains = gains.copy()  # Crear una copia para no modificar el original
    
    if cgm < 70:  # Hipoglucemia
        gains[0] *= 0.5  # Reducir gain de comida
        gains[1] *= 0.1  # Reducir gain de corrección
    elif cgm > 250:  # Hiperglucemia severa
        gains[1] *= 1.5  # Aumentar gain de corrección
    
    return gains

def compute_bolus(gains, cho, cgm, iob, mealtime, patient_icr=None, patient_isf=None, cgm_history=None):
    """
    Calcula la dosis de insulina basada en los parámetros de entrada.
    Usa los parámetros clínicos específicos del paciente si están disponibles,
    o los globales por defecto.
    """
    bg = cgm  # Asignar siempre el valor de glucosa actual
    
    trend_factor = calculate_trend_factor(cgm_history, bg) if cgm_history else 1.0
    
    # Convertir gains a numpy si es tensor
    if isinstance(gains, torch.Tensor):
        gains = gains.detach().cpu().numpy()

    # Aplicar restricciones contextuales
    gains = apply_contextual_constraints(gains, bg, cho)

    icr_to_use = patient_icr if patient_icr is not None else ICR
    isf_to_use = patient_isf if patient_isf is not None else ISF
    
    bolus = 0.0
    correction_dose = 0.0
    meal_dose = 0.0

    # Calcular componente de comida
    if mealtime and cho > 0:
        meal_dose = (cho / icr_to_use) * gains[0]
        bolus += meal_dose

    # Calcular componente de corrección
    if bg > CORRECTION_BG:
        correction = (bg - CORRECTION_BG) / isf_to_use * trend_factor
        correction_dose = correction * gains[1]
        bolus += correction_dose

    # Ajustar por insulina activa
    if iob > 0:
        iob_reduction = iob * gains[2]
        bolus = max(0, bolus - iob_reduction)

    # Aplicar límites de seguridad
    bolus = apply_hypo_guard(bg, bolus)

    # Si el bolo es positivo pero muy pequeño, redondear a min_bolus
    if 0 < bolus < MIN_BOLUS:
        bolus = MIN_BOLUS

    bolus = min(bolus, MAX_BOLUS_ABS)

    # Recalcular desglose si el bolo total fue ajustado
    if bolus == 0:
        meal_dose = 0
        correction_dose = 0
    else:
        total_calculated = (meal_dose + correction_dose) - (iob_reduction if iob > 0 else 0)
        if total_calculated > 0:
            ratio = bolus / total_calculated
            meal_dose *= ratio
            correction_dose *= ratio

    return bolus, meal_dose, correction_dose

def prepare_state(cgm, cho, hour_of_day, iob, cgm_history=None):
    """Prepara el estado para el modelo DRL, incluyendo trend_factor."""
    minutes_since_midnight = hour_of_day * 60
    cho_rate = cho / 5.0 if cho > 0 else 0.0  # Distribución en 5 minutos
    trend_factor = calculate_trend_factor(cgm_history, cgm) if cgm_history else 1.0
    state = np.array([cgm, cho_rate, minutes_since_midnight, iob, trend_factor], dtype=np.float32)
    logger.info(f'Prepared state: {state}')
    return state

def predict_insulin(data):
    global cgm_history
    try:
        logger.info('Starting insulin prediction')
        logger.info(f'Input data: {json.dumps(data, indent=2)}')
        
        # Cargar modelo
        patient_name = data.get('patient_name', 'adult#002')
        model_path = Path(f'C:/Users/ruso_/TPP_insulA_BackEnd/src/utils/personalized_actor_{patient_name}.pth')
        if not model_path.exists():
            model_path = Path('C:/Users/ruso_/TPP_insulA_BackEnd/src/utils/population_actor.pth')
            logger.warning(f"Personalized model for {patient_name} not found. Using population model.")

        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        actor = load_actor_model(model_path, device)
        
        # Cargar parámetros del paciente
        patient_icr, patient_isf = load_quest_params(patient_name)
        
        # Parsear los datos de entrada
        request_date = datetime.datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
        hour_of_day = request_date.hour
        cgm = float(data['cgm'])
        cho = float(data['carbs'])
        iob = float(data.get('insulinOnBoard', 0.0))
        
        # Actualizar historial de CGM
        if 'cgm_history' in data and data['cgm_history']:
             cgm_history = data['cgm_history']
        else:
             cgm_history = update_cgm_history(cgm)

        # Preparar el estado
        state = prepare_state(cgm, cho, hour_of_day, iob, cgm_history)
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(device)
        
        # Obtener las ganancias del actor (igual que en validación)
        with torch.no_grad():
            gains = actor(state_tensor).cpu().numpy()[0]
        logger.info(f'Predicted gains: {gains}')
        
        # Calcular el bolo
        mealtime = cho > 0
        bolus, meal_dose, correction_dose = compute_bolus(gains, cho, cgm, iob, mealtime, patient_icr, patient_isf, cgm_history)
        
        # Convertir a float nativo
        bolus = round(float(bolus), 2)
        correction_dose = round(float(correction_dose), 2)
        meal_dose = round(float(meal_dose), 2)
        
        # Retornar el resultado
        result = {
            "total": bolus,
            "breakdown": {
                "correctionDose": correction_dose,
                "mealDose": meal_dose,
                "activityAdjustment": 0.0,
                "timeAdjustment": 0.0
            }
        }
        logger.info(f'Returning result: {json.dumps(result, indent=2)}')
        return result
    except Exception as e:
        logger.error(f'Error in predict_insulin: {str(e)}', exc_info=True)
        return {
            "total": 0.0,
            "breakdown": {
                "correctionDose": 0.0,
                "mealDose": 0.0,
                "activityAdjustment": 0.0,
                "timeAdjustment": 0.0
            },
            "error": str(e)
        }

if __name__ == "__main__":
    try:
        logger.info('Starting model predictor script')
        input_data = json.loads(sys.stdin.read())
        logger.info('Input data received')
        result = predict_insulin(input_data)
        print(json.dumps(result))
        logger.info('Prediction completed and result sent')
    except Exception as e:
        logger.error(f'Error in main: {str(e)}', exc_info=True)
        print(json.dumps({"error": str(e)}))