"""
FastAPI Backend integration tests using TestClient.
"""

import os
import sys

from fastapi.testclient import TestClient

# Set PYTHONPATH
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))

import app.core.auth as auth_module
import jwt
from app.db.seed import seed_database
from app.main import app
from app.services.alert_service import maybe_alert
from cryptography.hazmat.primitives.asymmetric import rsa

# Setup real RS256 token signer for integration tests
_TEST_PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_TEST_PUBLIC_KEY = _TEST_PRIVATE_KEY.public_key()


class _MockSigningKey:
    def __init__(self, key):
        self.key = key


class _MockJWKSClient:
    def get_signing_key_from_jwt(self, token: str):
        return _MockSigningKey(_TEST_PUBLIC_KEY)


auth_module._jwks = _MockJWKSClient()


def mint_test_jwt(sub: str, role: str) -> str:
    payload = {
        "sub": sub,
        "role": role,
        "public_metadata": {"role": role},
        "is_demo": True,
    }
    return jwt.encode(payload, _TEST_PRIVATE_KEY, algorithm="RS256")


# Ensure database is seeded for test runs
seed_database()

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ThermaGrid" in data["app"]


def test_list_locations():
    response = client.get("/api/v1/locations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first_ward = data[0]
    assert "ward_code" in first_ward
    assert "population_density_per_km2" in first_ward


def test_get_current_weather():
    response = client.get("/api/v1/weather/current?location_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "temperature_c" in data
    assert "rel_humidity_pct" in data
    assert "wind_speed_ms" in data


def test_get_current_thermal_indices():
    response = client.get("/api/v1/thermal/current?location_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "wbgt_c" in data
    assert "utci_c" in data
    assert "heat_index_c" in data
    assert "wbgt_category" in data


def test_get_current_risk():
    response = client.get("/api/v1/risk/current?location_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert 0.0 <= data["risk_score"] <= 100.0
    assert "band" in data
    assert "factor_breakdown" in data
    assert len(data["factor_breakdown"]) >= 3
    assert "explanation" in data


def test_cooling_centres_list():
    response = client.get("/api/v1/cooling-centres")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "capacity_persons" in data[0]


def test_data_sources_provenance():
    response = client.get("/api/v1/data-sources")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    for source in data:
        assert "name" in source
        assert "provider" in source
        assert "license" in source
        assert "spatial_resolution" in source


def test_clerk_auth_me():
    # Calling /auth/me without bearer token raises 401
    resp_unauth = client.get("/api/v1/auth/me")
    assert resp_unauth.status_code == 401

    # Calling with valid bearer token returns user profile
    headers = {"Authorization": f"Bearer {mint_test_jwt('user_test_authority', 'authority')}"}
    resp_auth = client.get("/api/v1/auth/me", headers=headers)
    assert resp_auth.status_code == 200
    data = resp_auth.json()
    assert data["role"] == "authority"
    assert "user_id" in data


def test_role_guard_authority_403_for_citizens():
    # Citizen token accessing authority endpoint gets 403 Forbidden
    citizen_headers = {"Authorization": f"Bearer {mint_test_jwt('user_test_citizen', 'citizen')}"}
    resp = client.get("/api/v1/auth/authority-only", headers=citizen_headers)
    assert resp.status_code == 403

    # Authority token gets 200 OK
    auth_headers = {"Authorization": f"Bearer {mint_test_jwt('user_test_authority', 'authority')}"}
    resp_ok = client.get("/api/v1/auth/authority-only", headers=auth_headers)
    assert resp_ok.status_code == 200
    assert resp_ok.json()["status"] == "authorized"


def test_authority_view_role_guard():
    # 7.7: Server-side role guard on authority console returning polite card for citizen
    citizen_headers = {"Authorization": f"Bearer {mint_test_jwt('user_test_citizen', 'citizen')}"}
    resp = client.get("/api/v1/auth/authority-guard", headers=citizen_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["authorized"] is False
    assert "card" in data
    assert "municipal authorities" in data["card"]["title"]
    assert data["card"]["redirect_to"] == "/app"

    # Authority account is authorized
    auth_headers = {"Authorization": f"Bearer {mint_test_jwt('user_test_authority', 'authority')}"}
    resp_auth = client.get("/api/v1/auth/authority-guard", headers=auth_headers)
    assert resp_auth.status_code == 200
    assert resp_auth.json()["authorized"] is True


import asyncio


def test_alert_threshold_dispatch():
    # Below threshold (e.g. 50 < 80) -> returns False
    did_alert_low = asyncio.run(
        maybe_alert("test@mcgm.gov.in", risk=50.0, ward="Ward A", peak="14:00")
    )
    assert did_alert_low is False

    # Above threshold (e.g. 85 >= 80) -> dispatches via active channel
    did_alert_high = asyncio.run(
        maybe_alert("test@mcgm.gov.in", risk=85.0, ward="Ward M/East", peak="14:00")
    )
    assert did_alert_high is True


def test_safe_windows_planner():
    # 45 min walking window
    res = client.get("/api/v1/planner/safe-windows?location_id=1&activity=walk&duration_min=45")
    assert res.status_code == 200
    data = res.json()
    assert "windows" in data
    assert "avoid" in data
    assert "threshold" in data
    threshold = data["threshold"]

    # Verify that every returned window sample has peak_risk < threshold
    for w in data["windows"]:
        assert w["peak_risk"] < threshold

    # 90 min exercise window
    res90 = client.get(
        "/api/v1/planner/safe-windows?location_id=1&activity=exercise&duration_min=90"
    )
    assert res90.status_code == 200
    data90 = res90.json()
    thresh_ex = data90["threshold"]
    for w in data90["windows"]:
        assert w["peak_risk"] < thresh_ex


def test_night_risk_tropical_nights():
    res = client.get("/api/v1/risk/night?location_id=1")
    assert res.status_code == 200
    data = res.json()
    assert "tropical_night" in data
    assert "guidance" in data
    assert isinstance(data["guidance"], list)
    assert len(data["guidance"]) >= 1
    if data["night_min_c"] is not None:
        assert data["tropical_night"] == (data["night_min_c"] >= 25.0)


def test_indoor_heat_archetype():
    res = client.get("/api/v1/risk/indoor?location_id=1&archetype=tin_roof_top_floor")
    assert res.status_code == 200
    data = res.json()
    assert data["method"] == "archetype_delta"
    assert "basis" in data
    assert data["indoor_now_c"] > data["outdoor_now_c"]
    assert "indoor_peak_time" in data
    assert "lag_hours" in data


def test_subscriptions_user_scoping_and_validation():
    user1_headers = {"Authorization": f"Bearer {mint_test_jwt('user_test_authority', 'authority')}"}
    user2_headers = {"Authorization": f"Bearer {mint_test_jwt('user_test_citizen', 'citizen')}"}

    # Validation: missing destination must return 422
    invalid_res = client.post(
        "/api/v1/subscriptions",
        headers=user1_headers,
        json={"channel": "email", "destination": "", "threshold": 75},
    )
    assert invalid_res.status_code == 422

    # User 1 creates subscription
    sub1_res = client.post(
        "/api/v1/subscriptions",
        headers=user1_headers,
        json={
            "ward_id": 1,
            "channel": "email",
            "destination": "officer@example.com",
            "threshold": 75,
            "language": "en",
            "quiet_hours": "22:00-06:00",
        },
    )
    assert sub1_res.status_code == 201
    sub1_data = sub1_res.json()
    sub1_id = sub1_data["id"]

    # User 2 lists subscriptions - should NOT see User 1's subscription
    user2_list = client.get("/api/v1/subscriptions", headers=user2_headers)
    assert user2_list.status_code == 200
    user2_ids = [s["id"] for s in user2_list.json()]
    assert sub1_id not in user2_ids

    # User 2 tries to delete User 1's subscription - gets 404
    del_forbidden = client.delete(f"/api/v1/subscriptions/{sub1_id}", headers=user2_headers)
    assert del_forbidden.status_code == 404

    # User 1 deletes their own subscription
    del_ok = client.delete(f"/api/v1/subscriptions/{sub1_id}", headers=user1_headers)
    assert del_ok.status_code == 204


def test_dependents_care_circle_scoping():
    user1_headers = {"Authorization": f"Bearer {mint_test_jwt('user_test_authority', 'authority')}"}
    user2_headers = {"Authorization": f"Bearer {mint_test_jwt('user_test_citizen', 'citizen')}"}

    # User 1 adds a dependent
    dep_res = client.post(
        "/api/v1/dependents",
        headers=user1_headers,
        json={
            "name": "Amma",
            "ward_id": 1,
            "age_band": "elderly",
            "phone": "+919876543210",
            "consent_note": "Informed and consented",
        },
    )
    assert dep_res.status_code == 201
    dep_id = dep_res.json()["id"]

    # User 2 lists dependents - should NOT see User 1's dependent
    user2_deps = client.get("/api/v1/dependents", headers=user2_headers)
    assert user2_deps.status_code == 200
    assert dep_id not in [d["id"] for d in user2_deps.json()]

    # Clean up
    del_dep = client.delete(f"/api/v1/dependents/{dep_id}", headers=user1_headers)
    assert del_dep.status_code == 204


def test_worker_shift_card():
    res = client.get(
        "/api/v1/worker/shift-card?location_id=1&met=6&exposure=sun&start=09:00&end=18:00"
    )
    assert res.status_code == 200
    data = res.json()
    assert "breaks" in data
    assert len(data["breaks"]) >= 2
    assert "water_ml_per_hour" in data
    assert data["water_ml_per_hour"] >= 500
    assert "disclaimer" in data
    assert "not medical advice" in data["disclaimer"].lower()
    assert "wbgt_series" in data


def test_cooling_centres_usable_details():
    res = client.get("/api/v1/cooling-centres?near_lat=19.05&near_lon=72.85")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    c = data[0]
    assert "distance_km" in c
    assert c["distance_km"] is not None
    assert "directions_url" in c
    assert "google.com/maps/dir" in c["directions_url"]
    assert "is_open_now" in c
    assert "current_status" in c
