"""
Pydantic schemas for Risk scores and forecasts.
"""

from datetime import datetime

from pydantic import BaseModel

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
    level: str | None = "ward"
    parent_code: str | None = None
    calculated_for: datetime
    risk_score: float
    band: str
    band_label: str
    alert_color: str
    hazard_score: float
    exposure_index: float
    vulnerability_index: float
    factor_breakdown: list[FactorContribution]
    explanation: str
    temperature_c: float
    wbgt_c: float
    utci_c: float
    confidence: float
    sub_scores: dict[str, float | None] | None = None
    diagnostics: dict[str, float] | None = None
    is_demo: bool = False
    demo_label: str | None = None
    provenance: ProvenanceEnvelope | None = None
    imd_grade: str | None = "NORMAL"
    imd_label: str | None = "No Warning (Normal)"
    consecutive_hot_days: int | None = 0
    consecutive_hot_nights: int | None = 0
    hours_to_threshold: float | None = None


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
    items: list[HourlyRiskForecastItem]
    model_name: str | None = None
    method: str | None = None
    is_model_backed: bool = False
    interval_kind: str | None = None
    is_demo: bool = False
    demo_label: str | None = None
    provenance: ProvenanceEnvelope | None = None
