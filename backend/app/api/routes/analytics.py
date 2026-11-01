"""
Analytics routes: Trends, spatial hotspots, exposure distribution, and vulnerability analysis.
"""

import sys
import os
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.location import Location
from app.services.risk_service import RiskService
from app.services.thermal_service import ThermalService

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))
from src.spatial.hotspots import compute_ward_hotspots

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/trends")
def get_thermal_trends(
    location_id: int = Query(1, description="Location ID"),
    days: int = Query(3, ge=1, le=7),
    db: Session = Depends(get_db),
):
    """Returns diurnal trend analysis comparing WBGT, UTCI, and Heat Index."""
    return ThermalService.get_thermal_history(db, location_id, days=days)


@router.get("/hotspots")
def get_spatial_hotspots(
    city: Optional[str] = Query("Mumbai", description="City to analyze"),
    db: Session = Depends(get_db),
):
    """
    Computes spatial risk hotspots using Getis-Ord Gi* z-score statistics across city wards.
    """
    wards_risk = RiskService.get_all_wards_risk(db, city=city)
    hotspots = compute_ward_hotspots(wards_risk, score_key="risk_score")
    return {
        "city": city,
        "total_wards": len(hotspots),
        "hotspots_count": len([h for h in hotspots if h["is_hotspot"]]),
        "hotspots": hotspots,
    }


@router.get("/exposure")
def get_exposure_analytics(
    city: Optional[str] = Query("Mumbai"),
    db: Session = Depends(get_db),
):
    """Returns comparative population density and outdoor workforce exposure statistics."""
    wards = db.query(Location).filter(Location.city.ilike(f"%{city}%")).all()
    records = []
    total_workers_at_risk = 0
    total_population = 0

    for w in wards:
        workers = int(w.population * w.outdoor_worker_ratio)
        total_workers_at_risk += workers
        total_population += w.population
        records.append({
            "ward_id": w.id,
            "ward_name": w.ward_name,
            "ward_code": w.ward_code,
            "population": w.population,
            "population_density": w.population_density_per_km2,
            "outdoor_workers": workers,
            "outdoor_worker_ratio": w.outdoor_worker_ratio,
        })

    return {
        "city": city,
        "total_population": total_population,
        "total_outdoor_workers": total_workers_at_risk,
        "wards": records,
    }


@router.get("/vulnerability")
def get_vulnerability_analytics(
    city: Optional[str] = Query("Mumbai"),
    db: Session = Depends(get_db),
):
    """Returns structural and demographic vulnerability factors by ward."""
    wards = db.query(Location).filter(Location.city.ilike(f"%{city}%")).all()
    records = []
    for w in wards:
        records.append({
            "ward_id": w.id,
            "ward_name": w.ward_name,
            "ward_code": w.ward_code,
            "informal_settlement_pct": round(w.informal_settlement_ratio * 100, 1),
            "tree_canopy_pct": round(w.tree_canopy_fraction * 100, 1),
            "canopy_deficit_pct": round((1.0 - w.tree_canopy_fraction) * 100, 1),
            "elderly_children_pct": round((w.elderly_ratio + w.children_ratio) * 100, 1),
            "cooling_deficit_pct": round(w.cooling_access_deficit * 100, 1),
            "hospitals_count": w.hospital_count,
        })

    return {
        "city": city,
        "wards": records,
    }
