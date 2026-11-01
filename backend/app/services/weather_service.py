"""
Weather service orchestrator.
Fetches surface meteorology from Open-Meteo client or cached database observations.
"""

import sys
import os
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

# Add analytics package to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))

from src.ingestion.open_meteo import OpenMeteoClient
from app.models.location import Location
from app.models.weather import WeatherObservation
from app.core.config import get_settings
from app.core.errors import DataSourceUnavailable

settings = get_settings()
open_meteo_client = OpenMeteoClient(base_url=settings.OPEN_METEO_BASE_URL)


def assert_risk_inputs(obs: dict, settings) -> None:
    if obs.get("is_synthetic") and not getattr(settings, "allow_synthetic_risk", False):
        raise DataSourceUnavailable("Synthetic observations cannot drive a live risk score")
    age_min = obs.get("age_minutes", 0)
    if age_min > getattr(settings, "max_observation_age_min", 180):
        raise DataSourceUnavailable(f"Observation is stale ({age_min} min old)")
    if obs.get("completeness", 1.0) < getattr(settings, "min_completeness", 0.9):
        raise DataSourceUnavailable("Observation is incomplete")


class WeatherService:
    @staticmethod
    def get_current_weather(db: Session, location_id: int, for_risk: bool = False) -> Dict[str, Any]:
        """
        Retrieves current surface weather for a specific location/ward.
        """
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise ValueError(f"Location ID {location_id} not found.")

        # Query Open-Meteo
        weather_data = open_meteo_client.fetch_current_and_forecast(
            latitude=location.latitude,
            longitude=location.longitude,
            forecast_days=1,
        )

        curr = weather_data.get("current_weather", {})
        temp = curr.get("temperature")
        wind = curr.get("windspeed")
        
        # Hourly slice for humidity & solar radiation
        hourly = weather_data.get("hourly", {})
        rhs = hourly.get("relative_humidity_2m", [])
        sols = hourly.get("shortwave_radiation_instant", [])
        apps = hourly.get("apparent_temperature", [])

        if for_risk:
            if temp is None:
                raise DataSourceUnavailable("Missing temperature in upstream observation")
            if wind is None:
                raise DataSourceUnavailable("Missing wind speed in upstream observation")
            if not rhs or rhs[0] is None:
                raise DataSourceUnavailable("Missing relative humidity in upstream observation")
            if not sols or sols[0] is None:
                raise DataSourceUnavailable("Missing solar radiation in upstream observation")
            rh = rhs[0]
            sol = sols[0]
            app_t = apps[0] if (apps and apps[0] is not None) else (temp + 4.0)
        else:
            if temp is None:
                temp = 34.5
            if wind is None:
                wind = 2.2
            rh = rhs[0] if (rhs and rhs[0] is not None) else 55.0
            sol = sols[0] if (sols and sols[0] is not None) else 650.0
            app_t = apps[0] if (apps and apps[0] is not None) else (temp + 4.0)

        is_demo = weather_data.get("is_demo", False)
        demo_label = weather_data.get("demo_label", None) if is_demo else None

        obs_dict = {
            "location_id": location.id,
            "city": location.city,
            "ward_name": location.ward_name,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "recorded_at": datetime.now(timezone.utc),
            "temperature_c": float(temp),
            "rel_humidity_pct": float(rh),
            "wind_speed_ms": float(wind),
            "solar_radiation_wm2": float(sol),
            "apparent_temperature_c": float(app_t),
            "source_name": weather_data.get("data_source", "Open-Meteo"),
            "is_demo": is_demo,
            "is_synthetic": is_demo,
            "demo_label": demo_label,
            "age_minutes": weather_data.get("age_minutes", 0),
            "completeness": weather_data.get("completeness", 1.0),
        }

        if for_risk:
            assert_risk_inputs(obs_dict, settings)

        return obs_dict

    @staticmethod
    def get_weather_forecast(db: Session, location_id: int, days: int = 5) -> Dict[str, Any]:
        """
        Retrieves multi-day hourly forecast for a ward.
        """
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise ValueError(f"Location ID {location_id} not found.")

        data = open_meteo_client.fetch_current_and_forecast(
            latitude=location.latitude,
            longitude=location.longitude,
            forecast_days=days,
        )

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        rhs = hourly.get("relative_humidity_2m", [])
        winds = hourly.get("wind_speed_10m", [])
        sols = hourly.get("shortwave_radiation_instant", [])

        items = []
        for i in range(len(times)):
            items.append({
                "time": times[i],
                "temperature_c": float(temps[i]),
                "rel_humidity_pct": float(rhs[i]),
                "wind_speed_ms": float(winds[i]),
                "solar_radiation_wm2": float(sols[i]),
            })

        is_demo = data.get("is_demo", False)
        return {
            "location_id": location.id,
            "city": location.city,
            "ward_name": location.ward_name,
            "hourly": items,
            "is_demo": is_demo,
            "demo_label": data.get("demo_label", None) if is_demo else None,
        }
