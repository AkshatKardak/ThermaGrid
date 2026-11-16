"""
Dedicated forecast route by location.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.risk import RiskForecastOut
from app.services.forecast_service import ForecastService

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("/{location_id}", response_model=RiskForecastOut)
def get_forecast_by_location(
    location_id: int,
    days: int = Query(5, ge=1, le=7),
    db: Session = Depends(get_db),
):
    """Retrieves 5-day ML risk forecast with confidence intervals for a specific ward."""
    return ForecastService.get_risk_forecast(db, location_id, days=days)
