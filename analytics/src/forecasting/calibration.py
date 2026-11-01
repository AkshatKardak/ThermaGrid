"""
Probabilistic Calibration Metrics: Pinball Loss and PICP (Prediction Interval Coverage).
"""

from typing import Dict, Any, List
import numpy as np


def pinball_loss(y_true: np.ndarray, y_pred: np.ndarray, alpha: float) -> float:
    """Computes quantile (pinball) loss for a given quantile alpha (e.g. 0.1, 0.5, 0.9)."""
    diff = y_true - y_pred
    return float(np.mean(np.maximum(alpha * diff, (alpha - 1.0) * diff)))


def evaluate_interval_coverage(
    y_true: List[float],
    y_lower: List[float],
    y_upper: List[float],
    nominal_confidence: float = 0.80,  # 80% interval (0.10 to 0.90)
) -> Dict[str, Any]:
    """
    Computes Prediction Interval Coverage Probability (PICP)
    and Mean Prediction Interval Width (MPIW).
    """
    yt = np.array(y_true, dtype=float)
    yl = np.array(y_lower, dtype=float)
    yu = np.array(y_upper, dtype=float)
    
    covered = (yt >= yl) & (yt <= yu)
    picp = float(np.mean(covered))
    mpiw = float(np.mean(yu - yl))
    
    # Well-calibrated if actual coverage matches nominal within +/- 6%
    is_calibrated = abs(picp - nominal_confidence) <= 0.06
    
    return {
        "picp": round(picp, 3),
        "nominal_confidence": nominal_confidence,
        "is_calibrated": is_calibrated,
        "mpiw": round(mpiw, 2),
        "coverage_error": round(picp - nominal_confidence, 3),
    }
