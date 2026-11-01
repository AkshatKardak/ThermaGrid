"""
Core domain constants and normative thresholds for ThermaGrid.

All thresholds and parameters cite official standards:
- National Disaster Management Authority (NDMA) National Heat Action Plan Guidelines (2020)
- India Meteorological Department (IMD) Heat Wave Classification Criteria
- ISO 7243:2017 Ergonomics of the Thermal Environment (WBGT Assessment)
- World Meteorological Organization (WMO) / WHO Thermal Stress Metrics
"""

from typing import Dict, Any, List

# Heat scale palette tokens (mirrored identically in frontend theme/tokens.ts)
HEAT_PALETTE = {
    "safe": "#2FA37C",       # Safe / Low Thermal Strain
    "moderate": "#E8C547",   # Moderate / Caution
    "high": "#F59E0B",       # High / Extreme Caution
    "veryhigh": "#FF704F",   # Very High / Danger
    "extreme": "#C31D3C",    # Extreme / Emergency
}

# Human Thermal Risk Score Bands (0 - 100)
# Cites: NDMA National Guidelines for Preparation of Action Plan (2020), Section 3.2
RISK_BANDS = {
    "safe": {"min": 0.0, "max": 24.9, "label": "Low / Safe", "color": HEAT_PALETTE["safe"]},
    "moderate": {"min": 25.0, "max": 49.9, "label": "Moderate", "color": HEAT_PALETTE["moderate"]},
    "high": {"min": 50.0, "max": 69.9, "label": "High Risk", "color": HEAT_PALETTE["high"]},
    "veryhigh": {"min": 70.0, "max": 84.9, "label": "Very High Risk", "color": HEAT_PALETTE["veryhigh"]},
    "extreme": {"min": 85.0, "max": 100.0, "label": "Extreme / Emergency", "color": HEAT_PALETTE["extreme"]},
}

# ISO 7243:2017 Occupational WBGT Screening Limits (°C) for Acclimatized Workers
# Standard reference metabolic rate: Moderate physical work (300 W, e.g. construction/masonry)
ISO_7243_WBGT_THRESHOLDS = {
    "continuous_work_max": 28.0,      # 100% work / 0% rest
    "moderate_rest_cycle": 29.0,      # 75% work / 25% rest (45 min work / 15 min rest)
    "half_rest_cycle": 30.0,          # 50% work / 50% rest (30 min work / 30 min rest)
    "heavy_rest_cycle": 31.5,         # 25% work / 75% rest (15 min work / 45 min rest)
    "stop_work_limit": 32.2,          # Cease outdoor heavy labor (heat stroke danger)
}

# UTCI (Universal Thermal Climate Index) Categories (°C)
# Cites: Bröde et al. (2012) & COST Action 730
UTCI_CATEGORIES = {
    "extreme_heat": {"min": 46.0, "max": 100.0, "label": "Extreme heat stress", "band": "extreme"},
    "very_strong_heat": {"min": 38.0, "max": 46.0, "label": "Very strong heat stress", "band": "veryhigh"},
    "strong_heat": {"min": 32.0, "max": 38.0, "label": "Strong heat stress", "band": "high"},
    "moderate_heat": {"min": 26.0, "max": 32.0, "label": "Moderate heat stress", "band": "moderate"},
    "thermal_comfort": {"min": 9.0, "max": 26.0, "label": "No thermal stress", "band": "safe"},
    "slight_cold": {"min": 0.0, "max": 9.0, "label": "Slight cold stress", "band": "safe"},
}

# NOAA NWS / NDMA Heat Index Categories (°C)
# Cites: Rothfusz (1990) & Steadman (1979)
HEAT_INDEX_CATEGORIES = {
    "caution": {"min": 27.0, "max": 32.0, "label": "Caution", "band": "moderate"},
    "extreme_caution": {"min": 32.0, "max": 41.0, "label": "Extreme Caution", "band": "high"},
    "danger": {"min": 41.0, "max": 54.0, "label": "Danger", "band": "veryhigh"},
    "extreme_danger": {"min": 54.0, "max": 100.0, "label": "Extreme Danger", "band": "extreme"},
}

# Default Risk Composition Weights (Configurable via risk_config DB table)
# Cites: IPCC AR6 WGII Chapter 16 Risk Framework
DEFAULT_RISK_WEIGHTS = {
    "weight_hazard": 0.50,
    "weight_exposure": 0.25,
    "weight_vulnerability": 0.25,
}

# Spatial & Buffer Constants
COOLING_CENTRE_MAX_DISPATCH_RADIUS_KM = 5.0
DEFAULT_HEATWAVE_THRESHOLD_TEMP_C = 40.0       # IMD Plains threshold
COASTAL_HEATWAVE_THRESHOLD_TEMP_C = 37.0       # IMD Coastal threshold
DEMO_DATA_TAG = "DEMO DATA"
