"""
Clerk Authentication & Role-Based Authorization
Verifies Clerk Session JWTs via RS256 JWKS key rotation.
"""

import os
from typing import Optional, Dict, Any
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import get_settings

bearer = HTTPBearer(auto_error=False)
_jwks: Optional[PyJWKClient] = None


def _jwks_client() -> Optional[PyJWKClient]:
    global _jwks
    s = get_settings()
    if not s.clerk_jwks_url:
        return None
    if _jwks is None:
        _jwks = PyJWKClient(s.clerk_jwks_url)
    return _jwks


def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> Dict[str, Any]:
    """
    Validates a Clerk session JWT (RS256) against Clerk's JWKS.
    Fails closed: any token that cannot be verified is rejected.
    """
    if creds is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    s = get_settings()

    # Test suite mock tokens (only active when running under pytest or explicit TESTING flag)
    if os.getenv("TESTING") == "true" or os.getenv("PYTEST_CURRENT_TEST") is not None:
        if creds.credentials == "test_authority_jwt_token":
            return {"sub": "user_test_authority", "role": "authority", "is_demo": True}
        if creds.credentials == "test_citizen_jwt_token":
            return {"sub": "user_test_citizen", "role": "citizen", "is_demo": True}

    # Dev-only escape hatch. Unreachable unless BOTH app_env=development AND debug=true.
    # Never returns a privileged role.
    if s.app_env == "development" and s.debug and creds.credentials == "dev_token":
        return {"sub": "user_dev_mock", "role": "citizen", "is_demo": True}

    jwks = _jwks_client()
    if jwks is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is not configured (CLERK_JWKS_URL missing)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        signing_key = jwks.get_signing_key_from_jwt(creds.credentials).key
        decode_kwargs: Dict[str, Any] = {
            "algorithms": ["RS256"],
            "options": {"verify_aud": False},
        }
        if s.clerk_issuer:
            decode_kwargs["issuer"] = s.clerk_issuer
        payload = jwt.decode(creds.credentials, signing_key, **decode_kwargs)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Role comes from a Clerk-signed claim; default to least privilege.
    if "role" not in payload:
        meta = payload.get("public_metadata") or {}
        payload["role"] = meta.get("role", "citizen")
    if payload["role"] not in {"citizen", "worker", "authority", "admin"}:
        payload["role"] = "citizen"

    return payload


def require_role(*allowed: str):
    """
    Role guard dependency. Raises 403 Forbidden if user role is not permitted.
    """
    def dep(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = user.get("role", "citizen")
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role}' forbidden from accessing this resource. Required: {', '.join(allowed)}",
            )
        return user
    return dep
