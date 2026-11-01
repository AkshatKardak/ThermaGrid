"""
Pydantic schemas for Locations and Wards.
"""

from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


class LocationBase(BaseModel):
    state: str
    district: str
    city: str
    ward_code: str
    ward_name: str
    latitude: float
    longitude: float
    area_sq_km: Optional[float] = None
    population: int
    population_density_per_km2: float
    outdoor_worker_ratio: float
    informal_settlement_ratio: float
    tree_canopy_fraction: float
    elderly_ratio: float
    children_ratio: float
    cooling_access_deficit: float
    hospital_count: int
    drinking_water_deficit: float
    description: Optional[str] = None


class LocationOut(LocationBase):
    id: int
    geometry_geojson: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)
