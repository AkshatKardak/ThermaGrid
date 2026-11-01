"""
Cooling Centres endpoints.
"""

import sys
import os
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


@router.get("", response_model=List[CoolingCentreOut])
def list_cooling_centres(
    city: Optional[str] = Query(None, description="City filter"),
    lat: Optional[float] = Query(None, description="User latitude for distance sorting"),
    lon: Optional[float] = Query(None, description="User longitude for distance sorting"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Lists active municipal cooling shelters, public AC transit halls, and UPHCs.
    If lat and lon are provided, sorts by Haversine proximity distance.
    """
    query = db.query(CoolingCentre).filter(CoolingCentre.is_active == 1)
    if city:
        query = query.filter(CoolingCentre.city.ilike(f"%{city}%"))
    
    centres = query.all()
    
    # If user provided coordinates, calculate proximity distance
    if lat is not None and lon is not None:
        dict_centres = [c.__dict__ for c in centres]
        nearest = find_nearest_cooling_centres(lat, lon, dict_centres, limit=limit)
        return [CoolingCentreOut.model_validate(c) for c in nearest]

    return [CoolingCentreOut.model_validate(c) for c in centres[:limit]]
