"""
National Weather Service (NWS) Heat Index calculation module.

Citations:
1. Rothfusz, L. P. (1990). The heat index equation (or, more than you ever wanted
   to know about heat index). NWS Southern Region Technical Attachment, SR/SSD 90-23,
   Fort Worth, TX.
2. Steadman, R. G. (1979). The assessment of sultriness. Part I: A
   temperature-humidity index based on human physiology and clothing science.
   Journal of Applied Meteorology, 18(7), 861-873.
3. National Oceanic and Atmospheric Administration (NOAA) National Weather Service.
   Heat Index Equation and Guidelines.
"""

from typing import Any


def celsius_to_fahrenheit(c: float) -> float:
    """Converts degrees Celsius to Fahrenheit."""
    return (c * 9.0 / 5.0) + 32.0


def fahrenheit_to_celsius(f: float) -> float:
    """Converts degrees Fahrenheit to Celsius."""
    return (f - 32.0) * 5.0 / 9.0


def calculate_heat_index(
    temp_c: float,
    rel_humidity_pct: float,
) -> dict[str, Any]:
    """
    Calculates the NWS Heat Index (apparent temperature) in °C using the Rothfusz regression.

    Formulas:
        Steadman simple formula (used when calculated HI < 80°F):
            HI_simple = 0.5 * (T_f + 61.0 + ((T_f - 68.0) * 1.2) + (RH * 0.094))

        Rothfusz 9-term polynomial regression (for T_f >= 80°F and RH >= 40%):
            HI = -42.379
               + 2.04901523 * T
               + 10.14333127 * RH
               - 0.22475541 * T * RH
               - 0.00683783 * T^2
               - 0.05481717 * RH^2
               + 0.00122874 * T^2 * RH
               + 0.00085282 * T * RH^2
               - 0.00000199 * T^2 * RH^2

        Adjustment for low humidity (RH < 13% and 80 <= T_f <= 112):
            adjustment = -((13 - RH) / 4) * sqrt((17 - |T_f - 95|) / 17)
            HI = HI + adjustment

        Adjustment for high humidity (RH > 85% and 80 <= T_f <= 87):
            adjustment = ((RH - 85) / 10) * ((87 - T_f) / 5)
            HI = HI + adjustment

    Input Variables & Units:
        temp_c: Ambient dry-bulb temperature in °C.
        rel_humidity_pct: Relative humidity in % [0.0 - 100.0].

    Categories (NOAA NWS & NDMA Heat Action Plan):
        < 27°C (< 80°F):        Safe / Normal
        27°C - 32°C (80-90°F):  Caution (fatigue possible with prolonged exposure)
        32°C - 41°C (90-105°F): Extreme Caution (sunstroke, heat cramps/exhaustion possible)
        41°C - 54°C (106-130°F):Danger (heat cramps or exhaustion likely, stroke possible)
        >= 54°C (>= 130°F):     Extreme Danger (heat stroke highly likely)
    """
    t_f = celsius_to_fahrenheit(temp_c)
    rh = max(0.0, min(100.0, float(rel_humidity_pct)))

    # Simple Steadman equation first
    hi_simple = 0.5 * (t_f + 61.0 + ((t_f - 68.0) * 1.2) + (rh * 0.094))

    if hi_simple < 80.0:
        hi_f = hi_simple
    else:
        # Full Rothfusz regression
        hi_f = (
            -42.379
            + 2.04901523 * t_f
            + 10.14333127 * rh
            - 0.22475541 * t_f * rh
            - 0.00683783 * (t_f**2)
            - 0.05481717 * (rh**2)
            + 0.00122874 * (t_f**2) * rh
            + 0.00085282 * t_f * (rh**2)
            - 0.00000199 * (t_f**2) * (rh**2)
        )

        # Low humidity adjustment
        if rh < 13.0 and 80.0 <= t_f <= 112.0:
            diff = abs(t_f - 95.0)
            if diff <= 17.0:
                adjustment = -((13.0 - rh) / 4.0) * ((17.0 - diff) / 17.0) ** 0.5
                hi_f += adjustment

        # High humidity adjustment
        elif rh > 85.0 and 80.0 <= t_f <= 87.0:
            adjustment = ((rh - 85.0) / 10.0) * ((87.0 - t_f) / 5.0)
            hi_f += adjustment

    hi_c = round(fahrenheit_to_celsius(hi_f), 2)
    hi_f_rounded = round(hi_f, 1)

    # Classify according to NOAA / NDMA bands
    if hi_c < 27.0:
        category = "Safe"
        risk_level = "safe"
        warning = "Normal conditions. Standard hydration recommended."
    elif 27.0 <= hi_c < 32.0:
        category = "Caution"
        risk_level = "moderate"
        warning = "Fatigue is possible with prolonged exposure and activity."
    elif 32.0 <= hi_c < 41.0:
        category = "Extreme Caution"
        risk_level = "high"
        warning = "Heat cramps and heat exhaustion are possible. Continuing activity could lead to heat stroke."
    elif 41.0 <= hi_c < 54.0:
        category = "Danger"
        risk_level = "veryhigh"
        warning = (
            "Heat cramps or exhaustion likely, and heat stroke possible with continued exposure."
        )
    else:
        category = "Extreme Danger"
        risk_level = "extreme"
        warning = "Heat stroke is imminent with continued physical exposure."

    return {
        "heat_index_c": hi_c,
        "heat_index_f": hi_f_rounded,
        "category": category,
        "risk_level": risk_level,
        "warning": warning,
        "method": "rothfusz_nws",
        "citation": "Rothfusz (1990) & Steadman (1979)",
    }
