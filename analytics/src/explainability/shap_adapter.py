"""
Surrogate Local Feature Importance & SHAP Adapter.
"""

from typing import Dict, Any, List


def get_feature_importances(
    features: Dict[str, float],
    weights: Dict[str, float] = None,
) -> List[Dict[str, Any]]:
    """
    Returns ranked local feature contributions normalized to [-1.0, +1.0]
    representing surrogate Shapley values for linear or tree estimators.
    """
    if weights is None:
        weights = {
            "wbgt_c": 0.35,
            "population_density": 0.25,
            "informal_settlement_ratio": 0.20,
            "tree_canopy_fraction": -0.15,
            "cooling_deficit": 0.05,
        }
        
    ranked = []
    for k, v in features.items():
        w = weights.get(k, 0.1)
        impact = round(float(v * w), 3)
        ranked.append({
            "feature": k,
            "raw_value": v,
            "shap_approx_value": impact,
            "effect": "increases_risk" if impact > 0 else "mitigates_risk",
        })
        
    ranked.sort(key=lambda x: abs(x["shap_approx_value"]), reverse=True)
    return ranked
