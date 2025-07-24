from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, Any, AsyncGenerator
import logging

from response_models import (
    UserProfile, 
    BolusRequest, 
    BolusResponse, 
    ErrorResponse,
    CGMReading
)
from model_manager import ModelManager
from constants.constants import (
    API_TITLE, 
    API_DESCRIPTION, 
    API_VERSION,
    STARTUP_MESSAGE, 
    SHUTDOWN_MESSAGE,
    ACTIVE_STATUS, 
    SUCCESS_STATUS,
    REGISTER_SUCCESS_MSG, 
    REGISTER_ERROR_MSG,
    USER_NOT_FOUND_MSG, 
    USER_ID_MISMATCH_MSG,
    UPDATE_SUCCESS_MSG,
    CGM_RECORD_MSG,
    INTERNAL_ERROR_CODE, 
    INTERNAL_ERROR_MSG
)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Variable global para el administrador de modelos
model_manager: ModelManager

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Administra el ciclo de vida de la aplicación FastAPI.
    
    Parámetros:
    -----------
    app : FastAPI
        Instancia de la aplicación FastAPI.
        
    Yields:
    -------
    None
        Control durante la ejecución de la aplicación.
    """
    # Eventos de inicio
    global model_manager
    model_manager = ModelManager()
    logger.info(STARTUP_MESSAGE)
    
    yield
    
    # Eventos de cierre
    model_manager.cleanup_unused_models()
    logger.info(SHUTDOWN_MESSAGE)

# Inicializar FastAPI con lifespan
app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    lifespan=lifespan
)

# Configurar CORS para permitir acceso desde aplicaciones móviles
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root() -> Dict[str, str]:
    """
    Endpoint raíz para verificar estado de la API.

    Retorna:
    --------
    Dict[str, str]
        Información básica del estado de la API.
    """
    return {
        "message": API_TITLE,
        "version": API_VERSION,
        "status": ACTIVE_STATUS,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Endpoint de verificación de salud del sistema.

    Retorna:
    --------
    Dict[str, Any]
        Estado de salud y estadísticas del sistema.
    """
    return {
        "status": SUCCESS_STATUS,
        "timestamp": datetime.now().isoformat(),
        "models_loaded": len(model_manager.loaded_models),
        "users_registered": len(model_manager.user_profiles)
    }

@app.post("/users/register", response_model=Dict[str, str])
async def register_user(user_profile: UserProfile) -> Dict[str, str]:
    """
    Registra un nuevo usuario en el sistema.
    
    Parámetros:
    -----------
    user_profile : UserProfile
        Perfil del usuario a registrar.
        
    Retorna:
    --------
    Dict[str, str]
        Mensaje de confirmación del registro.
    """
    try:
        success: bool = model_manager.register_user(user_profile)
        if success:
            return {
                "message": f"Usuario {user_profile.user_id} {REGISTER_SUCCESS_MSG}",
                "user_id": user_profile.user_id,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=400, detail=REGISTER_ERROR_MSG)
    except Exception as e:
        logger.error(f"Error en registro de usuario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}", response_model=UserProfile)
async def get_user_profile(user_id: str) -> UserProfile:
    """
    Obtiene el perfil de un usuario específico.
    
    Parámetros:
    -----------
    user_id : str
        Identificador único del usuario.
        
    Retorna:
    --------
    UserProfile
        Perfil completo del usuario solicitado.
    """
    if user_id not in model_manager.user_profiles:
        raise HTTPException(status_code=404, detail=USER_NOT_FOUND_MSG)
    
    return model_manager.user_profiles[user_id]

@app.put("/users/{user_id}", response_model=Dict[str, str])
async def update_user_profile(user_id: str, user_profile: UserProfile) -> Dict[str, str]:
    """
    Actualiza el perfil de un usuario existente.
    
    Parámetros:
    -----------
    user_id : str
        Identificador único del usuario.
    user_profile : UserProfile
        Nuevo perfil del usuario con datos actualizados.
        
    Retorna:
    --------
    Dict[str, str]
        Mensaje de confirmación de la actualización.
    """
    if user_id != user_profile.user_id:
        raise HTTPException(status_code=400, detail=USER_ID_MISMATCH_MSG)
    
    user_profile.updated_at = datetime.now()
    model_manager.user_profiles[user_id] = user_profile
    
    return {
        "message": f"Perfil de usuario {user_id} {UPDATE_SUCCESS_MSG}",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict/bolus", response_model=BolusResponse)
async def predict_bolus_dose(request: BolusRequest) -> BolusResponse:
    """
    Predice la dosis de bolo de insulina requerida basada en parámetros clínicos.
    
    Parámetros:
    -----------
    request : BolusRequest
        Solicitud con todos los datos necesarios para la predicción.
        
    Retorna:
    --------
    BolusResponse
        Respuesta con la dosis recomendada e intervalo de confianza.
    """
    try:
        # Verificar que el usuario existe
        if request.user_id not in model_manager.user_profiles:
            raise HTTPException(status_code=404, detail=USER_NOT_FOUND_MSG)
        
        # Realizar predicción con intervalo de confianza
        bolus, conf_lower, conf_upper, alerts = model_manager.predict_bolus_with_confidence(request)
        
        return BolusResponse(
            user_id=request.user_id,
            recommended_bolus=bolus,
            confidence_lower=conf_lower,
            confidence_upper=conf_upper,
            safety_alerts=alerts,
            model_version=API_VERSION,
            timestamp=datetime.now()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en predicción de bolo: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.post("/cgm/reading", response_model=Dict[str, str])
async def record_cgm_reading(reading: CGMReading) -> Dict[str, str]:
    """
    Registra una lectura de CGM para futuro historial del usuario.
    
    Parámetros:
    -----------
    reading : CGMReading
        Lectura del monitor continuo de glucosa con timestamp.
        
    Retorna:
    --------
    Dict[str, str]
        Mensaje de confirmación del registro.
    """
    # En una implementación completa, esto se guardaría en una base de datos
    logger.info(f"Lectura CGM registrada para usuario {reading.user_id}: {reading.cgm_value} mg/dL")
    
    return {
        "message": CGM_RECORD_MSG,
        "user_id": reading.user_id,
        "timestamp": reading.timestamp.isoformat()
    }

@app.get("/models/status/{user_id}")
async def get_model_status(user_id: str) -> Dict[str, Any]:
    """
    Obtiene el estado del modelo para un usuario específico.
    
    Parámetros:
    -----------
    user_id : str
        Identificador único del usuario.
        
    Retorna:
    --------
    Dict[str, Any]
        Estado actual del modelo del usuario.
    """
    if user_id not in model_manager.user_profiles:
        raise HTTPException(status_code=404, detail=USER_NOT_FOUND_MSG)
    
    user_profile: UserProfile = model_manager.user_profiles[user_id]
    has_personalized: bool = user_id in model_manager.loaded_models
    
    return {
        "user_id": user_id,
        "model_type": user_profile.model_type,
        "has_personalized_model": has_personalized,
        "model_loaded": has_personalized or model_manager.population_model is not None,
        "timestamp": datetime.now().isoformat()
    }

# Manejo de errores globales
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Manejador global de excepciones no controladas.
    
    Parámetros:
    -----------
    request : Request
        Solicitud HTTP que causó la excepción.
    exc : Exception
        Excepción no controlada.
        
    Retorna:
    --------
    ErrorResponse
        Respuesta de error estandarizada.
    """
    logger.error(f"Error no manejado: {exc}")
    return ErrorResponse(
        error_code=INTERNAL_ERROR_CODE,
        message=INTERNAL_ERROR_MSG,
        details=str(exc)
    )