"""
Location and Ward endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.location import Location
from app.schemas.location import LocationOut

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("", response_model=List[LocationOut])
def list_locations(
    city: Optional[str] = Query(None, description="Filter by city, e.g. Mumbai or Delhi"),
    state: Optional[str] = Query(None, description="Filter by state"),
    db: Session = Depends(get_db),
):
    """Lists all registered urban wards with geometry and demographic vulnerability parameters."""
    query = db.query(Location)
    if city:
        query = query.filter(Location.city.ilike(f"%{city}%"))
    if state:
        query = query.filter(Location.state.ilike(f"%{state}%"))
    return query.all()


@router.get("/{location_id}", response_model=LocationOut)
def get_location(location_id: int, db: Session = Depends(get_db)):
    """Retrieves full ward profile and geometry by ID."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc
