import sys
import os
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))

import app.core.auth as auth_module

_TEST_PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_TEST_PUBLIC_KEY = _TEST_PRIVATE_KEY.public_key()


class _MockSigningKey:
    def __init__(self, key):
        self.key = key


class _MockJWKSClient:
    def get_signing_key_from_jwt(self, token: str):
        return _MockSigningKey(_TEST_PUBLIC_KEY)


auth_module._jwks = _MockJWKSClient()

from app.core.config import get_settings
get_settings().allow_synthetic_risk = True

from app.core.cache import response_cache
import pytest

@pytest.fixture(autouse=True)
def clear_response_cache_fixture():
    response_cache.clear()
    yield
    response_cache.clear()


def mint_test_jwt(sub: str, role: str) -> str:
    payload = {
        "sub": sub,
        "role": role,
        "public_metadata": {"role": role},
        "is_demo": True,
    }
    return jwt.encode(payload, _TEST_PRIVATE_KEY, algorithm="RS256")
