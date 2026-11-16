"""
Comprehensive Data Quality & Telemetry Assurance Report Generator.
"""

from typing import Any

from .anomalies import detect_telemetry_anomalies
from .quality import compute_completeness, compute_freshness_seconds, compute_validity


def generate_quality_report(
    records: list[dict[str, Any]],
    expected_count: int = 168,  # 7 days of hourly data
) -> dict[str, Any]:
    """
    Evaluates complete telemetry pipeline health:
    - Overall quality score (0.0 to 1.0)
    - Completeness, validity, freshness
    - Detected anomalies (spikes, flatlines)
    """
    completeness = compute_completeness(records, expected_count)
    validity = compute_validity(records)

    latest_ts = records[-1].get("timestamp", "") if records else ""
    freshness = compute_freshness_seconds(latest_ts)

    anomalies = detect_telemetry_anomalies(records)

    # Composite Quality Score calculation
    anomaly_penalty = min(0.4, len(anomalies) * 0.05)
    freshness_penalty = 0.2 if freshness > 7200 else (0.1 if freshness > 3600 else 0.0)

    quality_score = max(
        0.0,
        round(0.5 * completeness + 0.5 * validity - anomaly_penalty - freshness_penalty, 3),
    )

    return {
        "quality_score": quality_score,
        "completeness": completeness,
        "validity": validity,
        "freshness_seconds": freshness,
        "stale": bool(freshness > 7200),
        "total_observations": len(records),
        "anomalies_detected": len(anomalies),
        "anomalies": anomalies[:10],  # top 10 findings
        "status": "nominal"
        if quality_score >= 0.85
        else ("degraded" if quality_score >= 0.60 else "critical"),
    }
