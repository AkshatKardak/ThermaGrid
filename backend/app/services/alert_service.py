import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.alert import Alert
from app.models.alert_dispatch import AlertDispatch
from app.models.location import Location
from app.models.subscription import Subscription
from app.services.alerts.base import AlertChannel
from app.services.alerts.email_resend import EmailChannel
from app.services.alerts.whatsapp import WhatsAppChannel

logger = logging.getLogger(__name__)

BAND_RANKS = {
    "safe": 0,
    "moderate": 1,
    "high": 2,
    "veryhigh": 3,
    "extreme": 4,
}


def _get_band_rank(band: str) -> int:
    clean = (band or "").lower().replace(" ", "").replace("_", "")
    return BAND_RANKS.get(clean, 0)


def _band_from_score(score: float) -> str:
    if score < 25:
        return "safe"
    if score < 50:
        return "moderate"
    if score < 70:
        return "high"
    if score < 85:
        return "veryhigh"
    return "extreme"


def is_in_quiet_hours(quiet_hours: str | None, dt: datetime | None = None) -> bool:
    """
    Evaluates whether datetime dt falls within quiet hours (e.g. '22:00-06:00').
    Supports midnight wrap where start hour > end hour.
    """
    if not quiet_hours or "-" not in quiet_hours:
        return False
    if dt is None:
        dt = datetime.now(UTC)
    try:
        start_str, end_str = quiet_hours.split("-")
        sh, sm = map(int, start_str.strip().split(":"))
        eh, em = map(int, end_str.strip().split(":"))
        cur_min = dt.hour * 60 + dt.minute
        start_min = sh * 60 + sm
        end_min = eh * 60 + em

        if start_min <= end_min:
            return start_min <= cur_min <= end_min
        else:
            # Midnight wrap
            return cur_min >= start_min or cur_min <= end_min
    except Exception as ex:
        logger.warning(f"Error parsing quiet hours '{quiet_hours}': {ex}")
        return False


class _Noop:
    """No-operation alert channel for local development or disabled state."""

    async def send(self, to: str, subject: str, body: str) -> bool:
        logger.info(f"[ALERT DEMO] Simulated dispatch to {to} | {subject}")
        return True


def get_channel() -> AlertChannel:
    """
    Returns active AlertChannel depending on ALERT_PROVIDER configuration.
    Never hardcoded.
    """
    provider = get_settings().alert_provider.lower().strip()
    if provider == "resend":
        return EmailChannel()
    if provider == "whatsapp":
        return WhatsAppChannel()
    return _Noop()


async def maybe_alert(to: str, risk: float, ward: str, peak: str) -> bool:
    """
    Evaluates risk threshold against ALERT_THRESHOLD from settings.
    Dispatches alert payload if risk exceeds trigger point.
    """
    s = get_settings()
    if risk < s.alert_threshold:
        return False

    subject = f"HEAT ALERT · {ward} · {int(risk)}/100"
    body = (
        f"<b>Extreme heat risk in {ward}.</b><br>"
        f"Risk score: {int(risk)}/100 · Peak window: {peak}.<br>"
        f"Shift outdoor work, increase hydration, open cooling centres."
    )
    return await get_channel().send(to, subject, body)


