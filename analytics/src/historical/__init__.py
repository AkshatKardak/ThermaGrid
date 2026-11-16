"""
Historical Climate Analytics Module.
"""

from .aggregate import aggregate_daily
from .extremes import detect_heatwave_spells
from .store import HistoricalDataUnavailable, HistoricalStore
from .trends import compute_trend
from .yoy import compute_yoy_anomalies

__all__ = [
    "HistoricalDataUnavailable",
    "HistoricalStore",
    "aggregate_daily",
    "compute_trend",
    "compute_yoy_anomalies",
    "detect_heatwave_spells",
]
