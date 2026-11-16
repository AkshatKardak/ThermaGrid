"""
Weather service orchestrator.
Fetches surface meteorology from Open-Meteo client or cached database observations.
"""

import os
import sys
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

# Add analytics package to sys.path
BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))

from src.ingestion.open_meteo import OpenMeteoClient

from app.core.config import get_settings
from app.core.errors import DataSourceUnavailable, WeatherUnavailableError
from app.models.location import Location
from app.models.weather import WeatherObservation

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
    def get_current_weather(
        db: Session, location_id: int, for_risk: bool = False
    ) -> dict[str, Any]:
        """
        Retrieves current surface weather for a specific location/ward.
        """
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise ValueError(f"Location ID {location_id} not found.")

        allow_synth = (
            bool(
                getattr(settings, "allow_synthetic_risk", False)
                or settings.app_env in ["development", "testing"]
            )
            if not for_risk
            else bool(getattr(settings, "allow_synthetic_risk", False))
        )

        try:
            weather_data = open_meteo_client.fetch_current_and_forecast(
                latitude=location.latitude,
                longitude=location.longitude,
                forecast_days=1,
                allow_synthetic=allow_synth,
            )
        except Exception as e:
            # Check if DB has a recent cached observation
            last_obs = (
                db.query(WeatherObservation)
                .filter(WeatherObservation.location_id == location_id)
                .order_by(WeatherObservation.recorded_at.desc())
                .first()
            )
            if last_obs and last_obs.recorded_at:
                rec_at = last_obs.recorded_at
                if rec_at.tzinfo is None:
                    rec_at = rec_at.replace(tzinfo=UTC)
                age_minutes = int((datetime.now(UTC) - rec_at).total_seconds() / 60)
                if age_minutes <= getattr(settings, "max_observation_age_min", 180):
                    return {
                        "location_id": location.id,
                        "city": location.city,
                        "ward_name": location.ward_name,
                        "latitude": location.latitude,
                        "longitude": location.longitude,
                        "recorded_at": rec_at,
                        "temperature_c": float(last_obs.temperature_c),
                        "rel_humidity_pct": float(last_obs.rel_humidity_pct),
                        "wind_speed_ms": float(last_obs.wind_speed_ms),
                        "solar_radiation_wm2": float(last_obs.solar_radiation_wm2),
                        "apparent_temperature_c": (
                            float(last_obs.apparent_temperature_c)
                            if last_obs.apparent_temperature_c is not None
                            else None
                        ),
                        "source_name": "cached_observation",
                        "is_demo": False,
                        "is_synthetic": False,
                        "demo_label": None,
                        "stale": True,
                        "age_minutes": age_minutes,
                        "completeness": 1.0,
                    }
            raise WeatherUnavailableError(f"Upstream weather service unavailable: {e}") from e

        curr = weather_data.get("current_weather", {})
        temp = curr.get("temperature")
        wind = curr.get("windspeed")

        # Hourly slice for humidity & solar radiation
        hourly = weather_data.get("hourly", {})
        rhs = hourly.get("relative_humidity_2m", [])
        sols = hourly.get("shortwave_radiation_instant", [])
        apps = hourly.get("apparent_temperature", [])

        rh = rhs[0] if (rhs and rhs[0] is not None) else None
        sol = sols[0] if (sols and sols[0] is not None) else None
        app_t = apps[0] if (apps and apps[0] is not None) else None

        if temp is None or wind is None or rh is None or sol is None:
            raise WeatherUnavailableError(
                "Upstream observation incomplete: missing required meteorological fields"
            )

        is_demo = weather_data.get("is_demo", False)
        demo_label = weather_data.get("demo_label", None) if is_demo else None
        source_name = "synthetic" if is_demo else weather_data.get("data_source", "Open-Meteo")

        obs_dict = {
            "location_id": location.id,
            "city": location.city,
            "ward_name": location.ward_name,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "recorded_at": datetime.now(UTC),
            "temperature_c": float(temp),
            "rel_humidity_pct": float(rh),
            "wind_speed_ms": float(wind),
            "solar_radiation_wm2": float(sol),
            "apparent_temperature_c": float(app_t) if app_t is not None else None,
            "source_name": source_name,
            "is_demo": is_demo,
            "is_synthetic": is_demo,
            "demo_label": demo_label,
            "stale": False,
            "age_minutes": weather_data.get("age_minutes", 0),
            "completeness": weather_data.get("completeness", 1.0),
        }

        if for_risk:
            assert_risk_inputs(obs_dict, settings)

        return obs_dict

    @staticmethod
    def get_weather_forecast(db: Session, location_id: int, days: int = 5) -> dict[str, Any]:
        """
        Retrieves multi-day hourly forecast for a ward.
        """
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise ValueError(f"Location ID {location_id} not found.")

        allow_synth = bool(
            getattr(settings, "allow_synthetic_risk", False)
            or settings.app_env in ["development", "testing"]
        )

        try:
            data = open_meteo_client.fetch_current_and_forecast(
                latitude=location.latitude,
                longitude=location.longitude,
                forecast_days=days,
                allow_synthetic=allow_synth,
            )
        except Exception as e:
            raise WeatherUnavailableError(f"Upstream forecast service unavailable: {e}") from e

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        rhs = hourly.get("relative_humidity_2m", [])
        winds = hourly.get("wind_speed_10m", [])
        sols = hourly.get("shortwave_radiation_instant", [])

        if not times or not temps:
            raise WeatherUnavailableError(
                "Upstream forecast incomplete: missing hourly time-series"
            )

        items = []
        for i in range(len(times)):
            items.append(
                {
                    "time": times[i],
                    "temperature_c": float(temps[i]),
                    "rel_humidity_pct": float(rhs[i])
                    if (rhs and i < len(rhs) and rhs[i] is not None)
                    else None,
                    "wind_speed_ms": float(winds[i])
                    if (winds and i < len(winds) and winds[i] is not None)
                    else None,
                    "solar_radiation_wm2": float(sols[i])
                    if (sols and i < len(sols) and sols[i] is not None)
                    else None,
                }
            )

        is_demo = data.get("is_demo", False)
        return {
            "location_id": location.id,
            "city": location.city,
            "ward_name": location.ward_name,
            "hourly": items,
            "is_demo": is_demo,
            "demo_label": data.get("demo_label", None) if is_demo else None,
        }
