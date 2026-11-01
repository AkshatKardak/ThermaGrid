"""
Baseline models for human thermal stress and WBGT forecasting.
Implements:
1. Persistence baseline (WBGT_t+h = WBGT_t)
2. Diurnal climatological persistence
3. Simple Multivariate Linear Regression baseline
"""

from typing import Dict, Any, Tuple
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


class ThermalBaselineModel:
    """
    Evaluates baseline forecasting benchmarks against which ML models are tested.
    """

    def __init__(self):
        self.ridge = Ridge(alpha=1.0)
        self.is_fitted = False

    def evaluate_persistence(
        self, y_true: np.ndarray, y_lag1: np.ndarray
    ) -> Dict[str, float]:
        """
        Computes standard persistence error: y_pred = y_(t-1)
        """
        mae = float(mean_absolute_error(y_true, y_lag1))
        rmse = float(np.sqrt(mean_squared_error(y_true, y_lag1)))
        r2 = float(r2_score(y_true, y_lag1))
        return {
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "r2": round(r2, 3),
        }

    def fit_linear_baseline(
        self, X_train: np.ndarray, y_train: np.ndarray
    ) -> "ThermalBaselineModel":
        self.ridge.fit(X_train, y_train)
        self.is_fitted = True
        return self

    def evaluate_linear_baseline(
        self, X_test: np.ndarray, y_test: np.ndarray
    ) -> Dict[str, float]:
        if not self.is_fitted:
            raise RuntimeError("Linear baseline model must be fitted first.")
        y_pred = self.ridge.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))
        return {
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "r2": round(r2, 3),
        }
