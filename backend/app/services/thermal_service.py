"""
Thermal Index Service orchestrator.
Calls pure calculation functions in analytics package for WBGT, UTCI, and Heat Index.
"""

import sys
import os
from typing import Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))

from src.thermal_indices.wbgt import calculate_wbgt
from src.thermal_indices.utci import calculate_utci
from src.thermal_indices.heat_index import calculate_heat_index
from app.services.weather_service import WeatherService
from app.models.location import Location


class ThermalService:
    @staticmethod
    def get_current_thermal_indices(db: Session, location_id: int, for_risk: bool = False) -> Dict[str, Any]:
        """
        Computes current WBGT, UTCI, and Heat Index for a ward using current weather.
        """
        weather = WeatherService.get_current_weather(db, location_id, for_risk=for_risk)
        temp_c = weather["temperature_c"]
        rh_pct = weather["rel_humidity_pct"]
        wind_ms = weather["wind_speed_ms"]
        solar_wm2 = weather["solar_radiation_wm2"]

        wbgt_res = calculate_wbgt(
            temp_c=temp_c,
            rel_humidity_pct=rh_pct,
            wind_speed_ms=wind_ms,
            solar_radiation_wm2=solar_wm2,
            is_outdoor=True,
        )

        utci_res = calculate_utci(
            temp_c=temp_c,
            rel_humidity_pct=rh_pct,
            wind_speed_10m_ms=wind_ms,
            solar_radiation_wm2=solar_wm2,
        )

        hi_res = calculate_heat_index(
            temp_c=temp_c,
            rel_humidity_pct=rh_pct,
        )

        return {
            "location_id": weather["location_id"],
            "city": weather["city"],
            "ward_name": weather["ward_name"],
            "calculated_for": datetime.now(timezone.utc),
            "wbgt_c": wbgt_res["wbgt"],
            "wet_bulb_c": wbgt_res["wet_bulb"],
            "globe_temp_c": wbgt_res["globe_temp"],
            "wbgt_category": wbgt_res["category"],
            "wbgt_work_rest_guidance": wbgt_res["work_rest_guidance"],
            "utci_c": utci_res["utci"],
            "utci_category": utci_res["category"],
            "utci_impact": utci_res["physiological_impact"],
            "heat_index_c": hi_res["heat_index_c"],
            "heat_index_category": hi_res["category"],
            "heat_index_warning": hi_res["warning"],
            "citation": f"{wbgt_res['citation']} | {utci_res['citation']} | {hi_res['citation']}",
            "is_demo": weather["is_demo"],
            "demo_label": weather["demo_label"],
        }

    @staticmethod
    def get_thermal_history(db: Session, location_id: int, days: int = 2) -> Dict[str, Any]:
        """
        Hourly thermal indices computed from STORED OBSERVATIONS only.
        Never derives history from forecasts.
        """
        from datetime import datetime, timedelta, timezone
        from src.historical.store import HistoricalStore, HistoricalDataUnavailable

        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)

        store = HistoricalStore(db)
        obs = store.read_range(location_id, start, end)      # DataFrame

        if obs is None or obs.empty:
            raise HistoricalDataUnavailable(
                f"No stored observations for location {location_id} between {start.date()} and {end.date()}"
            )

        items = []
        for row in obs.itertuples():
            t, rh, w, s = row.temperature_c, row.relative_humidity_pct, row.wind_speed_ms, row.solar_radiation_wm2
            items.append({
                "time": row.observed_at.isoformat(),
                "temperature_c": t,
                "wbgt_c": calculate_wbgt(t, rh, w, s)["wbgt"],
                "utci_c": calculate_utci(t, rh, w, s)["utci"],
                "heat_index_c": calculate_heat_index(t, rh)["heat_index_c"],
            })

        return {
            "location_id": location_id,
            "items": items,
            "source": "observed",
            "is_synthetic": bool(obs["is_synthetic"].any()) if "is_synthetic" in obs else False,
            "count": len(items),
        }
