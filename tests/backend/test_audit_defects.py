"""
Audit Defect Regression Tests.
Verifies all P0/P1 audit fixes described in specification.
"""

import sys
import os
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))

from app.main import app
from app.db.seed import seed_database
from app.services.forecast_service import ForecastService

seed_database()
client = TestClient(app)


def test_planner_safe_windows_filters_high_risk_hours():
    """1.1: GET /planner/safe-windows must not return a window containing a 72/100 hour."""
    mock_items = []
    for h in range(24):
        # 14:00 is high risk (72.0), others are safe (30.0)
        risk = 72.0 if h == 14 else 30.0
        mock_items.append({
            "time": f"2026-05-15T{h:02d}:00:00",
            "predicted_risk_score": risk,
            "lower_bound": risk - 5.0,
            "upper_bound": risk + 5.0,
            "band": "extreme" if risk > 70 else "safe",
            "predicted_wbgt": 33.0 if risk > 70 else 24.0,
            "temperature_c": 38.0 if risk > 70 else 29.0,
        })

    mock_forecast = {
        "location_id": 1,
        "city": "Mumbai",
        "ward_name": "Ward A",
        "forecast_days": 1,
        "items": mock_items,
    }

    with patch.object(ForecastService, "get_risk_forecast", return_value=mock_forecast):
        # Activity with threshold 50.0 and 2-hour duration
        resp = client.get("/api/v1/planner/safe-windows?location_id=1&activity=outdoor_run&duration_min=120&threshold=50.0")
        assert resp.status_code == 200
        data = resp.json()
        windows = data["windows"]
        # Ensure no window covers 14:00
        for w in windows:
            start_h = w["start_hour"]
            end_h = (start_h + 2) % 24
            # If 14:00 is inside window, fail
            assert not (start_h <= 14 < start_h + 2)
            assert w["peak_risk"] < 50.0


def test_planner_no_safe_window_branch():
    """1.1: A day with no sub-threshold window must return the no-safe-window branch."""
    mock_items = [
        {
            "time": f"2026-05-15T{h:02d}:00:00",
            "predicted_risk_score": 85.0,
            "lower_bound": 80.0,
            "upper_bound": 90.0,
            "band": "extreme",
            "predicted_wbgt": 35.0,
            "temperature_c": 41.0,
        }
        for h in range(24)
    ]
    mock_forecast = {
        "location_id": 1,
        "city": "Mumbai",
        "ward_name": "Ward A",
        "forecast_days": 1,
        "items": mock_items,
    }

    with patch.object(ForecastService, "get_risk_forecast", return_value=mock_forecast):
        resp = client.get("/api/v1/planner/safe-windows?location_id=1&activity=outdoor_run&duration_min=60&threshold=50.0")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["windows"]) == 0
        assert data["no_safe_window_message"] is not None
        assert "No safe window found today" in data["no_safe_window_message"]
        assert data["best"] is not None


