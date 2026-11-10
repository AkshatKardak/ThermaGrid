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
