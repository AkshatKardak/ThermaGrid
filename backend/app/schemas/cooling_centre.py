"""
Pydantic schemas for Cooling Centres.
"""

from typing import Any

from pydantic import BaseModel, ConfigDict


class CoolingCentreOut(BaseModel):
    id: int
    name: str
    facility_type: str
    city: str
    ward_name: str | None = None
    address: str
    latitude: float
    longitude: float
    capacity_persons: int
    capacity: int | None = None
    current_occupancy: int
    amenities: list[str] | None = None
    operating_hours: str
    opening_hours: dict[str, Any] | None = None
    contact_phone: str
    phone: str | None = None
    current_status: str = "open"  # open | closed | unknown
    is_open_now: bool = True
    is_free: bool = True
    distance_km: float | None = None
    walk_minutes: int | None = None
    directions_url: str | None = None
    is_demo: bool = False
    demo_label: str | None = None

    model_config = ConfigDict(from_attributes=True)
