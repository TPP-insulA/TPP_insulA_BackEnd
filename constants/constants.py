# Dimensiones del estado y acción
from typing import Dict, Tuple


STATE_DIM: int = 4  # CGM + CHO + tiempo_comida + IOB
ACTION_DIM: int = 3  # ganancias: g_ICR, g_ISF, g_IOB

# Replay Buffer y entrenamiento
BUFFER_SIZE: int = 50000
BATCH_SIZE: int = 128
GAMMA: float = 0.99
TAU: float = 0.001
LR_ACTOR: float = 1e-4
LR_CRITIC: float = 1e-3
NOISE_STD: float = 0.1
UPDATE_FREQ: int = 4
WEIGHT_DECAY: float = 1e-2

# Prioritized Replay Buffer
PRIORITY_ALPHA: float = 0.6  # Grado de priorización (0 = uniforme)
PRIORITY_BETA: float = 0.4   # Grado de compensación de sesgo
PRIORITY_EPS: float = 1e-6   # Pequeña constante para evitar prioridad cero


# Parámetros clínicos y de seguridad
ICR: int = 8           # Insulin to Carb Ratio (g/U)
IC_RATIO: int = 10      # Alias para compatibilidad
ISF: int = 40          # Insulin Sensitivity Factor (mg/dL/U)
TARGET_BG: int = 110    # Glucosa objetivo (mg/dL)
MAX_BOLUS: float = 25.0   # Bolo máximo permitido (U/min)
MIN_BOLUS: float = 0.1    # Bolo mínimo permitido (U)
MAX_BOLUS_ABS: float = 20.0 # Bolo absoluto máximo (U)

# Entrenamiento
N_DAYS_POPULATION: int = 180   # Días para entrenamiento poblacional
N_DAYS_PERSONALIZED: int = 180 # Días para entrenamiento personalizado
WINDOW_SIZE: int = 100        # Tamaño de ventana para convergencia
CONVERGENCE_THRESHOLD: float = 0.01

# Protocolo de comidas
MEAL_TIMES: Dict[str, Tuple[int, int, int]] = {
    'desayuno': (7, 0, 70),
    'almuerzo': (14, 0, 110),
    'cena': (21, 0, 90)
}
MEAL_TIME_VARIATION_MIN: int = -30  # minutos
MEAL_TIME_VARIATION_MAX: int = 30   # minutos
MEAL_CHO_VARIATION_MIN: float = 0.8   # 80%
MEAL_CHO_VARIATION_MAX: float = 1.2   # 120%
MEAL_ESTIMATION_VARIATION_MIN: float = 0.7
MEAL_ESTIMATION_VARIATION_MAX: float = 1.1

# Valores por defecto
## Pacientes
DEFAULT_PATIENT: str = 'adult#001'  # Paciente por defecto para entrenamiento poblacional
DEFAULT_PATIENT_ADULT: str = 'adult#001'  # Paciente adulto por defecto
DEFAULT_PATIENT_CHILD: str = 'child#001'  # Paciente infantil por defecto
DEFAULT_PATIENT_ADOLESCENT: str = 'adolescent#001'  # Paciente adolescente por defecto
ICR_DEFAULT: float = 15.0  # Relación carbohidratos-insulina
ISF_DEFAULT: float = 50.0  # Factor de sensibilidad a la insulina
DEFAULT_MODELS_DIR: str = "models"
DEFAULT_DEVICE: str = "cpu"

# Recompensas, límites y penalizaciones
IDEAL_LOWER_BOUND: float = 100.0
IDEAL_UPPER_BOUND: float = 140.0
HYPO_THRESHOLD: float = 70.0
HYPER_THRESHOLD: float = 180.0
SEVERE_HYPO_THRESHOLD: float = 54.0
SEVERE_HYPER_THRESHOLD: float = 250.0
IDEAL_REWARD: float = 1.618
MILD_HYPER_PENALTY: float = -53.8
MILD_HYPO_PENALTY: float = -19.6
SEVERE_HYPER_PENALTY: float = -83.7
SEVERE_HYPO_PENALTY: float = -37.8
SEVERE_ADDITIONAL_SCALE: float = 1.5

# Parámetros de recompensa por variabilidad
CV_LOW_THRESHOLD: float = 20.0          # Umbral de baja variabilidad (%)
CV_ACCEPTABLE_THRESHOLD: float = 30.0   # Umbral de variabilidad aceptable (%)
CV_HIGH_THRESHOLD: float = 40.0         # Umbral de alta variabilidad (%)
VARIABILITY_LOW_REWARD: float = 1.0     # Recompensa por baja variabilidad
VARIABILITY_ACCEPTABLE_REWARD: float = 0.0  # Recompensa por variabilidad aceptable
VARIABILITY_HIGH_PENALTY: float = -2.0  # Penalización por alta variabilidad
VARIABILITY_VERY_HIGH_PENALTY: float = -4.0  # Penalización por variabilidad muy alta

