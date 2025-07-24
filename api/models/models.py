import os
import sys
import logging
import torch
import torch.nn as nn

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)


from constants.constants import (
    ACTOR_MODEL_INVALID_PATH_MSG,
    ACTOR_MODEL_FILE_NOT_FOUND_MSG,
    ACTOR_MODEL_LOADED_MSG,
    ACTOR_MODEL_ERROR_MSG,
    CRITIC_MODEL_INVALID_PATH_MSG,
    CRITIC_MODEL_FILE_NOT_FOUND_MSG,
    CRITIC_MODEL_LOADED_MSG,
    CRITIC_MODEL_ERROR_MSG,
    HYPO_THRESHOLD,
    SEVERE_HYPO_THRESHOLD,
    HYPOGLYCEMIA_GAIN_FACTOR,
    LOW_GLUCOSE_GAIN_FACTOR,
    MIN_GAIN_VALUE,
    MAX_GAIN_VALUE,
    ICR_DEFAULT,
    ISF_DEFAULT,
    TARGET_BG,
    MIN_BOLUS,
    MAX_BOLUS
)

# Configuración del logger
logger = logging.getLogger(__name__)

class Actor(nn.Module):
    def __init__(self, state_dim, action_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, 400), nn.ReLU(),
            nn.Linear(400, 300), nn.ReLU(),
            nn.Linear(300, action_dim), nn.Tanh()
        )

    def forward(self, x):
        return self.net(x) * 0.5 + 1.0

class Critic(nn.Module):
    def __init__(self, state_dim, action_dim):
        super().__init__()
        self.net1 = nn.Sequential(
            nn.Linear(state_dim + action_dim, 400), nn.ReLU(),
            nn.Linear(400, 300), nn.ReLU(),
            nn.Linear(300, 1)
        )

    def forward(self, state, action):
        return self.net1(torch.cat([state, action], dim=1))

def load_actor_model(
    model_path: str, 
    state_dim: int, 
    action_dim: int, 
    device: str = "cpu"
) -> Actor:
    """
    Carga un modelo Actor preentrenado desde un archivo .pth.
    
    Parámetros:
    -----------
    model_path : str
        Ruta al archivo del modelo (.pth).
    state_dim : int
        Dimensión del espacio de estados.
    action_dim : int
        Dimensión del espacio de acciones.
    device : str
        Dispositivo para cargar el modelo ('cpu' o 'cuda').
        
    Retorna:
    --------
    Actor
        Modelo Actor cargado y configurado para evaluación.
        
    Raises:
    -------
    FileNotFoundError
        Si el archivo del modelo no existe.
    RuntimeError
        Si hay error al cargar el modelo.
    ValueError
        Si la ruta del modelo es inválida.
    """

    if not model_path or not isinstance(model_path, str):
        # logger.error(ACTOR_MODEL_INVALID_PATH_MSG)
        raise ValueError(ACTOR_MODEL_INVALID_PATH_MSG)
    
    if not model_path.endswith('.pth'):
        # logger.error(f"{ACTOR_MODEL_INVALID_PATH_MSG}: debe terminar en .pth")
        raise ValueError(f"{ACTOR_MODEL_INVALID_PATH_MSG}: debe terminar en .pth")
    
    try:
        if not os.path.exists(model_path):
            # logger.error(f"{ACTOR_MODEL_FILE_NOT_FOUND_MSG}: {model_path}")
            raise FileNotFoundError(f"{ACTOR_MODEL_FILE_NOT_FOUND_MSG}: {model_path}")
        
        # Crear instancia del modelo Actor
        actor_model: Actor = Actor(state_dim, action_dim).to(device)
        
        # Cargar los parámetros del modelo
        state_dict: dict = torch.load(model_path, map_location=device)
        actor_model.load_state_dict(state_dict)
        
        # Configurar para evaluación (deshabilitar dropout, batchnorm, etc.)
        actor_model.eval()
        
        # logger.info(f"{ACTOR_MODEL_LOADED_MSG} {model_path}")
        return actor_model
        
    except torch.serialization.pickle.UnpicklingError as e:
        # logger.error(f"{ACTOR_MODEL_ERROR_MSG} {model_path}: Error de deserialización - {e}")
        raise RuntimeError(f"{ACTOR_MODEL_ERROR_MSG} {model_path}: Error de deserialización")
    
    except Exception as e:
        # logger.error(f"{ACTOR_MODEL_ERROR_MSG} {model_path}: {e}")
        raise RuntimeError(f"{ACTOR_MODEL_ERROR_MSG} {model_path}: {str(e)}")

