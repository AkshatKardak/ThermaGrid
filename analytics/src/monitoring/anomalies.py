"""
Statistical Telemetry Anomaly Detection via Median Absolute Deviation (MAD) and Flatline Scanning.
"""

from typing import Any

import numpy as np


def detect_telemetry_anomalies(
    records: list[dict[str, Any]],
    z_threshold: float = 3.5,
    flatline_window: int = 12,
) -> list[dict[str, Any]]:
    """
    Scans a series of observations for:
    1. Robust MAD Z-score spikes (outliers)
    2. Consecutive identical values (frozen / stuck sensor)
    """
    anomalies: list[dict[str, Any]] = []
    temps = [r.get("temperature_c") for r in records]
    valid_temps = [t for t in temps if t is not None]

    if len(valid_temps) < 10:
        return anomalies

    median = np.median(valid_temps)
    mad = np.median(np.abs(valid_temps - median))
    if mad < 0.001:
        mad = 0.5  # prevent division by zero for low-variance records

    # Check for spikes
    for idx, r in enumerate(records):
        t = r.get("temperature_c")
        if t is None:
            continue
        z_score = 0.6745 * abs(t - median) / mad
        if z_score > z_threshold:
            anomalies.append(
                {
                    "index": idx,
                    "timestamp": r.get("timestamp"),
                    "type": "spike",
                    "value": t,
                    "expected_median": round(float(median), 2),
                    "z_score": round(float(z_score), 2),
                    "severity": "high" if z_score > 5.0 else "medium",
                }
            )

    # Check for flatlines
    repeat_count = 1
    for idx in range(1, len(records)):
        curr_t = records[idx].get("temperature_c")
        prev_t = records[idx - 1].get("temperature_c")
        if curr_t is not None and curr_t == prev_t:
            repeat_count += 1
            if repeat_count >= flatline_window:
                anomalies.append(
                    {
                        "index": idx,
                        "timestamp": records[idx].get("timestamp"),
                        "type": "flatline",
                        "value": curr_t,
                        "consecutive_hours": repeat_count,
                        "severity": "high",
                    }
                )
        else:
            repeat_count = 1

    return anomalies
