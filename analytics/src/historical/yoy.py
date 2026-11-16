"""
Year-Over-Year (YoY) Thermal Anomaly and Climatological Delta Evaluation.
"""

from typing import Any

import numpy as np


def compute_yoy_anomalies(
    yearly_metrics: list[dict[str, Any]],
    baseline_years_range: tuple = (2000, 2020),
) -> list[dict[str, Any]]:
    """
    Computes yearly mean temperature and heatwave days anomalies
    relative to a reference climatological baseline.
    """
    # 1. Calculate baseline average
    baseline_vals = [
        y["t_mean_c"]
        for y in yearly_metrics
        if y.get("t_mean_c") is not None
        and baseline_years_range[0] <= y.get("year", 0) <= baseline_years_range[1]
    ]
    baseline_mean = float(np.mean(baseline_vals)) if baseline_vals else 28.5

    anomalies = []
    for y in yearly_metrics:
        val = y.get("t_mean_c")
        if val is None:
            continue
        delta = round(float(val - baseline_mean), 2)
        anomalies.append(
            {
                "year": y.get("year"),
                "t_mean_c": val,
                "baseline_mean_c": round(baseline_mean, 2),
                "anomaly_c": delta,
                "anomaly_direction": "above_normal"
                if delta > 0.2
                else ("below_normal" if delta < -0.2 else "normal"),
                "heatwave_days_count": y.get("heatwave_days", 0),
            }
        )

    return anomalies
