"""
Feature Normalization for Composite Equity Indexing.
"""

import numpy as np


def min_max_normalize(values: list[float | None], default: float = 0.5) -> list[float]:
    """Scales a list of floats to [0, 1]. Replaces None/NaN with default (0.5), returns 0.5 if range is zero."""
    clean_vals = [
        float(v) if (v is not None and not np.isnan(float(v))) else default for v in values
    ]
    if not clean_vals:
        return []
    vals = np.array(clean_vals, dtype=float)
    v_min = float(np.min(vals))
    v_max = float(np.max(vals))
    if abs(v_max - v_min) < 1e-7:
        return [0.5] * len(values)
    norm = (vals - v_min) / (v_max - v_min)
    return [round(float(x), 4) for x in norm]
