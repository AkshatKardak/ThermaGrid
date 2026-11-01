"""
Extreme Event & Heatwave Spell Detection Module.
"""

from typing import List, Dict, Any
import numpy as np


def detect_heatwave_spells(
    daily_records: List[Dict[str, Any]],
    climatological_p95_c: float = 40.0,
    min_consecutive_days: int = 3,
) -> List[Dict[str, Any]]:
    """
    Identifies heatwave spells according to the standard definition:
    ≥ min_consecutive_days where daily t_max_c exceeds the 95th percentile threshold.
    """
    spells: List[Dict[str, Any]] = []
    current_spell: List[Dict[str, Any]] = []
    
    for day in daily_records:
        t_max = day.get("t_max_c")
        if t_max is not None and t_max >= climatological_p95_c:
            current_spell.append(day)
        else:
            if len(current_spell) >= min_consecutive_days:
                spell_temps = [d["t_max_c"] for d in current_spell]
                spells.append({
                    "start_date": current_spell[0]["date"],
                    "end_date": current_spell[-1]["date"],
                    "duration_days": len(current_spell),
                    "peak_t_max_c": max(spell_temps),
                    "mean_t_max_c": round(float(np.mean(spell_temps)), 2),
                    "severity": "Severe" if max(spell_temps) >= climatological_p95_c + 3.0 else "Moderate",
                })
            current_spell = []
            
    # Check end of series
    if len(current_spell) >= min_consecutive_days:
        spell_temps = [d["t_max_c"] for d in current_spell]
        spells.append({
            "start_date": current_spell[0]["date"],
            "end_date": current_spell[-1]["date"],
            "duration_days": len(current_spell),
            "peak_t_max_c": max(spell_temps),
            "mean_t_max_c": round(float(np.mean(spell_temps)), 2),
            "severity": "Severe" if max(spell_temps) >= climatological_p95_c + 3.0 else "Moderate",
        })
        
    return spells
