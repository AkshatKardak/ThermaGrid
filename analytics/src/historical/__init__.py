"""
Historical Climate Analytics Module.
"""

from .aggregate import aggregate_daily
from .extremes import detect_heatwave_spells
from .trends import compute_trend
from .yoy import compute_yoy_anomalies
from .store import HistoricalStore, HistoricalDataUnavailable

__all__ = [
    "aggregate_daily",
    "detect_heatwave_spells",
    "compute_trend",
    "compute_yoy_anomalies",
    "HistoricalStore",
    "HistoricalDataUnavailable",
]
