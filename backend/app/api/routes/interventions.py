"""
Heat Action Plan interventions, greedy resource optimization, and outcome tracking.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.location import Location
from app.models.intervention_outcome import InterventionOutcome
from app.services.risk_service import RiskService
from app.services.recommendation_service import get_recommendations_for_risk

router = APIRouter(prefix="/interventions", tags=["Interventions"])

INTERVENTION_CATALOG = [
    {
        "type": "mobile_water_tankers",
        "name": "Mobile Drinking Water & Electrolyte Tanker",
        "unit_cost_inr": 25000.0,
        "risk_delta": 2.5,
        "max_units": 4,
        "description": "Rapid mobile deployment of potable cold water and ORS packets.",
    },
    {
        "type": "misting_stations",
        "name": "High-Pressure Evaporative Misting Station",
        "unit_cost_inr": 50000.0,
        "risk_delta": 4.0,
        "max_units": 3,
        "description": "Localized evaporative cooling hubs at transit terminals and dense markets.",
    },
    {
        "type": "cooling_centre_activation",
        "name": "24/7 Municipal AC Shelter & UPHC Activation",
        "unit_cost_inr": 80000.0,
        "risk_delta": 5.0,
        "max_units": 2,
        "description": "Continuous public air-conditioned shelter with hydration and paramedic care.",
    },
    {
        "type": "cool_roofs",
        "name": "High-Albedo Reflective Coating (Cool Roof)",
        "unit_cost_inr": 150000.0,
        "risk_delta": 7.5,
        "max_units": 2,
        "description": "Solar-reflective high-emissivity white coating on informal tin and concrete roofs.",
    },
]


class InterventionPlanRequest(BaseModel):
    budget_inr: float = Field(default=1000000.0, ge=50000.0, description="Total budget in INR")
    city: Optional[str] = Field(default="Mumbai", description="Target municipal corporation")
    target_ward_ids: Optional[List[int]] = Field(default=None, description="Optional target ward IDs")


@router.post("/plan")
def create_optimal_intervention_plan(
    payload: InterventionPlanRequest,
    db: Session = Depends(get_db),
):
    """
    Greedy municipal resource allocation algorithm:
    Ranks wards by composite human thermal risk, then greedily assigns interventions
    with the highest cost-effectiveness ratio (delta / cost) within the budget ceiling.
    Persists resulting deltas to intervention_outcomes.
    """
    city = payload.city or "Mumbai"
    query = db.query(Location)
    if payload.target_ward_ids:
        query = query.filter(Location.id.in_(payload.target_ward_ids))
    elif city:
        query = query.filter(Location.city.ilike(f"%{city}%"))

    candidate_locations = query.all()
    if not candidate_locations:
        candidate_locations = db.query(Location).filter(Location.level == "ward").limit(10).all()

    if not candidate_locations:
        raise HTTPException(status_code=404, detail="No candidate wards found for optimization")

    # Evaluate current risk for each candidate ward
    ward_profiles = []
    for loc in candidate_locations:
        try:
            r = RiskService.get_current_risk(db, loc.id, include_forecast=False)
            ward_profiles.append({
                "location": loc,
                "pre_score": r["risk_score"],
                "current_score": r["risk_score"],
                "units_allocated": {item["type"]: 0 for item in INTERVENTION_CATALOG},
            })
        except Exception:
            continue

    # Sort candidates descending by current risk
    ward_profiles.sort(key=lambda x: x["current_score"], reverse=True)

    remaining_budget = payload.budget_inr
    total_allocated = 0.0
    total_risk_delta = 0.0
    total_pop_protected = 0
    deployed_records = []

    # Greedy allocation loop: iteratively select ward + intervention with maximum ROI
    max_rounds = 50
    for _ in range(max_rounds):
        best_candidate = None
        best_action = None
        best_roi = -1.0

        for wp in ward_profiles:
            for item in INTERVENTION_CATALOG:
                cost = item["unit_cost_inr"]
                itype = item["type"]
                if cost <= remaining_budget and wp["units_allocated"][itype] < item["max_units"]:
                    # ROI: risk reduction pts * ward priority weight
                    priority_weight = wp["current_score"] / 50.0
                    roi = (item["risk_delta"] / cost) * priority_weight
                    if roi > best_roi:
                        best_roi = roi
                        best_candidate = wp
                        best_action = item

        if not best_candidate or not best_action:
            break

        # Allocate
        cost = best_action["unit_cost_inr"]
        delta = best_action["risk_delta"]
        itype = best_action["type"]

        remaining_budget -= cost
        total_allocated += cost
        total_risk_delta += delta
        best_candidate["units_allocated"][itype] += 1
        best_candidate["current_score"] = max(10.0, round(best_candidate["current_score"] - delta, 1))

        loc = best_candidate["location"]
        pop = loc.population or 100000
        total_pop_protected += int(pop * 0.15)  # estimated 15% direct coverage per unit

        # Persist outcome record
        outcome = InterventionOutcome(
            location_id=loc.id,
            ward_name=loc.ward_name,
            intervention_type=itype,
            allocated_units=1,
            cost_inr=cost,
            pre_risk_score=round(best_candidate["pre_score"], 1),
            post_risk_score=round(best_candidate["current_score"], 1),
            risk_delta=round(delta, 1),
            population_protected=int(pop * 0.15),
            status="deployed",
        )
        db.add(outcome)
        deployed_records.append({
            "ward_id": loc.id,
            "ward_name": loc.ward_name,
            "intervention": best_action["name"],
            "intervention_type": itype,
            "cost_inr": cost,
            "risk_reduction_pts": delta,
            "new_projected_risk": best_candidate["current_score"],
        })

    db.commit()

    return {
        "status": "success",
        "city": city,
        "total_budget_inr": payload.budget_inr,
        "allocated_budget_inr": total_allocated,
        "remaining_budget_inr": remaining_budget,
        "budget_utilization_pct": round((total_allocated / payload.budget_inr) * 100, 1),
        "total_risk_points_reduced": round(total_risk_delta, 1),
        "total_population_protected": total_pop_protected,
        "allocations_count": len(deployed_records),
        "allocations": deployed_records,
    }


@router.get("/outcomes")
def get_intervention_outcomes(
    limit: int = Query(50, ge=1, le=200),
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns recorded intervention allocations and audited pre/post risk score deltas.
    Optionally scopes to a specific city or state.
    """
    query = db.query(InterventionOutcome)
    if city or state:
        query = query.join(Location, InterventionOutcome.location_id == Location.id)
        if city:
            query = query.filter(func.lower(Location.city) == city.strip().lower())
        if state:
            query = query.filter(func.lower(Location.state) == state.strip().lower())

    records = (
        query
        .order_by(InterventionOutcome.created_at.desc())
        .limit(limit)
        .all()
    )

    total_spent = sum(r.cost_inr for r in records)
    total_delta = sum(r.risk_delta for r in records)
    total_people = sum(r.population_protected for r in records)

    return {
        "count": len(records),
        "summary": {
            "total_investment_inr": round(total_spent, 2),
            "total_risk_points_attenuated": round(total_delta, 1),
            "average_reduction_per_action": round(total_delta / max(1, len(records)), 2),
            "total_population_protected": total_people,
        },
        "records": [
            {
                "id": r.id,
                "location_id": r.location_id,
                "ward_name": r.ward_name,
                "intervention_type": r.intervention_type,
                "allocated_units": r.allocated_units,
                "cost_inr": r.cost_inr,
                "pre_risk_score": r.pre_risk_score,
                "post_risk_score": r.post_risk_score,
                "risk_delta": r.risk_delta,
                "population_protected": r.population_protected,
                "status": r.status,
                "created_at": r.created_at.isoformat(),
            }
            for r in records
        ],
    }


@router.get("/{location_id}")
def get_interventions_for_location(location_id: int, db: Session = Depends(get_db)):
    """
    Returns rule-based Heat Action Plan recommendations tailored to the ward's
    current risk band and dominant vulnerability drivers.
    """
    risk_info = RiskService.get_current_risk(db, location_id)
    top_driver = risk_info["factor_breakdown"][0]["name"] if risk_info["factor_breakdown"] else "Thermal Hazard"

    recs = get_recommendations_for_risk(
        risk_band=risk_info["band"],
        top_driver=top_driver,
    )

    return {
        "location_id": location_id,
        "city": risk_info["city"],
        "ward_name": risk_info["ward_name"],
        "risk_score": risk_info["risk_score"],
        "band": risk_info["band"],
        "band_label": risk_info["band_label"],
        "dominant_driver": top_driver,
        "recommendations": recs,
    }
