"""
Heat Equity Index (HEI) Computation Engine.
Evaluates disproportionate heat exposure on underserved and informal populations.
"""

from typing import Any

from .normalize import min_max_normalize


def compute_heat_equity_index(
    wards: list[dict[str, Any]],
    weights: dict[str, float] = None,
) -> list[dict[str, Any]]:
    """
    Computes HEI for each ward:
    HEI = w_hazard * Hazard + w_exposure * Exposure + w_vuln * Vulnerability + w_adapt * (1 - AdaptiveCapacity)
    Scaled to [0, 100].
    """
    if weights is None:
        weights = {
            "hazard": 0.40,
            "exposure": 0.25,
            "vulnerability": 0.20,
            "adaptive_capacity": 0.15,
        }

    n = len(wards)
    if n == 0:
        return []

    # Extract raw vectors with safe handling for nullable fields
    hazards = [float(w.get("wbgt_c")) if w.get("wbgt_c") is not None else 30.0 for w in wards]
    densities = [
        float(w.get("population_density_per_km2"))
        if w.get("population_density_per_km2") is not None
        else 20000.0
        for w in wards
    ]
    informal = [
        float(w.get("informal_settlement_ratio"))
        if w.get("informal_settlement_ratio") is not None
        else 0.3
        for w in wards
    ]
    canopies = [
        float(w.get("tree_canopy_fraction")) if w.get("tree_canopy_fraction") is not None else 0.15
        for w in wards
    ]

    # Normalize components
    norm_h = min_max_normalize(hazards)
    norm_e = min_max_normalize(densities)
    norm_v = min_max_normalize(informal)
    norm_a = min_max_normalize(canopies)

    w_h = weights.get("hazard", 0.40)
    w_e = weights.get("exposure", 0.25)
    w_v = weights.get("vulnerability", 0.20)
    w_a = weights.get("adaptive_capacity", 0.15)

    # Compute raw composite priority scores
    raw_scores = [
        w_h * norm_h[i] + w_e * norm_e[i] + w_v * norm_v[i] + w_a * (1.0 - norm_a[i])
        for i in range(n)
    ]

    # Calculate hazard ranks (1 = highest physical hazard)
    sorted_by_hazard = sorted(range(n), key=lambda idx: norm_h[idx], reverse=True)
    hazard_ranks = {orig_idx: rank + 1 for rank, orig_idx in enumerate(sorted_by_hazard)}

    # Calculate priority ranks (1 = highest intervention priority)
    sorted_by_priority = sorted(range(n), key=lambda idx: raw_scores[idx], reverse=True)
    priority_ranks = {orig_idx: rank + 1 for rank, orig_idx in enumerate(sorted_by_priority)}

    results = []
    for i, w in enumerate(wards):
        h_score = norm_h[i]
        e_score = norm_e[i]
        v_score = norm_v[i]
        a_deficit = 1.0 - norm_a[i]

        composite_raw = raw_scores[i]
        hei_score = round(float(composite_raw * 100.0), 1)

        h_rank = hazard_ranks[i]
        p_rank = priority_ranks[i]
        # Equity gap = hazard_rank - priority_rank
        # Positive gap (+): ward is elevated in priority due to structural vulnerability
        equity_gap = h_rank - p_rank
        signed_gap = f"+{equity_gap}" if equity_gap > 0 else str(equity_gap)

        results.append(
            {
                "ward_code": w.get("ward_code"),
                "ward_name": w.get("ward_name"),
                "hei_score": hei_score,
                "hazard_rank": h_rank,
                "priority_rank": p_rank,
                "equity_gap": equity_gap,
                "equity_gap_signed": signed_gap,
                "equity_tier": "Critical Priority"
                if hei_score >= 75
                else ("High Priority" if hei_score >= 50 else "Moderate"),
                "sub_scores": {
                    "hazard_norm": round(h_score, 3),
                    "exposure_norm": round(e_score, 3),
                    "vulnerability_norm": round(v_score, 3),
                    "adaptive_deficit_norm": round(a_deficit, 3),
                },
            }
        )

    # Sort results by intervention priority rank ascending
    results.sort(key=lambda x: x["priority_rank"])
    return results
