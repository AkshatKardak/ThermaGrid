"""
Model evaluation, regression metrics, and thermal backtesting module.
"""

from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def compute_regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Computes standard regression error metrics: MAE, RMSE, and R².
    """
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4),
    }


def compute_skill_score(mae_model: float, mae_baseline: float) -> float:
    """
    Computes forecast skill score relative to baseline:
    Skill = 1 - (MAE_model / MAE_baseline)
    """
    if mae_baseline <= 0:
        return 0.0
    skill = 1.0 - (mae_model / mae_baseline)
    return round(skill * 100.0, 2)
