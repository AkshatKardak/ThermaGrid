"""
Thermal Risk endpoints: current score, multi-day forecast, night-time risk, indoor heat, ward drilldowns.
"""

import os
from datetime import datetime, timedelta
from typing import Any

import yaml
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.location import Location
from app.models.risk import WardRiskCurrent
from app.schemas.risk import RiskCurrentOut, RiskForecastOut
from app.services.forecast_service import ForecastService
from app.services.risk_service import RiskService
from app.services.thermal_service import ThermalService
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/risk", tags=["Thermal Risk"])

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
)
ARCHETYPES_PATH = os.path.join(
    PROJECT_ROOT,
    "analytics",
    "config",
    "building_archetypes.yaml",
)

NIGHT_GUIDANCE_TEMPLATES = {
    "safe": [
        "Normal overnight cooling expected",
        "Natural cross-ventilation is sufficient for restorative sleep",
        "No special night-time precautions needed",
    ],
    "moderate": [
        "Keep bedroom windows open for evening cross-ventilation",
        "Use ceiling fans to maintain air circulation",
        "Hydrate with a glass of water before sleeping",
    ],
    "high": [
        "Tropical night: minimum temperature stays above 25°C",
        "Sleep in the coolest room, preferably lowest floor",
        "Keep windows on opposite sides open to induce cross-breeze",
        "Wear lightweight cotton sleepwear and stay hydrated",
    ],
    "veryhigh": [
        "Sleep on the lowest floor",
        "Open windows on two sides for cross-ventilation",
        "Wet the floor before sleeping",
        "Check on elderly neighbours tonight",
    ],
    "extreme": [
        "Acute nocturnal heat emergency: zero thermal relief",
        "Sleep on the lowest floor away from concrete roof heat storage",
        "Dampen floor or mist sheets with cool water for evaporative cooling",
        "Conduct immediate welfare check on elderly family and neighbours",
    ],
}


def _load_archetypes() -> dict[str, Any]:
    if not os.path.exists(ARCHETYPES_PATH):
        raise FileNotFoundError(f"Archetypes configuration file not found at {ARCHETYPES_PATH}")
    with open(ARCHETYPES_PATH, "r") as f:
        archetypes = yaml.safe_load(f)
        if not archetypes:
            raise ValueError(f"Missing building archetypes in {ARCHETYPES_PATH}")
        return archetypes


@router.get("/current", response_model=RiskCurrentOut)
def get_current_risk(
    location_id: int = Query(1, description="Ward Location ID"),
    db: Session = Depends(get_db),
):
    """
    Computes current comprehensive ward-level human thermal risk score (0-100),
    factor breakdown, and deterministic explanation.
    """
    return RiskService.get_current_risk(db, location_id)


