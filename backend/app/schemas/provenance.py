"""
Provenance Envelope Schema for Auditable, Verifiable Early-Warning Telemetry.
"""

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProvenanceEnvelope(BaseModel):
    """
    Standard Provenance Metadata block attached to every API response
    ensuring transparency of source, freshness, and quality.
    """

    source: Literal["observed", "forecast", "synthetic"] = Field(
        default="observed",
        description="Data origin: directly observed station telemetry, numerical NWP forecast, or deterministic synthetic baseline.",
    )
    observed_at: str | None = Field(
        default=None,
        description="ISO 8601 timestamp of atmospheric observation or forecast valid time.",
    )
    fetched_at: str = Field(
        default_factory=lambda: datetime.now(UTC).isoformat(),
        description="ISO 8601 timestamp when data was fetched or synthesized.",
    )
    is_synthetic: bool = Field(
        default=False,
        description="Strictly True if data contains synthetic or simulated inputs.",
    )
    is_model_backed: bool = Field(
        default=True,
        description="True only if generated from a verified, trained machine-learning or physical standard.",
    )
    completeness: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Telemetry observation completeness ratio (1.0 = 100% complete).",
    )
    quality_score: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Data quality index based on physical range checks and anomaly scans.",
    )
    stale: bool = Field(
        default=False, description="True if last observation is older than 2 hours."
    )


def create_provenance(
    source: Literal["observed", "forecast", "synthetic"] = "observed",
    observed_at: str | None = None,
    is_synthetic: bool = False,
    is_model_backed: bool = True,
    completeness: float = 1.0,
    quality_score: float = 1.0,
    stale: bool = False,
) -> ProvenanceEnvelope:
    """Helper to instantiate a ProvenanceEnvelope with current timestamp."""
    return ProvenanceEnvelope(
        source=source,
        observed_at=observed_at or datetime.now(UTC).isoformat(),
        fetched_at=datetime.now(UTC).isoformat(),
        is_synthetic=is_synthetic,
        is_model_backed=is_model_backed,
        completeness=completeness,
        quality_score=quality_score,
        stale=stale,
    )
