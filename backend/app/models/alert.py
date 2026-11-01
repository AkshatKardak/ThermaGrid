"""
Heat Action Plan Early-Warning Alert ORM model.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from app.db.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), index=True, nullable=False)
    alert_level = Column(String(50), nullable=False)  # Yellow, Orange, Red / Extreme
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    action_directives = Column(Text, nullable=False)
    target_audience = Column(String(100), default="all")  # all, workers, elderly, schools
    channels = Column(String(100), default="web,sms,whatsapp")
    is_active = Column(Boolean, default=True)
    dispatched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
