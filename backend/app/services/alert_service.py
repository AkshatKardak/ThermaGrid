import logging
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.alert import Alert
from app.models.location import Location
from app.services.alerts.base import AlertChannel
from app.services.alerts.email_resend import EmailChannel
from app.services.alerts.whatsapp import WhatsAppChannel

logger = logging.getLogger(__name__)


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


class AlertService:
    """
    High-level Alert Service integrating DB persistence and channel dispatching.
    """

    @staticmethod
    def get_active_alerts(db: Session, city: Optional[str] = None) -> List[Alert]:
        query = db.query(Alert).filter(Alert.is_active == True) # noqa: E712
        if city:
            query = query.join(Location).filter(Location.city.ilike(f"%{city}%"))
        return query.order_by(Alert.issued_at.desc()).all()

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
        now = datetime.now(timezone.utc)
        alert = Alert(
            location_id=location_id,
            alert_level=alert_level,
            title=title,
            message=message,
            action_directives=action_directives,
            target_audience=target_audience,
            is_active=True,
            issued_at=now,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert
