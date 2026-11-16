"""
Pydantic schemas for Locations and Wards.
"""

from typing import Any

from pydantic import BaseModel, ConfigDict


class LocationBase(BaseModel):
    state: str
    district: str
    city: str
    ward_code: str
    ward_name: str
    latitude: float
    longitude: float
    area_sq_km: float | None = None
    min_lat: float | None = None
    max_lat: float | None = None
    min_lng: float | None = None
    max_lng: float | None = None
    population: int
    population_density_per_km2: float
    outdoor_worker_ratio: float | None = None
    informal_settlement_ratio: float | None = None
    tree_canopy_fraction: float | None = None
    elderly_ratio: float | None = None
    children_ratio: float | None = None
    cooling_access_deficit: float | None = None
    hospital_count: int | None = None
    drinking_water_deficit: float | None = None
    level: str = "ward"
    parent_code: str | None = None
    description: str | None = None


class LocationOut(LocationBase):
    id: int
    geometry_geojson: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)
