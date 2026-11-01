"""
Thermal Indices routes for WBGT, UTCI, and Heat Index.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.thermal_service import ThermalService
from app.schemas.thermal import ThermalCurrentOut
from src.historical.store import HistoricalDataUnavailable

router = APIRouter(prefix="/thermal", tags=["Thermal Indices"])


@router.get("/current", response_model=ThermalCurrentOut)
def get_current_thermal(
    location_id: int = Query(1, description="Ward Location ID"),
    db: Session = Depends(get_db),
):
    """Calculates current ISO 7243 WBGT, UTCI, and Heat Index for a ward."""
    return ThermalService.get_current_thermal_indices(db, location_id)


@router.get("/history")
def get_thermal_history(
    location_id: int = Query(1, description="Ward Location ID"),
    days: int = Query(2, ge=1, le=5),
    db: Session = Depends(get_db),
):
    """Retrieves hourly time-series of thermal indices over past & forecast hours."""
    try:
        return ThermalService.get_thermal_history(db, location_id, days=days)
    except HistoricalDataUnavailable as e:
        raise HTTPException(status_code=409, detail=str(e))
