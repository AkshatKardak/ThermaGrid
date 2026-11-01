"""
FastAPI dependency injection: Database session, Clerk authentication, and role authorization.
"""

from typing import Generator, Optional, Dict, Any, List
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import get_current_user, require_role

# Alias for backward-compatibility with RoleChecker(["authority", "admin"])
class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        checker = require_role(*self.allowed_roles)
        return checker(user)

__all__ = ["get_db", "get_current_user", "require_role", "RoleChecker"]
