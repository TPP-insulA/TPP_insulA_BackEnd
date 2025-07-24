from model_manager import ModelManager
from response_models import UserProfile, BolusRequest
from datetime import datetime

# 1. Instancia el ModelManager (usando la carpeta de modelos ya entrenados)
manager = ModelManager(models_directory="../models")

# 2. Crea un perfil de usuario de prueba
profile = UserProfile(
    user_id="test_user",
    icr=15.0,
    isf=50.0,
    target_bg=120.0,
    weight=70.0,
    age=30,
    model_type="personalized"  # O "population" si quieres probar el modelo poblacional
)

# 3. Registra el usuario
manager.register_user(profile)

# 4. Crea una solicitud de predicción de bolo
request = BolusRequest(
    user_id="test_user",
    cgm_value=120.0,            # Glucosa actual
    carb_intake_grams=40.0,     # Carbohidratos a consumir
    iob=1.5,                    # Insulina activa
    sleep_quality=3,            # Calidad del sueño (opcional)
    exercise_intensity=2,       # Intensidad de ejercicio (opcional)
    work_stress_intensity=1,    # Estrés laboral (opcional)
    timestamp=datetime.now()    # Momento actual
)

# 5. Llama a la predicción
try:
    pred, lower, upper, alerts = manager.predict_bolus_with_confidence(request)
    print(f"Predicción: {pred:.2f} U")
    print(f"Intervalo de confianza: [{lower:.2f}, {upper:.2f}] U")
    print("Alertas:", alerts)
except Exception as e:
    print(f"Error al predecir bolo: {e}") 