"""
Thermal indices package containing reference implementations for:
- Wet Bulb Globe Temperature (WBGT) via ISO 7243 & Stull (2011)
- Universal Thermal Climate Index (UTCI) via Bröde et al. (2012)
- Heat Index (HI) via Rothfusz (1990) & Steadman (1979)
"""

from .heat_index import calculate_heat_index
from .utci import calculate_utci, estimate_mean_radiant_temperature
from .wbgt import calculate_wbgt, calculate_wet_bulb_stull, estimate_globe_temperature

__all__ = [
    "calculate_heat_index",
    "calculate_utci",
    "calculate_wbgt",
    "calculate_wet_bulb_stull",
    "estimate_globe_temperature",
    "estimate_mean_radiant_temperature",
]