def load_critic_model(
    model_path: str, 
    state_dim: int, 
    action_dim: int, 
    device: str = "cpu"
) -> Critic:
    """
    Carga un modelo Crítico preentrenado desde un archivo .pth.
    
    Parámetros:
    -----------
    model_path : str
        Ruta al archivo del modelo (.pth).
    state_dim : int
        Dimensión del espacio de estados.
    action_dim : int
        Dimensión del espacio de acciones.
    device : str
        Dispositivo para cargar el modelo ('cpu' o 'cuda').
        
    Retorna:
    --------
    Critic
        Modelo Crítico cargado y configurado para evaluación.
        
    Raises:
    -------
    FileNotFoundError
        Si el archivo del modelo no existe.
    RuntimeError
        Si hay error al cargar el modelo.
    ValueError
        Si la ruta del modelo es inválida.
    """
    
    if not model_path or not isinstance(model_path, str):
        # logger.error(CRITIC_MODEL_INVALID_PATH_MSG)
        raise ValueError(CRITIC_MODEL_INVALID_PATH_MSG)
    
    if not model_path.endswith('.pth'):
        # logger.error(f"{CRITIC_MODEL_INVALID_PATH_MSG}: debe terminar en .pth")
        raise ValueError(f"{CRITIC_MODEL_INVALID_PATH_MSG}: debe terminar en .pth")
    
    try:
        if not os.path.exists(model_path):
            # logger.error(f"{CRITIC_MODEL_FILE_NOT_FOUND_MSG}: {model_path}")
            raise FileNotFoundError(f"{CRITIC_MODEL_FILE_NOT_FOUND_MSG}: {model_path}")
        
        # Crear instancia del modelo Crítico
        critic_model: Critic = Critic(state_dim, action_dim).to(device)
        
        # Cargar los parámetros del modelo
        state_dict: dict = torch.load(model_path, map_location=device)
        critic_model.load_state_dict(state_dict)
        
        # Configurar para evaluación (deshabilitar dropout, batchnorm, etc.)
        critic_model.eval()
        
        # logger.info(f"{CRITIC_MODEL_LOADED_MSG} {model_path}")
        return critic_model
        
    except torch.serialization.pickle.UnpicklingError as e:
        logger.error(f"{CRITIC_MODEL_ERROR_MSG} {model_path}: Error de deserialización - {e}")
        raise RuntimeError(f"{CRITIC_MODEL_ERROR_MSG} {model_path}: Error de deserialización")

def apply_safety_constraints(action_gains: torch.Tensor, cgm: float) -> torch.Tensor:
    """
    Aplica restricciones de seguridad a las ganancias de acción del actor.
    
    Parámetros:
    -----------
    action_gains : torch.Tensor
        Ganancias de acción del modelo actor.
    cgm : float
        Valor actual de glucosa (mg/dL).
        
    Retorna:
    --------
    torch.Tensor
        Ganancias de acción con restricciones de seguridad aplicadas.
    """
    # Constantes de seguridad
    
    # Copiar tensor para no modificar el original
    safe_gains: torch.Tensor = action_gains.clone()
    
    # Aplicar restricciones basadas en nivel de glucosa
    if cgm < HYPO_THRESHOLD:
        # Reducir drásticamente las ganancias en hipoglucemia
        safe_gains *= HYPOGLYCEMIA_GAIN_FACTOR
        # logger.warning(f"Restricción de hipoglucemia aplicada: CGM={cgm}")
    elif cgm < SEVERE_HYPO_THRESHOLD:
        # Reducir moderadamente las ganancias en glucosa baja
        safe_gains *= LOW_GLUCOSE_GAIN_FACTOR
        # logger.info(f"Restricción de glucosa baja aplicada: CGM={cgm}")
    
    # Asegurar que las ganancias estén en rango válido
    safe_gains = torch.clamp(safe_gains, MIN_GAIN_VALUE, MAX_GAIN_VALUE)
    
    return safe_gains

def compute_bolus(
    gains: torch.Tensor,
    cho: float,
    cgm: float,
    iob: float,
    mealtime: bool
) -> float:
    """
    Calcula la dosis de bolo de insulina basada en ganancias del actor y parámetros clínicos.
    
    Parámetros:
    -----------
    gains : torch.Tensor
        Ganancias del modelo actor [ganancia_cho, ganancia_correccion, ganancia_iob].
    cho : float
        Carbohidratos a consumir (gramos).
    cgm : float
        Valor actual de glucosa (mg/dL).
    iob : float
        Insulina activa (Unidades).
    mealtime : bool
        Indica si es momento de comida.
        
    Retorna:
    --------
    float
        Dosis de bolo calculada (Unidades).
    """
    bolus_total: float = 0.0
    
    # Convertir tensor a numpy para cálculos
    gains_np: torch.Tensor = gains.detach()
    
    # Componente de comida
    if mealtime and cho > 0:
        bolus_comida: float = (cho / ICR_DEFAULT) * gains_np[0].item()
        bolus_total += bolus_comida
    
    # Componente de corrección
    if cgm > TARGET_BG:
        correccion: float = (cgm - TARGET_BG) / ISF_DEFAULT
        bolus_correccion: float = correccion * gains_np[1].item()
        bolus_total += bolus_correccion
    
    # Ajuste por insulina activa
    if iob > 0:
        ajuste_iob: float = iob * gains_np[2].item()
        bolus_total = max(0.0, bolus_total - ajuste_iob)
    
    # Aplicar restricciones de seguridad
    if cgm < HYPO_THRESHOLD:
        bolus_total = 0.0
        # logger.warning(f"Bolo cancelado por hipoglucemia: CGM={cgm}")
    
    # Redondear a bolo mínimo si es muy pequeño
    if 0 < bolus_total < MIN_BOLUS:
        bolus_total = MIN_BOLUS
    elif bolus_total < 0:
        bolus_total = 0.0
    
    # Aplicar límite máximo
    bolus_total = min(bolus_total, MAX_BOLUS)
    
    return bolus_total