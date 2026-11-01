"""
Feature Normalization for Composite Equity Indexing.
"""

from typing import List
import numpy as np


def min_max_normalize(values: List[float]) -> List[float]:
    """Scales a list of floats to [0, 1]. Returns 0.5 if range is zero."""
    vals = np.array(values, dtype=float)
    v_min = np.min(vals)
    v_max = np.max(vals)
    if abs(v_max - v_min) < 1e-7:
        return [0.5] * len(values)
    norm = (vals - v_min) / (v_max - v_min)
    return [round(float(x), 4) for x in norm]
