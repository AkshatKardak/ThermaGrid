"""
Pydantic schemas for Risk scores, forecasts, and what-if simulation.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel


class FactorContribution(BaseModel):
    name: str
    share_pct: float
    value_unit: str


class RiskCurrentOut(BaseModel):
    location_id: int
    city: str
    ward_name: str
    ward_code: str
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
    is_demo: bool = False
    demo_label: Optional[str] = None


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
    model_name: str
    is_demo: bool = False
    demo_label: Optional[str] = None


class SimulationScenarioRequest(BaseModel):
    location_id: int
    green_cover_expansion_pct: float = 0.0     # e.g., +15% urban tree canopy
    cool_roofs_adoption_pct: float = 0.0       # e.g., +30% high-albedo paint
    misting_shelters_count: int = 0            # e.g., 5 misting hydration hubs
    shift_outdoor_hours_by: int = 0            # e.g., 2 hours early start shift


class SimulationScenarioResponse(BaseModel):
    location_id: int
    city: str
    ward_name: str
    baseline_risk_score: float
    simulated_risk_score: float
    risk_reduction_points: float
    baseline_wbgt_c: float
    simulated_wbgt_c: float
    estimated_uhi_reduction_c: float
    population_protected_count: int
    is_demo: bool = True
    demo_label: str = "DEMO DATA (Microclimate Intervention Simulation)"
