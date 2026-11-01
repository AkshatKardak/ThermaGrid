"""
Database models package.
"""

from app.models.user import User
from app.models.location import Location
from app.models.weather import WeatherObservation, WeatherForecast
from app.models.thermal import ThermalIndex
from app.models.risk import RiskScore, RiskForecast, RiskConfig
from app.models.cooling_centre import CoolingCentre
from app.models.alert import Alert
from app.models.data_source import DataSource

__all__ = [
    "User",
    "Location",
    "WeatherObservation",
    "WeatherForecast",
    "ThermalIndex",
    "RiskScore",
    "RiskForecast",
    "RiskConfig",
    "CoolingCentre",
    "Alert",
    "DataSource",
]
