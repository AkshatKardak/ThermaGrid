"""
Risk Score, Risk Forecast, and Risk Configuration ORM models.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, DateTime, String, Boolean, JSON, Text, ForeignKey
from app.db.base import Base


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), index=True, nullable=False)
    calculated_for = Column(DateTime, nullable=False, index=True)
    
    score = Column(Float, nullable=False)               # 0.0 - 100.0
    band = Column(String(50), nullable=False)           # safe | moderate | high | veryhigh | extreme
    band_label = Column(String(100), nullable=False)
    alert_color = Column(String(20), nullable=False)
    
    hazard_score = Column(Float, nullable=False)
    exposure_index = Column(Float, nullable=False)
    vulnerability_index = Column(Float, nullable=False)
    
    factor_breakdown_json = Column(JSON, nullable=False)
    explanation = Column(Text, nullable=False)
    confidence = Column(Float, default=0.92)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class RiskForecast(Base):
    __tablename__ = "risk_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), index=True, nullable=False)
    forecast_for = Column(DateTime, nullable=False, index=True)
    
    predicted_risk_score = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    band = Column(String(50), nullable=False)
    predicted_wbgt = Column(Float, nullable=False)
    confidence = Column(Float, default=0.88)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class RiskConfig(Base):
    """
    Configurable risk thresholds and weights to ensure criteria are not hardcoded.
    """
    __tablename__ = "risk_config"

    id = Column(Integer, primary_key=True, index=True)
    config_name = Column(String(100), unique=True, default="default")
    weight_hazard = Column(Float, default=0.50)
    weight_exposure = Column(Float, default=0.25)
    weight_vulnerability = Column(Float, default=0.25)
    heatwave_temp_threshold_c = Column(Float, default=40.0)
    wbgt_work_stop_threshold_c = Column(Float, default=32.2)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
