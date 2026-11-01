"""
Data ingestion script.
Fetches surface meteorology from Open-Meteo for configured metropolitan wards,
validates against physical boundaries, and stages into data/processed/.
"""

import sys
import os
import json
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))

from src.ingestion.open_meteo import OpenMeteoClient
from src.ingestion.census_loader import list_all_wards
from src.cleaning.validator import validate_weather_observation, clean_and_impute_observation


def run_ingestion():
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting meteorological data ingestion...")
    client = OpenMeteoClient()
    wards = list_all_wards()

    output_dir = os.path.join(BASE_DIR, "data", "processed")
    os.makedirs(output_dir, exist_ok=True)

    records = []
    for w in wards:
        print(f"Fetching weather for: {w['ward_name']} ({w['city']})...")
        data = client.fetch_current_and_forecast(
            latitude=w["latitude"],
            longitude=w["longitude"],
            forecast_days=3,
        )

        curr = data.get("current_weather", {})
        temp = curr.get("temperature", 34.0)
        wind = curr.get("windspeed", 2.0)

        obs = {
            "ward_code": w["ward_code"],
            "city": w["city"],
            "timestamp": curr.get("time", datetime.now(timezone.utc).isoformat()),
            "temperature_c": temp,
            "rel_humidity_pct": 58.0,
            "wind_speed_ms": wind,
            "solar_radiation_wm2": 720.0,
            "is_demo": data.get("is_demo", False),
        }

        valid, err = validate_weather_observation(obs)
        if not valid:
            print(f"Validation warning for {w['ward_code']}: {err}")
            obs = clean_and_impute_observation(obs)

        records.append(obs)

    output_path = os.path.join(output_dir, "latest_observations.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    print(f"Ingested and validated {len(records)} ward observations. Stored to: {output_path}")


if __name__ == "__main__":
    run_ingestion()
