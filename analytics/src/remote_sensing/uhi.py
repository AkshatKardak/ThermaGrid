"""
Surface Urban Heat Island (SUHI) Metric Evaluation.
"""

from typing import Any

import numpy as np


def compute_uhi_intensity(
    urban_lst_field: np.ndarray,
    rural_lst_buffer: np.ndarray,
) -> dict[str, Any]:
    """
    Computes Surface Urban Heat Island intensity:
    SUHI = mean(LST_urban) - mean(LST_rural)
    """
    urban_mean = float(np.mean(urban_lst_field))
    rural_mean = float(np.mean(rural_lst_buffer))
    suhi_intensity = round(urban_mean - rural_mean, 2)

    return {
        "suhi_intensity_c": suhi_intensity,
        "urban_mean_lst_c": round(urban_mean, 2),
        "rural_mean_lst_c": round(rural_mean, 2),
        "urban_peak_lst_c": round(float(np.max(urban_lst_field)), 2),
        "is_significant": bool(suhi_intensity >= 2.0),
        "severity": "Severe"
        if suhi_intensity >= 5.0
        else ("Moderate" if suhi_intensity >= 2.5 else "Mild"),
    }
