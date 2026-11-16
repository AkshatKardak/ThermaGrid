"""
Deterministic Synthetic Atmospheric & Ward Generation Module.
"""

from .inject import (
    inject_heatwave_spell,
    inject_missing_gaps,
    inject_sensor_flatline,
    inject_sensor_spikes,
)
from .manifest import create_manifest
from .profiles import CLIMATE_PROFILES
from .rasters import generate_synthetic_rasters
from .wards import generate_synthetic_wards
from .weather import generate_hourly_weather

__all__ = [
    "CLIMATE_PROFILES",
    "create_manifest",
    "generate_hourly_weather",
    "generate_synthetic_rasters",
    "generate_synthetic_wards",
    "inject_heatwave_spell",
    "inject_missing_gaps",
    "inject_sensor_flatline",
    "inject_sensor_spikes",
]
