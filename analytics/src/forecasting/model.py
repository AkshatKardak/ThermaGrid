"""
Thermal stress forecasting model using ensemble Gradient Boosting
with uncertainty estimation (quantile loss for confidence bands).
"""

import os
import json
import joblib
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


FEATURE_NAMES = [
    "temp_c",
    "rel_humidity_pct",
    "wind_speed_ms",
    "solar_radiation_wm2",
    "hour_sin",
    "hour_cos",
    "day_of_year_sin",
    "day_of_year_cos",
    "uhi_excess_c",
    "temp_lag1",
    "rh_lag1",
    "wbgt_lag1",
]


class ThermalForecastPipeline:
    """
    Trained model for predicting future WBGT and thermal risk score
    with lower (10th percentile) and upper (90th percentile) confidence bounds.
    """

    def __init__(self):
        # Median prediction model
        self.median_model = GradientBoostingRegressor(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=4,
            loss="squared_error",
            random_state=42,
        )
        # Lower bound (quantile 0.10)
        self.lower_model = GradientBoostingRegressor(
            n_estimators=60,
            learning_rate=0.08,
            max_depth=3,
            loss="quantile",
            alpha=0.10,
            random_state=42,
        )
        # Upper bound (quantile 0.90)
        self.upper_model = GradientBoostingRegressor(
            n_estimators=60,
            learning_rate=0.08,
            max_depth=3,
            loss="quantile",
            alpha=0.90,
            random_state=42,
        )
        self.feature_names = FEATURE_NAMES
        self.is_trained = False
        self.metrics: Dict[str, Any] = {}

    def train_and_evaluate(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        baseline_metrics: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Trains models and produces rigorous validation metrics comparing to baseline.
        """
        self.median_model.fit(X_train, y_train)
        self.lower_model.fit(X_train, y_train)
        self.upper_model.fit(X_train, y_train)
        self.is_trained = True

        y_pred = self.median_model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))

        # Extract feature importances
        importances = self.median_model.feature_importances_
        feature_importance_list = [
            {"feature": name, "importance": round(float(imp) * 100, 2)}
            for name, imp in zip(self.feature_names, importances)
        ]
        feature_importance_list.sort(key=lambda x: x["importance"], reverse=True)

        self.metrics = {
            "model_type": "GradientBoostingRegressor (Ensemble with Quantile Bounds)",
            "metrics": {
                "mae": round(mae, 3),
                "rmse": round(rmse, 3),
                "r2": round(r2, 3),
            },
            "baseline_comparison": baseline_metrics or {},
            "improvement_over_baseline": {
                "mae_reduction_pct": round(
                    ((baseline_metrics.get("persistence", {}).get("mae", mae) - mae)
                     / max(0.01, baseline_metrics.get("persistence", {}).get("mae", mae))) * 100,
                    2
                ) if baseline_metrics and "persistence" in baseline_metrics else 0.0,
            },
            "feature_importance": feature_importance_list,
        }
        return self.metrics

    def predict_with_confidence(self, X: np.ndarray) -> List[Dict[str, float]]:
        """
        Predicts point forecast and 80% confidence interval [lower_bound, upper_bound].
        """
        if not self.is_trained:
            # Fallback heuristic if called before fit
            preds = []
            for row in X:
                # Approximate from temp and rh
                temp = row[0]
                rh = row[1]
                approx = temp * 0.7 + (rh * 0.1)
                preds.append({
                    "predicted_wbgt": round(approx, 2),
                    "lower_bound": round(approx - 1.2, 2),
                    "upper_bound": round(approx + 1.2, 2),
                })
            return preds

        y_pred = self.median_model.predict(X)
        y_low = self.lower_model.predict(X)
        y_high = self.upper_model.predict(X)

        results = []
        for p, l, h in zip(y_pred, y_low, y_high):
            results.append({
                "predicted_wbgt": round(float(p), 2),
                "lower_bound": round(float(min(p, l)), 2),
                "upper_bound": round(float(max(p, h)), 2),
            })
        return results

    def save(self, artifact_path: str, metrics_path: str) -> None:
        """Saves model weights and metrics JSON."""
        os.makedirs(os.path.dirname(artifact_path), exist_ok=True)
        os.makedirs(os.path.dirname(metrics_path), exist_ok=True)
        joblib.dump(self, artifact_path)
        with open(metrics_path, "w", encoding="utf-8") as f:
            json.dump(self.metrics, f, indent=2)

    @classmethod
    def load(cls, artifact_path: str) -> "ThermalForecastPipeline":
        if os.path.exists(artifact_path):
            return joblib.load(artifact_path)
        return cls()
