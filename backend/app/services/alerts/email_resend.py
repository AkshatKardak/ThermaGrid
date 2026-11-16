import httpx

from app.core.config import get_settings


class EmailChannel:
    """
    Email notification dispatcher using Resend API.
    """

    async def send(self, to: str, subject: str, body: str) -> bool:
        s = get_settings()
        if not s.resend_api_key:
            return False
        try:
            async with httpx.AsyncClient(timeout=10) as c:
                r = await c.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {s.resend_api_key}"},
                    json={
                        "from": s.alert_from_email,
                        "to": [to],
                        "subject": subject,
                        "html": body,
                    },
                )
                return r.is_success
        except Exception:
            return False
