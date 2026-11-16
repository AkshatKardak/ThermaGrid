"""
Tests for analytics evaluation metrics and data cleaning/validation.
"""

import numpy as np
from src.cleaning.validator import (
    clean_and_impute_observation,
    validate_weather_observation,
)
from src.evaluation.metrics import compute_regression_metrics, compute_skill_score


def test_compute_regression_metrics():
    y_true = np.array([30.0, 32.0, 35.0, 40.0])
    y_pred = np.array([30.5, 31.5, 35.0, 39.0])
    metrics = compute_regression_metrics(y_true, y_pred)
    assert "mae" in metrics
    assert "rmse" in metrics
    assert "r2" in metrics
    assert metrics["mae"] == 0.5
    assert metrics["r2"] > 0.9


def test_compute_skill_score():
    score = compute_skill_score(0.8, 1.6)
    assert score == 50.0

    score_zero_baseline = compute_skill_score(0.8, 0.0)
    assert score_zero_baseline == 0.0


def test_validate_weather_observation():
    valid_obs = {
        "temperature_c": 38.5,
        "rel_humidity_pct": 45.0,
        "wind_speed_ms": 2.5,
        "solar_radiation_wm2": 800.0,
    }
    is_valid, err = validate_weather_observation(valid_obs)
    assert is_valid is True
    assert err is None

    invalid_obs = {
        "temperature_c": 75.0,  # exceeds upper bound of 56.0
        "rel_humidity_pct": 50.0,
    }
    is_valid, err = validate_weather_observation(invalid_obs)
    assert is_valid is False
    assert "out of physical bounds" in err


def test_clean_and_impute_observation():
    obs = {
        "temperature_c": "42.0",
        "rel_humidity_pct": 105.0,
        "wind_speed_ms": -1.0,
        "solar_radiation_wm2": -50.0,
    }
    cleaned = clean_and_impute_observation(obs)
    assert cleaned["temperature_c"] == 42.0
    assert cleaned["rel_humidity_pct"] == 100.0
    assert cleaned["wind_speed_ms"] == 0.1
    assert cleaned["solar_radiation_wm2"] == 0.0


def test_remote_sensing_indices():
    from src.remote_sensing.indices import compute_ndbi, compute_ndvi

    nir = np.array([0.5, 0.4, 0.1])
    red = np.array([0.1, 0.2, 0.3])
    swir = np.array([0.2, 0.3, 0.5])

    ndvi = compute_ndvi(nir, red)
    assert len(ndvi) == 3
    assert ndvi[0] > 0.0  # Dense vegetation

    ndbi = compute_ndbi(swir, nir)
    assert len(ndbi) == 3


def test_spatial_uhi_and_hotspots():
    from src.remote_sensing.hotspots import detect_spatial_hotspots
    from src.spatial.uhi import estimate_uhi_intensity

    uhi = estimate_uhi_intensity(
        impervious_surface_fraction=0.75,
        tree_canopy_fraction=0.10,
        building_height_avg_m=20.0,
        albedo_avg=0.15,
    )
    assert "uhi_excess_c" in uhi
    assert uhi["uhi_excess_c"] > 1.0

    features = [
        {"latitude": 19.01, "longitude": 72.84, "wbgt_c": 36.5},
        {"latitude": 19.02, "longitude": 72.85, "wbgt_c": 36.2},
        {"latitude": 19.03, "longitude": 72.83, "wbgt_c": 35.8},
        {"latitude": 19.15, "longitude": 72.90, "wbgt_c": 28.0},
        {"latitude": 19.16, "longitude": 72.91, "wbgt_c": 27.5},
    ]
    clusters = detect_spatial_hotspots(features, value_key="wbgt_c", distance_threshold_km=5.0)
    assert len(clusters) == 5
    assert any("Hot Spot" in c.get("cluster_type", "") for c in clusters)


def test_forecasting_baseline_and_registry():
    from src.forecasting.baseline import ThermalBaselineModel
    from src.forecasting.registry import get_model_registry_info

    info = get_model_registry_info()
    assert "model_id" in info
    assert info["is_model_backed"] is True

    model = ThermalBaselineModel()
    y_true = np.array([28.0, 30.0, 32.0, 34.0])
    y_lag = np.array([27.5, 29.5, 31.0, 33.5])
    p_metrics = model.evaluate_persistence(y_true, y_lag)
    assert "mae" in p_metrics
    assert p_metrics["mae"] == 0.625

    X_train = np.array([[20.0, 40.0], [25.0, 50.0], [30.0, 60.0], [35.0, 70.0]])
    y_train = np.array([22.0, 26.0, 31.0, 37.0])
    model.fit_linear_baseline(X_train, y_train)
    l_metrics = model.evaluate_linear_baseline(X_train, y_train)
    assert "mae" in l_metrics
    assert l_metrics["r2"] > 0.95
