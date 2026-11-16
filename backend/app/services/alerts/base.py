from typing import Protocol


class AlertChannel(Protocol):
    """
    Abstract protocol for dispatching thermal stress early-warning alerts.
    """

    async def send(self, to: str, subject: str, body: str) -> bool: ...