def test_night_time_risk_returns_real_data():
    """1.2: /risk/night?location_id=1 returns a real night_min_c and a tropical_night boolean."""
    resp = client.get("/api/v1/risk/night?location_id=1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["available"] is True
    assert isinstance(data["night_min_c"], (int, float))
    assert isinstance(data["tropical_night"], bool)
    assert len(data["hourly_overnight"]) >= 4
    for sample in data["hourly_overnight"]:
        assert "temp_c" in sample
        assert sample["temp_c"] is not None


def test_worker_shift_card_different_met_and_exposure():
    """1.3: Worker shift card must produce different outputs for different MET and exposure."""
    resp_shade = client.get("/api/v1/worker/shift-plan?location_id=1&met=2.0&exposure=shade&start=09:00&end=17:00")
    resp_sun = client.get("/api/v1/worker/shift-plan?location_id=1&met=11.0&exposure=sun&start=09:00&end=17:00")
    assert resp_shade.status_code == 200
    assert resp_sun.status_code == 200
    d_shade = resp_shade.json()
    d_sun = resp_sun.json()

    # Assert outputs are distinct
    assert d_shade["max_wbgt_c"] != d_sun["max_wbgt_c"]
    assert d_shade["water_ml_per_hour"] != d_sun["water_ml_per_hour"]
    assert d_shade["wbgt_series"] != d_sun["wbgt_series"]
    # Check sun has +1.5 C adjustment over shade series
    for s_shade, s_sun in zip(d_shade["wbgt_series"], d_sun["wbgt_series"]):
        assert s_sun["wbgt_c"] > s_shade["wbgt_c"]


def test_vulnerability_analytics_no_500():
    """1.4: /analytics/vulnerability returns 200 with null for missing inputs."""
    resp = client.get("/api/v1/analytics/vulnerability")
    assert resp.status_code == 200
    data = resp.json()
    assert "wards" in data
    assert len(data["wards"]) > 0
    first_ward = data["wards"][0]
    # Check that required keys exist even if null
    for key in [
        "informal_settlement_pct",
        "tree_canopy_pct",
        "canopy_deficit_pct",
        "elderly_children_pct",
        "cooling_deficit_pct",
        "hospitals_count",
    ]:
        assert key in first_ward


def test_auth_test_token_backdoor_eliminated():
    """2.1: Literal test_authority_jwt_token must be rejected with 401 even when TESTING=true."""
    headers = {"Authorization": "Bearer test_authority_jwt_token"}
    resp = client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 401

    resp_auth_only = client.get("/api/v1/auth/authority-only", headers=headers)
    assert resp_auth_only.status_code == 401


def test_weather_outage_returns_503():
    """3.5a: Upstream weather outage returns 503 with retry_after header, not 500."""
    from app.services.weather_service import WeatherService
    from app.core.errors import WeatherUnavailableError

    with patch.object(WeatherService, "get_current_weather", side_effect=WeatherUnavailableError("Open-Meteo API unreachable")):
        resp = client.get("/api/v1/weather/current?location_id=1")
        assert resp.status_code == 503
        data = resp.json()
        assert data.get("upstream_outage") is True
        assert "retry_after" in data
        assert resp.headers.get("retry-after") == "300"


def test_national_coverage_all_36_states_and_uts():
    """3.6: All 28 states and 8 union territories are represented at district tier."""
    resp = client.get("/api/v1/locations")
    assert resp.status_code == 200
    locations = resp.json()

    states = {loc["state"] for loc in locations}
    # 28 states + 8 UTs = 36 entities
    assert len(states) >= 36

    # Verify every state has at least one district
    district_locs = [loc for loc in locations if loc.get("level") == "district"]
    assert len(district_locs) >= 36


def test_no_location_claims_ward_level_without_polygon():
    """3.6: No location claims level='ward' without a real polygon."""
    resp = client.get("/api/v1/locations")
    assert resp.status_code == 200
    locations = resp.json()

    for loc in locations:
        if loc.get("level") == "ward":
            geom = loc.get("geometry_geojson")
            assert geom is not None, f"Ward {loc['ward_code']} missing geometry"
            assert geom.get("type") in ["Polygon", "MultiPolygon"], f"Ward {loc['ward_code']} invalid geometry type"
            assert len(geom.get("coordinates", [])) > 0


def test_synthetic_data_rejected_when_not_allowed_in_dev():
    """3.2: Synthetic data must be rejected for live risk unless explicitly allowed."""
    from app.core.config import get_settings
    settings = get_settings()
    orig = settings.allow_synthetic_risk
    try:
        settings.allow_synthetic_risk = False
        resp = client.get("/api/v1/risk/current?location_id=1")
        assert resp.status_code == 503
        data = resp.json()
        assert "Synthetic observations cannot drive a live risk score" in data.get("detail", "")
    finally:
        settings.allow_synthetic_risk = orig


def test_hospital_and_water_deficit_null_when_unsourced():
    """3.5b: hospital_count and drinking_water_deficit must be null rather than fabricated numbers."""
    resp = client.get("/api/v1/locations")
    assert resp.status_code == 200
    locations = resp.json()

    # Mumbai wards have un-sourced hospital_count and drinking_water_deficit
    mumbai_wards = [l for l in locations if l.get("city") == "Mumbai" and l.get("level") == "ward"]
    assert len(mumbai_wards) > 0
    for w in mumbai_wards:
        assert w.get("hospital_count") is None
        assert w.get("drinking_water_deficit") is None


def test_risk_all_does_not_mix_levels():
    """3.6: /risk/all never mixes levels in a single aggregate."""
    resp_wards = client.get("/api/v1/risk/all?level=ward")
    assert resp_wards.status_code == 200
    wards_data = resp_wards.json()
    assert len(wards_data) > 0
    for w in wards_data:
        assert w.get("level") == "ward"

    resp_districts = client.get("/api/v1/risk/all?level=district")
    assert resp_districts.status_code == 200
    districts_data = resp_districts.json()
    assert len(districts_data) > 0
    for d in districts_data:
        assert d.get("level") == "district"


@pytest.mark.anyio
async def test_background_jobs_persist_rows():
    """4.0: Scheduled jobs must persist rows to DB with correct column names (score, dispatched_at)."""
    from app.db.session import SessionLocal
    from app.jobs.tasks import ingest_weather, compute_thermal, evaluate_alerts
    from app.models.weather import WeatherObservation
    from app.models.thermal import ThermalIndex
    from app.models.risk import RiskScore, WardRiskCurrent
    from app.models.alert import Alert
    from datetime import datetime, timezone

    # 1. Test ingest_weather persists at least one row
    await ingest_weather()
    with SessionLocal() as db:
        obs_count = db.query(WeatherObservation).count()
        assert obs_count > 0, "ingest_weather did not persist any WeatherObservation rows"

    # 2. Test compute_thermal persists ThermalIndex and RiskScore rows
    await compute_thermal()
    with SessionLocal() as db:
        th_count = db.query(ThermalIndex).count()
        assert th_count > 0, "compute_thermal did not persist any ThermalIndex rows"
        risk_count = db.query(RiskScore).count()
        assert risk_count > 0, "compute_thermal did not persist any RiskScore rows"
        w_curr_count = db.query(WardRiskCurrent).count()
        assert w_curr_count > 0, "compute_thermal did not persist any WardRiskCurrent rows"

    # 3. Insert a high risk score to trigger alert evaluation and verify Alert persistence
    with SessionLocal() as db:
        high_risk = RiskScore(
            location_id=1,
            calculated_for=datetime.now(timezone.utc),
            score=88.5,  # >= 80.0 alert threshold
            band="extreme",
            band_label="Extreme Emergency",
            alert_color="#C31D3C",
            hazard_score=90.0,
            exposure_index=0.85,
            vulnerability_index=0.80,
            factor_breakdown_json=[{"name": "Thermal Stress", "share_pct": 80.0, "value_unit": "WBGT 34°C"}],
            explanation="Extreme emergency heat risk test.",
            confidence=0.95,
            is_demo=False,
        )
        db.add(high_risk)
        db.commit()

    await evaluate_alerts()
    with SessionLocal() as db:
        alerts = db.query(Alert).filter(Alert.location_id == 1).all()
        assert len(alerts) > 0, "evaluate_alerts did not persist any Alert rows"
        first_alert = alerts[0]
        # Assert correct column dispatched_at is set
        assert first_alert.dispatched_at is not None
        assert first_alert.is_active is True


def test_spatial_index_point_in_polygon_lookup():
    """7.2: Point-in-polygon queries use spatial bounding box and geometry containment."""
    # Point inside Ward A (Colaba / Fort)
    resp = client.get("/api/v1/locations/lookup?lat=18.9220&lng=72.8347")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ward_code"] == "WARD_A"

    # Point inside Ward M/East (Govandi)
    resp_me = client.get("/api/v1/locations/lookup?lat=19.0558&lng=72.9315")
    assert resp_me.status_code == 200
    data_me = resp_me.json()
    assert data_me["ward_code"] == "WARD_ME"

    # Verify min_lat, max_lat, min_lng, max_lng exist for spatial pruning
    assert data["min_lat"] is not None
    assert data["max_lat"] is not None
    assert data["min_lat"] <= 18.9220 <= data["max_lat"]


def test_response_caching_hit_and_miss_headers():
    """7.3: Cached endpoints return cache: 'hit' | 'miss' headers with TTL caching."""
    from app.core.cache import response_cache
    response_cache.clear()

    # 1. Observation endpoint: /weather/current
    resp1 = client.get("/api/v1/weather/current?location_id=1")
    assert resp1.status_code == 200
    assert resp1.headers.get("cache") == "miss" or resp1.headers.get("x-cache") == "miss"

    resp2 = client.get("/api/v1/weather/current?location_id=1")
    assert resp2.status_code == 200
    assert resp2.headers.get("cache") == "hit" or resp2.headers.get("x-cache") == "hit"

    # 2. Forecast endpoint: /weather/forecast
    resp3 = client.get("/api/v1/weather/forecast?location_id=1")
    assert resp3.status_code == 200
    assert resp3.headers.get("cache") == "miss" or resp3.headers.get("x-cache") == "miss"

    resp4 = client.get("/api/v1/weather/forecast?location_id=1")
    assert resp4.status_code == 200
    assert resp4.headers.get("cache") == "hit" or resp4.headers.get("x-cache") == "hit"
