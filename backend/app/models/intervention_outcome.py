"""
Intervention Outcome ORM model.
Tracks municipal resource allocations and measured/simulated before-and-after risk deltas.
"""

from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String

from app.db.base import Base


class InterventionOutcome(Base):
    __tablename__ = "intervention_outcomes"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    ward_name = Column(String(255), nullable=False)
    intervention_type = Column(
        String(100), nullable=False
    )  # 'cool_roofs', 'misting_stations', 'cooling_centre_activation', 'mobile_water_tankers'
    allocated_units = Column(Integer, default=1, nullable=False)
    cost_inr = Column(Float, nullable=False)
    pre_risk_score = Column(Float, nullable=False)
    post_risk_score = Column(Float, nullable=False)
    risk_delta = Column(Float, nullable=False)  # pre - post
    population_protected = Column(Integer, default=0, nullable=False)
    status = Column(
        String(50), default="deployed", nullable=False
    )  # 'planned' | 'deployed' | 'verified'
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), index=True)
