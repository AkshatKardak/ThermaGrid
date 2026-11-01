"""
Explainability & Decision Transparency Module.
"""

from .decompose import decompose_risk_score
from .narrate import generate_risk_narrative
from .shap_adapter import get_feature_importances

__all__ = [
    "decompose_risk_score",
    "generate_risk_narrative",
    "get_feature_importances",
]
