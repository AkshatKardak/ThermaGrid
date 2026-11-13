"""
Pydantic schemas for Risk scores and forecasts.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.provenance import ProvenanceEnvelope


class FactorContribution(BaseModel):
    name: str
    share_pct: float
    value_unit: str


class RiskCurrentOut(BaseModel):
    location_id: int
    city: str
    ward_name: str
    ward_code: str
    level: Optional[str] = "ward"
    parent_code: Optional[str] = None
    calculated_for: datetime
    risk_score: float
    band: str
    band_label: str
    alert_color: str
    hazard_score: float
    exposure_index: float
    vulnerability_index: float
    factor_breakdown: List[FactorContribution]
    explanation: str
    temperature_c: float
    wbgt_c: float
    utci_c: float
    confidence: float
    sub_scores: Optional[Dict[str, Optional[float]]] = None
    diagnostics: Optional[Dict[str, float]] = None
    is_demo: bool = False
    demo_label: Optional[str] = None
    provenance: Optional[ProvenanceEnvelope] = None
    imd_grade: Optional[str] = "NORMAL"
    imd_label: Optional[str] = "No Warning (Normal)"
    consecutive_hot_days: Optional[int] = 0
    consecutive_hot_nights: Optional[int] = 0
    hours_to_threshold: Optional[float] = None


class HourlyRiskForecastItem(BaseModel):
    time: str
    predicted_risk_score: float
    lower_bound: float
    upper_bound: float
    band: str
    predicted_wbgt: float
    temperature_c: float


class RiskForecastOut(BaseModel):
    location_id: int
    city: str
    ward_name: str
    forecast_days: int
    items: List[HourlyRiskForecastItem]
    model_name: Optional[str] = None
    method: Optional[str] = None
    is_model_backed: bool = False
    interval_kind: Optional[str] = None
    is_demo: bool = False
    demo_label: Optional[str] = None
    provenance: Optional[ProvenanceEnvelope] = None
