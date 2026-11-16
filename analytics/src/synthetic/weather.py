"""
Deterministic Hourly Weather Series Generator with Physical Cycles and Autoregressive Residuals.
"""

import math
from datetime import UTC, datetime, timedelta
from typing import Any

import numpy as np

from .profiles import CLIMATE_PROFILES


def generate_hourly_weather(
    profile_key: str = "hot_humid_coastal",
    days: int = 14,
    seed: int = 42,
    start_time: datetime | None = None,
) -> list[dict[str, Any]]:
    """
    Generates deterministic hourly weather series adhering to physical relationships.
    - Temperature peaks at ~14:00, trough at ~05:00
    - Relative humidity inverts diurnal temperature cycle
    - Solar irradiance follows solar elevation angle
    - AR(1) noise models realistic synoptic persistence
    """
    rng = np.random.default_rng(seed)
    profile = CLIMATE_PROFILES.get(profile_key, CLIMATE_PROFILES["hot_humid_coastal"])

    if start_time is None:
        start_time = datetime(2026, 5, 1, 0, 0, 0, tzinfo=UTC)

    total_hours = days * 24
    records: list[dict[str, Any]] = []

    # AR(1) residual state
    phi = 0.82
    temp_noise = 0.0
    rh_noise = 0.0
    wind_noise = 0.0

    for h in range(total_hours):
        current_dt = start_time + timedelta(hours=h)
        day_of_year = current_dt.timetuple().tm_yday
        hour_of_day = current_dt.hour

        # 1. Seasonal baseline (peaks ~day 140 / late May)
        seasonal_phase = 2 * math.pi * (day_of_year - 140) / 365.25
        t_season = profile["t_base"] + profile["t_seasonal_amp"] * math.cos(seasonal_phase)
        rh_season = profile["rh_base"] - profile["rh_seasonal_amp"] * math.cos(seasonal_phase)

        # 2. Diurnal cycle (peak ~14:00 = 2pm)
        diurnal_phase = 2 * math.pi * (hour_of_day - 14) / 24.0
        t_diurnal = profile["t_diurnal_amp"] * math.cos(diurnal_phase)
        rh_diurnal = -profile["rh_diurnal_amp"] * math.cos(diurnal_phase)

        # 3. Autoregressive noise
        temp_noise = phi * temp_noise + rng.normal(0, 0.45)
        rh_noise = phi * rh_noise + rng.normal(0, 1.2)
        wind_noise = 0.7 * wind_noise + rng.normal(0, 0.3)

        # 4. Synthesize values with physical clamps
        temp_c = round(float(t_season + t_diurnal + temp_noise), 2)
        rh_pct = round(float(np.clip(rh_season + rh_diurnal + rh_noise, 10.0, 99.0)), 1)
        wind_ms = round(
            float(
                np.clip(
                    profile["wind_base_ms"] + wind_noise + rng.uniform(-0.4, 0.6),
                    0.5,
                    18.0,
                )
            ),
            2,
        )

        # 5. Solar Radiation: daylight between 06:00 and 18:00
        if 6 <= hour_of_day <= 18:
            solar_frac = math.sin(math.pi * (hour_of_day - 6) / 12.0)
            solar_wm2 = round(
                float(max(0.0, profile["solar_peak_wm2"] * solar_frac + rng.normal(0, 25))),
                1,
            )
        else:
            solar_wm2 = 0.0

        records.append(
            {
                "timestamp": current_dt.isoformat(),
                "temperature_c": temp_c,
                "rel_humidity_pct": rh_pct,
                "wind_speed_ms": wind_ms,
                "solar_radiation_wm2": solar_wm2,
                "is_synthetic": True,
                "climate_archetype": profile_key,
            }
        )

    return records
