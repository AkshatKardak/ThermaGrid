"""
Heat Emergency Alert management endpoints.
"""

from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.alert_service import AlertService
from app.services.alerts.sms import SmsChannel, SmsRateLimitExceeded
from app.schemas.alert import AlertCreate, AlertOut
from app.api.deps import RoleChecker

router = APIRouter(prefix="/alerts", tags=["Alerts"])


class TestSmsRequest(BaseModel):
    phone: Optional[str] = None
    message: Optional[str] = None


@router.post("/test-sms")
async def send_test_sms(payload: Optional[TestSmsRequest] = None):
    """
    Dedicated test endpoint for SMS channel verification.
    Rate limited to 1 message per minute.
    Destination phone is sourced strictly from DEMO_ALERT_PHONE in environment
    unless an explicit phone is supplied. Never hardcoded.
    """
    channel = SmsChannel()
    phone = payload.phone if payload and payload.phone else None
    message = payload.message if payload and payload.message else None
    try:
        result = await channel.send(to=phone, message=message)
        return result
    except SmsRateLimitExceeded as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


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
