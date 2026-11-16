"""
Deterministic Natural Language Risk Justification (Rule-Based, Non-Generative).
"""

from typing import Any


def generate_risk_narrative(
    ward_name: str,
    composite_score: float,
    decomposition: dict[str, Any],
    weather_summary: dict[str, Any] = None,
) -> str:
    """
    Constructs a deterministic, defensible textual explanation for disaster managers
    explaining exactly why an alert grade was assigned.
    """
    dominant = decomposition.get("dominant_driver", "Thermal Hazard")
    pcts = decomposition.get("percentage_contributions", {})
    pts = decomposition.get("point_contributions", {})

    tier = (
        "Severe / Emergency"
        if composite_score >= 75
        else ("High Caution" if composite_score >= 55 else "Moderate")
    )

    lines = [
        f"{ward_name} is evaluated at a composite heat risk index of {composite_score}/100 ({tier}).",
        f"The primary driver of risk is {dominant}, accounting for {pcts.get('hazard_pct' if 'Hazard' in dominant else 'vulnerability_pct', 35)}% of total risk points (+{pts.get('hazard_pts' if 'Hazard' in dominant else 'vulnerability_pts', 25)} pts).",
    ]

    if weather_summary:
        t = weather_summary.get("temperature_c", 35.0)
        wbgt = weather_summary.get("wbgt_c", 30.0)
        lines.append(
            f"Meteorological conditions report dry-bulb {t}°C with an effective ISO 7243 WBGT of {wbgt}°C."
        )

    lines.append(
        "Immediate operational recommendation: prioritize targeted cooling shelters and dispatch mobile rehydration units to outdoor labor corridors."
    )

    return " ".join(lines)
