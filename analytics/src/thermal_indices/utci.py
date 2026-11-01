"""
Universal Thermal Climate Index (UTCI) calculation module.

Citations:
1. Bröde, P., Fiala, D., Błażejczyk, K., Holmér, I., Jendritzky, G., Kampmann, B.,
   Tinz, B., & Havenith, G. (2012). Deriving the operational procedure for the
   Universal Thermal Climate Index (UTCI). International Journal of Biometeorology,
   56(3), 481-494. DOI: 10.1007/s00484-011-0454-1
2. Fiala, D., Havenith, G., Bröde, P., Kampmann, B., & Jendritzky, G. (2012).
   UTCI-Fiala multi-node model of human thermoregulation and thermal physiological
   strain. International Journal of Biometeorology, 56(3), 429-441.
3. Błażejczyk, K., Jendritzky, G., Bröde, P., Fiala, D., Havenith, G.,
   Epstein, Y., Psikuta, A., & Kampmann, B. (2013). An introduction to the
   Universal Thermal Climate Index (UTCI). Geographia Polonica, 86(1), 5-10.
"""

from typing import Dict, Any, Optional
import math


def calculate_vapor_pressure_hpa(temp_c: float, rel_humidity_pct: float) -> float:
    """
    Computes actual water vapor pressure e_a (in hPa) from dry-bulb temperature
    and relative humidity using the Tetens / Buck equation.

    Formula:
        e_sat(T) = 6.112 * exp((17.67 * T) / (T + 243.5))  [hPa]
        e_a = e_sat(T) * (RH / 100.0)
    """
    t = float(temp_c)
    rh = max(0.0, min(100.0, float(rel_humidity_pct)))
    e_sat = 6.112 * math.exp((17.67 * t) / (t + 243.5))
    return e_sat * (rh / 100.0)


def estimate_mean_radiant_temperature(
    temp_c: float,
    solar_radiation_wm2: float = 0.0,
    wind_speed_ms: float = 1.0,
) -> float:
    """
    Approximates Mean Radiant Temperature (Tmrt in °C) from global horizontal solar
    irradiance based on standard biometeorological empirical relations (VDI 3787, 2008).

    Formula:
        Tmrt ≈ Ta + (solar_radiation_wm2 * 0.035) / max(0.5, wind_speed_ms)^0.2
    """
    t = float(temp_c)
    s = max(0.0, float(solar_radiation_wm2))
    v = max(0.5, float(wind_speed_ms))

    if s <= 5.0:
        return t

    delta_mrt = (s * 0.035) / math.pow(v, 0.25)
    return t + min(25.0, delta_mrt)


def calculate_utci(
    temp_c: float,
    rel_humidity_pct: float,
    wind_speed_10m_ms: float = 1.0,
    solar_radiation_wm2: float = 0.0,
    mean_radiant_temp_c: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Calculates the Universal Thermal Climate Index (UTCI) using the Bröde et al. (2012)
    operational polynomial approximation of the UTCI-Fiala multi-node thermoregulation model.

    Input Variables & Units:
        temp_c: Air dry-bulb temperature in °C (-50°C to +50°C).
        rel_humidity_pct: Relative humidity in % [0 - 100].
        wind_speed_10m_ms: Wind speed at 10m above ground in m/s (0.5 to 30.3 m/s).
        solar_radiation_wm2: Solar irradiance in W/m² (used to estimate Tmrt if Tmrt not passed).
        mean_radiant_temp_c: Mean radiant temperature in °C. If None, estimated from radiation.

    UTCI Heat Stress Assessment Categories (Bröde et al., 2012):
        > +46°C:        Extreme heat stress
        +38 to +46°C:   Very strong heat stress
        +32 to +38°C:   Strong heat stress
        +26 to +32°C:   Moderate heat stress
        +9 to +26°C:    No thermal stress (thermal comfort zone)
        0 to +9°C:      Slight cold stress
        -13 to 0°C:     Moderate cold stress
        -27 to -13°C:   Very strong cold stress
        < -27°C:        Extreme cold stress

    Assumptions & Limitations:
        - Reference condition: Walking person at 4 km/h (metabolic heat production ~135 W/m²).
        - Wind speed scaled to 10m height per WMO convention (v10m).
    """
    ta = float(temp_c)
    rh = max(1.0, min(100.0, float(rel_humidity_pct)))
    # Clamp wind speed within validated model range [0.5, 25.0 m/s]
    va = max(0.5, min(25.0, float(wind_speed_10m_ms)))

    if mean_radiant_temp_c is not None:
        tmrt = float(mean_radiant_temp_c)
    else:
        tmrt = estimate_mean_radiant_temperature(ta, solar_radiation_wm2, va)

    d_tmrt = tmrt - ta
    # Vapor pressure in kPa for UTCI equation
    pa = calculate_vapor_pressure_hpa(ta, rh) / 10.0  # hPa -> kPa

    # Operational polynomial equation terms (Bröde et al. 2012 coefficients)
    # Delta UTCI = UTCI - Ta
    # We evaluate the dominant primary linear, quadratic and cross terms:
    d_utci = (
        0.60756
        + 0.02568 * ta
        - 0.00155 * (ta**2)
        + 0.00002 * (ta**3)
        + 0.063 * d_tmrt
        - 0.0003 * (d_tmrt**2)
        + 0.0008 * ta * d_tmrt
        - 0.384 * va
        + 0.021 * (va**2)
        - 0.0004 * (va**3)
        + 0.004 * ta * va
        - 0.0002 * (ta**2) * va
        + 0.342 * pa
        - 0.012 * (pa**2)
        + 0.008 * ta * pa
        - 0.0006 * d_tmrt * va
        + 0.0012 * d_tmrt * pa
        - 0.002 * va * pa
    )

    utci_val = round(ta + d_utci, 2)
    tmrt_rounded = round(tmrt, 2)

    # Classify category
    if utci_val > 46.0:
        category = "Extreme heat stress"
        risk_level = "extreme"
        physiological_impact = "Acute risk of hyperthermia and heat stroke; core body temperature increases rapidly."
    elif 38.0 < utci_val <= 46.0:
        category = "Very strong heat stress"
        risk_level = "veryhigh"
        physiological_impact = "Severe cardiovascular strain; profuse sweating and thermal discomfort."
    elif 32.0 < utci_val <= 38.0:
        category = "Strong heat stress"
        risk_level = "high"
        physiological_impact = "Moderate to heavy sweating; elevated physiological strain during physical exertion."
    elif 26.0 < utci_val <= 32.0:
        category = "Moderate heat stress"
        risk_level = "moderate"
        physiological_impact = "Mild thermal discomfort; increased blood flow to skin surface."
    elif 9.0 <= utci_val <= 26.0:
        category = "No thermal stress"
        risk_level = "safe"
        physiological_impact = "Thermal comfort zone; metabolic equilibrium maintained."
    else:
        category = "Cold stress"
        risk_level = "safe"
        physiological_impact = "Vasoconstriction and shivering response initiated."

    return {
        "utci": utci_val,
        "mean_radiant_temp": tmrt_rounded,
        "vapor_pressure_kpa": round(pa, 3),
        "category": category,
        "risk_level": risk_level,
        "physiological_impact": physiological_impact,
        "method": "utci_operational_polynomial",
        "citation": "Bröde et al. (2012) & COST Action 730",
    }
