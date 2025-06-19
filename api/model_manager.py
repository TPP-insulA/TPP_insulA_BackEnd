import os
import torch
import numpy as np
from datetime import datetime
from typing import Dict, Optional, Tuple, List

from models.models import Actor, Critic, load_actor_model, load_critic_model, apply_safety_constraints, compute_bolus
from constants.constants import (
    STATE_DIM,
    ACTION_DIM,
    SEED,
    CGM_NOISE_STD,
    MEAL_DURATION_FOR_RATE_CALCULATION,
    MIN_CGM_VALUE,
    MAX_CGM_VALUE,
    CONFIDENCE_LOWER_PERCENTILE,
    CONFIDENCE_UPPER_PERCENTILE,
    DEFAULT_DEVICE,
    DEFAULT_MODELS_DIR,
    POPULATION_ACTOR_FILE,
    POPULATION_CRITIC_FILE,
    PERSONALIZED_ACTOR_PREFIX,
    PERSONALIZED_CRITIC_PREFIX,
    MODEL_EXTENSION,
    POPULATION_MODEL_LOADED_MSG,
    POPULATION_MODEL_ERROR_MSG,
    POPULATION_MODEL_NOT_FOUND_MSG,
    USER_REGISTERED_MSG,
    USER_REGISTER_ERROR_MSG,
    MODEL_CLONE_DURING_REGISTRATION_MSG,
    MODEL_CLONE_ERROR_DURING_REGISTRATION_MSG,
    MODEL_SAVED_MSG,
    PERSONALIZED_MODEL_LOADED_MSG,
    PERSONALIZED_MODEL_ERROR_MSG,
    USING_POPULATION_MODEL_MSG,
    NO_MODEL_AVAILABLE_MSG,
    HIGH_BOLUS_WARNING_MSG,
    HIGH_BOLUS_SEVERE_MSG,
    HIGH_IOB_MSG,
    HIGH_CARBS_MSG,
    HIGH_EXERCISE_MSG,
    HYPO_WARNING_MSG,
    HYPO_SEVERE_MSG,
    HYPER_WARNING_MSG,
    HYPER_SEVERE_MSG,
    CLEANUP_MODELS_MSG,
    NUM_UNCERTAINTY_SAMPLES,
    HIGH_BOLUS_WARNING,
    HIGH_BOLUS_SEVERE,
    HIGH_IOB_THRESHOLD,
    HIGH_CARBS_THRESHOLD,
    HIGH_EXERCISE_THRESHOLD,
    SEVERE_HYPO_THRESHOLD,
    HYPO_THRESHOLD,
    SEVERE_HYPER_THRESHOLD,
    HYPER_THRESHOLD
)
from response_models import UserProfile, BolusRequest, BolusResponse
import logging

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Administrador de modelos DRL para múltiples usuarios.
    """
    
    def __init__(self, models_directory: str = DEFAULT_MODELS_DIR, device: str = DEFAULT_DEVICE) -> None:
        """
        Inicializa el administrador de modelos.
        
        Parámetros:
        -----------
        models_directory : str
            Directorio donde se almacenan los modelos.
        device : str
            Dispositivo para la inferencia ('cpu' o 'cuda').
        """
        self.models_directory: str = models_directory
        self.device: str = device
        self.loaded_models: Dict[str, Dict[str, torch.nn.Module]] = {}
        self.user_profiles: Dict[str, UserProfile] = {}
        self.population_actor: Optional[Actor] = None
        self.population_critic: Optional[Critic] = None
        self.rng: np.random.Generator = np.random.default_rng(seed=SEED)
        
        # Crear directorio de modelos si no existe
        os.makedirs(models_directory, exist_ok=True)
        
        # Cargar modelos poblacionales por defecto
        self._load_population_models()
    
    def _load_population_models(self) -> None:
        """
        Carga los modelos poblacionales (actor y critic) por defecto desde el directorio de modelos.
        """
        population_actor_path: str = os.path.join(self.models_directory, POPULATION_ACTOR_FILE)
        population_critic_path: str = os.path.join(self.models_directory, POPULATION_CRITIC_FILE)
        
        # Cargar actor poblacional
        if os.path.exists(population_actor_path):
            try:
                self.population_actor = load_actor_model(
                    population_actor_path, STATE_DIM, ACTION_DIM, self.device
                )
                logger.info(f"{POPULATION_MODEL_LOADED_MSG} (Actor)")
            except Exception as e:
                logger.error(f"{POPULATION_MODEL_ERROR_MSG} (Actor): {e}")
                self.population_actor = None
        else:
            logger.warning(f"{POPULATION_MODEL_NOT_FOUND_MSG} (Actor)")
            self.population_actor = None
        
        # Cargar critic poblacional
        if os.path.exists(population_critic_path):
            try:
                self.population_critic = Critic(STATE_DIM, ACTION_DIM).to(self.device)
                self.population_critic = load_critic_model(population_critic_path, STATE_DIM, ACTION_DIM, self.device)
                self.population_critic.eval()
                logger.info(f"{POPULATION_MODEL_LOADED_MSG} (Critic)")
            except Exception as e:
                logger.error(f"{POPULATION_MODEL_ERROR_MSG} (Critic): {e}")
                self.population_critic = None
        else:
            logger.warning(f"{POPULATION_MODEL_NOT_FOUND_MSG} (Critic)")
            self.population_critic = None
    
    def register_user(self, user_profile: UserProfile) -> bool:
        """
        Registra un nuevo usuario en el sistema de gestión de modelos y clona modelos poblacionales.
        
        Parámetros:
        -----------
        user_profile : UserProfile
            Perfil del usuario a registrar con parámetros clínicos.
            
        Retorna:
        --------
        bool
            True si el registro fue exitoso, False en caso contrario.
        """
        try:
            # Registrar perfil del usuario
            self.user_profiles[user_profile.user_id] = user_profile
            
            # Clonar modelos poblacionales inmediatamente durante el registro
            if user_profile.model_type == "personalized":
                models_cloned: bool = self._clone_population_models_for_user(user_profile.user_id)
                if not models_cloned:
                    logger.warning(f"Usuario {user_profile.user_id} registrado pero sin modelos personalizados")
            
            logger.info(f"Usuario {user_profile.user_id} {USER_REGISTERED_MSG}")
            return True
        except Exception as e:
            logger.error(f"{USER_REGISTER_ERROR_MSG} {user_profile.user_id}: {e}")
            return False
    
    def _clone_population_models_for_user(self, user_id: str) -> bool:
        """
        Clona los modelos poblacionales para crear modelos personalizados específicos del usuario.
        
        Parámetros:
        -----------
        user_id : str
            Identificador único del usuario.
            
        Retorna:
        --------
        bool
            True si el clonado fue exitoso, False en caso contrario.
        """
        if self.population_actor is None or self.population_critic is None:
            logger.error(f"No se pueden clonar modelos para {user_id}: modelos poblacionales no disponibles")
            return False
        
        try:
            # Clonar actor poblacional
            cloned_actor: Actor = Actor(STATE_DIM, ACTION_DIM).to(self.device)
            cloned_actor.load_state_dict(self.population_actor.state_dict())
            cloned_actor.train()  # Configurar para entrenamiento
            
            # Clonar critic poblacional
            cloned_critic: Critic = Critic(STATE_DIM, ACTION_DIM).to(self.device)
            cloned_critic.load_state_dict(self.population_critic.state_dict())
            cloned_critic.train()  # Configurar para entrenamiento
            
            # Guardar en memoria
            self.loaded_models[user_id] = {"actor": cloned_actor, "critic": cloned_critic}
            
            # Guardar modelos clonados en disco para persistencia
            self._save_user_models(user_id, cloned_actor, cloned_critic)
            
            logger.info(f"{MODEL_CLONE_DURING_REGISTRATION_MSG} {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"{MODEL_CLONE_ERROR_DURING_REGISTRATION_MSG} {user_id}: {e}")
            return False
    
    def get_user_models(self, user_id: str) -> Optional[Dict[str, torch.nn.Module]]:
        """
        Obtiene los modelos específicos (actor y critic) para un usuario.
        
        Parámetros:
        -----------
        user_id : str
            Identificador único del usuario.
            
        Retorna:
        --------
        Optional[Dict[str, torch.nn.Module]]
            Diccionario con modelos del usuario o None si no existe.
        """
        # Verificar si los modelos ya están cargados en memoria
        if user_id in self.loaded_models:
            return self.loaded_models[user_id]
        
        # Intentar cargar modelos personalizados específicos del usuario desde disco
        personalized_actor_path: str = os.path.join(
            self.models_directory, f"{PERSONALIZED_ACTOR_PREFIX}{user_id}{MODEL_EXTENSION}"
        )
        personalized_critic_path: str = os.path.join(
            self.models_directory, f"{PERSONALIZED_CRITIC_PREFIX}{user_id}{MODEL_EXTENSION}"
        )
        
        if os.path.exists(personalized_actor_path) and os.path.exists(personalized_critic_path):
            try:
                # Cargar modelos personalizados existentes
                actor: Actor = load_actor_model(
                    personalized_actor_path, STATE_DIM, ACTION_DIM, self.device
                )
                
                critic: Critic = load_critic_model(personalized_critic_path, STATE_DIM, ACTION_DIM, self.device)
                self.loaded_models[user_id] = {"actor": actor, "critic": critic}
                logger.info(f"{PERSONALIZED_MODEL_LOADED_MSG} {user_id}")
                return self.loaded_models[user_id]
            except Exception as e:
                logger.error(f"{PERSONALIZED_MODEL_ERROR_MSG} {user_id}: {e}")
        
        # Verificar tipo de modelo del usuario
        if user_id in self.user_profiles:
            user_profile: UserProfile = self.user_profiles[user_id]
            if user_profile.model_type == "personalized":
                # Si debe tener modelo personalizado pero no existe, crearlo ahora
                models_cloned: bool = self._clone_population_models_for_user(user_id)
                if models_cloned:
                    return self.loaded_models[user_id]
        
        # Usar modelos poblacionales como fallback (solo para inferencia)
        if self.population_actor is not None:
            logger.info(f"{USING_POPULATION_MODEL_MSG} {user_id}")
            return {"actor": self.population_actor, "critic": self.population_critic}
        
        logger.error(f"{NO_MODEL_AVAILABLE_MSG} {user_id}")
        return None
    
    def _save_user_models(self, user_id: str, actor: Actor, critic: Critic) -> None:
        """
        Guarda los modelos personalizados de un usuario en disco.
        
        Parámetros:
        -----------
        user_id : str
            Identificador único del usuario.
        actor : Actor
            Modelo actor a guardar.
        critic : Critic
            Modelo critic a guardar.
        """
        try:
            actor_path: str = os.path.join(
                self.models_directory, f"{PERSONALIZED_ACTOR_PREFIX}{user_id}{MODEL_EXTENSION}"
            )
            critic_path: str = os.path.join(
                self.models_directory, f"{PERSONALIZED_CRITIC_PREFIX}{user_id}{MODEL_EXTENSION}"
            )
            
            torch.save(actor.state_dict(), actor_path)
            torch.save(critic.state_dict(), critic_path)
            logger.info(f"{MODEL_SAVED_MSG} {user_id}")
        except Exception as e:
            logger.error(f"Error al guardar modelos para {user_id}: {e}")
    
    def predict_bolus(
        self,
        actor_model: Actor,
        cgm: float,
        carb_intake_grams: float,
        iob: float,
        current_time: datetime,
        sleep_quality: Optional[int] = None,
        exercise_intensity: Optional[int] = None,
        work_stress_intensity: Optional[int] = None
    ) -> float:
        """
        Predice el bolo de insulina requerido basado en las condiciones actuales usando el modelo de actor.

        Parámetros:
        -----------
        actor_model : Actor
            El modelo de actor preentrenado y cargado.
        cgm : float
            Lectura actual del Monitor Continuo de Glucosa (mg/dL).
        carb_intake_grams : float
            Gramos totales de carbohidratos a consumir.
        iob : float
            Insulina Activa (Unidades).
        current_time : datetime
            La hora actual.
        sleep_quality : Optional[int]
            Opcional: Calidad del sueño (1-4).
        exercise_intensity : Optional[int]
            Opcional: Intensidad del ejercicio (0-10).
        work_stress_intensity : Optional[int]
            Opcional: Intensidad del estrés laboral (0-10).

        Retorna:
        --------
        float
            Bolo predicho en Unidades.
        """
        if actor_model is None:
            logger.error("Modelo de actor no cargado. No se puede predecir el bolo.")
            return 0.0

        # Preparar estado para el modelo de actor
        cho_rate: float
        if carb_intake_grams > 0:
            cho_rate = carb_intake_grams / MEAL_DURATION_FOR_RATE_CALCULATION
        else:
            cho_rate = 0.0

        minutes_since_midnight: int = current_time.hour * 60 + current_time.minute

        # Estado: [cgm, cho_rate, minutes_since_midnight, iob]
        state_np: np.ndarray = np.array([cgm, cho_rate, minutes_since_midnight, iob], dtype=np.float32)
        state_tensor: torch.Tensor = torch.FloatTensor(state_np).unsqueeze(0).to(self.device)

        # Obtener action_gains del modelo de actor (sin ruido para inferencia)
        with torch.no_grad():
            action_gains_tensor: torch.Tensor = actor_model(state_tensor)
        action_gains: np.ndarray = action_gains_tensor.cpu().numpy()[0]

        # Aplicar restricciones de seguridad a las ganancias
        action_gains = apply_safety_constraints(action_gains, cgm)

        # Marcador de posición para ajustes heurísticos basados en parámetros opcionales
        if sleep_quality is not None or exercise_intensity is not None or work_stress_intensity is not None:
            # Aquí se podrían implementar reglas heurísticas para ajustar action_gains
            logger.debug(f"Parámetros opcionales: Sleep={sleep_quality}, Exercise={exercise_intensity}, Stress={work_stress_intensity}")

        # Llamar a compute_bolus con las ganancias
        mealtime: bool = carb_intake_grams > 0
        
        predicted_bolus_U: float = compute_bolus(
            gains=action_gains,
            cho=carb_intake_grams,
            cgm=cgm,
            iob=iob,
            mealtime=mealtime
        )

        return predicted_bolus_U
    
    def predict_bolus_with_confidence(
        self, request: BolusRequest
    ) -> Tuple[float, float, float, List[str]]:
        """
        Predice el bolo con intervalo de confianza y alertas de seguridad.
        
        Parámetros:
        -----------
        request : BolusRequest
            Solicitud de predicción con parámetros clínicos.
            
        Retorna:
        --------
        Tuple[float, float, float, List[str]]
            Bolo predicho, límite inferior, límite superior, lista de alertas.
        """
        user_models: Optional[Dict[str, torch.nn.Module]] = self.get_user_models(request.user_id)
        if user_models is None or "actor" not in user_models:
            raise ValueError(f"No hay modelo disponible para usuario {request.user_id}")
        
        actor_model: Actor = user_models["actor"]
        
        # Predicción base sin variación
        base_prediction: float = self.predict_bolus(
            actor_model=actor_model,
            cgm=request.cgm_value,
            carb_intake_grams=request.carb_intake_grams,
            iob=request.iob,
            current_time=request.timestamp,
            sleep_quality=request.sleep_quality,
            exercise_intensity=request.exercise_intensity,
            work_stress_intensity=request.work_stress_intensity
        )
        
        # Generar múltiples predicciones para estimar incertidumbre
        predictions: List[float] = []
        rng_uncertainty: np.random.Generator = np.random.default_rng(seed=SEED)
        
        for _ in range(NUM_UNCERTAINTY_SAMPLES):
            # Añadir pequeña variación en CGM para estimar incertidumbre
            noise_cgm: float = rng_uncertainty.normal(0, CGM_NOISE_STD)
            noisy_cgm: float = max(MIN_CGM_VALUE, min(MAX_CGM_VALUE, request.cgm_value + noise_cgm))
            
            pred: float = self.predict_bolus(
                actor_model=actor_model,
                cgm=noisy_cgm,
                carb_intake_grams=request.carb_intake_grams,
                iob=request.iob,
                current_time=request.timestamp,
                sleep_quality=request.sleep_quality,
                exercise_intensity=request.exercise_intensity,
                work_stress_intensity=request.work_stress_intensity
            )
            predictions.append(pred)
        
        # Calcular intervalo de confianza usando percentiles
        predictions_array: np.ndarray = np.array(predictions)
        confidence_lower: float = np.percentile(predictions_array, CONFIDENCE_LOWER_PERCENTILE)
        confidence_upper: float = np.percentile(predictions_array, CONFIDENCE_UPPER_PERCENTILE)
        
        # Generar alertas de seguridad basadas en parámetros clínicos
        safety_alerts: List[str] = self._generate_safety_alerts(request, base_prediction)
        
        return base_prediction, confidence_lower, confidence_upper, safety_alerts
    
    def _generate_safety_alerts(
        self, request: BolusRequest, predicted_bolus: float
    ) -> List[str]:
        """
        Genera alertas de seguridad basadas en la solicitud y predicción.
        
        Parámetros:
        -----------
        request : BolusRequest
            Solicitud original con parámetros clínicos.
        predicted_bolus : float
            Bolo predicho por el modelo.
            
        Retorna:
        --------
        List[str]
            Lista de alertas de seguridad para el usuario.
        """
        alerts: List[str] = []
        
        # Alertas relacionadas con hipoglucemia
        if request.cgm_value < SEVERE_HYPO_THRESHOLD:
            alerts.append(HYPO_SEVERE_MSG)
        elif request.cgm_value < HYPO_THRESHOLD:
            alerts.append(HYPO_WARNING_MSG)
        
        # Alertas relacionadas con hiperglucemia
        if request.cgm_value > SEVERE_HYPER_THRESHOLD:
            alerts.append(HYPER_SEVERE_MSG)
        elif request.cgm_value > HYPER_THRESHOLD:
            alerts.append(HYPER_WARNING_MSG)
        
        # Alertas relacionadas con dosis alta de insulina
        if predicted_bolus > HIGH_BOLUS_SEVERE:
            alerts.append(HIGH_BOLUS_SEVERE_MSG)
        elif predicted_bolus > HIGH_BOLUS_WARNING:
            alerts.append(HIGH_BOLUS_WARNING_MSG)
        
        # Alertas relacionadas con insulina activa alta
        if request.iob > HIGH_IOB_THRESHOLD:
            alerts.append(HIGH_IOB_MSG)
        
        # Alertas relacionadas con carbohidratos altos
        if request.carb_intake_grams > HIGH_CARBS_THRESHOLD:
            alerts.append(HIGH_CARBS_MSG)
        
        # Alertas relacionadas con ejercicio intenso
        if request.exercise_intensity and request.exercise_intensity > HIGH_EXERCISE_THRESHOLD:
            alerts.append(HIGH_EXERCISE_MSG)
        
        return alerts
    
    def update_user_model_with_feedback(
        self, 
        user_id: str, 
        state: np.ndarray, 
        action: np.ndarray, 
        reward: float, 
        next_state: np.ndarray, 
        done: bool
    ) -> None:
        """
        Actualiza el modelo personalizado del usuario con retroalimentación del mundo real.
        
        Parámetros:
        -----------
        user_id : str
            Identificador único del usuario.
        state : np.ndarray
            Estado anterior.
        action : np.ndarray
            Acción tomada.
        reward : float
            Recompensa obtenida.
        next_state : np.ndarray
            Nuevo estado.
        done : bool
            Si el episodio terminó.
        """
        user_models: Optional[Dict[str, torch.nn.Module]] = self.get_user_models(user_id)
        if user_models is None:
            logger.error(f"No se pueden actualizar modelos para usuario {user_id}: no existen")
            return
        
        # Aquí implementarías la lógica de entrenamiento online
        # Por ahora, solo registramos la experiencia
        logger.info(f"Retroalimentación recibida para usuario {user_id}: reward={reward}")
        
        # Guardar modelos actualizados
        if "actor" in user_models and "critic" in user_models:
            self._save_user_models(user_id, user_models["actor"], user_models["critic"])
    
    def cleanup_unused_models(self) -> None:
        """
        Limpia modelos no utilizados de la memoria para optimizar recursos.
        """
        logger.info(CLEANUP_MODELS_MSG)
        # En una implementación futura, aquí se liberarían modelos no usados recientemente
        # Por ejemplo, modelos que no se han usado en las últimas N horas