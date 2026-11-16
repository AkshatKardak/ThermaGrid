"""
Unit tests for thermal indices (WBGT, UTCI, Heat Index) and Risk scoring model.
"""

import os
import sys

# Add root and analytics to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../analytics")))

from src.risk.scoring import compute_composite_risk
from src.thermal_indices.heat_index import calculate_heat_index
from src.thermal_indices.utci import calculate_utci
from src.thermal_indices.wbgt import calculate_wbgt, calculate_wet_bulb_stull


def test_stull_wet_bulb_known_values():
    """
    Test Stull (2011) formula against published reference benchmark:
    At T = 30.0°C and RH = 50.0%, Stull predicts Tw ≈ 22.1°C (±0.3°C).
    At T = 20.0°C and RH = 50.0%, Tw ≈ 13.7°C.
    """
    tw_30_50 = calculate_wet_bulb_stull(30.0, 50.0)
    assert 21.8 <= tw_30_50 <= 22.4, f"Expected ~22.1°C, got {tw_30_50}"

    tw_20_50 = calculate_wet_bulb_stull(20.0, 50.0)
    assert 13.4 <= tw_20_50 <= 14.0, f"Expected ~13.7°C, got {tw_20_50}"


def test_wbgt_outdoor_and_indoor():
    """
    Test ISO 7243 WBGT calculation under outdoor high solar load vs indoor/shade.
    """
    res_sun = calculate_wbgt(
        temp_c=36.0,
        rel_humidity_pct=65.0,
        wind_speed_ms=1.5,
        solar_radiation_wm2=800.0,
        is_outdoor=True,
    )
    # Under intense sun and high RH, WBGT should exceed 31°C (Very High / Extreme)
    assert res_sun["wbgt"] >= 31.0
    assert res_sun["category"] in ["Very High Risk", "Extreme / Stop Work"]

    # In shade with 0 solar radiation, WBGT must be significantly lower
    res_shade = calculate_wbgt(
        temp_c=36.0,
        rel_humidity_pct=65.0,
        wind_speed_ms=1.5,
        solar_radiation_wm2=0.0,
        is_outdoor=False,
    )
    assert res_sun["wbgt"] > res_shade["wbgt"]


def test_heat_index_rothfusz_noaa_benchmark():
    """
    NOAA verification table benchmark:
    T = 90°F (32.22°C), RH = 50% => Heat Index ≈ 94.6 - 95°F (35.0 - 35.6°C).
    T = 100°F (37.78°C), RH = 40% => Heat Index ≈ 109°F (42.8°C).
    """
    res_90_50 = calculate_heat_index(32.22, 50.0)
    assert 94.0 <= res_90_50["heat_index_f"] <= 96.0
    assert 34.5 <= res_90_50["heat_index_c"] <= 35.8

    res_100_40 = calculate_heat_index(37.78, 40.0)
    assert 107.0 <= res_100_40["heat_index_f"] <= 111.0
    assert res_100_40["category"] in ["Danger", "Extreme Caution"]


def test_utci_stress_scaling():
    """
    Verify UTCI scales appropriately with temperature and radiation.
    At 40°C air temperature with 700 W/m² radiation, UTCI must indicate strong/extreme heat stress.
    """
    res = calculate_utci(
        temp_c=40.0,
        rel_humidity_pct=50.0,
        wind_speed_10m_ms=1.5,
        solar_radiation_wm2=700.0,
    )
    assert res["utci"] >= 38.0
    assert res["risk_level"] in ["veryhigh", "extreme"]


def test_two_wards_same_temperature_different_risk():
    """
    Core benchmark requirement:
    Two wards experiencing IDENTICAL meteorology (Ta = 36.0°C, RH = 65%)
    must yield distinct risk alerts due to vulnerability and exposure differences.
    Ward A: Affluent, coastal tree canopy, formal housing.
    Ward M/East: Slum density, tin roofs, canopy deficit, outdoor labor.
    """
    ta = 36.0
    rh = 65.0
    wbgt = calculate_wbgt(ta, rh, solar_radiation_wm2=750)["wbgt"]
    utci = calculate_utci(ta, rh, solar_radiation_wm2=750)["utci"]
    hi = calculate_heat_index(ta, rh)["heat_index_c"]

    # Ward A (Colaba): low density, 16% outdoor workers, 8% informal, 32% canopy
    risk_colaba = compute_composite_risk(
        temp_c=ta,
        wbgt_c=wbgt,
        utci_c=utci,
        heat_index_c=hi,
        population_density_per_km2=14810,
        outdoor_worker_ratio=0.16,
        informal_settlement_ratio=0.08,
        vegetation_deficit_ratio=0.68,
        cooling_access_deficit=0.22,
    )

    # Ward M/East (Govandi): extreme density 55k/km², 42% outdoor workers, 68% informal, 4% canopy
    risk_govandi = compute_composite_risk(
        temp_c=ta,
        wbgt_c=wbgt,
        utci_c=utci,
        heat_index_c=hi,
        population_density_per_km2=55705,
        outdoor_worker_ratio=0.42,
        informal_settlement_ratio=0.68,
        vegetation_deficit_ratio=0.96,
        cooling_access_deficit=0.75,
    )

    # Govandi risk score must be significantly higher than Colaba despite identical weather
    assert risk_govandi["risk_score"] > risk_colaba["risk_score"] + 15.0
    assert risk_govandi["band"] in ["veryhigh", "extreme"]
    assert risk_colaba["band"] in ["moderate", "high"]
    assert len(risk_govandi["factor_breakdown"]) >= 5
    assert (
        "informal" in risk_govandi["explanation"].lower()
        or "thermal" in risk_govandi["explanation"].lower()
    )
