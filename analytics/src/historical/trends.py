"""
Climatological Trend Analysis: Sen's Slope and Mann-Kendall Non-Parametric Trend Test.
"""

from typing import Any

import numpy as np
from scipy import stats


def compute_trend(
    values: list[float],
    time_steps_years: list[float] = None,
) -> dict[str, Any]:
    """
    Computes Sen's Slope estimator and Mann-Kendall / Kendall tau trend statistics.
    Returns:
    - slope_per_year: Theil-Sen rate of change
    - p_value: statistical significance test (p < 0.05 indicates significant warming trend)
    - direction: 'warming', 'cooling', or 'stable'
    """
    clean_vals = [v for v in values if v is not None and not np.isnan(v)]
    n = len(clean_vals)
    if n < 5:
        return {
            "slope_per_decade": 0.0,
            "p_value": 1.0,
            "direction": "insufficient_data",
            "is_significant": False,
        }

    x = np.arange(n) if time_steps_years is None else np.array(time_steps_years[:n])
    y = np.array(clean_vals)

    # Theil-Sen robust slope
    res = stats.theil_sen(y, x)
    slope = float(res.slope)

    # Kendall Tau
    tau, p_val = stats.kendalltau(x, y)

    is_sig = bool(p_val < 0.05)
    if is_sig and slope > 0:
        direction = "warming"
    elif is_sig and slope < 0:
        direction = "cooling"
    else:
        direction = "stable"

    return {
        "slope_per_year": round(slope, 4),
        "slope_per_decade": round(slope * 10.0, 3),
        "kendall_tau": round(float(tau), 4),
        "p_value": round(float(p_val), 5),
        "direction": direction,
        "is_significant": is_sig,
        "sample_size": n,
    }