# Parámetros de recompensa por estabilidad
STABILITY_MIN_SAMPLES: int = 6          # Mínimas muestras para calcular estabilidad (30 min)
STABILITY_CHANGE_THRESHOLD: float = 30.0  # Cambio >30 mg/dL en 5 min
STABILITY_PERFECT_REWARD: float = 2.0   # Recompensa por estabilidad perfecta
STABILITY_ACCEPTABLE_CHANGES: int = 2   # Cambios aceptables
STABILITY_ACCEPTABLE_REWARD: float = 0.0  # Recompensa por estabilidad aceptable
STABILITY_PENALTY_FACTOR: float = -1.0  # Factor de penalización por cambio

# Parámetros de penalización por insulina
INSULIN_ICR_ESTIMATION: float = 10.0    # Estimación ICR para cálculos
INSULIN_EXCESS_FACTOR: float = 1.5      # Factor de exceso de insulina
INSULIN_PENALTY_FACTOR: float = -2.0    # Factor de penalización por exceso

# Parámetros de bonus postprandial
POSTPRANDIAL_MIN_SAMPLES: int = 12      # Mínimas muestras para bonus postprandial (1 hora)
POSTPRANDIAL_IDEAL_THRESHOLD: float = 180.0  # Umbral ideal postprandial
POSTPRANDIAL_ACCEPTABLE_THRESHOLD: float = 200.0  # Umbral aceptable postprandial
POSTPRANDIAL_SEVERE_THRESHOLD: float = 250.0  # Umbral severo postprandial
POSTPRANDIAL_IDEAL_BONUS: float = 3.0   # Bonus por control ideal
POSTPRANDIAL_ACCEPTABLE_BONUS: float = 1.0  # Bonus por control aceptable
POSTPRANDIAL_POOR_PENALTY: float = -2.0  # Penalización por control pobre

# Pesos de los componentes de recompensa
TIR_WEIGHT: float = 0.6                 # Peso del tiempo en rango (60%)
VARIABILITY_WEIGHT: float = 0.2         # Peso de la variabilidad (20%)
STABILITY_WEIGHT: float = 0.15          # Peso de la estabilidad (15%)
INSULIN_WEIGHT: float = 0.05            # Peso de la penalización por insulina (5%)
POSTPRANDIAL_WEIGHT: float = 0.1        # Peso del bonus postprandial (10%)

# Límites de recompensa para simulación
MAX_SIMULATION_HOURS: int = 5           # Máximas horas de simulación postprandial
MAX_SIMULATION_SAMPLES: int = 60        # Máximas muestras (5 horas * 12 muestras/hora)
NORMALIZATION_FACTOR: float = 0.01      # Factor de normalización para penalizaciones crecientes
EXCESS_PENALTY_FACTOR: float = 0.05     # Factor de penalización por exceso de glucosa
SEVERE_PENALTY_FACTOR: float = 0.02     # Factor de penalización severa

HYPOGLYCEMIA_GAIN_FACTOR: float = 0.1
LOW_GLUCOSE_GAIN_FACTOR: float = 0.5
MIN_GAIN_VALUE: float = 0.1
MAX_GAIN_VALUE: float = 2.0

HIGH_BOLUS_WARNING: float = 10.0
HIGH_BOLUS_SEVERE: float = 20.0
HIGH_IOB_THRESHOLD: float = 10.0
HIGH_CARBS_THRESHOLD: float = 150.0
HIGH_EXERCISE_THRESHOLD: int = 7

NUM_UNCERTAINTY_SAMPLES: int = 20
CGM_NOISE_STD: float = 2.0
MIN_CGM_VALUE: float = 10.0
MAX_CGM_VALUE: float = 900.0
CONFIDENCE_LOWER_PERCENTILE: float = 2.5
CONFIDENCE_UPPER_PERCENTILE: float = 97.5
MEAL_DURATION_FOR_RATE_CALCULATION: int = 15  # minutos

# Randomización y reproducibilidad
SEED: int = 42  # Semilla para reproducibilidad

# Archivos, prefijos y sufijos
POPULATION_ACTOR_FILE: str = "population_actor.pth"
POPULATION_CRITIC_FILE: str = "population_critic.pth"
PERSONALIZED_ACTOR_PREFIX: str = "personalized_actor_"
PERSONALIZED_CRITIC_PREFIX: str = "personalized_critic_"
MODEL_EXTENSION: str = ".pth"

