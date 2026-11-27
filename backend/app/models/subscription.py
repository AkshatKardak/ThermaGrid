"""
Alert Subscription ORM model.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)

from app.db.base import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clerk_user_id = Column(String(255), nullable=False, index=True)
    ward_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    channel = Column(String(20), nullable=False)  # 'email'
    destination = Column(String(255), nullable=False)  # E.164 phone or email
    threshold = Column(Integer, default=70, nullable=False)  # risk score
    language = Column(String(10), default="en", nullable=False)
    quiet_hours = Column(String(50), nullable=True)  # '22:00-06:00' or None
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    __table_args__ = (
        UniqueConstraint("clerk_user_id", "ward_id", "channel", name="uq_user_ward_channel"),
    )
