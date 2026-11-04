"""
Pydantic schemas for self-serve alert subscriptions.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator


class SubscriptionCreate(BaseModel):
    ward_id: Optional[int] = None
    channel: str = Field(..., description="whatsapp or email")
    destination: str = Field(..., min_length=3, description="Phone (E.164) or Email address")
    threshold: int = Field(70, ge=1, le=100)
    language: str = Field("en", description="en | hi | mr | ta | bn")
    quiet_hours: Optional[str] = Field("22:00-06:00", description="'HH:MM-HH:MM' or null")

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        clean = v.lower().strip()
        if clean not in ("whatsapp", "email"):
            raise ValueError("Channel must be 'whatsapp' or 'email'")
        return clean

    @field_validator("destination")
    @classmethod
    def validate_destination(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Destination cannot be empty")
        return clean


class SubscriptionUpdate(BaseModel):
    ward_id: Optional[int] = None
    channel: Optional[str] = None
    destination: Optional[str] = None
    threshold: Optional[int] = Field(None, ge=1, le=100)
    language: Optional[str] = None
    quiet_hours: Optional[str] = None
    is_active: Optional[bool] = None


class SubscriptionOut(BaseModel):
    id: str
    clerk_user_id: str
    ward_id: Optional[int] = None
    ward_name: Optional[str] = None
    channel: str
    destination: str
    threshold: int
    language: str
    quiet_hours: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
