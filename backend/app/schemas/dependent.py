"""
Pydantic schemas for Care Circle (Dependents).
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class DependentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    ward_id: Optional[int] = None
    age_band: Optional[str] = Field("elderly", description="elderly | child | adult")
    phone: Optional[str] = None
    consent_note: Optional[str] = Field(
        "Consent confirmed for ward heat monitoring",
        description="Explicit user confirmation that the person knows their ward is watched",
    )


class DependentOut(BaseModel):
    id: str
    clerk_user_id: str
    name: str
    ward_id: Optional[int] = None
    ward_name: Optional[str] = None
    age_band: Optional[str] = None
    phone: Optional[str] = None
    consent_note: Optional[str] = None
    created_at: datetime
    current_risk_score: Optional[float] = None
    current_band: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
