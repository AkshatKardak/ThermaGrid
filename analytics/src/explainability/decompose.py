"""
Exact Additive Risk Score Decomposition Engine.
Decomposes composite score into exact constituent points and percentage contributions.
"""

from typing import Dict, Any


def decompose_risk_score(
    hazard_score: float,       # 0 - 100
    exposure_score: float,     # 0 - 100
    vulnerability_score: float,# 0 - 100
    adaptive_deficit: float,   # 0 - 100
    weights: Dict[str, float] = None,
) -> Dict[str, Any]:
    """
    Decomposes composite risk score into exact additive point contributions:
    Score = w_h * H + w_e * E + w_v * V + w_a * A_def
    """
    if weights is None:
        weights = {"hazard": 0.40, "exposure": 0.25, "vulnerability": 0.20, "adaptive_deficit": 0.15}
        
    w_h = weights.get("hazard", 0.40)
    w_e = weights.get("exposure", 0.25)
    w_v = weights.get("vulnerability", 0.20)
    w_a = weights.get("adaptive_deficit", 0.15)
    
    contrib_h = round(w_h * hazard_score, 2)
    contrib_e = round(w_e * exposure_score, 2)
    contrib_v = round(w_v * vulnerability_score, 2)
    contrib_a = round(w_a * adaptive_deficit, 2)
    
    total = round(contrib_h + contrib_e + contrib_v + contrib_a, 1)
    
    # Calculate percentage contributions
    pct_h = round((contrib_h / total * 100) if total > 0 else 25.0, 1)
    pct_e = round((contrib_e / total * 100) if total > 0 else 25.0, 1)
    pct_v = round((contrib_v / total * 100) if total > 0 else 25.0, 1)
    pct_a = round((contrib_a / total * 100) if total > 0 else 25.0, 1)
    
    return {
        "composite_score": total,
        "point_contributions": {
            "hazard_pts": contrib_h,
            "exposure_pts": contrib_e,
            "vulnerability_pts": contrib_v,
            "adaptive_deficit_pts": contrib_a,
        },
        "percentage_contributions": {
            "hazard_pct": pct_h,
            "exposure_pct": pct_e,
            "vulnerability_pct": pct_v,
            "adaptive_deficit_pct": pct_a,
        },
        "dominant_driver": max(
            [("Thermal Hazard", contrib_h), ("Population Exposure", contrib_e),
             ("Socioeconomic Vulnerability", contrib_v), ("Lack of Adaptive Capacity", contrib_a)],
            key=lambda x: x[1]
        )[0],
    }
