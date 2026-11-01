import httpx
from app.core.config import get_settings


class WhatsAppChannel:
    """
    WhatsApp notification dispatcher using Meta WhatsApp Cloud API.
    """
    async def send(self, to: str, subject: str, body: str) -> bool:
        s = get_settings()
        if not (s.whatsapp_phone_id and s.whatsapp_token):
            return False
        url = f"https://graph.facebook.com/v20.0/{s.whatsapp_phone_id}/messages"
        clean_to = to.lstrip("+").strip()
        try:
            async with httpx.AsyncClient(timeout=10) as c:
                r = await c.post(
                    url,
                    headers={"Authorization": f"Bearer {s.whatsapp_token}"},
                    json={
                        "messaging_product": "whatsapp",
                        "to": clean_to,  # E.164 without '+'
                        "type": "text",
                        "text": {"body": f"{subject}\n\n{body}"},
                    },
                )
                return r.is_success
        except Exception:
            return False
