"""
Authentication routes: Clerk profile verification, session info, and role check.
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from app.core.auth import get_current_user, require_role

router = APIRouter(prefix="/auth", tags=["Authentication"])


class AuthMeResponse(BaseModel):
    user_id: str
    role: str
    email: str = ""
    is_demo: bool = False


@router.get("/me", response_model=AuthMeResponse)
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns profile for currently authenticated Clerk user.
    """
    return AuthMeResponse(
        user_id=str(user.get("sub", "")),
        role=user.get("role", "citizen"),
        email=user.get("email", ""),
        is_demo=user.get("is_demo", False),
    )


@router.get("/authority-only", response_model=Dict[str, Any])
def authority_guard_check(user: Dict[str, Any] = Depends(require_role("authority", "admin"))):
    """
    Enforces that only 'authority' or 'admin' roles can access this endpoint.
    Used for 403 authorization guard verification.
    """
    return {
        "status": "authorized",
        "user_id": user.get("sub"),
        "role": user.get("role"),
        "message": "Authority authorization verified."
    }


@router.get("/authority-guard", response_model=Dict[str, Any])
def authority_view_role_guard(user: Dict[str, Any] = Depends(get_current_user)):
    """
    Server-side role guard on authority routes.
    Returns a polite 'this view is for municipal authorities' card response
    rather than an abrupt 403.
    """
    user_role = user.get("role", "citizen")
    if user_role not in ["authority", "admin"]:
        return {
            "authorized": False,
            "role": user_role,
            "card": {
                "title": "This view is for municipal authorities",
                "message": "The Mission Control console is reserved for municipal disaster response authorities and ward officers.",
                "action": "Please navigate to the Citizen Overview Hub or authenticate with an authorized authority account.",
                "redirect_to": "/app",
            },
        }
    return {
        "authorized": True,
        "role": user_role,
        "user_id": user.get("sub"),
        "message": "Authority clearance verified.",
    }
