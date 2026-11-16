"""
Model training and evaluation script.
Trains baseline (persistence and ridge) and Gradient Boosting thermal forecast models,
computes true validation metrics (MAE, RMSE, R²), compares against baseline,
and saves model artifact and metrics.json.
"""

import os
import sys

import numpy as np

# Ensure analytics package is on path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))

from src.forecasting.baseline import ThermalBaselineModel
from src.forecasting.model import ThermalForecastPipeline
from src.thermal_indices.wbgt import calculate_wbgt


def generate_empirical_training_dataset(num_samples: int = 1500) -> tuple:
    """
    Generates synthetic training dataset modeling realistic diurnal cycles
    and pre-monsoon heat conditions across Indian metropolitan wards.
    Ground-truth WBGT is calculated using the rigorous ISO 7243 & Stull formulas.
    """
    np.random.seed(42)

    # Simulating hours across months March - June (day 60 to 180)
    days = np.random.uniform(60, 180, num_samples)
    hours = np.random.uniform(0, 24, num_samples)

    # Base temperatures (24°C at dawn to 44°C peak afternoon)
    diurnal_curve = np.maximum(0.0, np.sin((hours - 6) * np.pi / 12))
    temps = 26.0 + 14.0 * diurnal_curve + np.random.normal(0, 1.5, num_samples)

    # Relative humidity (inversely proportional to temperature, 25% to 85%)
    rhs = 75.0 - 40.0 * diurnal_curve + np.random.normal(0, 4.0, num_samples)
    rhs = np.clip(rhs, 15.0, 95.0)

    # Wind speed (0.5 to 5.0 m/s)
    winds = np.clip(1.5 + 1.2 * diurnal_curve + np.random.normal(0, 0.5, num_samples), 0.5, 8.0)

    # Solar radiation (0 at night, up to 1000 W/m² at solar noon)
    solars = np.clip(diurnal_curve * 950.0 + np.random.normal(0, 30.0, num_samples), 0.0, 1050.0)

    # UHI thermal excess based on urban ward surface characteristics (0.5°C to 4.5°C)
    uhi_deltas = np.random.uniform(0.5, 4.5, num_samples)
    temps_effective = temps + uhi_deltas

    # Cyclical encodings
    hour_sin = np.sin(hours * 2 * np.pi / 24)
    hour_cos = np.cos(hours * 2 * np.pi / 24)
    doy_sin = np.sin(days * 2 * np.pi / 365.25)
    doy_cos = np.cos(days * 2 * np.pi / 365.25)

    # Lag features
    temp_lags = temps_effective - np.random.normal(0.2, 0.8, num_samples)
    rh_lags = np.clip(rhs + np.random.normal(0.0, 3.0, num_samples), 15.0, 95.0)

    # Calculate ground truth WBGT for each sample using pure ISO 7243 formula
    y_wbgt = []
    wbgt_lags = []
    for i in range(num_samples):
        res = calculate_wbgt(
            temp_c=temps_effective[i],
            rel_humidity_pct=rhs[i],
            wind_speed_ms=winds[i],
            solar_radiation_wm2=solars[i],
            is_outdoor=True,
        )
        y_wbgt.append(res["wbgt"])

        # Lag WBGT
        res_lag = calculate_wbgt(
            temp_c=temp_lags[i],
            rel_humidity_pct=rh_lags[i],
            wind_speed_ms=winds[i],
            solar_radiation_wm2=max(0.0, solars[i] - 50.0),
            is_outdoor=True,
        )
        wbgt_lags.append(res_lag["wbgt"])

    y_wbgt = np.array(y_wbgt)
    wbgt_lags = np.array(wbgt_lags)

    # Assemble feature matrix X
    # ["temp_c", "rel_humidity_pct", "wind_speed_ms", "solar_radiation_wm2",
    #  "hour_sin", "hour_cos", "day_of_year_sin", "day_of_year_cos",
    #  "uhi_excess_c", "temp_lag1", "rh_lag1", "wbgt_lag1"]
    X = np.column_stack(
        [
            temps_effective,
            rhs,
            winds,
            solars,
            hour_sin,
            hour_cos,
            doy_sin,
            doy_cos,
            uhi_deltas,
            temp_lags,
            rh_lags,
            wbgt_lags,
        ]
    )

    return X, y_wbgt, wbgt_lags


def main():
    print("Generating meteorological & thermal stress dataset for model training...")
    X, y, y_lag1 = generate_empirical_training_dataset(num_samples=2000)

    # Split train (80%) / test (20%)
    split_idx = int(0.80 * len(X))
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    y_lag_test = y_lag1[split_idx:]

    print(f"Dataset split: {len(X_train)} train, {len(X_test)} test samples.")

    # 1. Evaluate Persistence Baseline
    baseline = ThermalBaselineModel()
    persistence_metrics = baseline.evaluate_persistence(y_test, y_lag_test)
    print(
        f"Baseline Persistence -> MAE: {persistence_metrics['mae']:.3f}°C, RMSE: {persistence_metrics['rmse']:.3f}°C, R²: {persistence_metrics['r2']:.3f}"
    )

    # 2. Fit and Evaluate Linear Regression Baseline
    baseline.fit_linear_baseline(X_train, y_train)
    linear_metrics = baseline.evaluate_linear_baseline(X_test, y_test)
    print(
        f"Baseline Linear Model -> MAE: {linear_metrics['mae']:.3f}°C, RMSE: {linear_metrics['rmse']:.3f}°C, R²: {linear_metrics['r2']:.3f}"
    )

    # 3. Fit and Evaluate Gradient Boosting Pipeline
    pipeline = ThermalForecastPipeline()
    metrics = pipeline.train_and_evaluate(
        X_train,
        y_train,
        X_test,
        y_test,
        baseline_metrics={
            "persistence": persistence_metrics,
            "linear_ridge": linear_metrics,
        },
    )

    print(
        f"Gradient Boosting Model -> MAE: {metrics['metrics']['mae']:.3f}°C, RMSE: {metrics['metrics']['rmse']:.3f}°C, R²: {metrics['metrics']['r2']:.3f}"
    )
    print(
        f"Improvement over persistence baseline: {metrics['improvement_over_baseline']['mae_reduction_pct']}% error reduction."
    )

    # 4. Save Model Artifact and Metrics
    artifact_path = os.path.join(BASE_DIR, "analytics", "models", "forecast_model.pkl")
    metrics_path = os.path.join(BASE_DIR, "analytics", "models", "metrics.json")
    pipeline.save(artifact_path, metrics_path)
    print(f"Saved model artifact to: {artifact_path}")
    print(f"Saved metrics to: {metrics_path}")


if __name__ == "__main__":
    main()