@router.get("/night")
def get_night_risk(
    location_id: int = Query(1, description="Ward Location ID"),
    db: Session = Depends(get_db),
):
    """
    Computes overnight thermal stress and tropical night flag (min >= 25.0°C)
    over 20:00 -> 06:00 forecast hours with templated guidance.
    """
    try:
        weather_fc = WeatherService.get_weather_forecast(db, location_id, days=2)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    hourly = weather_fc.get("hourly", [])
    if not hourly:
        return {
            "available": False,
            "message": "tonight's data not yet available",
            "night_min_c": None,
            "tropical_night": False,
            "band": "moderate",
            "guidance": ["Tonight's data not yet available — check back at next model cycle."],
            "hourly_overnight": [],
        }

    # Extract hours between 20:00 tonight and 06:00 tomorrow morning
    try:
        from src.thermal_indices.wbgt import calculate_wbgt
    except ImportError:
        from analytics.src.thermal_indices.wbgt import calculate_wbgt

    overnight_samples = []
    for it in hourly[:36]:
        ts = it.get("time") or it.get("timestamp")
        if not ts:
            raise KeyError("Forecast hourly record missing 'time' field")
        h = None
        try:
            if "T" in ts:
                h = int(ts.split("T")[1].split(":")[0])
            elif " " in ts:
                h = int(ts.split(" ")[1].split(":")[0])
        except Exception:
            continue

        if h is not None and (h >= 20 or h <= 6):
            time_label = f"{h:02d}:00"
            temp_val = it.get("temperature_c")
            if temp_val is None:
                raise KeyError("Forecast hourly record missing 'temperature_c' field")
            temp = float(temp_val)
            wbgt_val = it.get("wbgt_c")
            if wbgt_val is None:
                rh = it.get("rel_humidity_pct")
                ws = it.get("wind_speed_ms", 1.0)
                sol = it.get("solar_radiation_wm2", 0.0)
                if rh is not None:
                    wbgt_res = calculate_wbgt(
                        temp_c=temp,
                        rel_humidity_pct=float(rh),
                        wind_speed_ms=float(ws),
                        solar_radiation_wm2=float(sol),
                    )
                    wbgt_val = wbgt_res["wbgt"]
                else:
                    wbgt_val = None

            overnight_samples.append(
                {
                    "time": time_label,
                    "hour": h,
                    "temp_c": round(float(temp), 1),
                    "wbgt_c": round(float(wbgt_val), 1) if wbgt_val is not None else None,
                    "timestamp": ts,
                }
            )

    if len(overnight_samples) < 4:
        return {
            "available": False,
            "message": "tonight's data not yet available",
            "night_min_c": None,
            "tropical_night": False,
            "band": "moderate",
            "guidance": ["Tonight's data not yet available — check back at next model cycle."],
            "hourly_overnight": overnight_samples,
        }

    night_temps = [s["temp_c"] for s in overnight_samples]
    night_min_c = min(night_temps)
    tropical_night = bool(night_min_c >= 25.0)

    if night_min_c < 20.0:
        band = "safe"
    elif night_min_c < 25.0:
        band = "moderate"
    elif night_min_c < 28.0:
        band = "high"
    elif night_min_c < 31.0:
        band = "veryhigh"
    else:
        band = "extreme"

    guidance = NIGHT_GUIDANCE_TEMPLATES.get(band, NIGHT_GUIDANCE_TEMPLATES["veryhigh"])

    return {
        "available": True,
        "night_min_c": round(night_min_c, 1),
        "tropical_night": tropical_night,
        "band": band,
        "guidance": guidance,
        "hourly_overnight": overnight_samples[:11],  # 20:00 to 06:00 = 11 intervals
    }


@router.get("/indoor")
def get_indoor_risk(
    location_id: int = Query(1, description="Ward Location ID"),
    archetype: str = Query("tin_roof_top_floor", description="Building archetype"),
    db: Session = Depends(get_db),
):
    """
    Computes estimated indoor temperatures and thermal lag relative to outdoor conditions
    using documented building archetypes.
    """
    archetypes = _load_archetypes()
    arch_key = archetype.strip().lower()
    if arch_key not in archetypes:
        arch_key = "tin_roof_top_floor"

    arch_cfg = archetypes[arch_key]
    delta = float(arch_cfg.get("indoor_delta_c", 4.0))
    lag = float(arch_cfg.get("lag_hours", 2.0))
    basis = arch_cfg.get("basis", "assumption")

    try:
        current_wx = WeatherService.get_current_weather(db, location_id)
        current_th = ThermalService.get_current_thermal_indices(db, location_id, for_risk=True)
        fc = WeatherService.get_weather_forecast(db, location_id, days=1)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    outdoor_now_c = round(float(current_wx.get("temperature_c", 32.0)), 1)
    indoor_now_c = round(outdoor_now_c + delta, 1)

    # Calculate outdoor diurnal peak from today's forecast
    hourly = fc.get("hourly", [])
    if hourly:
        peak_sample = max(hourly, key=lambda x: x.get("temperature_c", 0.0))
        outdoor_peak_c = float(peak_sample.get("temperature_c", outdoor_now_c))
        peak_ts = peak_sample.get("timestamp", "")
        try:
            peak_dt = datetime.fromisoformat(peak_ts.replace("Z", "+00:00"))
        except Exception:
            peak_dt = datetime.now()
    else:
        outdoor_peak_c = outdoor_now_c + 2.5
        peak_dt = datetime.now()

    indoor_peak_c = round(outdoor_peak_c + delta, 1)
    indoor_peak_dt = peak_dt + timedelta(hours=lag)
    indoor_peak_time = indoor_peak_dt.strftime("%H:%M")

    current_wbgt = float(current_th.get("wbgt_c", 27.0))
    wbgt_indoor = round(current_wbgt + (delta * 0.65), 1)

    if indoor_now_c < 28.0:
        band = "safe"
    elif indoor_now_c < 33.0:
        band = "moderate"
    elif indoor_now_c < 38.0:
        band = "high"
    elif indoor_now_c < 42.0:
        band = "veryhigh"
    else:
        band = "extreme"

    return {
        "location_id": location_id,
        "archetype": arch_key,
        "outdoor_now_c": outdoor_now_c,
        "indoor_now_c": indoor_now_c,
        "indoor_peak_c": indoor_peak_c,
        "indoor_peak_time": indoor_peak_time,
        "wbgt_indoor": wbgt_indoor,
        "band": band,
        "method": "archetype_delta",
        "basis": basis,
        "lag_hours": lag,
        "note": f"Building envelope causes indoor peak to lag {lag}h behind outdoor diurnal solar maximum.",
    }


