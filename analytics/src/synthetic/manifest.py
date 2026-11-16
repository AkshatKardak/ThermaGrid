"""
Synthetic Generation Manifest and Provenance Registry.
"""

import hashlib
import json
from datetime import UTC, datetime
from typing import Any


def create_manifest(
    dataset_name: str = "ThermaGrid Synthetic Baseline 2026",
    seeds: dict[str, int] = None,
    profiles_used: list = None,
) -> dict[str, Any]:
    """Generates an audit trail manifest for synthetic datasets."""
    if seeds is None:
        seeds = {"weather": 42, "wards": 101, "rasters": 2026}
    if profiles_used is None:
        profiles_used = ["hot_humid_coastal", "hot_dry", "ganga_plain"]

    raw_payload = json.dumps(
        {"dataset": dataset_name, "seeds": seeds, "profiles": profiles_used},
        sort_keys=True,
    )
    manifest_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

    return {
        "dataset_name": dataset_name,
        "is_synthetic": True,
        "is_model_backed": False,
        "manifest_sha256": manifest_hash,
        "seeds": seeds,
        "profiles_used": profiles_used,
        "generated_at": datetime.now(UTC).isoformat(),
        "disclaimer": "DEMO DATA: Deterministically generated synthetic atmospheric and ward demographics.",
    }
