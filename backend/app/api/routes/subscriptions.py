"""
Alert Subscriptions routes.
Strictly scoped to authenticated clerk_user_id from JWT.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.subscription import Subscription
from app.models.location import Location
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate, SubscriptionOut
from app.services.alert_service import get_channel

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


def _enrich_sub(sub: Subscription, db: Session) -> Dict[str, Any]:
    ward_name = None
    if sub.ward_id:
        w = db.query(Location).filter(Location.id == sub.ward_id).first()
        if w:
            ward_name = w.ward_name
    return {
        "id": sub.id,
        "clerk_user_id": sub.clerk_user_id,
        "ward_id": sub.ward_id,
        "ward_name": ward_name,
        "channel": sub.channel,
        "destination": sub.destination,
        "threshold": sub.threshold,
        "language": sub.language,
        "quiet_hours": sub.quiet_hours,
        "is_active": sub.is_active,
        "created_at": sub.created_at,
    }


@router.post("", response_model=SubscriptionOut, status_code=status.HTTP_201_CREATED)
def create_subscription(
    payload: SubscriptionCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new self-serve alert subscription scoped to current authenticated user.
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token")

    # Destination validation
    dest = payload.destination.strip()
    if not dest:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Destination cannot be empty")

    # Upsert or check existing
    existing = (
        db.query(Subscription)
        .filter(
            Subscription.clerk_user_id == user_id,
            Subscription.ward_id == payload.ward_id,
            Subscription.channel == payload.channel,
        )
        .first()
    )

    if existing:
        existing.destination = dest
        existing.threshold = payload.threshold
        existing.language = payload.language
        existing.quiet_hours = payload.quiet_hours
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return _enrich_sub(existing, db)

    new_sub = Subscription(
        clerk_user_id=user_id,
        ward_id=payload.ward_id,
        channel=payload.channel,
        destination=dest,
        threshold=payload.threshold,
        language=payload.language,
        quiet_hours=payload.quiet_hours,
        is_active=True,
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return _enrich_sub(new_sub, db)


@router.get("", response_model=List[SubscriptionOut])
def list_my_subscriptions(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists all subscriptions for the authenticated user.
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token")

    subs = db.query(Subscription).filter(Subscription.clerk_user_id == user_id).all()
    return [_enrich_sub(s, db) for s in subs]


@router.patch("/{subscription_id}", response_model=SubscriptionOut)
def update_subscription(
    subscription_id: str,
    payload: SubscriptionUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates an existing subscription. Enforces user ownership.
    """
    user_id = current_user.get("sub")
    sub = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id, Subscription.clerk_user_id == user_id)
        .first()
    )
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    if payload.destination is not None:
        sub.destination = payload.destination.strip()
    if payload.channel is not None:
        sub.channel = payload.channel.strip().lower()
    if payload.threshold is not None:
        sub.threshold = payload.threshold
    if payload.language is not None:
        sub.language = payload.language
    if payload.quiet_hours is not None:
        sub.quiet_hours = payload.quiet_hours
    if payload.is_active is not None:
        sub.is_active = payload.is_active
    if payload.ward_id is not None:
        sub.ward_id = payload.ward_id

    db.commit()
    db.refresh(sub)
    return _enrich_sub(sub, db)


@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(
    subscription_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes a subscription owned by the current user.
    """
    user_id = current_user.get("sub")
    sub = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id, Subscription.clerk_user_id == user_id)
        .first()
    )
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    db.delete(sub)
    db.commit()
    return None


@router.post("/{subscription_id}/test")
async def send_test_alert(
    subscription_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Dispatches a single immediate test alert to the verified subscription destination.
    """
    user_id = current_user.get("sub")
    sub = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id, Subscription.clerk_user_id == user_id)
        .first()
    )
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    channel = get_channel()
    subject = "ThermaGrid Test Alert — Early Warning System"
    body = (
        f"<b>ThermaGrid Alert Test</b><br>"
        f"This is a verified test dispatch for your subscription.<br>"
        f"Channel: {sub.channel.upper()} · Trigger Threshold: {sub.threshold}/100 · Language: {sub.language.upper()}."
    )

    success = await channel.send(sub.destination, subject, body)
    return {
        "status": "sent" if success else "failed",
        "destination": sub.destination,
        "channel": sub.channel,
        "message": f"Test alert dispatched to {sub.destination}",
    }
