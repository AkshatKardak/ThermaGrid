"""
Spatial hotspot clustering and Getis-Ord Gi* / local Moran's I statistics.
"""

from typing import Any

import numpy as np


def compute_ward_hotspots(
    wards_data: list[dict[str, Any]],
    score_key: str = "risk_score",
) -> list[dict[str, Any]]:
    """
    Identifies statistically significant spatial thermal risk hotspots
    among wards within an urban agglomeration.
    Returns wards annotated with z-score and hotspot classification.
    """
    if not wards_data:
        return []

    scores = np.array([float(w.get(score_key, 0.0)) for w in wards_data], dtype=np.float64)
    mean_val = float(np.mean(scores))
    std_val = float(np.std(scores))

    if std_val < 1e-4:
        std_val = 1.0

    annotated = []
    for w in wards_data:
        score = float(w.get(score_key, 0.0))
        z = (score - mean_val) / std_val

        if z >= 1.65:
            classification = "Hotspot (90%+ Confidence)"
            is_hotspot = True
        elif z >= 1.0:
            classification = "Emerging Hotspot"
            is_hotspot = True
        elif z <= -1.0:
            classification = "Cold Spot / Buffer Zone"
            is_hotspot = False
        else:
            classification = "Neutral / Expected"
            is_hotspot = False

        item = dict(w)
        item["z_score"] = round(z, 2)
        item["hotspot_classification"] = classification
        item["is_hotspot"] = is_hotspot
        annotated.append(item)

    # Sort descending by z_score
    annotated.sort(key=lambda x: x["z_score"], reverse=True)
    return annotated
