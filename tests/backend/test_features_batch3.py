from fastapi.testclient import TestClient
from app.main import app
import pytest

client = TestClient(app)

def test_risk_current_imd_and_countdown_fields():
    resp = client.get("/api/v1/risk/current?location_id=1")
    assert resp.status_code == 200
    data = resp.json()
    assert "imd_grade" in data
    assert "imd_label" in data
    assert "consecutive_hot_days" in data
    assert "consecutive_hot_nights" in data
    assert "hours_to_threshold" in data
    assert isinstance(data["imd_grade"], str)
    assert isinstance(data["imd_label"], str)


def test_cooling_centre_gap_analysis():
    resp = client.get("/api/v1/analytics/cooling-gap")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_wards" in data
    assert "wards_with_gap" in data
    assert "gap_percentage" in data
    assert "results" in data
    assert len(data["results"]) > 0
    first = data["results"][0]
    assert "ward_name" in first
    assert "nearest_centre_km" in first
    assert "centres_within_2km" in first
    assert "gap_flag" in first
    assert isinstance(first["gap_flag"], bool)


def test_worker_shift_card_with_clothing_and_acclimatisation():
    resp = client.get("/api/v1/worker/shift-card?location_id=1&activity=heavy&exposure=direct_sun&clothing=heavy&acclimatised=false")
    assert resp.status_code == 200
    data = resp.json()
    assert data["clothing"] == "heavy"
    assert data["acclimatised"] is False
    assert "breaks" in data
    assert "water_ml_per_hour" in data
    assert len(data["breaks"]) > 0


def test_intervention_plan_greedy_and_outcomes():
    payload = {
        "budget_inr": 500000,
        "available_cooling_buses": 3,
        "mist_canons": 2,
        "cool_roof_paint_sqm": 2000
    }
    resp = client.post("/api/v1/interventions/plan", json=payload)
    assert resp.status_code == 200
    plan = resp.json()
    assert "allocations" in plan
    assert "allocated_budget_inr" in plan
    assert "total_risk_points_reduced" in plan
    assert plan["allocated_budget_inr"] <= payload["budget_inr"]

    # Test history outcomes endpoint
    hist_resp = client.get("/api/v1/interventions/outcomes")
    assert hist_resp.status_code == 200
    outcomes = hist_resp.json()
    assert "count" in outcomes
    assert "records" in outcomes
    assert outcomes["count"] > 0
    assert "intervention_type" in outcomes["records"][0]
    assert "risk_delta" in outcomes["records"][0]


def test_hap_compliance_report():
    resp = client.get("/api/v1/reports/hap?from=2024-05-01&to=2024-05-31")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert len(resp.content) > 100
    assert resp.content.startswith(b"%PDF")


def test_alerts_test_sms_endpoint():
    resp = client.post("/api/v1/alerts/test-sms")
    assert resp.status_code in (200, 429)
    data = resp.json()
    assert "success" in data
