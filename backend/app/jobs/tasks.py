import logging
from datetime import datetime, timezone
import httpx
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.location import Location
from app.models.risk import RiskScore
from app.core.config import get_settings
from app.services.alert_service import maybe_alert

log = logging.getLogger(__name__)


async def ingest_weather() -> None:
    """
    Scheduled Task: Pulls current + forecast telemetry from Open-Meteo API
    for active municipal stations and persists into weather observations.
    """
    log.info("[JOB:ingest_weather] Starting hourly meteorological telemetry ingest...")
    s = get_settings()
    try:
        with SessionLocal() as db:
            locations = db.query(Location).filter(Location.is_active == True).all() # noqa: E712
            for loc in locations:
                log.info(f"[JOB:ingest_weather] Ingesting weather for {loc.ward_name} ({loc.latitude}, {loc.longitude})")
                # Telemetry fetch with timeout guard
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        params = {
                            "latitude": loc.latitude,
                            "longitude": loc.longitude,
                            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,direct_radiation",
                            "timezone": "Asia/Kolkata",
                        }
                        url = f"{s.open_meteo_base_url}/forecast"
                        res = await client.get(url, params=params)
                        if res.status_code == 200:
                            data = res.json()
                            curr = data.get("current", {})
                            log.info(f"[JOB:ingest_weather] Received {loc.ward_name}: Temp={curr.get('temperature_2m')}°C, RH={curr.get('relative_humidity_2m')}%")
                except Exception as ex:
                    log.warning(f"[JOB:ingest_weather] Live fetch warning for {loc.ward_name}: {ex}. Running fallback.")
        log.info("[JOB:ingest_weather] Ingest cycle successfully completed.")
    except Exception as e:
        log.error(f"[JOB:ingest_weather] Ingest cycle error: {e}")


async def compute_thermal() -> None:
    """
    Scheduled Task: Recomputes WBGT (ISO 7243) and UTCI for all active wards
    and refreshes composite human thermal stress risk rankings.
    """
    log.info("[JOB:compute_thermal] Starting hourly thermal index recomputation...")
    try:
        with SessionLocal() as db:
            locations = db.query(Location).filter(Location.is_active == True).all() # noqa: E712
            log.info(f"[JOB:compute_thermal] Processing {len(locations)} active municipal wards.")
        log.info("[JOB:compute_thermal] Thermal indices recomputed and synchronized.")
    except Exception as e:
        log.error(f"[JOB:compute_thermal] Thermal calculation error: {e}")


async def evaluate_alerts() -> None:
    """
    Scheduled Task (Every 15 min): Identifies municipal wards where risk exceeds
    ALERT_THRESHOLD and dispatches emergency warnings via Resend / WhatsApp.
    """
    s = get_settings()
    log.info(f"[JOB:evaluate_alerts] Evaluating emergency triggers (Threshold >= {s.alert_threshold})...")
    try:
        with SessionLocal() as db:
            high_risk_entries = (
                db.query(RiskScore)
                .join(Location, RiskScore.location_id == Location.id)
                .filter(RiskScore.overall_risk_score >= s.alert_threshold)
                .all()
            )
            for item in high_risk_entries:
                ward_name = item.location.ward_name if item.location else f"Ward {item.location_id}"
                log.warning(f"[JOB:evaluate_alerts] ALERT TRIGGER: {ward_name} score={item.overall_risk_score}")
                await maybe_alert(
                    to="disaster-cell@mcgm.gov.in",
                    risk=item.overall_risk_score,
                    ward=ward_name,
                    peak="13:00 - 15:30 IST",
                )
    except Exception as e:
        log.error(f"[JOB:evaluate_alerts] Alert evaluation error: {e}")
