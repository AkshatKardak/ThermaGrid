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
    min_lat: Optional[float] = None
    max_lat: Optional[float] = None
    min_lng: Optional[float] = None
    max_lng: Optional[float] = None
    population: int
    population_density_per_km2: float
    outdoor_worker_ratio: Optional[float] = None
    informal_settlement_ratio: Optional[float] = None
    tree_canopy_fraction: Optional[float] = None
    elderly_ratio: Optional[float] = None
    children_ratio: Optional[float] = None
    cooling_access_deficit: Optional[float] = None
    hospital_count: Optional[int] = None
    drinking_water_deficit: Optional[float] = None
    level: str = "ward"
    parent_code: Optional[str] = None
    description: Optional[str] = None


class LocationOut(LocationBase):
    id: int
    geometry_geojson: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)
