"""
User and Role ORM models.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="citizen", nullable=False)  # citizen | worker | authority | admin
    is_active = Column(Boolean, default=True)
    city_preference = Column(String(100), default="Mumbai")
    phone_number = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
