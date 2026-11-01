"""
Pydantic schemas for Thermal Indices.
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class ThermalCurrentOut(BaseModel):
    location_id: int
    city: str
    ward_name: str
    calculated_for: datetime
    wbgt_c: float
    wet_bulb_c: float
    globe_temp_c: float
    wbgt_category: str
    wbgt_work_rest_guidance: str
    
    utci_c: float
    utci_category: str
    utci_impact: str
    
    heat_index_c: float
    heat_index_category: str
    heat_index_warning: str

    citation: str
    is_demo: bool = False
    demo_label: Optional[str] = None


class HourlyThermalItem(BaseModel):
    time: str
    wbgt_c: float
    utci_c: float
    heat_index_c: float
    temperature_c: float


class ThermalHistoryOut(BaseModel):
    location_id: int
    city: str
    ward_name: str
    items: List[HourlyThermalItem]
    is_demo: bool = False
    demo_label: Optional[str] = None
