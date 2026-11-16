"""
FastAPI dependency injection: Database session, Clerk authentication, and role authorization.
"""

from typing import Any

from fastapi import Depends

from app.core.auth import get_current_user, require_role
from app.db.session import get_db


# Alias for backward-compatibility with RoleChecker(["authority", "admin"])
class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        checker = require_role(*self.allowed_roles)
        return checker(user)


__all__ = ["RoleChecker", "get_current_user", "get_db", "require_role"]
