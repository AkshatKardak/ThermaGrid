"""
Physics Validation Test Suite.
Validates ThermaGrid biometeorological implementations (UTCI, WBGT, Heat Index)
against the standard pythermalcomfort reference library.
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../analytics")))

from pythermalcomfort.models import (
    heat_index_rothfusz as py_hi,
)
from pythermalcomfort.models import (
    utci as py_utci,
)
from pythermalcomfort.models import (
    wbgt as py_wbgt,
)
from src.thermal_indices.heat_index import calculate_heat_index
from src.thermal_indices.utci import calculate_utci
from src.thermal_indices.wbgt import (
    calculate_wbgt,
    calculate_wet_bulb_stull,
    estimate_globe_temperature,
)


def test_utci_vs_pythermalcomfort_reference():
    """
    Validates ThermaGrid's UTCI polynomial against pythermalcomfort across
    a range of typical tropical and heatwave conditions (30°C - 45°C, 25% - 55% RH).
    ThermaGrid's 16-term polynomial approximation tracks pythermalcomfort reference within ±1.5°C.
    """
    test_cases = [
        # (temp_c, rh_pct, wind_ms)
        (30.0, 50.0, 1.0),
        (35.0, 40.0, 1.5),
        (38.0, 55.0, 1.0),
        (40.0, 35.0, 2.0),
        (42.0, 30.0, 1.2),
        (45.0, 25.0, 1.0),
    ]

    for temp, rh, wind in test_cases:
        ref_result = py_utci(tdb=temp, tr=temp, v=wind, rh=rh)
        ref_val = float(ref_result.utci)

        our_result = calculate_utci(
            temp_c=temp,
            rel_humidity_pct=rh,
            wind_speed_10m_ms=wind,
            solar_radiation_wm2=0.0,  # tr == tdb when solar = 0
        )
        our_val = our_result["utci"]

        diff = abs(ref_val - our_val)
        assert diff <= 1.5, (
            f"UTCI discrepancy at T={temp}°C, RH={rh}%, v={wind}m/s: "
            f"pythermalcomfort={ref_val:.2f}, ThermaGrid={our_val:.2f}, diff={diff:.3f}"
        )


def test_heat_index_vs_pythermalcomfort_reference():
    """
    Validates ThermaGrid's Rothfusz regression Heat Index against pythermalcomfort
    under NOAA heat advisory scenarios (32°C - 44°C).
    Tolerance is set to ±0.20°C.
    """
    test_cases = [
        (32.0, 50.0),
        (35.0, 60.0),
        (38.0, 45.0),
        (40.0, 50.0),
        (42.0, 35.0),
    ]

    for temp, rh in test_cases:
        ref_result = py_hi(tdb=temp, rh=rh)
        ref_val = float(ref_result.hi)

        our_result = calculate_heat_index(temp_c=temp, rel_humidity_pct=rh)
        our_val = our_result["heat_index_c"]

        diff = abs(ref_val - our_val)
        assert diff <= 0.20, (
            f"Heat Index discrepancy at T={temp}°C, RH={rh}%: "
            f"pythermalcomfort={ref_val:.2f}, ThermaGrid={our_val:.2f}, diff={diff:.3f}"
        )


def test_iso7243_wbgt_vs_pythermalcomfort_reference():
    """
    Validates ISO 7243 WBGT linear combinations against pythermalcomfort.
    Outdoor: 0.7 Twb + 0.2 Tg + 0.1 Tdb
    Indoor/Shade: 0.7 Twb + 0.3 Tg
    Tolerance is set to ±0.10°C.
    """
    test_cases = [
        # (temp_c, rh_pct, wind_ms, solar_wm2)
        (32.0, 60.0, 1.2, 700.0),
        (36.0, 50.0, 1.5, 800.0),
        (40.0, 40.0, 2.0, 850.0),
        (34.0, 75.0, 0.8, 500.0),
    ]

    for temp, rh, wind, solar in test_cases:
        tw = calculate_wet_bulb_stull(temp, rh)
        tg = estimate_globe_temperature(temp, wind, solar)

        # Outdoor validation
        ref_outdoor = py_wbgt(twb=tw, tg=tg, tdb=temp, with_solar_load=True, round_output=False)
        our_outdoor = calculate_wbgt(temp, rh, wind, solar, is_outdoor=True)
        diff_out = abs(float(ref_outdoor.wbgt) - our_outdoor["wbgt"])
        assert diff_out <= 0.10, (
            f"Outdoor WBGT mismatch: {ref_outdoor.wbgt} vs {our_outdoor['wbgt']}"
        )

        # Indoor validation
        ref_indoor = py_wbgt(twb=tw, tg=tg, with_solar_load=False, round_output=False)
        our_indoor = calculate_wbgt(temp, rh, wind, solar, is_outdoor=False)
        diff_in = abs(float(ref_indoor.wbgt) - our_indoor["wbgt"])
        assert diff_in <= 0.10, f"Indoor WBGT mismatch: {ref_indoor.wbgt} vs {our_indoor['wbgt']}"
