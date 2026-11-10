"""
Risk Service orchestrator.
Composes Hazard, Exposure, and Vulnerability using the analytics risk package.
Generates deterministic factor breakdown and natural-language explanations.
"""

import sys
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))

from src.risk.scoring import compute_composite_risk
from app.services.thermal_service import ThermalService
from app.services.weather_service import WeatherService
from app.models.location import Location
from app.models.risk import RiskConfig
from app.schemas.provenance import create_provenance


class RiskService:
    @staticmethod
    def get_current_risk(db: Session, location_id: int) -> Dict[str, Any]:
        """
        Computes current comprehensive thermal risk score for a specific ward.
        """
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise ValueError(f"Location ID {location_id} not found.")

        # Get current thermal metrics
        thermal = ThermalService.get_current_thermal_indices(db, location_id, for_risk=True)
        weather = WeatherService.get_current_weather(db, location_id, for_risk=True)

        # Retrieve weights from DB config if present
        config = db.query(RiskConfig).filter(RiskConfig.config_name == "default").first()
        w_hazard = config.weight_hazard if config else 0.50
        w_exposure = config.weight_exposure if config else 0.25
        w_vulnerability = config.weight_vulnerability if config else 0.25

        canopy = location.tree_canopy_fraction if location.tree_canopy_fraction is not None else 0.15
        informal = location.informal_settlement_ratio if location.informal_settlement_ratio is not None else 0.30
        cooling = location.cooling_access_deficit if location.cooling_access_deficit is not None else 0.40
        outdoor = location.outdoor_worker_ratio if location.outdoor_worker_ratio is not None else 0.25
        elderly = location.elderly_ratio if location.elderly_ratio is not None else 0.08
        children = location.children_ratio if location.children_ratio is not None else 0.07

        risk_calc = compute_composite_risk(
            temp_c=weather["temperature_c"],
            wbgt_c=thermal["wbgt_c"],
            utci_c=thermal["utci_c"],
            heat_index_c=thermal["heat_index_c"],
            population_density_per_km2=location.population_density_per_km2,
            outdoor_worker_ratio=outdoor,
            elderly_ratio=elderly,
            children_ratio=children,
            informal_settlement_ratio=informal,
            vegetation_deficit_ratio=1.0 - canopy,
            cooling_access_deficit=cooling,
            weight_hazard=w_hazard,
            weight_exposure=w_exposure,
            weight_vulnerability=w_vulnerability,
            is_demo=weather["is_demo"],
        )

        # Dynamic confidence based on observation provenance and data completeness
        is_demo = weather.get("is_demo", False)
        if is_demo:
            confidence = 0.50
        else:
            completeness = float(weather.get("completeness", 1.0))
            age_min = weather.get("age_minutes", 0)
            freshness = max(0.5, 1.0 - (age_min / 360.0))
            confidence = round(0.95 * completeness * freshness, 2)

        # Adaptive capacity derived honestly from cooling access deficit if available
        adaptive_cap = (
            round(100.0 * (1.0 - location.cooling_access_deficit), 1)
            if location.cooling_access_deficit is not None
            else None
        )

        sub_scores = {
            "thermal_hazard": risk_calc["hazard_score"],
            "population_exposure": round(risk_calc["exposure_index"] * 100.0, 1),
            "social_vulnerability": round(risk_calc["vulnerability_index"] * 100.0, 1),
            "adaptive_capacity": adaptive_cap,
        }

        return {
            "location_id": location.id,
            "city": location.city,
            "ward_name": location.ward_name,
            "ward_code": location.ward_code,
            "level": location.level or "ward",
            "parent_code": location.parent_code,
            "calculated_for": datetime.now(timezone.utc),
            "risk_score": risk_calc["risk_score"],
            "band": risk_calc["band"],
            "band_label": risk_calc["band_label"],
            "alert_color": risk_calc["alert_color"],
            "hazard_score": risk_calc["hazard_score"],
            "exposure_index": risk_calc["exposure_index"],
            "vulnerability_index": risk_calc["vulnerability_index"],
            "factor_breakdown": risk_calc["factor_breakdown"],
            "explanation": risk_calc["explanation"],
            "temperature_c": weather["temperature_c"],
            "wbgt_c": thermal["wbgt_c"],
            "utci_c": thermal["utci_c"],
            "confidence": confidence,
            "sub_scores": sub_scores,
            "diagnostics": risk_calc.get("diagnostics", {
                "utci_c": thermal["utci_c"],
                "heat_index_c": thermal.get("heat_index_c", 0.0),
                "temperature_c": weather["temperature_c"],
            }),
            "is_demo": risk_calc["is_demo"],
            "demo_label": weather["demo_label"],
            "provenance": create_provenance(
                source="synthetic" if risk_calc["is_demo"] else "observed",
                is_synthetic=risk_calc["is_demo"],
                is_model_backed=True,
                completeness=0.98 if not is_demo else 0.50,
                quality_score=0.96 if not is_demo else 0.50,
            ),
        }

    @staticmethod
    def get_all_wards_risk(
        db: Session, city: Optional[str] = None, level: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves current risk ranking across locations.
        Never mixes levels inside one aggregate.
        """
        query = db.query(Location)
        if level:
            query = query.filter(Location.level == level)
        elif city:
            query = query.filter(Location.city.ilike(city))
            first_loc = query.first()
            if first_loc:
                query = query.filter(Location.level == first_loc.level)
        else:
            query = query.filter(Location.level == "ward")

        locations = query.all()

        results = []
        for w in locations:
            try:
                r = RiskService.get_current_risk(db, w.id)
                r["latitude"] = w.latitude
                r["longitude"] = w.longitude
                r["population"] = w.population
                r["level"] = w.level
                results.append(r)
            except Exception:
                continue

        # Sort descending by risk_score for authority prioritization
        results.sort(key=lambda x: x["risk_score"], reverse=True)
        return results
