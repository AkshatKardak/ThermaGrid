"""
Urban Heat Resilience What-If Simulation endpoint.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.simulation_service import SimulationService
from app.schemas.risk import SimulationScenarioRequest, SimulationScenarioResponse

router = APIRouter(prefix="/simulation", tags=["Simulation"])


@router.post("", response_model=SimulationScenarioResponse)
def run_simulation(
    scenario: SimulationScenarioRequest,
    db: Session = Depends(get_db),
):
    """
    Simulates the impact of cool roofs, green tree canopy expansion, misting hubs,
    and outdoor labor work-hour shifts on ward thermal risk.
    """
    return SimulationService.run_scenario(
        db=db,
        location_id=scenario.location_id,
        green_cover_expansion_pct=scenario.green_cover_expansion_pct,
        cool_roofs_adoption_pct=scenario.cool_roofs_adoption_pct,
        misting_shelters_count=scenario.misting_shelters_count,
        shift_outdoor_hours_by=scenario.shift_outdoor_hours_by,
    )
