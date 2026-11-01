"""
Thermal Indices ORM models for WBGT, UTCI, and Heat Index.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, DateTime, String, Boolean, ForeignKey
from app.db.base import Base


class ThermalIndex(Base):
    __tablename__ = "thermal_indices"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), index=True, nullable=False)
    calculated_for = Column(DateTime, nullable=False, index=True)
    
    # Primary Metrics
    wbgt_c = Column(Float, nullable=False)
    wet_bulb_c = Column(Float, nullable=True)
    globe_temp_c = Column(Float, nullable=True)
    utci_c = Column(Float, nullable=False)
    mean_radiant_temp_c = Column(Float, nullable=True)
    heat_index_c = Column(Float, nullable=False)
    
    # Classifications
    wbgt_category = Column(String(50), nullable=False)
    utci_category = Column(String(50), nullable=False)
    heat_index_category = Column(String(50), nullable=False)
    
    method_version = Column(String(50), default="ISO7243:2017+Brode2012+Rothfusz1990")
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
