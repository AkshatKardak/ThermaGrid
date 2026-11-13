"""
Schemas package.
"""

from app.schemas.user import UserCreate, UserLogin, UserOut, Token, TokenPayload
from app.schemas.location import LocationOut
from app.schemas.weather import WeatherCurrentOut, WeatherForecastOut
from app.schemas.thermal import ThermalCurrentOut, ThermalHistoryOut
from app.schemas.risk import (
    RiskCurrentOut,
    RiskForecastOut,
)
from app.schemas.cooling_centre import CoolingCentreOut
from app.schemas.alert import AlertCreate, AlertOut
from app.schemas.data_source import DataSourceOut

__all__ = [
    "UserCreate",
    "UserLogin",
    "UserOut",
    "Token",
    "TokenPayload",
    "LocationOut",
    "WeatherCurrentOut",
    "WeatherForecastOut",
    "ThermalCurrentOut",
    "ThermalHistoryOut",
    "RiskCurrentOut",
    "RiskForecastOut",
    "CoolingCentreOut",
    "AlertCreate",
    "AlertOut",
    "DataSourceOut",
]
