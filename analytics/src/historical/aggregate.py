"""
Historical Aggregation Module: Daily and Monthly Biometeorological Summaries.
"""

from typing import List, Dict, Any
import numpy as np


def aggregate_daily(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Groups hourly records by calendar date and calculates daily statistics:
    - t_max, t_min, t_mean
    - wbgt_max, wbgt_mean (if present)
    - rh_min, rh_mean
    - extreme_hours_count (hours with temp >= 40°C or wbgt >= 32°C)
    """
    days: Dict[str, List[Dict[str, Any]]] = {}
    for r in records:
        ts = r.get("timestamp", "")
        date_str = ts.split("T")[0] if "T" in ts else ts.split(" ")[0]
        if not date_str:
            continue
        if date_str not in days:
            days[date_str] = []
        days[date_str].append(r)
        
    daily_summaries = []
    for d, items in sorted(days.items()):
        temps = [it["temperature_c"] for it in items if it.get("temperature_c") is not None]
        rhs = [it["rel_humidity_pct"] for it in items if it.get("rel_humidity_pct") is not None]
        wbgts = [it["wbgt_c"] for it in items if it.get("wbgt_c") is not None]
        
        t_max = max(temps) if temps else None
        t_min = min(temps) if temps else None
        t_mean = round(float(np.mean(temps)), 2) if temps else None
        
        wbgt_max = max(wbgts) if wbgts else None
        wbgt_mean = round(float(np.mean(wbgts)), 2) if wbgts else None
        
        # Extreme hours: temp >= 40.0 or wbgt >= 32.0
        ext_count = sum(1 for t in temps if t >= 40.0)
        
        daily_summaries.append({
            "date": d,
            "t_max_c": t_max,
            "t_min_c": t_min,
            "t_mean_c": t_mean,
            "wbgt_max_c": wbgt_max,
            "wbgt_mean_c": wbgt_mean,
            "rh_mean_pct": round(float(np.mean(rhs)), 1) if rhs else None,
            "hours_above_40c": ext_count,
            "observations_count": len(items),
        })
        
    return daily_summaries
