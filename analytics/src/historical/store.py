"""
Historical Time-Series Store Interface.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd


class HistoricalDataUnavailable(Exception):
    """Raised when no historical observations exist for a queried location/timerange."""
    pass


class HistoricalStore:
    """In-memory and cached repository for historical weather records."""
    
    def __init__(self, db: Any = None):
        self._records: Dict[str, List[Dict[str, Any]]] = {}
        self.db = db
        
    def add_records(self, location_id: str, records: List[Dict[str, Any]]) -> None:
        if location_id not in self._records:
            self._records[location_id] = []
        self._records[location_id].extend(records)
        
    def get_records(
        self,
        location_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        recs = self._records.get(location_id, [])
        if not recs:
            raise HistoricalDataUnavailable(f"No historical records found for location {location_id}")
        return recs

    def read_range(self, location_id: int, start: datetime, end: datetime) -> pd.DataFrame:
        """
        Query weather_observations filtered by location and time window,
        ordered by observed_at, return a DataFrame.
        """
        if self.db is None:
            return pd.DataFrame()

        from app.models.weather import WeatherObservation

        start_naive = start.replace(tzinfo=None) if hasattr(start, "tzinfo") and start.tzinfo else start
        end_naive = end.replace(tzinfo=None) if hasattr(end, "tzinfo") and end.tzinfo else end

        col = getattr(WeatherObservation, "observed_at", None)
        if col is None:
            col = getattr(WeatherObservation, "recorded_at", None)

        if col is None:
            return pd.DataFrame()

        rows = (
            self.db.query(WeatherObservation)
            .filter(
                WeatherObservation.location_id == location_id,
                col >= start_naive,
                col <= end_naive,
            )
            .order_by(col.asc())
            .all()
        )

        if not rows:
            return pd.DataFrame()

        data = []
        for r in rows:
            obs_time = getattr(r, "observed_at", None) or getattr(r, "recorded_at", None)
            rh = getattr(r, "relative_humidity_pct", None)
            if rh is None:
                rh = getattr(r, "rel_humidity_pct", 0.0)
            is_syn = getattr(r, "is_synthetic", None)
            if is_syn is None:
                is_syn = getattr(r, "is_demo", False)

            data.append({
                "observed_at": obs_time,
                "temperature_c": r.temperature_c,
                "relative_humidity_pct": rh,
                "wind_speed_ms": r.wind_speed_ms,
                "solar_radiation_wm2": r.solar_radiation_wm2,
                "is_synthetic": is_syn,
            })

        return pd.DataFrame(data)
