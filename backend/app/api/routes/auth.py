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
