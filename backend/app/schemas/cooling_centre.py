"""
Pydantic schemas for Cooling Centres.
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


class CoolingCentreOut(BaseModel):
    id: int
    name: str
    facility_type: str
    city: str
    ward_name: Optional[str] = None
    address: str
    latitude: float
    longitude: float
    capacity_persons: int
    capacity: Optional[int] = None
    current_occupancy: int
    amenities: Optional[List[str]] = None
    operating_hours: str
    opening_hours: Optional[Dict[str, Any]] = None
    contact_phone: str
    phone: Optional[str] = None
    current_status: str = "open"  # open | closed | unknown
    is_open_now: bool = True
    is_free: bool = True
    distance_km: Optional[float] = None
    walk_minutes: Optional[int] = None
    directions_url: Optional[str] = None
    is_demo: bool = False
    demo_label: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
