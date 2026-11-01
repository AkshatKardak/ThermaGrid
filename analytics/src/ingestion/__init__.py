"""
Data ingestion module.
"""

from .open_meteo import OpenMeteoClient
from .census_loader import get_ward_demographics, list_all_wards, METROPOLITAN_WARD_BENCHMARKS

__all__ = [
    "OpenMeteoClient",
    "get_ward_demographics",
    "list_all_wards",
    "METROPOLITAN_WARD_BENCHMARKS",
]
