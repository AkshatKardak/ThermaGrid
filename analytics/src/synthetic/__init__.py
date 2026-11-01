"""
Deterministic Synthetic Atmospheric & Ward Generation Module.
"""

from .profiles import CLIMATE_PROFILES
from .weather import generate_hourly_weather
from .wards import generate_synthetic_wards
from .rasters import generate_synthetic_rasters
from .inject import (
    inject_heatwave_spell,
    inject_sensor_spikes,
    inject_sensor_flatline,
    inject_missing_gaps,
)
from .manifest import create_manifest

__all__ = [
    "CLIMATE_PROFILES",
    "generate_hourly_weather",
    "generate_synthetic_wards",
    "generate_synthetic_rasters",
    "inject_heatwave_spell",
    "inject_sensor_spikes",
    "inject_sensor_flatline",
    "inject_missing_gaps",
    "create_manifest",
]
