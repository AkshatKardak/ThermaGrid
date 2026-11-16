#!/usr/bin/env python3
"""Data fetching and asset management utility for ThermaGrid.

Downloads external GIS boundaries, census data dumps, and calibration fixtures
that are excluded from Git to keep the repository footprint under 5MB.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import sys
import urllib.error
import urllib.request
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parent.parent

DATASET_REGISTRY: dict[str, dict[str, str]] = {
    "india-states": {
        "url": "https://raw.githubusercontent.com/datameet/maps/master/States/Admin2.geojson",
        "default_path": "frontend/src/assets/geo/india-states.json",
        "description": "Survey of India / DataMeet State & UT administrative boundary polygons",
    },
    "mumbai-census": {
        "url": "https://raw.githubusercontent.com/datameet/mumbai-ward-boundaries/master/mumbai_wards_census_2011.json",
        "default_path": "data/raw/mumbai_wards_census_2011.json",
        "description": "Census of India 2011 Ward-level demographics and household density",
    },
}


def download_dataset(dataset_key: str, dest_path: Path, force: bool = False) -> bool:
    """Download a dataset from the remote registry to the destination path."""
    meta = DATASET_REGISTRY.get(dataset_key)
    if not meta:
        logger.error(
            "Unknown dataset '%s'. Available: %s", dataset_key, list(DATASET_REGISTRY.keys())
        )
        return False

    if dest_path.exists() and not force:
        logger.info(
            "Destination '%s' already exists (%d bytes). Use --force to redownload.",
            dest_path,
            dest_path.stat().st_size,
        )
        return True

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    logger.info("Fetching '%s' from %s ...", dataset_key, meta["url"])

    try:
        req = urllib.request.Request(meta["url"], headers={"User-Agent": "ThermaGrid-Fetcher/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read()

        # Validate that content is valid JSON
        parsed = json.loads(content)
        feature_count = len(parsed.get("features", [])) if isinstance(parsed, dict) else 0

        dest_path.write_bytes(content)
        sha256 = hashlib.sha256(content).hexdigest()
        logger.info(
            "Successfully fetched '%s' to '%s' (%d bytes, %d features, sha256: %s)",
            dataset_key,
            dest_path,
            len(content),
            feature_count,
            sha256[:12],
        )
        return True
    except urllib.error.URLError as err:
        logger.error("Failed to download '%s': %s", dataset_key, err)
        return False
    except json.JSONDecodeError as err:
        logger.error("Downloaded content for '%s' is not valid JSON: %s", dataset_key, err)
        return False


def verify_datasets() -> bool:
    """Verify presence and validity of local datasets."""
    all_ok = True
    for key, meta in DATASET_REGISTRY.items():
        target = REPO_ROOT / meta["default_path"]
        if not target.exists():
            logger.warning("MISSING: '%s' at %s", key, target)
            all_ok = False
        else:
            try:
                data = json.loads(target.read_text(encoding="utf-8"))
                features = len(data.get("features", [])) if isinstance(data, dict) else "N/A"
                logger.info(
                    "OK: '%s' at %s (%d bytes, features: %s)",
                    key,
                    target,
                    target.stat().st_size,
                    features,
                )
            except Exception as err:
                logger.error("CORRUPT: '%s' at %s: %s", key, target, err)
                all_ok = False
    return all_ok


def main() -> int:
    """CLI entrypoint."""
    parser = argparse.ArgumentParser(description="ThermaGrid remote data asset fetcher")
    parser.add_argument(
        "--dataset",
        choices=["all", *DATASET_REGISTRY.keys()],
        default="all",
        help="Specific dataset to fetch (default: all)",
    )
    parser.add_argument("--output", type=Path, default=None, help="Custom output file destination")
    parser.add_argument("--force", action="store_true", help="Overwrite existing local files")
    parser.add_argument(
        "--verify", action="store_true", help="Verify integrity of current local datasets"
    )

    args = parser.parse_args()

    if args.verify:
        success = verify_datasets()
        return 0 if success else 1

    targets = list(DATASET_REGISTRY.keys()) if args.dataset == "all" else [args.dataset]
    for key in targets:
        dest = args.output if args.output else (REPO_ROOT / DATASET_REGISTRY[key]["default_path"])
        ok = download_dataset(key, dest, force=args.force)
        if not ok and not dest.exists():
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
