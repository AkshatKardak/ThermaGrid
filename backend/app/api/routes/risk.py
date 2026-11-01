"""
Thermal Risk endpoints: current score, multi-day forecast, ward drilldowns.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.risk_service import RiskService
from app.services.forecast_service import ForecastService
from app.schemas.risk import RiskCurrentOut, RiskForecastOut

router = APIRouter(prefix="/risk", tags=["Thermal Risk"])


@router.get("/current", response_model=RiskCurrentOut)
def get_current_risk(
    location_id: int = Query(1, description="Ward Location ID"),
    db: Session = Depends(get_db),
):
    """
    Computes current comprehensive ward-level human thermal risk score (0-100),
    factor breakdown, and deterministic explanation.
    """
    return RiskService.get_current_risk(db, location_id)


@router.get("/forecast", response_model=RiskForecastOut)
def get_risk_forecast(
    location_id: int = Query(1, description="Ward Location ID"),
    days: int = Query(5, ge=1, le=7),
    db: Session = Depends(get_db),
):
    """
    Produces 3-5 day risk forecast with lower and upper confidence bounds.
    """
    return ForecastService.get_risk_forecast(db, location_id, days=days)


@router.get("/all", response_model=List[RiskCurrentOut])
def get_all_wards_risk(
    city: Optional[str] = Query(None, description="Filter by city, e.g. Mumbai"),
    db: Session = Depends(get_db),
):
    """
    Returns current risk score ranking across all wards in a city for authority prioritization.
    """
    return RiskService.get_all_wards_risk(db, city=city)


@router.get("/{location_id}", response_model=RiskCurrentOut)
def get_risk_by_location(location_id: int, db: Session = Depends(get_db)):
    """Retrieves risk evaluation for a specific ward ID."""
    return RiskService.get_current_risk(db, location_id)
