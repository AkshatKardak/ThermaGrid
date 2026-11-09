"""
Forecast Service orchestrator.
Generates 3-5 day risk forecast with confidence intervals using the trained ML pipeline.
"""

import sys
import os
from typing import Dict, Any, List
from datetime import datetime, timezone
import numpy as np
from sqlalchemy.orm import Session

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))

from src.forecasting.model import ThermalForecastPipeline
from src.thermal_indices.wbgt import calculate_wbgt
from src.thermal_indices.utci import calculate_utci
from src.thermal_indices.heat_index import calculate_heat_index
from src.risk.scoring import compute_composite_risk
from app.services.weather_service import WeatherService
from app.models.location import Location
from app.core.config import get_settings

settings = get_settings()

# Load trained forecast pipeline singleton
ml_pipeline = ThermalForecastPipeline.load(settings.MODEL_ARTIFACT_PATH)


class ForecastService:
    @staticmethod
    def get_risk_forecast(db: Session, location_id: int, days: int = 5) -> Dict[str, Any]:
        """
        Produces hourly risk forecasts with 80% confidence interval bounds.
        """
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise ValueError(f"Location ID {location_id} not found.")

        weather_fc = WeatherService.get_weather_forecast(db, location_id, days=days)
        hourly_records = weather_fc["hourly"]

        items = []
        for i, h in enumerate(hourly_records):
            t = h["temperature_c"]
            rh = h["rel_humidity_pct"]
            w = h["wind_speed_ms"]
            s = h["solar_radiation_wm2"]

            # Ground truth calculation for base thermal indices
            wbgt_v = calculate_wbgt(t, rh, w, s)["wbgt"]
            utci_v = calculate_utci(t, rh, w, s)["utci"]
            hi_v = calculate_heat_index(t, rh)["heat_index_c"]

            canopy = location.tree_canopy_fraction if location.tree_canopy_fraction is not None else 0.15
            informal = location.informal_settlement_ratio if location.informal_settlement_ratio is not None else 0.30
            cooling = location.cooling_access_deficit if location.cooling_access_deficit is not None else 0.40
            outdoor = location.outdoor_worker_ratio if location.outdoor_worker_ratio is not None else 0.25
            elderly = location.elderly_ratio if location.elderly_ratio is not None else 0.08
            children = location.children_ratio if location.children_ratio is not None else 0.07

            risk_eval = compute_composite_risk(
                temp_c=t,
                wbgt_c=wbgt_v,
                utci_c=utci_v,
                heat_index_c=hi_v,
                population_density_per_km2=location.population_density_per_km2,
                outdoor_worker_ratio=outdoor,
                elderly_ratio=elderly,
                children_ratio=children,
                informal_settlement_ratio=informal,
                vegetation_deficit_ratio=1.0 - canopy,
                cooling_access_deficit=cooling,
            )

            score = risk_eval["risk_score"]

            predicted = None
            is_model_backed = False
            method = "weather_derived_projection"
            if ml_pipeline is not None and getattr(ml_pipeline, "is_trained", False):
                pred = ml_pipeline.predict_with_confidence(
                    features=build_forecast_features(h, location), horizon_hours=i
                )
                predicted = pred["value"]
                lower_bound, upper_bound = pred["lower"], pred["upper"]
                is_model_backed = bool(pred.get("is_model_backed", True))
                method = "quantile_gbm" if is_model_backed else "weather_derived_projection"

            if predicted is None:
                # Heuristic widening — NOT a prediction interval.
                lead_hour_penalty = (i / len(hourly_records)) * 4.5
                lower_bound = max(0.0, round(score - (3.5 + lead_hour_penalty), 1))
                upper_bound = min(100.0, round(score + (3.5 + lead_hour_penalty), 1))

            items.append({
                "time": h["time"],
                "predicted_risk_score": score,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "band": risk_eval["band"],
                "predicted_wbgt": wbgt_v,
                "temperature_c": t,
            })

        return {
            "location_id": location.id,
            "city": location.city,
            "ward_name": location.ward_name,
            "forecast_days": days,
            "items": items,
            "method": method,
            "is_model_backed": is_model_backed,
            "interval_kind": "prediction_interval" if is_model_backed else "heuristic_uncertainty",
            "is_demo": weather_fc["is_demo"],
            "demo_label": weather_fc["demo_label"],
        }
