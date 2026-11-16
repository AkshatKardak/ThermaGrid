"""
Pydantic schemas for Weather observations and forecasts.
"""

from datetime import datetime

from pydantic import BaseModel


class WeatherCurrentOut(BaseModel):
    location_id: int
    city: str
    ward_name: str
    latitude: float
    longitude: float
    recorded_at: datetime
    temperature_c: float
    rel_humidity_pct: float
    wind_speed_ms: float
    solar_radiation_wm2: float
    apparent_temperature_c: float | None = None
    source_name: str
    is_demo: bool = False
    demo_label: str | None = None


class HourlyWeatherItem(BaseModel):
    time: str
    temperature_c: float
    rel_humidity_pct: float
    wind_speed_ms: float
    solar_radiation_wm2: float


class WeatherForecastOut(BaseModel):
    location_id: int
    city: str
    ward_name: str
    hourly: list[HourlyWeatherItem]
    is_demo: bool = False
    demo_label: str | None = None
