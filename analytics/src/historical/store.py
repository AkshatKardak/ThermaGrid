"""
Historical Time-Series Store Interface.
"""

from typing import List, Dict, Any, Optional


class HistoricalDataUnavailable(Exception):
    """Raised when no historical observations exist for a queried location/timerange."""
    pass


class HistoricalStore:
    """In-memory and cached repository for historical weather records."""
    
    def __init__(self):
        self._records: Dict[str, List[Dict[str, Any]]] = {}
        
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
