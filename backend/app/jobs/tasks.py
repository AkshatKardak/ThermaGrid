"""
Background scheduled tasks for ThermaGrid:
- Ingest hourly meteorological telemetry
- Recompute thermal indices (WBGT, UTCI, Heat Index) & composite risk
- Evaluate Heat Action Plan emergency alert triggers and persist alerts
"""

import logging
from datetime import UTC, datetime

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.alert import Alert
from app.models.location import Location
from app.models.risk import RiskScore, WardRiskCurrent
from app.models.thermal import ThermalIndex
from app.models.weather import WeatherObservation
from app.services.alert_service import dispatch_ward_alerts, maybe_alert
from app.services.risk_service import RiskService
from app.services.thermal_service import ThermalService
from app.services.weather_service import WeatherService

log = logging.getLogger(__name__)


async def ingest_weather() -> None:
    """
    Scheduled Task: Pulls current meteorological telemetry
    for locations and persists into weather observations.
    """
    log.info("[JOB:ingest_weather] Starting hourly meteorological telemetry ingest...")
    try:
        with SessionLocal() as db:
            locations = db.query(Location).all()
            for loc in locations:
                try:
                    obs = WeatherService.get_current_weather(db, loc.id, for_risk=False)
                    rec_at = obs.get("recorded_at", datetime.now(UTC))
                    if rec_at.tzinfo is None:
                        rec_at = rec_at.replace(tzinfo=UTC)
                    w_row = WeatherObservation(
                        location_id=loc.id,
                        recorded_at=rec_at,
                        temperature_c=obs["temperature_c"],
                        rel_humidity_pct=obs["rel_humidity_pct"],
                        wind_speed_ms=obs["wind_speed_ms"],
                        solar_radiation_wm2=obs["solar_radiation_wm2"],
                        apparent_temperature_c=obs.get("apparent_temperature_c"),
                        source_name=obs.get("source_name", "Open-Meteo Ingest"),
                        is_demo=obs.get("is_demo", False),
                    )
                    db.add(w_row)
                    db.commit()
                except Exception as ex:
                    log.warning(f"[JOB:ingest_weather] Ingest warning for {loc.ward_name}: {ex}")
        log.info("[JOB:ingest_weather] Ingest cycle successfully completed.")
    except Exception as e:
        log.error(f"[JOB:ingest_weather] Ingest cycle error: {e}")


