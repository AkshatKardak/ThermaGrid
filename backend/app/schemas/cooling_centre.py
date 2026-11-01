"""
Pydantic schemas for Cooling Centres.
"""

from typing import List, Optional
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
    current_occupancy: int
    amenities: Optional[List[str]] = None
    operating_hours: str
    contact_phone: str
    distance_km: Optional[float] = None
    is_demo: bool = False
    demo_label: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
