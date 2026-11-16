"""
Textbelt SMS Alert Channel.
Exposed ONLY for testing / verification via manual trigger.
Never wired to automated scheduler dispatch.
Target phone number lives strictly in .env (DEMO_ALERT_PHONE).
"""

import logging
import time
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Global rate limiter: at most 1 SMS dispatch per minute
_LAST_SMS_TIMESTAMP: float = 0.0
_SMS_MIN_INTERVAL_SECONDS: float = 60.0


class SmsRateLimitExceeded(Exception):
    """Raised when SMS dispatch is called faster than 1/minute."""


class SmsChannel:
    """
    Direct SMS dispatch via Textbelt HTTP API.
    """

    def __init__(self):
        self.settings = get_settings()

    async def send(self, to: str | None = None, message: str = "") -> dict[str, Any]:
        global _LAST_SMS_TIMESTAMP
        now = time.time()
        elapsed = now - _LAST_SMS_TIMESTAMP
        if elapsed < _SMS_MIN_INTERVAL_SECONDS:
            remaining = int(_SMS_MIN_INTERVAL_SECONDS - elapsed)
            raise SmsRateLimitExceeded(
                f"Rate limit exceeded: SMS testing is limited to 1 message per minute. Try again in {remaining}s."
            )

        target_phone = to or self.settings.demo_alert_phone
        if not target_phone:
            raise ValueError("Target phone number not configured in DEMO_ALERT_PHONE.")

        payload = {
            "phone": target_phone,
            "message": message or "THERMAGRID TEST: Heat Action Alert verification.",
            "key": self.settings.textbelt_key or "textbelt",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post("https://textbelt.com/text", data=payload)
                data = resp.json()
                _LAST_SMS_TIMESTAMP = time.time()
                logger.info(f"Textbelt SMS dispatch response: {data}")
                return {
                    "success": data.get("success", False),
                    "phone": target_phone[:3] + "..." + target_phone[-4:]
                    if len(target_phone) > 7
                    else "***",
                    "quota_remaining": data.get("quotaRemaining"),
                    "text_id": data.get("textId"),
                    "error": data.get("error"),
                }
        except Exception as e:
            logger.error(f"Failed to dispatch Textbelt SMS: {e}")
            return {
                "success": False,
                "error": str(e),
            }