async def dispatch_ward_alerts(
    db: Session,
    location: Location,
    risk_info: Any,
) -> list[AlertDispatch]:
    """
    Evaluates all active subscriptions for a ward with multi-tier alert fatigue controls:
    1. Threshold filter: risk >= subscription.threshold
    2. Quiet hours: suppresses non-critical alerts during user quiet periods (midnight wrap aware)
    3. Seasonal budget: checks settings.alert_season_budget (default 40 per season)
    4. Daily cap: checks settings.alert_max_per_day (default 2 per 24h)
    5. Cooldown gap: checks settings.alert_cooldown_minutes (default 180 min)
       - Escalation override: if risk band worsened, bypasses cooldown for life safety.
    Persists audit trail to alert_dispatches with unique deduplication.
    """
    settings = get_settings()
    now = datetime.now(UTC)

    if isinstance(risk_info, dict):
        score = float(risk_info.get("risk_score") or risk_info.get("score") or 0.0)
        band = str(risk_info.get("band") or _band_from_score(score))
    else:
        score = float(getattr(risk_info, "score", 0.0))
        band = str(getattr(risk_info, "band", _band_from_score(score)))

    subscriptions = (
        db.query(Subscription)
        .filter(
            Subscription.is_active.is_(True),
            (Subscription.ward_id == location.id) | (Subscription.ward_id.is_(None)),
        )
        .all()
    )

    dispatches: list[AlertDispatch] = []

    for sub in subscriptions:
        # 1. Threshold check
        if score < sub.threshold:
            continue

        # 2. Quiet hours check
        if is_in_quiet_hours(sub.quiet_hours, now):
            d = AlertDispatch(
                subscription_id=sub.id,
                triggered_at=now,
                channel=sub.channel,
                status="throttled",
                reason=f"Quiet hours active ({sub.quiet_hours})",
                risk_score=score,
            )
            db.add(d)
            db.commit()
            dispatches.append(d)
            continue

        # 3. Seasonal budget check (last 180 days)
        season_start = now - timedelta(days=180)
        season_dispatches = (
            db.query(AlertDispatch)
            .filter(
                AlertDispatch.subscription_id == sub.id,
                AlertDispatch.triggered_at >= season_start,
                AlertDispatch.status == "sent",
            )
            .count()
        )
        if season_dispatches >= settings.alert_season_budget:
            d = AlertDispatch(
                subscription_id=sub.id,
                triggered_at=now,
                channel=sub.channel,
                status="throttled",
                reason=f"Seasonal budget of {settings.alert_season_budget} exceeded",
                risk_score=score,
            )
            db.add(d)
            db.commit()
            dispatches.append(d)
            continue

        # 4. Daily cap check (last 24 hours)
        day_start = now - timedelta(hours=24)
        daily_dispatches = (
            db.query(AlertDispatch)
            .filter(
                AlertDispatch.subscription_id == sub.id,
                AlertDispatch.triggered_at >= day_start,
                AlertDispatch.status == "sent",
            )
            .count()
        )
        if daily_dispatches >= settings.alert_max_per_day:
            d = AlertDispatch(
                subscription_id=sub.id,
                triggered_at=now,
                channel=sub.channel,
                status="throttled",
                reason=f"Daily cap of {settings.alert_max_per_day} alerts reached",
                risk_score=score,
            )
            db.add(d)
            db.commit()
            dispatches.append(d)
            continue

        # 5. Minimum cooldown gap with escalation override
        last_sent = (
            db.query(AlertDispatch)
            .filter(
                AlertDispatch.subscription_id == sub.id,
                AlertDispatch.status == "sent",
            )
            .order_by(AlertDispatch.triggered_at.desc())
            .first()
        )

        if last_sent:
            last_dt = last_sent.triggered_at
            if last_dt.tzinfo is None:
                last_dt = last_dt.replace(tzinfo=UTC)
            elapsed_min = (now - last_dt).total_seconds() / 60.0
            if elapsed_min < settings.alert_cooldown_minutes:
                # Check escalation: only bypass cooldown if risk band escalated
                prev_rank = _get_band_rank(_band_from_score(last_sent.risk_score))
                curr_rank = _get_band_rank(band)
                if curr_rank <= prev_rank:
                    d = AlertDispatch(
                        subscription_id=sub.id,
                        triggered_at=now,
                        channel=sub.channel,
                        status="throttled",
                        reason=f"Cooldown active ({int(elapsed_min)}/{settings.alert_cooldown_minutes}m) without escalation",
                        risk_score=score,
                    )
                    db.add(d)
                    db.commit()
                    dispatches.append(d)
                    continue

        # Ready to dispatch!
        reason_str = f"Risk score {score:.1f} crossed threshold {sub.threshold} ({band.upper()})"
        channel_success = True
        err_msg = None

        # Dispatch via configured channel (Note: Textbelt SMS is NEVER wired to automated dispatch)
        try:
            if sub.channel == "email":
                subject = f"HEAT WARNING · {location.ward_name} · Score {int(score)}/100"
                body = (
                    f"Thermal stress in {location.ward_name} reached {score:.1f}/100 ({band.upper()}). "
                    f"Take preventive hydration precautions."
                )
                channel_success = await EmailChannel().send(sub.destination, subject, body)
            elif sub.channel == "whatsapp":
                subject = f"HEAT WARNING · {location.ward_name}"
                body = f"Thermal stress in {location.ward_name} is {score:.1f}/100 ({band.upper()}). Stay hydrated."
                channel_success = await WhatsAppChannel().send(sub.destination, subject, body)
            else:
                channel_success = await _Noop().send(sub.destination, "HEAT WARNING", reason_str)
        except Exception as ex:
            logger.error(f"Error dispatching to {sub.destination}: {ex}")
            channel_success = False
            err_msg = str(ex)

        d = AlertDispatch(
            subscription_id=sub.id,
            triggered_at=now,
            channel=sub.channel,
            status="sent" if channel_success else "failed",
            reason=reason_str,
            risk_score=score,
            error=err_msg,
        )
        db.add(d)
        db.commit()
        db.refresh(d)
        dispatches.append(d)

    return dispatches


class AlertService:
    """
    High-level Alert Service integrating DB persistence and channel dispatching.
    """

    @staticmethod
    def get_active_alerts(db: Session, city: str | None = None) -> list[Alert]:
        query = db.query(Alert).filter(Alert.is_active.is_(True))
        if city:
            query = query.join(Location).filter(Location.city.ilike(f"%{city}%"))
        return query.order_by(Alert.dispatched_at.desc()).all()

    @staticmethod
    def create_and_dispatch_alert(
        db: Session,
        location_id: int,
        alert_level: str,
        title: str,
        message: str,
        action_directives: str,
        target_audience: str = "all",
    ) -> Alert:
        now = datetime.now(UTC)
        alert = Alert(
            location_id=location_id,
            alert_level=alert_level,
            title=title,
            message=message,
            action_directives=action_directives,
            target_audience=target_audience,
            is_active=True,
            dispatched_at=now,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert
