"""
Worker Safety & Shift Card API route.
Computes ISO 7243 work-rest intervals, hydration targets, and printable shift cards.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.location import Location
from app.services.forecast_service import ForecastService

router = APIRouter(prefix="/worker", tags=["Worker Safety"])


@router.get("/shift-card")
@router.get("/shift-plan")
def get_worker_shift_card(
    location_id: int = Query(1, description="Ward Location ID"),
    met: float = Query(6.0, ge=1.0, le=12.0, description="Metabolic work rate in MET"),
    exposure: str = Query("sun", description="sun | shade"),
    clothing: str = Query("normal", description="light | normal | heavy"),
    acclimatised: bool = Query(True, description="Whether worker is acclimatised to heat"),
    start: str = Query("09:00", description="Shift start time HH:MM"),
    end: str = Query("18:00", description="Shift end time HH:MM"),
    db: Session = Depends(get_db),
):
    """
    Produces a printable worker shift card containing scheduled rest intervals,
    hourly hydration targets, and recommended heavy work windows based on ISO 7243 standards.
    """
    location = db.query(Location).filter(Location.id == location_id).first()
    ward_name = location.ward_name if location else f"Ward #{location_id}"

    try:
        fc = ForecastService.get_risk_forecast(db, location_id, days=1)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    items = fc.get("items", [])
    if not items:
        raise HTTPException(status_code=404, detail="No hourly forecast telemetry found")

    # Parse start and end hours
    try:
        start_h = int(start.split(":")[0])
        end_h = int(end.split(":")[0])
    except Exception:
        start_h, end_h = 9, 18

    shift_items = []
    for it in items[:24]:
        ts = it.get("time") or it.get("timestamp")
        if not ts:
            continue
        h = None
        try:
            if "T" in ts:
                h = int(ts.split("T")[1].split(":")[0])
            elif " " in ts:
                h = int(ts.split(" ")[1].split(":")[0])
        except Exception:
            continue

        if h is not None and start_h <= h <= end_h:
            wbgt = it.get("predicted_wbgt")
            if wbgt is None:
                wbgt = it.get("wbgt_c")
            if wbgt is None:
                temp_val = it.get("temperature_c")
                rh_val = it.get("rel_humidity_pct", 50.0)
                if temp_val is not None:
                    try:
                        from src.thermal_indices.wbgt import calculate_wbgt
                    except ImportError:
                        from analytics.src.thermal_indices.wbgt import calculate_wbgt
                    wbgt = calculate_wbgt(
                        temp_c=float(temp_val),
                        rel_humidity_pct=float(rh_val),
                        wind_speed_ms=1.0,
                        solar_radiation_wm2=0.0,
                    )["wbgt"]
                else:
                    raise KeyError("Forecast item missing WBGT and temperature")
            wbgt = float(wbgt)
            
            # ISO 7243 Clothing Adjustment Value (CAV)
            clothing_clean = (clothing or "normal").lower().strip()
            if clothing_clean == "heavy":
                cav = 3.0
                clothing_water = 200
            elif clothing_clean == "light":
                cav = 0.0
                clothing_water = -50
            else:
                clothing_clean = "normal"
                cav = 1.0
                clothing_water = 0

            # Physiological acclimatisation status
            acclim_wbgt_penalty = 0.0 if acclimatised else 2.0
            acclim_water = 0 if acclimatised else 150
            acclim_break_extra = 0 if acclimatised else 15

            # Direct sun adds ~1.5°C effective thermal load if exposed
            eff_wbgt = wbgt + (1.5 if exposure.lower() == "sun" else 0.0) + cav + acclim_wbgt_penalty

            temp_val = it.get("temperature_c")
            if temp_val is None:
                raise KeyError("Forecast item missing 'temperature_c'")

            risk_val = it.get("predicted_risk_score")
            if risk_val is None:
                risk_val = it.get("risk_score")
            if risk_val is None:
                raise KeyError("Forecast item missing risk score")

            shift_items.append({
                "hour": h,
                "time": f"{h:02d}:00",
                "wbgt_c": round(eff_wbgt, 1),
                "temperature_c": round(float(temp_val), 1),
                "risk_score": round(float(risk_val), 1),
            })

    if not shift_items:
        raise HTTPException(
            status_code=404,
            detail="No hourly forecast telemetry found for the requested shift hours",
        )

    max_shift_wbgt = max(s["wbgt_c"] for s in shift_items)

    # Calculate hydration target (ml per hour) scaled with WBGT, metabolic exertion (MET), and solar exposure
    if max_shift_wbgt >= 32.0:
        base_water = 750
    elif max_shift_wbgt >= 29.0:
        base_water = 550
    elif max_shift_wbgt >= 26.0:
        base_water = 450
    else:
        base_water = 350

    met_bonus = int(max(0.0, met - 2.0) * 40)
    sun_bonus = 150 if exposure.lower() == "sun" else 0
    water_ml_per_hour = min(1800, base_water + met_bonus + sun_bonus + clothing_water + acclim_water)

    # Determine recommended heavy work window
    heavy_work_after = "17:00"
    for s in reversed(shift_items):
        if s["wbgt_c"] < 28.0:
            heavy_work_after = s["time"]
            break

    # Build ISO 7243 rest schedule intervals adjusted for metabolic rate, clothing, and acclimatisation
    breaks: List[Dict[str, str]] = []
    # Morning break
    m_hour = min(start_h + 2, 11)
    m_dur = (30 if (met >= 7.0 or max_shift_wbgt >= 30.0) else 20) + acclim_break_extra
    breaks.append({
        "start": f"{m_hour:02d}:00",
        "end": f"{m_hour:02d}:{m_dur:02d}",
        "duration": f"{m_dur} min",
        "reason": "Mid-morning hydration & physiological recovery" + (" (extended: unacclimatised/heavy exertion)" if (met >= 7.0 or not acclimatised) else ""),
    })

    # Peak afternoon break
    p_dur = (90 if (met >= 7.0 or exposure.lower() == "sun" or max_shift_wbgt >= 32.0) else 75) + acclim_break_extra
    p_end_min = (15 + (p_dur - 75)) % 60
    p_end_hr = 14 + ((15 + (p_dur - 75)) // 60)
    breaks.append({
        "start": "13:00",
        "end": f"{p_end_hr:02d}:{p_end_min:02d}",
        "duration": f"{p_dur} min",
        "reason": "Peak diurnal solar irradiance suspension" + (" (extended for sun exposure / PPE / unacclimatised)" if (met >= 7.0 or exposure.lower() == "sun" or not acclimatised) else ""),
    })

    # Late afternoon break
    if end_h >= 16:
        a_dur = (30 if (met >= 7.0 or max_shift_wbgt >= 30.0) else 20) + acclim_break_extra
        breaks.append({
            "start": "15:45",
            "end": f"16:{5 + (a_dur - 20):02d}",
            "duration": f"{a_dur} min",
            "reason": "Afternoon electrolytic replenishment",
        })

    return {
        "location_id": location_id,
        "ward_name": ward_name,
        "start": start,
        "end": end,
        "met": met,
        "exposure": exposure,
        "clothing": clothing_clean,
        "acclimatised": acclimatised,
        "water_ml_per_hour": water_ml_per_hour,
        "heavy_work_after": heavy_work_after,
        "recommended_heavy_work_window": f"Before 10:00 or after {heavy_work_after}",
        "max_wbgt_c": max_shift_wbgt,
        "breaks": breaks,
        "wbgt_series": shift_items,
        "disclaimer": "Advisory only — not medical advice. Comply with local occupational health standards.",
    }
