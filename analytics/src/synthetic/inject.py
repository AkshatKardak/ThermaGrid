"""
Synthetic Anomaly, Heatwave, and Sensor Fault Injector for Data Quality Stress Testing.
"""

import copy
from typing import Any

import numpy as np


def inject_heatwave_spell(
    records: list[dict[str, Any]],
    start_index: int = 48,
    duration_hours: int = 72,
    temp_boost_c: float = 4.5,
) -> list[dict[str, Any]]:
    """Injects a multi-day heatwave spell into a series."""
    series = copy.deepcopy(records)
    end = min(len(series), start_index + duration_hours)
    for i in range(start_index, end):
        series[i]["temperature_c"] = round(series[i]["temperature_c"] + temp_boost_c, 2)
        series[i]["heatwave_injected"] = True
    return series


def inject_sensor_spikes(
    records: list[dict[str, Any]],
    count: int = 3,
    spike_magnitude_c: float = 16.0,
    seed: int = 999,
) -> list[dict[str, Any]]:
    """Injects unphysical sensor spikes into telemetry."""
    series = copy.deepcopy(records)
    rng = np.random.default_rng(seed)
    indices = rng.choice(len(series), size=min(count, len(series)), replace=False)
    for idx in indices:
        series[idx]["temperature_c"] = round(series[idx]["temperature_c"] + spike_magnitude_c, 2)
        series[idx]["fault_injected"] = "spike"
    return series


def inject_sensor_flatline(
    records: list[dict[str, Any]],
    start_index: int = 30,
    duration_hours: int = 14,
) -> list[dict[str, Any]]:
    """Injects a frozen/flatlined sensor reading."""
    series = copy.deepcopy(records)
    end = min(len(series), start_index + duration_hours)
    frozen_val = series[start_index]["temperature_c"]
    for i in range(start_index, end):
        series[i]["temperature_c"] = frozen_val
        series[i]["fault_injected"] = "flatline"
    return series


def inject_missing_gaps(
    records: list[dict[str, Any]],
    start_index: int = 12,
    duration_hours: int = 6,
) -> list[dict[str, Any]]:
    """Simulates communication outage / data dropouts."""
    series = copy.deepcopy(records)
    end = min(len(series), start_index + duration_hours)
    for i in range(start_index, end):
        series[i]["temperature_c"] = None
        series[i]["rel_humidity_pct"] = None
        series[i]["fault_injected"] = "gap"
    return series
