"""
Care Circle (Dependents) routes.
Allows users to register loved ones and watch their ward's thermal stress.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.dependent import Dependent
from app.models.location import Location
from app.services.risk_service import RiskService
from app.schemas.dependent import DependentCreate, DependentOut

router = APIRouter(prefix="/dependents", tags=["Care Circle"])


def _enrich_dependent(dep: Dependent, db: Session) -> Dict[str, Any]:
    ward_name = None
    risk_score = None
    band = "moderate"

    if dep.ward_id:
        ward = db.query(Location).filter(Location.id == dep.ward_id).first()
        if ward:
            ward_name = ward.ward_name
            try:
                curr_risk = RiskService.get_current_risk(db, dep.ward_id)
                risk_score = curr_risk.get("risk_score")
                band = curr_risk.get("band", "moderate")
            except Exception:
                risk_score = None
                band = "unavailable"

    return {
        "id": dep.id,
        "clerk_user_id": dep.clerk_user_id,
        "name": dep.name,
        "ward_id": dep.ward_id,
        "ward_name": ward_name,
        "age_band": dep.age_band,
        "phone": dep.phone,
        "consent_note": dep.consent_note,
        "created_at": dep.created_at,
        "current_risk_score": risk_score,
        "current_band": band,
    }


@router.post("", response_model=DependentOut, status_code=status.HTTP_201_CREATED)
def create_dependent(
    payload: DependentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Registers a new person to watch in the user's Care Circle.
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Name cannot be empty")

    new_dep = Dependent(
        clerk_user_id=user_id,
        name=name,
        ward_id=payload.ward_id,
        age_band=payload.age_band,
        phone=payload.phone,
        consent_note=payload.consent_note,
    )
    db.add(new_dep)
    db.commit()
    db.refresh(new_dep)
    return _enrich_dependent(new_dep, db)


@router.get("", response_model=List[DependentOut])
def list_my_dependents(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists all people in the authenticated user's Care Circle, enriched with live ward risk.
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token")

    deps = db.query(Dependent).filter(Dependent.clerk_user_id == user_id).all()
    return [_enrich_dependent(d, db) for d in deps]


@router.delete("/{dependent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dependent(
    dependent_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Removes a person from Care Circle. Ownership verified by JWT.
    """
    user_id = current_user.get("sub")
    dep = (
        db.query(Dependent)
        .filter(Dependent.id == dependent_id, Dependent.clerk_user_id == user_id)
        .first()
    )
    if not dep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dependent not found")

    db.delete(dep)
    db.commit()
    return None
