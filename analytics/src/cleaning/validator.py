"""
Data validation and physical quality control module.
"""

from typing import Any

# Physical realistic bounds for meteorological variables in India
PHYSICAL_BOUNDS = {
    "temperature_c": (-5.0, 56.0),  # Lowest recorded plains vs highest Phalodi 51.0°C
    "rel_humidity_pct": (0.0, 100.0),
    "wind_speed_ms": (0.0, 65.0),  # Up to severe cyclonic gusts
    "solar_radiation_wm2": (0.0, 1400.0),  # Solar constant upper bound
    "pressure_hpa": (850.0, 1060.0),
    "wbgt_c": (0.0, 48.0),
    "utci_c": (-20.0, 65.0),
}


def validate_weather_observation(obs: dict[str, Any]) -> tuple[bool, str | None]:
    """
    Validates that a weather observation record adheres to physical conservation laws
    and meteorological bounds.
    """
    for key, (min_val, max_val) in PHYSICAL_BOUNDS.items():
        if key in obs and obs[key] is not None:
            val = float(obs[key])
            if val < min_val or val > max_val:
                return (
                    False,
                    f"Variable '{key}' value {val} out of physical bounds [{min_val}, {max_val}]",
                )

    return True, None


def clean_and_impute_observation(obs: dict[str, Any]) -> dict[str, Any]:
    """
    Cleans observation dictionary, clamping edge values and enforcing types.
    """
    cleaned = dict(obs)
    if "temperature_c" in cleaned and cleaned["temperature_c"] is not None:
        cleaned["temperature_c"] = float(cleaned["temperature_c"])
    if "rel_humidity_pct" in cleaned and cleaned["rel_humidity_pct"] is not None:
        cleaned["rel_humidity_pct"] = max(1.0, min(100.0, float(cleaned["rel_humidity_pct"])))
    if "wind_speed_ms" in cleaned and cleaned["wind_speed_ms"] is not None:
        cleaned["wind_speed_ms"] = max(0.1, float(cleaned["wind_speed_ms"]))
    if "solar_radiation_wm2" in cleaned and cleaned["solar_radiation_wm2"] is not None:
        cleaned["solar_radiation_wm2"] = max(0.0, float(cleaned["solar_radiation_wm2"]))
    return cleaned
