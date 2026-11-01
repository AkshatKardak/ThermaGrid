"""
Thermal index calculation pipeline script.
Processes observations and outputs WBGT, UTCI, and Heat Index with ISO classifications.
"""

import sys
import os
import json
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))

from src.thermal_indices.wbgt import calculate_wbgt
from src.thermal_indices.utci import calculate_utci
from src.thermal_indices.heat_index import calculate_heat_index


def run_thermal_computation():
    print(f"[{datetime.now(timezone.utc).isoformat()}] Computing thermal indices...")
    input_path = os.path.join(BASE_DIR, "data", "processed", "latest_observations.json")

    if not os.path.exists(input_path):
        print("Staged observations not found. Running ingestion first...")
        from scripts.ingest_data import run_ingestion
        run_ingestion()

    with open(input_path, "r", encoding="utf-8") as f:
        records = json.load(f)

    computed = []
    for r in records:
        t = r["temperature_c"]
        rh = r["rel_humidity_pct"]
        w = r["wind_speed_ms"]
        s = r["solar_radiation_wm2"]

        wbgt_res = calculate_wbgt(t, rh, w, s, is_outdoor=True)
        utci_res = calculate_utci(t, rh, w, s)
        hi_res = calculate_heat_index(t, rh)

        computed.append({
            "ward_code": r["ward_code"],
            "city": r["city"],
            "timestamp": r["timestamp"],
            "ambient_temp_c": t,
            "wbgt": wbgt_res,
            "utci": utci_res,
            "heat_index": hi_res,
        })

    output_path = os.path.join(BASE_DIR, "data", "processed", "thermal_indices.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(computed, f, indent=2)

    print(f"Computed indices for {len(computed)} wards. Stored to: {output_path}")


if __name__ == "__main__":
    run_thermal_computation()
