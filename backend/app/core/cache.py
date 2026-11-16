"""
In-process TTL Response Cache for ThermaGrid meteorological and risk endpoints.
Provides fast response times and sets 'cache: hit | miss' headers.
"""

import time


class ResponseCache:
    def __init__(self):
        # key -> (body_bytes, status_code, headers_list, media_type, expire_at)
        self._store: dict[str, tuple[bytes, int, list, str | None, float]] = {}

    def get(self, key: str) -> tuple[bytes, int, list, str | None] | None:
        item = self._store.get(key)
        if not item:
            return None
        body, status_code, headers, media_type, expire_at = item
        if time.time() > expire_at:
            del self._store[key]
            return None
        return body, status_code, headers, media_type

    def set(
        self,
        key: str,
        body: bytes,
        status_code: int,
        headers: list,
        media_type: str | None,
        ttl_seconds: int,
    ) -> None:
        self._store[key] = (
            body,
            status_code,
            headers,
            media_type,
            time.time() + ttl_seconds,
        )

    def clear(self) -> None:
        self._store.clear()


response_cache = ResponseCache()

# Route path patterns and their configured TTLs in seconds
# Observations: 10–15 min (600s). Forecasts: 1 hour (3600s).
CACHE_ROUTES = {
    "/weather/current": 600,
    "/thermal/current": 600,
    "/risk/current": 600,
    "/weather/forecast": 3600,
    "/risk/forecast": 3600,
}


def get_cache_ttl(path: str) -> int | None:
    clean_path = path.rstrip("/")
    for route_prefix, ttl in CACHE_ROUTES.items():
        if clean_path.endswith(route_prefix):
            return ttl
    return None
