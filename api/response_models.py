from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator

class UserProfile(BaseModel):
    """
    Perfil de usuario con parámetros clínicos personalizados.
    """
    user_id: str = Field(..., description="Identificador único del usuario")
    icr: float = Field(15.0, description="Relación de carbohidratos a insulina")
    isf: float = Field(50.0, description="Factor de sensibilidad a la insulina")
    target_bg: float = Field(120.0, description="Glucosa objetivo en mg/dL")
    weight: float = Field(70.0, description="Peso corporal en kg")
    age: int = Field(30, description="Edad en años")
    ml_model_type: str = Field("population", description="Tipo de modelo: 'population' o 'personalized'")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    @validator('icr')
    def validate_icr(cls, v: float) -> float:
        if not 5.0 <= v <= 50.0:
            raise ValueError('ICR debe estar entre 5.0 y 50.0')
        return v

    @validator('isf')
    def validate_isf(cls, v: float) -> float:
        if not 20.0 <= v <= 100.0:
            raise ValueError('ISF debe estar entre 20.0 y 100.0')
        return v

    @validator('target_bg')
    def validate_target_bg(cls, v: float) -> float:
        if not 100.0 <= v <= 140.0:
            raise ValueError('Glucosa objetivo debe estar entre 100.0 y 140.0 mg/dL')
        return v

class CGMReading(BaseModel):
    """
    Lectura del monitor continuo de glucosa.
    """
    user_id: str = Field(..., description="Identificador del usuario")
    cgm_value: float = Field(..., description="Valor de glucosa en mg/dL")
    timestamp: datetime = Field(default_factory=datetime.now)
    trend: Optional[str] = Field(None, description="Tendencia: 'rising', 'falling', 'stable'")

    @validator('cgm_value')
    def validate_cgm(cls, v: float) -> float:
        if not 40.0 <= v <= 400.0:
            raise ValueError('Valor de CGM debe estar entre 40.0 y 400.0 mg/dL')
        return v

class BolusRequest(BaseModel):
    """
    Solicitud de predicción de bolo de insulina.
    """
    user_id: str = Field(..., description="Identificador del usuario")
    cgm_value: float = Field(..., description="Valor actual de glucosa en mg/dL")
    carb_intake_grams: float = Field(0.0, description="Gramos de carbohidratos a consumir")
    iob: float = Field(0.0, description="Insulina activa en unidades")
    sleep_quality: Optional[int] = Field(None, description="Calidad del sueño (1-4)")
    exercise_intensity: Optional[int] = Field(None, description="Intensidad del ejercicio (0-10)")
    work_stress_intensity: Optional[int] = Field(None, description="Intensidad del estrés laboral (0-10)")
    timestamp: datetime = Field(default_factory=datetime.now)

    @validator('cgm_value')
    def validate_cgm(cls, v: float) -> float:
        if not 40.0 <= v <= 400.0:
            raise ValueError('Valor de CGM debe estar entre 40.0 y 400.0 mg/dL')
        return v

    @validator('carb_intake_grams')
    def validate_carbs(cls, v: float) -> float:
        if not 0.0 <= v <= 300.0:
            raise ValueError('Carbohidratos deben estar entre 0.0 y 300.0 gramos')
        return v

    @validator('iob')
    def validate_iob(cls, v: float) -> float:
        if not 0.0 <= v <= 50.0:
            raise ValueError('IOB debe estar entre 0.0 y 50.0 unidades')
        return v

    @validator('sleep_quality')
    def validate_sleep(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not 1 <= v <= 4:
            raise ValueError('Calidad del sueño debe estar entre 1 y 4')
        return v

    @validator('exercise_intensity')
    def validate_exercise(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not 0 <= v <= 10:
            raise ValueError('Intensidad del ejercicio debe estar entre 0 y 10')
        return v

    @validator('work_stress_intensity')
    def validate_stress(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not 0 <= v <= 10:
            raise ValueError('Intensidad del estrés debe estar entre 0 y 10')
        return v

class BolusResponse(BaseModel):
    """
    Respuesta con la predicción de bolo de insulina.
    """
    user_id: str = Field(..., description="ID del usuario")
    recommended_bolus: float = Field(..., description="Bolo recomendado en unidades")
    confidence_lower: float = Field(..., description="Límite inferior del intervalo de confianza")
    confidence_upper: float = Field(..., description="Límite superior del intervalo de confianza")
    confidence_level: float = Field(0.95, description="Nivel de confianza (0.0-1.0)")
    safety_alerts: list[str] = Field(default_factory=list, description="Alertas de seguridad")
    ml_model_version: str = Field(..., description="Versión del modelo utilizado")
    timestamp: datetime = Field(default_factory=datetime.now)
    
class ErrorResponse(BaseModel):
    """
    Respuesta de error estándar.
    """
    error_code: str = Field(..., description="Código de error")
    message: str = Field(..., description="Mensaje de error")
    details: Optional[str] = Field(None, description="Detalles adicionales del error")
    timestamp: datetime = Field(default_factory=datetime.now)