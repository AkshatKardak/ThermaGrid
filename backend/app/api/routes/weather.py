"""
Weather observation and forecast routes.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.weather_service import WeatherService
from app.schemas.weather import WeatherCurrentOut, WeatherForecastOut

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/current", response_model=WeatherCurrentOut)
def get_current_weather(
    location_id: int = Query(1, description="Ward Location ID"),
    db: Session = Depends(get_db),
):
    """Retrieves current surface meteorological observations for a ward."""
    return WeatherService.get_current_weather(db, location_id)


@router.get("/forecast", response_model=WeatherForecastOut)
def get_weather_forecast(
    location_id: int = Query(1, description="Ward Location ID"),
    days: int = Query(5, ge=1, le=7, description="Number of forecast days"),
    db: Session = Depends(get_db),
):
    """Retrieves 5-day hourly meteorological forecast for a ward."""
    return WeatherService.get_weather_forecast(db, location_id, days=days)
