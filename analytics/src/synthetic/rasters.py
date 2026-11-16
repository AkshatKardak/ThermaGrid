"""
Synthetic 2D Raster Grid Generator (LST, NDVI, Imperviousness) for Remote Sensing Analysis.
"""

from typing import Any

import numpy as np


def generate_synthetic_rasters(
    shape: tuple[int, int] = (100, 100),
    base_temp_c: float = 34.0,
    uhi_intensity_c: float = 6.5,
    seed: int = 2026,
) -> dict[str, Any]:
    """
    Generates synthetic 2D spatial fields simulating satellite observations:
    - Urban core has high imperviousness, low NDVI, high Land Surface Temperature (LST)
    - Surrounding periphery has higher vegetation, lower imperviousness, lower LST
    """
    rng = np.random.default_rng(seed)
    h, w = shape

    # Coordinate grid centered at (0,0)
    y, x = np.ogrid[-1 : 1 : complex(0, h), -1 : 1 : complex(0, w)]
    dist_from_center = np.sqrt(x * x + y * y)

    # Urban density / imperviousness radial decay + noise
    imperviousness = np.clip(1.0 - 0.8 * dist_from_center + rng.normal(0, 0.08, shape), 0.05, 0.95)

    # NDVI is negatively correlated with imperviousness
    ndvi = np.clip(0.7 * (1.0 - imperviousness) + rng.normal(0, 0.05, shape), -0.1, 0.85)

    # LST is positively driven by imperviousness and reduced by vegetation transpiration
    lst_field = (
        base_temp_c
        + uhi_intensity_c * (imperviousness - 0.4)
        - 3.5 * ndvi
        + rng.normal(0, 0.4, shape)
    )

    return {
        "shape": list(shape),
        "lst_mean_c": round(float(np.mean(lst_field)), 2),
        "lst_max_c": round(float(np.max(lst_field)), 2),
        "lst_min_c": round(float(np.min(lst_field)), 2),
        "uhi_delta_c": round(float(np.max(lst_field) - np.min(lst_field)), 2),
        "mean_ndvi": round(float(np.mean(ndvi)), 3),
        "mean_imperviousness": round(float(np.mean(imperviousness)), 3),
        "lst_grid": lst_field.round(2).tolist(),
        "ndvi_grid": ndvi.round(3).tolist(),
        "is_synthetic": True,
    }
