"""
Local Spatial Autocorrelation & Hotspot Detection (Getis-Ord Gi* approximation).
"""

from typing import Any

import numpy as np


def detect_spatial_hotspots(
    features: list[dict[str, Any]],
    value_key: str = "wbgt_c",
    distance_threshold_km: float = 8.0,
) -> list[dict[str, Any]]:
    """
    Computes local Getis-Ord Gi* z-scores to identify statistically significant
    spatial clusters of high thermal stress.
    Gi* > 1.96: 95% confidence hot spot
    Gi* < -1.96: 95% confidence cold spot
    """
    n = len(features)
    if n < 4:
        return features

    vals = np.array([f.get(value_key, 0.0) for f in features], dtype=float)
    lats = np.array([f.get("latitude", 0.0) for f in features], dtype=float)
    lons = np.array([f.get("longitude", 0.0) for f in features], dtype=float)

    mean_val = float(np.mean(vals))
    std_val = float(np.std(vals))
    if std_val < 1e-5:
        std_val = 1.0

    results = []
    for i in range(n):
        # Calculate spatial weights: inverse distance or threshold
        # Approximate 1 deg = 111km
        dists_km = np.sqrt(
            ((lats - lats[i]) * 111.0) ** 2
            + ((lons - lons[i]) * 111.0 * np.cos(np.radians(lats[i]))) ** 2
        )
        weights = (dists_km <= distance_threshold_km).astype(float)

        w_sum = np.sum(weights)
        w_sum_sq = np.sum(weights**2)

        numerator = np.sum(weights * vals) - mean_val * w_sum
        denom = std_val * np.sqrt((n * w_sum_sq - w_sum**2) / (n - 1.0))

        gi_z = float(numerator / denom) if denom > 1e-6 else 0.0

        item = dict(features[i])
        item["gi_z_score"] = round(gi_z, 3)
        if gi_z >= 2.58:
            item["cluster_type"] = "99% Hot Spot"
        elif gi_z >= 1.96:
            item["cluster_type"] = "95% Hot Spot"
        elif gi_z <= -1.96:
            item["cluster_type"] = "Cold Spot"
        else:
            item["cluster_type"] = "Not Significant"

        results.append(item)

    return results
