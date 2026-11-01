"""
Telemetry Data Quality Metrics: Completeness, Validity, Uniqueness, Freshness.
"""

from typing import List, Dict, Any
from datetime import datetime, timezone
import numpy as np


def compute_completeness(records: List[Dict[str, Any]], expected_count: int) -> float:
    """Calculates data completeness ratio (0.0 to 1.0)."""
    if expected_count <= 0:
        return 1.0
    valid_count = sum(1 for r in records if r.get("temperature_c") is not None)
    return round(float(min(1.0, valid_count / expected_count)), 3)


def compute_validity(records: List[Dict[str, Any]]) -> float:
    """Checks physical atmospheric plausibility: -10°C <= Temp <= 60°C, 0% <= RH <= 100%."""
    if not records:
        return 1.0
    valid_count = 0
    total = len(records)
    for r in records:
        t = r.get("temperature_c")
        rh = r.get("rel_humidity_pct")
        if t is None:
            continue
        if -10.0 <= t <= 60.0 and (rh is None or 0.0 <= rh <= 100.0):
            valid_count += 1
    return round(float(valid_count / total), 3)


def compute_freshness_seconds(latest_timestamp_iso: str) -> int:
    """Calculates seconds elapsed since the most recent telemetry observation."""
    try:
        dt = datetime.fromisoformat(latest_timestamp_iso.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        delta = (now - dt).total_seconds()
        return max(0, int(delta))
    except Exception:
        return 999999
