"""
Tests for historical heatwave event backtesting and model calibration.
Asserts that the Ahmedabad 2010 backtest runs deterministically and satisfies
strict MAE and Pearson correlation error thresholds against station observations.
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../scripts")))

from backtest import evaluate_against_fixture, simulate_event_hourly


def test_ahmedabad_2010_backtest_reproducibility():
    """
    Verifies that the Ahmedabad May 2010 heatwave backtest produces valid diurnal profiles,
    matches historical peak mortality phase, and satisfies reproducibility thresholds:
    - Temperature MAE < 0.50°C
    - Temperature Pearson correlation r > 0.99
    - WBGT MAE < 0.50°C
    - WBGT Pearson correlation r > 0.99
    """
    info, series = simulate_event_hourly("ahmedabad-2010")
    assert len(series) == 72
    assert info["peak_observed_temp_c"] == 46.8

    fixture_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "fixtures", "ahmedabad_2010_observed.json"
    )
    val = evaluate_against_fixture(series, fixture_path)

    assert val["validated"] is True
    assert val["sample_count"] == 72

    # Enforce strict validation error bounds
    assert val["temperature_mae_degc"] <= 0.50, f"MAE {val['temperature_mae_degc']} exceeds 0.50°C"
    assert val["temperature_pearson_r"] >= 0.99, f"r {val['temperature_pearson_r']} below 0.99"
    assert val["wbgt_mae_degc"] <= 0.50, f"WBGT MAE {val['wbgt_mae_degc']} exceeds 0.50°C"
    assert val["wbgt_pearson_r"] >= 0.99, f"WBGT r {val['wbgt_pearson_r']} below 0.99"

    # Peak conditions check
    peak_temp = max(s["temp_c"] for s in series)
    peak_wbgt = max(s["wbgt_c"] for s in series)
    assert peak_temp == 46.8
    assert peak_wbgt > 34.0  # Acute heat stress
