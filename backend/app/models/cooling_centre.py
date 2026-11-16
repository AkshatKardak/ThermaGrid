"""
Cooling Centre ORM model.
"""

from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, Integer, String, Text

from app.db.base import Base


class CoolingCentre(Base):
    __tablename__ = "cooling_centres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    facility_type = Column(
        String(100), default="Public AC Shelter"
    )  # Hospital, Metro Station, Community Hall, Library
    city = Column(String(100), nullable=False, index=True)
    ward_name = Column(String(100), nullable=True)
    address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity_persons = Column(Integer, default=150)
    current_occupancy = Column(Integer, default=20)
    amenities = Column(
        JSON, nullable=True
    )  # ["Air Conditioning", "Clean ORS Water", "Emergency Paramedic", "Shaded Seating"]
    operating_hours = Column(String(100), default="08:00 - 20:00")
    opening_hours = Column(JSON, nullable=True)  # Structured schedule
    current_status = Column(String(50), default="open")  # open | closed | unknown
    is_free = Column(Boolean, default=True)
    contact_phone = Column(String(50), default="108 / 1916")
    is_active = Column(Integer, default=1)
    is_demo = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    @property
    def capacity(self) -> int:
        return self.capacity_persons

    @property
    def phone(self) -> str:
        return self.contact_phone
