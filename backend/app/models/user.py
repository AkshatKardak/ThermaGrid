"""
User and Profile ORM model.
Unified user model keyed by clerk_user_id (the JWT sub) holding preferences.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String(255), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="citizen", nullable=False)  # citizen | worker | authority | admin
    language = Column(String(10), default="en")
    default_ward_id = Column(Integer, nullable=True)
    phone_number = Column(String(50), nullable=True)
    preferred_channel = Column(String(20), default="email")
    is_active = Column(Boolean, default=True)
    city_preference = Column(String(100), default="Mumbai")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
