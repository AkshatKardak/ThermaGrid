"""
Heat Equity Index (HEI) Computation Engine.
Evaluates disproportionate heat exposure on underserved and informal populations.
"""

from typing import List, Dict, Any
from .normalize import min_max_normalize


def compute_heat_equity_index(
    wards: List[Dict[str, Any]],
    weights: Dict[str, float] = None,
) -> List[Dict[str, Any]]:
    """
    Computes HEI for each ward:
    HEI = w_hazard * Hazard + w_exposure * Exposure + w_vuln * Vulnerability + w_adapt * (1 - AdaptiveCapacity)
    Scaled to [0, 100].
    """
    if weights is None:
        weights = {"hazard": 0.40, "exposure": 0.25, "vulnerability": 0.20, "adaptive_capacity": 0.15}
        
    n = len(wards)
    if n == 0:
        return []
        
    # Extract raw vectors
    hazards = [w.get("wbgt_c", 30.0) for w in wards]
    densities = [w.get("population_density_per_km2", 20000.0) for w in wards]
    informal = [w.get("informal_settlement_ratio", 0.3) for w in wards]
    canopies = [w.get("tree_canopy_fraction", 0.15) for w in wards]
    
    # Normalize components
    norm_h = min_max_normalize(hazards)
    norm_e = min_max_normalize(densities)
    norm_v = min_max_normalize(informal)
    norm_a = min_max_normalize(canopies)
    
    w_h = weights.get("hazard", 0.40)
    w_e = weights.get("exposure", 0.25)
    w_v = weights.get("vulnerability", 0.20)
    w_a = weights.get("adaptive_capacity", 0.15)
    
    results = []
    for i, w in enumerate(wards):
        h_score = norm_h[i]
        e_score = norm_e[i]
        v_score = norm_v[i]
        a_deficit = 1.0 - norm_a[i]
        
        composite_raw = w_h * h_score + w_e * e_score + w_v * v_score + w_a * a_deficit
        hei_score = round(float(composite_raw * 100.0), 1)
        
        results.append({
            "ward_code": w.get("ward_code"),
            "ward_name": w.get("ward_name"),
            "hei_score": hei_score,
            "equity_tier": "Critical Priority" if hei_score >= 75 else ("High Priority" if hei_score >= 50 else "Moderate"),
            "sub_scores": {
                "hazard_norm": round(h_score, 3),
                "exposure_norm": round(e_score, 3),
                "vulnerability_norm": round(v_score, 3),
                "adaptive_deficit_norm": round(a_deficit, 3),
            },
        })
        
    return results
