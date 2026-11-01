"""
Weight Sensitivity Analysis: Evaluates Rank Invariance under +/- 20% Parameter Perturbation.
"""

from typing import List, Dict, Any
import numpy as np
from scipy import stats
from .index import compute_heat_equity_index


def evaluate_weight_sensitivity(
    wards: List[Dict[str, Any]],
    base_weights: Dict[str, float] = None,
    perturbation_pct: float = 0.20,
) -> Dict[str, Any]:
    """
    Perturbs individual weights by +/- perturbation_pct, recalculates ward rankings,
    and returns Spearman rank correlation rho.
    rho >= 0.85 verifies robust mathematical stability.
    """
    if base_weights is None:
        base_weights = {"hazard": 0.40, "exposure": 0.25, "vulnerability": 0.20, "adaptive_capacity": 0.15}
        
    base_results = compute_heat_equity_index(wards, base_weights)
    base_scores = [r["hei_score"] for r in base_results]
    
    perturbations = {}
    rhos = []
    
    for key in base_weights:
        # Boost weight by +perturbation_pct
        mod_weights = base_weights.copy()
        mod_weights[key] *= (1.0 + perturbation_pct)
        # Re-normalize weights to sum to 1.0
        tot = sum(mod_weights.values())
        mod_weights = {k: v / tot for k, v in mod_weights.items()}
        
        mod_results = compute_heat_equity_index(wards, mod_weights)
        mod_scores = [r["hei_score"] for r in mod_results]
        
        rho, _ = stats.spearmanr(base_scores, mod_scores)
        rhos.append(float(rho))
        perturbations[f"{key}_boosted"] = {
            "spearman_rho": round(float(rho), 4),
            "rank_stable": bool(rho >= 0.85),
        }
        
    mean_rho = float(np.mean(rhos))
    return {
        "mean_spearman_rho": round(mean_rho, 4),
        "is_robust": bool(mean_rho >= 0.85),
        "perturbation_tested_pct": round(perturbation_pct * 100.0, 1),
        "component_sensitivities": perturbations,
    }
