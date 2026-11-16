"""
Pydantic schemas for Care Circle (Dependents).
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DependentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    ward_id: int | None = None
    age_band: str | None = Field("elderly", description="elderly | child | adult")
    phone: str | None = None
    consent_note: str | None = Field(
        "Consent confirmed for ward heat monitoring",
        description="Explicit user confirmation that the person knows their ward is watched",
    )


class DependentOut(BaseModel):
    id: str
    clerk_user_id: str
    name: str
    ward_id: int | None = None
    ward_name: str | None = None
    age_band: str | None = None
    phone: str | None = None
    consent_note: str | None = None
    created_at: datetime
    current_risk_score: float | None = None
    current_band: str | None = None

    model_config = ConfigDict(from_attributes=True)
