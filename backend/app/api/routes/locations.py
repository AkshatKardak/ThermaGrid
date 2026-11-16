"""
Location and Ward endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.location import Location
from app.schemas.location import LocationOut

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("", response_model=list[LocationOut])
def list_locations(
    city: str | None = Query(None, description="Filter by city, e.g. Mumbai or Delhi"),
    state: str | None = Query(None, description="Filter by state"),
    db: Session = Depends(get_db),
):
    """Lists all registered urban wards with geometry and demographic vulnerability parameters."""
    query = db.query(Location)
    if city:
        query = query.filter(Location.city.ilike(f"%{city}%"))
    if state:
        query = query.filter(Location.state.ilike(f"%{state}%"))
    return query.all()


@router.get("/lookup", response_model=LocationOut)
def lookup_location_by_coordinates(
    lat: float = Query(..., description="Latitude coordinate"),
    lng: float = Query(..., description="Longitude coordinate"),
    db: Session = Depends(get_db),
):
    """
    Index-accelerated Point-in-Polygon spatial query.
    Uses the spatial bounding box index (idx_locations_spatial_bbox) to prune non-candidate wards,
    then executes exact geometric point-in-polygon containment.
    Falls back to nearest centroid if point lies outside known polygons.
    """
    from shapely.geometry import Point, shape

    pt = Point(lng, lat)

    # 1. Spatial bounding box index query
    candidates = (
        db.query(Location)
        .filter(
            Location.min_lat <= lat,
            Location.max_lat >= lat,
            Location.min_lng <= lng,
            Location.max_lng >= lng,
        )
        .all()
    )

    # 2. Exact polygon containment test
    for cand in candidates:
        if cand.geometry_geojson:
            try:
                poly = shape(cand.geometry_geojson)
                if poly.contains(pt):
                    return cand
            except Exception:
                continue

    # 3. If point is not contained in any polygon, return nearest location by centroid
    from analytics.src.spatial.ward_joins import haversine_distance_km

    all_locs = db.query(Location).all()
    if not all_locs:
        raise HTTPException(status_code=404, detail="No locations found in database")

    nearest = min(
        all_locs,
        key=lambda loc: haversine_distance_km(lat, lng, loc.latitude, loc.longitude),
    )
    return nearest


@router.get("/{location_id}", response_model=LocationOut)
def get_location(location_id: int, db: Session = Depends(get_db)):
    """Retrieves full ward profile and geometry by ID."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc
