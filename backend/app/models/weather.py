"""
Weather observations and forecasts ORM models.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, DateTime, String, Boolean, ForeignKey
from app.db.base import Base


class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), index=True, nullable=False)
    recorded_at = Column(DateTime, nullable=False, index=True)
    temperature_c = Column(Float, nullable=False)
    rel_humidity_pct = Column(Float, nullable=False)
    wind_speed_ms = Column(Float, nullable=False)
    solar_radiation_wm2 = Column(Float, default=0.0)
    apparent_temperature_c = Column(Float, nullable=True)
    source_name = Column(String(100), default="Open-Meteo ECMWF/GFS")
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class WeatherForecast(Base):
    __tablename__ = "weather_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), index=True, nullable=False)
    forecast_for = Column(DateTime, nullable=False, index=True)
    temperature_c = Column(Float, nullable=False)
    rel_humidity_pct = Column(Float, nullable=False)
    wind_speed_ms = Column(Float, nullable=False)
    solar_radiation_wm2 = Column(Float, default=0.0)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