# Mensajes
## API
API_TITLE = "DRL Insulin Dosing API"
API_DESCRIPTION = "API para dosificación de insulina basada en Deep Reinforcement Learning"
API_VERSION = "1.0.0"
STARTUP_MESSAGE = "API de dosificación de insulina DRL iniciada"
SHUTDOWN_MESSAGE = "API de dosificación de insulina DRL detenida"
SUCCESS_STATUS = "healthy"
ACTIVE_STATUS = "activa"
REGISTER_SUCCESS_MSG = "registrado exitosamente"
UPDATE_SUCCESS_MSG = "actualizado exitosamente"
CGM_RECORD_MSG = "Lectura CGM registrada exitosamente"
USER_NOT_FOUND_MSG = "Usuario no encontrado"
USER_ID_MISMATCH_MSG = "ID de usuario no coincide"
REGISTER_ERROR_MSG = "Error al registrar usuario"
INTERNAL_ERROR_CODE = "INTERNAL_ERROR"
INTERNAL_ERROR_MSG = "Error interno del servidor"
## Mensajes de alerta
HYPO_SEVERE_MSG: str = "ALERTA: Glucosa actual por debajo de 70 mg/dL"
HYPO_WARNING_MSG: str = "PRECAUCIÓN: Glucosa cercana al rango de hipoglucemia"
HYPER_SEVERE_MSG: str = "ALERTA: Glucosa muy elevada, consulte médico"
HYPER_WARNING_MSG: str = "PRECAUCIÓN: Glucosa elevada"
HIGH_BOLUS_SEVERE_MSG: str = "ALERTA: Dosis de insulina muy alta, verificar entrada"
HIGH_BOLUS_WARNING_MSG: str = "PRECAUCIÓN: Dosis de insulina alta"
HIGH_IOB_MSG: str = "PRECAUCIÓN: Alta insulina activa, riesgo de hipoglucemia"
HIGH_CARBS_MSG: str = "PRECAUCIÓN: Alto consumo de carbohidratos"
HIGH_EXERCISE_MSG: str = "PRECAUCIÓN: Ejercicio intenso puede reducir glucosa"

## Mensajes de log
POPULATION_MODEL_LOADED_MSG: str = "Modelo poblacional cargado exitosamente"
POPULATION_MODEL_ERROR_MSG: str = "Error al cargar modelo poblacional"
POPULATION_MODEL_NOT_FOUND_MSG: str = "No se encontró modelo poblacional"
USER_REGISTERED_MSG: str = "registrado exitosamente"
USER_REGISTER_ERROR_MSG: str = "Error al registrar usuario"
PERSONALIZED_MODEL_LOADED_MSG: str = "Modelo personalizado cargado para usuario"
PERSONALIZED_MODEL_CLONED_MSG: str = "Modelo personalizado clonado para usuario"
PERSONALIZED_MODEL_ERROR_MSG: str = "Error al cargar modelo personalizado para"
USING_POPULATION_MODEL_MSG: str = "Usando modelo poblacional para usuario"
NO_MODEL_AVAILABLE_MSG: str = "No hay modelo disponible para usuario"
CLEANUP_MODELS_MSG: str = "Limpieza de modelos no utilizados ejecutada"
MODEL_SAVED_MSG: str = "Modelo guardado exitosamente para usuario"
MODEL_CLONE_DURING_REGISTRATION_MSG: str = "Modelos clonados durante registro para usuario"
MODEL_CLONE_ERROR_DURING_REGISTRATION_MSG: str = "Error al clonar modelos durante registro para usuario"

## Mensajes de Error
ACTOR_MODEL_ERROR_MSG: str = "Error al cargar modelo actor desde"
ACTOR_MODEL_INVALID_PATH_MSG: str = "Ruta de modelo actor inválida"
ACTOR_MODEL_FILE_NOT_FOUND_MSG: str = "Archivo de modelo actor no encontrado"
ACTOR_MODEL_LOADED_MSG: str = "Modelo actor cargado exitosamente desde"
CRITIC_MODEL_ERROR_MSG: str = "Error al cargar modelo crítico desde"
CRITIC_MODEL_INVALID_PATH_MSG: str = "Ruta de modelo crítico inválida"
CRITIC_MODEL_FILE_NOT_FOUND_MSG: str = "Archivo de modelo crítico no encontrado"
CRITIC_MODEL_LOADED_MSG: str = "Modelo crítico cargado exitosamente desde"