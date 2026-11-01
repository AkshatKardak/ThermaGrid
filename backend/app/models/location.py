"""
Location and Ward ORM models with demographic, built-environment,
and vulnerability attributes.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from app.db.base import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    ward_code = Column(String(50), unique=True, nullable=False, index=True)
    ward_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area_sq_km = Column(Float, nullable=True)
    
    # Demographics & Vulnerability (Census & Municipal data)
    population = Column(Integer, default=100000)
    population_density_per_km2 = Column(Float, default=15000.0)
    outdoor_worker_ratio = Column(Float, default=0.25)
    informal_settlement_ratio = Column(Float, default=0.30)
    tree_canopy_fraction = Column(Float, default=0.15)
    elderly_ratio = Column(Float, default=0.08)
    children_ratio = Column(Float, default=0.07)
    cooling_access_deficit = Column(Float, default=0.40)
    hospital_count = Column(Integer, default=3)
    drinking_water_deficit = Column(Float, default=0.30)

    # GeoJSON Boundary (Polygon or MultiPolygon)
    geometry_geojson = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
