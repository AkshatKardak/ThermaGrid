"""
Data ingestion module.
"""

from .census_loader import (
    METROPOLITAN_WARD_BENCHMARKS,
    get_ward_demographics,
    list_all_wards,
)
from .open_meteo import OpenMeteoClient

__all__ = [
    "METROPOLITAN_WARD_BENCHMARKS",
    "OpenMeteoClient",
    "get_ward_demographics",
    "list_all_wards",
]
