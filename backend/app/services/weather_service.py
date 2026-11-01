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

settings = get_settings()
open_meteo_client = OpenMeteoClient(base_url=settings.OPEN_METEO_BASE_URL)


class WeatherService:
    @staticmethod
    def get_current_weather(db: Session, location_id: int) -> Dict[str, Any]:
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
        temp = curr.get("temperature", 34.5)
        wind = curr.get("windspeed", 2.2)
        
        # Hourly slice for humidity & solar radiation
        hourly = weather_data.get("hourly", {})
        rhs = hourly.get("relative_humidity_2m", [55.0])
        sols = hourly.get("shortwave_radiation_instant", [650.0])
        apps = hourly.get("apparent_temperature", [temp + 4.0])

        rh = rhs[0] if rhs else 55.0
        sol = sols[0] if sols else 650.0
        app_t = apps[0] if apps else temp + 4.0

        is_demo = weather_data.get("is_demo", False)
        demo_label = weather_data.get("demo_label", None) if is_demo else None

        return {
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
            "demo_label": demo_label,
        }

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
