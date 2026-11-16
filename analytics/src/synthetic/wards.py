"""
Synthetic Municipal Wards Generator with Realistic Built-Environment Correlates.
"""

from typing import Any

import numpy as np


def generate_synthetic_wards(
    city: str = "Mumbai",
    center_lat: float = 19.0760,
    center_lon: float = 72.8777,
    count: int = 24,
    seed: int = 101,
) -> list[dict[str, Any]]:
    """
    Generates synthetic municipal wards arranged spatially with correlated demographics:
    - High informal housing correlates with lower tree canopy and higher outdoor worker fraction
    - Richer wards correlate with higher AC ownership (lower cooling deficit) and higher canopy
    """
    rng = np.random.default_rng(seed)
    wards: list[dict[str, Any]] = []

    for i in range(1, count + 1):
        ward_code = f"WARD_{city[:3].upper()}_{i:02d}"

        # Jitter coordinates around city center
        dlat = rng.normal(0, 0.05)
        dlon = rng.normal(0, 0.05)
        w_lat = round(float(center_lat + dlat), 5)
        w_lon = round(float(center_lon + dlon), 5)

        # Socio-economic status latent variable (-2 to +2)
        ses = rng.normal(0, 1.0)

        # Built-environment correlates
        informal_settlement_ratio = round(
            float(np.clip(0.35 - 0.25 * ses + rng.normal(0, 0.08), 0.02, 0.85)), 3
        )
        tree_canopy_fraction = round(
            float(np.clip(0.16 + 0.12 * ses + rng.normal(0, 0.04), 0.01, 0.45)), 3
        )
        outdoor_worker_ratio = round(
            float(np.clip(0.28 - 0.15 * ses + rng.normal(0, 0.05), 0.05, 0.65)), 3
        )
        cooling_access_deficit = round(
            float(np.clip(0.48 - 0.28 * ses + rng.normal(0, 0.06), 0.10, 0.90)), 3
        )
        drinking_water_deficit = round(
            float(np.clip(0.30 - 0.18 * ses + rng.normal(0, 0.05), 0.05, 0.75)), 3
        )

        # Demographics
        pop_density = round(
            float(
                np.clip(
                    25000 + 35000 * informal_settlement_ratio + rng.normal(0, 4000),
                    4000,
                    95000,
                )
            ),
            1,
        )
        area_sq_km = round(float(rng.uniform(3.5, 18.0)), 2)
        population = int(pop_density * area_sq_km)

        # Polygon bounding box
        delta = 0.012
        polygon = [
            [round(w_lon - delta, 5), round(w_lat - delta, 5)],
            [round(w_lon + delta, 5), round(w_lat - delta, 5)],
            [round(w_lon + delta, 5), round(w_lat + delta, 5)],
            [round(w_lon - delta, 5), round(w_lat + delta, 5)],
            [round(w_lon - delta, 5), round(w_lat - delta, 5)],
        ]

        wards.append(
            {
                "ward_code": ward_code,
                "ward_name": f"{city} Ward {i:02d}",
                "city": city,
                "latitude": w_lat,
                "longitude": w_lon,
                "area_sq_km": area_sq_km,
                "population": population,
                "population_density_per_km2": pop_density,
                "outdoor_worker_ratio": outdoor_worker_ratio,
                "informal_settlement_ratio": informal_settlement_ratio,
                "tree_canopy_fraction": tree_canopy_fraction,
                "cooling_access_deficit": cooling_access_deficit,
                "drinking_water_deficit": drinking_water_deficit,
                "elderly_ratio": round(float(rng.uniform(0.05, 0.12)), 3),
                "children_ratio": round(float(rng.uniform(0.06, 0.14)), 3),
                "hospital_count": int(max(1, round(area_sq_km * rng.uniform(0.3, 0.8)))),
                "geometry_geojson": {
                    "type": "Polygon",
                    "coordinates": [polygon],
                },
                "is_synthetic": True,
            }
        )

    return wards
