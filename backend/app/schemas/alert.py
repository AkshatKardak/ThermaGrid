"""
Pydantic schemas for Alerts.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AlertCreate(BaseModel):
    location_id: int
    alert_level: str
    title: str
    message: str
    action_directives: str
    target_audience: str = "all"


class AlertOut(BaseModel):
    id: int
    location_id: int
    alert_level: str
    title: str
    message: str
    action_directives: str
    target_audience: str
    channels: str
    is_active: bool
    dispatched_at: datetime
    city: Optional[str] = None
    ward_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