@router.get("/forecast", response_model=RiskForecastOut)
def get_risk_forecast(
    location_id: int = Query(1, description="Ward Location ID"),
    days: int = Query(5, ge=1, le=7),
    db: Session = Depends(get_db),
):
    """
    Produces 3-5 day risk forecast with lower and upper confidence bounds.
    """
    return ForecastService.get_risk_forecast(db, location_id, days=days)


@router.get("/all", response_model=list[RiskCurrentOut])
def get_all_wards_risk(
    city: str | None = Query(None, description="Filter by city, e.g. Mumbai"),
    state: str | None = Query(None, description="Filter by state, e.g. Maharashtra"),
    level: str | None = Query(
        None, description="Filter by hierarchy level ('ward' | 'district' | 'state')"
    ),
    db: Session = Depends(get_db),
):
    """
    Returns current risk score ranking across all locations for authority prioritization.
    Reads from the precomputed ward_risk_current snapshot table for optimal performance.
    Never mixes hierarchy tiers in a single aggregate.
    """
    query = db.query(WardRiskCurrent)
    if state:
        query = query.join(Location, WardRiskCurrent.location_id == Location.id).filter(
            Location.state.ilike(f"%{state}%")
        )
    if level:
        query = query.filter(WardRiskCurrent.level == level)
    elif city:
        query = query.filter(WardRiskCurrent.city.ilike(city))
        first_row = query.first()
        if first_row:
            query = query.filter(WardRiskCurrent.level == first_row.level)
    elif not state:
        query = query.filter(WardRiskCurrent.level == "ward")

    rows = query.order_by(WardRiskCurrent.risk_score.desc()).all()
    if rows:
        results = []
        for r in rows:
            results.append(
                {
                    "location_id": r.location_id,
                    "city": r.city,
                    "ward_name": r.ward_name,
                    "ward_code": r.ward_code,
                    "level": r.level,
                    "parent_code": r.parent_code,
                    "calculated_for": r.calculated_for,
                    "risk_score": r.risk_score,
                    "band": r.band,
                    "band_label": r.band_label,
                    "alert_color": r.alert_color,
                    "hazard_score": r.hazard_score,
                    "exposure_index": r.exposure_index,
                    "vulnerability_index": r.vulnerability_index,
                    "factor_breakdown": r.factor_breakdown_json,
                    "explanation": r.explanation,
                    "temperature_c": r.temperature_c,
                    "wbgt_c": r.wbgt_c,
                    "utci_c": r.utci_c,
                    "confidence": r.confidence,
                    "sub_scores": r.sub_scores_json,
                    "diagnostics": r.diagnostics_json,
                    "is_demo": r.is_demo,
                    "demo_label": r.demo_label,
                    "latitude": r.latitude,
                    "longitude": r.longitude,
                    "population": r.population,
                    "imd_grade": getattr(r, "imd_grade", "NORMAL") or "NORMAL",
                    "imd_label": getattr(r, "imd_label", "No Warning (Normal)")
                    or "No Warning (Normal)",
                    "consecutive_hot_days": getattr(r, "consecutive_hot_days", 0) or 0,
                    "consecutive_hot_nights": getattr(r, "consecutive_hot_nights", 0) or 0,
                    "hours_to_threshold": getattr(r, "hours_to_threshold", None),
                }
            )
        return results

    return RiskService.get_all_wards_risk(db, city=city, level=level)


@router.get("/{location_id}", response_model=RiskCurrentOut)
def get_risk_by_location(location_id: int, db: Session = Depends(get_db)):
    """Retrieves risk evaluation for a specific ward ID."""
    return RiskService.get_current_risk(db, location_id)
