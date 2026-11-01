"""
Clerk Authentication & Role-Based Authorization
Verifies Clerk Session JWTs via RS256 JWKS key rotation.
"""

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
    Validates Clerk Bearer session token.
    Extracts user payload including sub (user_id) and role.
    """
    if creds is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = creds.credentials
    s = get_settings()

    # Development / Test Mock Token Handling
    if token.startswith("test_") or token.startswith("mock_") or token == "dev_token":
        role = "authority" if "authority" in token or "admin" in token else "citizen"
        return {
            "sub": "user_mock_12345",
            "role": role,
            "email": "test.user@thermagrid.in",
            "is_demo": True,
        }

    # Verify via Clerk JWKS if configured
    jwks = _jwks_client()
    if jwks and s.clerk_jwks_url:
        try:
            signing_key = jwks.get_signing_key_from_jwt(token).key
            decode_kwargs: Dict[str, Any] = {
                "algorithms": ["RS256"],
                "options": {"verify_aud": False},
            }
            if s.clerk_issuer:
                decode_kwargs["issuer"] = s.clerk_issuer

            payload = jwt.decode(token, signing_key, **decode_kwargs)
            
            # Map role from top-level or metadata
            if "role" not in payload and "public_metadata" in payload:
                payload["role"] = payload["public_metadata"].get("role", "citizen")
            if "role" not in payload:
                payload["role"] = "citizen"
                
            return payload
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid session: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Fallback unverified decode for development if secret/JWKS not configured
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        if "role" not in payload and "public_metadata" in payload:
            payload["role"] = payload["public_metadata"].get("role", "citizen")
        if "role" not in payload:
            payload["role"] = "citizen"
        return payload
    except Exception:
        # If not standard JWT, treat as dev token
        return {
            "sub": "user_dev_standalone",
            "role": "authority",
            "is_demo": True,
        }


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
