"""
Data Provenance and Source Registry ORM model.
Tracks official provenance, resolution, update frequency, and licenses for all datasets.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.db.base import Base


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    provider = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    spatial_resolution = Column(String(100), nullable=False)
    temporal_resolution = Column(String(100), nullable=False)
    date_range = Column(String(100), nullable=False)
    license = Column(String(100), nullable=False)
    variables = Column(Text, nullable=False)
    update_frequency = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
