"""
Safe-Window Planner API route.
Computes safe physical activity intervals across the 24-hour diurnal risk curve.
Thresholds are dynamically loaded from analytics/config/weights.yaml.
"""

import math
import os
from datetime import datetime, timedelta
from typing import Any

import yaml
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.forecast_service import ForecastService

router = APIRouter(prefix="/planner", tags=["Planner"])

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
)
CONFIG_PATH = os.path.join(
    PROJECT_ROOT,
    "analytics",
    "config",
    "weights.yaml",
)


def _load_thresholds() -> dict[str, Any]:
    if not os.path.exists(CONFIG_PATH):
        raise FileNotFoundError(f"Configuration file not found at {CONFIG_PATH}")
    with open(CONFIG_PATH, "r") as f:
        cfg = yaml.safe_load(f)
        thresholds = cfg.get("planner", {}).get("activity_thresholds")
        if not thresholds:
            raise ValueError(f"Missing activity_thresholds in {CONFIG_PATH}")
        return thresholds


def _band_from_score(score: float) -> str:
    if score < 25:
        return "safe"
    elif score < 50:
        return "moderate"
    elif score < 70:
        return "high"
    elif score < 85:
        return "veryhigh"
    return "extreme"


def _generate_why(band: str, hour: int) -> str:
    if hour < 10:
        return "Early-morning window before peak solar irradiation and surface accumulation"
    elif hour >= 18:
        return "Post-sunset nocturnal cooling interval with diminished direct radiative stress"
    elif band in ("safe", "moderate"):
        return "Acceptable biometeorological conditions with manageable ambient thermal strain"
    else:
        return (
            "Sub-optimal window with elevated ambient thermal load — maintain continuous hydration"
        )


@router.get("/safe-windows")
def get_safe_windows(
    location_id: int = Query(1, description="Location ID"),
    activity: str = Query("walk", description="walk | commute | exercise | work"),
    duration_min: int = Query(45, ge=15, le=180, description="Duration in minutes"),
    db: Session = Depends(get_db),
):
    """
    Slides a duration_min window across 24h hourly forecast risk.
    Keeps windows where max(risk) < threshold(activity).
    Returns top 3 ranked by lowest mean risk, plus the worst block to avoid.
    """
    thresholds = _load_thresholds()
    activity_key = activity.lower().strip()
    if activity_key not in thresholds:
        activity_key = "walk"

    threshold = thresholds[activity_key].get("threshold", 60)

    try:
        fc = ForecastService.get_risk_forecast(db, location_id, days=2)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    items = fc.get("items", [])
    if not items:
        raise HTTPException(status_code=404, detail="No forecast data available for this location")

    # Focus on next 24 hourly periods
    horizon = items[:24]
    step_count = max(1, int(math.ceil(duration_min / 60.0)))

    candidate_windows = []
    all_evaluated_windows = []

    for i in range(len(horizon)):
        end_idx = i + step_count
        if end_idx > len(horizon):
            break
        window_slice = horizon[i:end_idx]

        def _get_item_risk(item: dict) -> float:
            if "predicted_risk_score" in item and item["predicted_risk_score"] is not None:
                return float(item["predicted_risk_score"])
            if "risk_score" in item and item["risk_score"] is not None:
                return float(item["risk_score"])
            raise KeyError(
                "Missing required risk score key ('predicted_risk_score') in forecast item"
            )

        # max risk across every hourly sample in the window
        peak_risk = max(_get_item_risk(w) for w in window_slice)
        mean_risk = sum(_get_item_risk(w) for w in window_slice) / len(window_slice)

        start_ts = window_slice[0].get("time") or window_slice[0].get("timestamp")
        if not start_ts:
            raise KeyError("Missing required time key ('time') in forecast item")
        # Compute nice formatted hour string or ISO
        start_hour = i
        start_str = f"{i:02d}:00"
        end_hour = (i + step_count) % 24
        end_str = f"{end_hour:02d}:00"

        if start_ts:
            try:
                clean_ts = start_ts.replace("Z", "+00:00")
                if " " in clean_ts and "T" not in clean_ts:
                    clean_ts = clean_ts.replace(" ", "T")
                dt = datetime.fromisoformat(clean_ts)
                dt_end = dt + timedelta(minutes=duration_min)
                start_str = dt.strftime("%H:%M")
                end_str = dt_end.strftime("%H:%M")
                start_hour = dt.hour
            except Exception:
                pass

        band = _band_from_score(peak_risk)
        why = _generate_why(band, start_hour)

        entry = {
            "start": start_str,
            "end": end_str,
            "start_iso": start_ts,
            "start_hour": start_hour,
            "peak_risk": round(peak_risk, 1),
            "mean_risk": round(mean_risk, 1),
            "band": band,
            "why": why,
        }

        all_evaluated_windows.append(entry)

        # STRICT acceptance: max(sample in window) MUST be strictly below threshold
        if peak_risk < threshold:
            candidate_windows.append(entry)

    # Sort by lowest mean risk
    candidate_windows.sort(key=lambda x: (x["mean_risk"], x["peak_risk"]))

    # Deduplicate closely overlapping windows for distinct options
    distinct_windows = []
    used_hours = set()
    for w in candidate_windows:
        h = w.get("start_hour", 0)
        if not any(abs(h - uh) < step_count for uh in used_hours):
            distinct_windows.append(w)
            used_hours.add(h)
        if len(distinct_windows) >= 3:
            break

    # If no distinct window found due to spacing, fallback to candidates
    if not distinct_windows and candidate_windows:
        distinct_windows = candidate_windows[:3]

    # Find worst block to avoid
    all_evaluated_windows.sort(key=lambda x: x["peak_risk"], reverse=True)
    worst = all_evaluated_windows[0] if all_evaluated_windows else None
    avoid = []
    if worst:
        avoid.append(
            {
                "start": worst["start"],
                "end": worst["end"],
                "peak_risk": worst["peak_risk"],
                "band": worst["band"],
                "why": "Peak solar radiation and acute multi-factorial thermal hazard",
            }
        )

    no_safe_window_message = None
    best = distinct_windows[0] if distinct_windows else None

    if not distinct_windows:
        # Zero-state: pick least-bad option
        all_evaluated_windows.sort(key=lambda x: (x["peak_risk"], x["mean_risk"]))
        least_bad = all_evaluated_windows[0] if all_evaluated_windows else None
        best = least_bad
        no_safe_window_message = (
            f"No safe window found today for {activity_key} (threshold {threshold}). "
            f"Here is the least-bad alternative option."
        )

    return {
        "location_id": location_id,
        "activity": activity_key,
        "threshold": threshold,
        "duration_min": duration_min,
        "windows": distinct_windows,
        "avoid": avoid,
        "best": best,
        "no_safe_window_message": no_safe_window_message,
    }
