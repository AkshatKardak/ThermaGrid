"""
Alert Dispatch Log ORM model.
Tracks individual alert dispatches with fatigue control and deduplication constraints.
"""

from datetime import UTC, datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)

from app.db.base import Base


class AlertDispatch(Base):
    __tablename__ = "alert_dispatches"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(String(36), ForeignKey("subscriptions.id"), nullable=False, index=True)
    triggered_at = Column(DateTime, nullable=False, default=lambda: datetime.now(UTC), index=True)
    channel = Column(String(20), nullable=False)  # 'email' | 'sms' | 'web'
    status = Column(String(20), default="sent", nullable=False)  # 'sent' | 'failed' | 'throttled'
    reason = Column(String(255), nullable=True)
    risk_score = Column(Float, nullable=False)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    __table_args__ = (
        UniqueConstraint("subscription_id", "triggered_at", name="uq_dispatch_sub_time"),
    )
