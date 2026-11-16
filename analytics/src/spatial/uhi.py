"""
Urban Heat Island (UHI) intensity modeling.
Estimates local temperature anomaly (°C) based on built density,
vegetation cover (NDVI proxy), and albedo.
"""

from typing import Any


def estimate_uhi_intensity(
    impervious_surface_fraction: float,
    tree_canopy_fraction: float,
    building_height_avg_m: float = 12.0,
    albedo_avg: float = 0.18,
) -> dict[str, Any]:
    """
    Estimates the localized microclimatic thermal excess (delta T in °C)
    relative to rural baseline due to Urban Heat Island effects.

    Citations:
        Oke, T. R. (1982). The energetic basis of the urban heat island.
        Quarterly Journal of the Royal Meteorological Society, 108(455), 1-24.
    """
    # Impervious surface trap sensible heat; tree canopy provides evaporative cooling
    # Typical Indian urban core delta ranges from +1.5°C to +5.5°C
    delta_uhi = (
        (impervious_surface_fraction * 3.2)
        - (tree_canopy_fraction * 2.8)
        + (min(40.0, building_height_avg_m) * 0.04)
        - ((albedo_avg - 0.15) * 4.0)
    )
    delta_uhi_clamped = round(max(0.2, min(6.5, delta_uhi)), 2)

    return {
        "uhi_excess_c": delta_uhi_clamped,
        "impervious_surface_pct": round(impervious_surface_fraction * 100, 1),
        "tree_canopy_pct": round(tree_canopy_fraction * 100, 1),
        "albedo_avg": round(albedo_avg, 2),
        "cooling_potential_c": round(tree_canopy_fraction * 2.8 + (0.35 - albedo_avg) * 4.0, 2),
    }
