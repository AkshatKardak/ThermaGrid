"""
Heat Emergency Alert management endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.alert_service import AlertService
from app.schemas.alert import AlertCreate, AlertOut
from app.api.deps import RoleChecker

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertOut])
def get_alerts(
    city: Optional[str] = Query(None, description="City filter"),
    db: Session = Depends(get_db),
):
    """Retrieves active early-warning heat alerts."""
    return AlertService.get_active_alerts(db, city=city)


@router.post("", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
def create_alert(
    alert_in: AlertCreate,
    db: Session = Depends(get_db),
    # In production, guarded by authority/admin role:
    # current_user = Depends(RoleChecker(["authority", "admin"]))
):
    """Issues and broadcasts a new heat action plan early warning alert."""
    alert = AlertService.create_and_dispatch_alert(
        db=db,
        location_id=alert_in.location_id,
        alert_level=alert_in.alert_level,
        title=alert_in.title,
        message=alert_in.message,
        action_directives=alert_in.action_directives,
        target_audience=alert_in.target_audience,
    )
    return alert