async def compute_thermal() -> None:
    """
    Scheduled Task: Recomputes WBGT (ISO 7243) and UTCI for all wards
    and refreshes composite human thermal stress risk rankings, persisting
    ThermalIndex and RiskScore rows.
    """
    log.info("[JOB:compute_thermal] Starting hourly thermal index recomputation...")
    try:
        with SessionLocal() as db:
            locations = db.query(Location).all()
            for loc in locations:
                try:
                    th = ThermalService.get_current_thermal_indices(db, loc.id, for_risk=False)
                    t_row = ThermalIndex(
                        location_id=loc.id,
                        calculated_for=datetime.now(UTC),
                        wbgt_c=th["wbgt_c"],
                        wet_bulb_c=th.get("wet_bulb_c"),
                        globe_temp_c=th.get("globe_temp_c"),
                        utci_c=th["utci_c"],
                        heat_index_c=th["heat_index_c"],
                        wbgt_category=th["wbgt_category"],
                        utci_category=th["utci_category"],
                        heat_index_category=th["heat_index_category"],
                        is_demo=th.get("is_demo", False),
                    )
                    db.add(t_row)

                    r = RiskService.get_current_risk(db, loc.id)
                    risk_row = RiskScore(
                        location_id=loc.id,
                        calculated_for=datetime.now(UTC),
                        score=r["risk_score"],
                        band=r["band"],
                        band_label=r["band_label"],
                        alert_color=r["alert_color"],
                        hazard_score=r["hazard_score"],
                        exposure_index=r["exposure_index"],
                        vulnerability_index=r["vulnerability_index"],
                        factor_breakdown_json=r["factor_breakdown"],
                        explanation=r["explanation"],
                        confidence=r.get("confidence", 0.92),
                        is_demo=r.get("is_demo", False),
                    )
                    db.add(risk_row)

                    # Maintain precomputed ward_risk_current snapshot for dashboard
                    w_curr = (
                        db.query(WardRiskCurrent)
                        .filter(WardRiskCurrent.location_id == loc.id)
                        .first()
                    )
                    if not w_curr:
                        w_curr = WardRiskCurrent(location_id=loc.id)
                        db.add(w_curr)
                    w_curr.city = loc.city
                    w_curr.ward_code = loc.ward_code
                    w_curr.ward_name = loc.ward_name
                    w_curr.level = loc.level or "ward"
                    w_curr.parent_code = loc.parent_code
                    w_curr.latitude = loc.latitude
                    w_curr.longitude = loc.longitude
                    w_curr.population = loc.population
                    w_curr.risk_score = r["risk_score"]
                    w_curr.band = r["band"]
                    w_curr.band_label = r["band_label"]
                    w_curr.alert_color = r["alert_color"]
                    w_curr.hazard_score = r["hazard_score"]
                    w_curr.exposure_index = r["exposure_index"]
                    w_curr.vulnerability_index = r["vulnerability_index"]
                    w_curr.temperature_c = r["temperature_c"]
                    w_curr.wbgt_c = r["wbgt_c"]
                    w_curr.utci_c = r["utci_c"]
                    w_curr.confidence = r.get("confidence", 0.92)
                    w_curr.factor_breakdown_json = r["factor_breakdown"]
                    w_curr.sub_scores_json = r.get("sub_scores")
                    w_curr.diagnostics_json = r.get("diagnostics")
                    w_curr.explanation = r["explanation"]
                    w_curr.is_demo = r.get("is_demo", False)
                    w_curr.demo_label = r.get("demo_label")
                    w_curr.imd_grade = r.get("imd_grade", "NORMAL")
                    w_curr.imd_label = r.get("imd_label", "No Warning (Normal)")
                    w_curr.consecutive_hot_days = r.get("consecutive_hot_days", 0)
                    w_curr.consecutive_hot_nights = r.get("consecutive_hot_nights", 0)
                    w_curr.hours_to_threshold = r.get("hours_to_threshold")
                    w_curr.calculated_for = r.get("calculated_for", datetime.now(UTC))
                    w_curr.updated_at = datetime.now(UTC)

                    db.commit()
                except Exception as ex:
                    log.warning(
                        f"[JOB:compute_thermal] Calculation warning for {loc.ward_name}: {ex}"
                    )
        log.info("[JOB:compute_thermal] Thermal indices recomputed and synchronized.")
    except Exception as e:
        log.error(f"[JOB:compute_thermal] Thermal calculation error: {e}")


async def evaluate_alerts() -> None:
    """
    Scheduled Task: Identifies wards where risk exceeds ALERT_THRESHOLD
    and dispatches emergency warnings via Resend / WhatsApp, persisting Alert records.
    """
    s = get_settings()
    log.info(
        f"[JOB:evaluate_alerts] Evaluating emergency triggers (Threshold >= {s.alert_threshold})..."
    )
    try:
        with SessionLocal() as db:
            high_risk_entries = (
                db.query(RiskScore)
                .join(Location, RiskScore.location_id == Location.id)
                .filter(RiskScore.score >= s.alert_threshold)
                .all()
            )
            for item in high_risk_entries:
                loc = db.query(Location).filter(Location.id == item.location_id).first()
                ward_name = loc.ward_name if loc else f"Location {item.location_id}"
                log.warning(f"[JOB:evaluate_alerts] ALERT TRIGGER: {ward_name} score={item.score}")

                alert_row = Alert(
                    location_id=item.location_id,
                    alert_level="Extreme"
                    if item.score >= 85
                    else ("Red" if item.score >= 70 else "Orange"),
                    title=f"Heat Emergency Trigger: {ward_name}",
                    message=f"Thermal risk score reached {int(item.score)}/100.",
                    action_directives="Suspend outdoor labor, activate misting hydration points, open municipal cooling shelters.",
                    target_audience="all",
                    channels="web,sms,whatsapp",
                    is_active=True,
                    dispatched_at=datetime.now(UTC),
                )
                db.add(alert_row)
                db.commit()

                await maybe_alert(
                    to="disaster-cell@mcgm.gov.in",
                    risk=item.score,
                    ward=ward_name,
                    peak="13:00 - 15:30 IST",
                )

                if loc:
                    await dispatch_ward_alerts(db, loc, item)
    except Exception as e:
        log.error(f"[JOB:evaluate_alerts] Alert evaluation error: {e}")
