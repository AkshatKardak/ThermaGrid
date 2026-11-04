"""
Cooling Centres endpoints.
"""

import sys
import os
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.cooling_centre import CoolingCentre
from app.schemas.cooling_centre import CoolingCentreOut

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))
from src.spatial.ward_joins import find_nearest_cooling_centres

router = APIRouter(prefix="/cooling-centres", tags=["Cooling Centres"])


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


@router.get("", response_model=List[CoolingCentreOut])
def list_cooling_centres(
    city: Optional[str] = Query(None, description="City filter"),
    lat: Optional[float] = Query(None, description="User latitude"),
    lon: Optional[float] = Query(None, description="User longitude"),
    near_lat: Optional[float] = Query(None, description="User latitude (alias)"),
    near_lon: Optional[float] = Query(None, description="User longitude (alias)"),
    open_now: Optional[bool] = Query(None, description="Filter for centres currently open"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Lists active municipal cooling shelters, public AC transit halls, and UPHCs.
    Includes distance, walk minutes, open/closed status, and Google Maps directions link.
    """
    target_lat = near_lat if near_lat is not None else lat
    target_lon = near_lon if near_lon is not None else lon

    query = db.query(CoolingCentre).filter(CoolingCentre.is_active == 1)
    if city:
        query = query.filter(CoolingCentre.city.ilike(f"%{city}%"))

    raw_centres = query.all()

    results = []
    for c in raw_centres:
        status_val = getattr(c, "current_status", None) or "open"
        is_open = status_val == "open"

        if open_now is True and not is_open:
            continue

        c_dict = {
            "id": c.id,
            "name": c.name,
            "facility_type": c.facility_type,
            "city": c.city,
            "ward_name": c.ward_name,
            "address": c.address,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "capacity_persons": c.capacity_persons,
            "capacity": getattr(c, "capacity_persons", 150),
            "current_occupancy": c.current_occupancy,
            "amenities": c.amenities,
            "operating_hours": c.operating_hours,
            "opening_hours": getattr(c, "opening_hours", None),
            "contact_phone": c.contact_phone,
            "phone": getattr(c, "contact_phone", "108"),
            "current_status": status_val,
            "is_open_now": is_open,
            "is_free": getattr(c, "is_free", True),
            "directions_url": f"https://www.google.com/maps/dir/?api=1&destination={c.latitude},{c.longitude}",
            "is_demo": bool(c.is_demo),
            "demo_label": "[DEMO DATA]" if c.is_demo else None,
        }

        if target_lat is not None and target_lon is not None:
            dist = _haversine_km(target_lat, target_lon, c.latitude, c.longitude)
            c_dict["distance_km"] = dist
            c_dict["walk_minutes"] = max(1, int(round((dist / 4.5) * 60)))
        else:
            c_dict["distance_km"] = None
            c_dict["walk_minutes"] = None

        results.append(c_dict)

    if target_lat is not None and target_lon is not None:
        results.sort(key=lambda x: x["distance_km"] if x["distance_km"] is not None else float("inf"))

    return [CoolingCentreOut(**item) for item in results[:limit]]
