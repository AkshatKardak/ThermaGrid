"""
Pydantic schemas for self-serve alert subscriptions.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SubscriptionCreate(BaseModel):
    ward_id: int | None = None
    channel: str = Field(..., description="email")
    destination: str = Field(..., min_length=3, description="Email address")
    threshold: int = Field(70, ge=1, le=100)
    language: str = Field("en", description="en | hi | mr | ta | bn")
    quiet_hours: str | None = Field("22:00-06:00", description="'HH:MM-HH:MM' or null")

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        clean = v.lower().strip()
        if clean != "email":
            raise ValueError("Channel must be 'email'")
        return clean

    @field_validator("destination")
    @classmethod
    def validate_destination(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Destination cannot be empty")
        return clean


class SubscriptionUpdate(BaseModel):
    ward_id: int | None = None
    channel: str | None = None
    destination: str | None = None
    threshold: int | None = Field(None, ge=1, le=100)
    language: str | None = None
    quiet_hours: str | None = None
    is_active: bool | None = None

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str | None) -> str | None:
        if v is None:
            return None
        clean = v.lower().strip()
        if clean != "email":
            raise ValueError("Channel must be 'email'")
        return clean


class SubscriptionOut(BaseModel):
    id: str
    clerk_user_id: str
    ward_id: int | None = None
    ward_name: str | None = None
    channel: str
    destination: str
    threshold: int
    language: str
    quiet_hours: str | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
