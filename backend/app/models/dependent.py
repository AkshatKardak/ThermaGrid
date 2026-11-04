"""
Dependent / Care Circle ORM model.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from app.db.base import Base


class Dependent(Base):
    __tablename__ = "dependents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clerk_user_id = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    ward_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    age_band = Column(String(50), nullable=True)  # 'elderly' | 'child' | 'adult'
    phone = Column(String(50), nullable=True)
    consent_note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
