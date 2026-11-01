"""
What-If Microclimate and Urban Intervention Simulation Engine.
Computes projected risk reduction, UHI mitigation, and population protected
when urban heat resilience interventions are applied.
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.location import Location
from app.services.risk_service import RiskService
from app.services.thermal_service import ThermalService
from app.schemas.provenance import create_provenance


class SimulationService:
    @staticmethod
    def run_scenario(
        db: Session,
        location_id: int,
        green_cover_expansion_pct: float = 0.0,
        cool_roofs_adoption_pct: float = 0.0,
        misting_shelters_count: int = 0,
        shift_outdoor_hours_by: int = 0,
    ) -> Dict[str, Any]:
        """
        Simulates microclimate interventions on a ward:
        - Cool roofs reduce roof surface temperature by 15-20°C and local UHI by up to 1.5°C.
        - Urban tree canopy provides shade and evapotranspiration (up to 2.0°C reduction).
        - Misting shelters provide localized evaporative cooling (2-3°C WBGT drop in immediate zone).
        - Shifted outdoor labor hours reduce direct peak-sun worker exposure.
        """
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise ValueError(f"Location ID {location_id} not found.")

        # Baseline metrics
        baseline_risk = RiskService.get_current_risk(db, location_id)
        baseline_thermal = ThermalService.get_current_thermal_indices(db, location_id)

        # Microclimate physical simulation calculations
        # Cool roof effect: delta_T_uhi ≈ cool_roofs_fraction * 1.8°C
        cool_roof_frac = min(1.0, max(0.0, cool_roofs_adoption_pct / 100.0))
        uhi_roof_reduction = cool_roof_frac * 1.6

        # Canopy effect: delta_T_canopy ≈ canopy_expansion * 2.2°C
        canopy_frac = min(0.5, max(0.0, green_cover_expansion_pct / 100.0))
        uhi_canopy_reduction = canopy_frac * 2.4

        # Total estimated ambient temperature reduction
        total_uhi_reduction = round(uhi_roof_reduction + uhi_canopy_reduction, 2)

        # WBGT reduction from shading + ambient drop
        wbgt_drop = round(total_uhi_reduction * 0.75 + (misting_shelters_count * 0.15), 2)
        simulated_wbgt = round(max(20.0, baseline_thermal["wbgt_c"] - wbgt_drop), 2)

        # Shifted hours reduce effective worker exposure by 20% per hour shifted away from peak
        worker_exposure_reduction = min(0.5, shift_outdoor_hours_by * 0.15)

        # Impact on composite risk score
        risk_reduction = (
            (wbgt_drop * 4.2)
            + (cool_roof_frac * 8.5)
            + (canopy_frac * 12.0)
            + (misting_shelters_count * 1.8)
            + (worker_exposure_reduction * 15.0)
        )
        simulated_score = round(max(5.0, baseline_risk["risk_score"] - risk_reduction), 1)
        actual_reduction = round(baseline_risk["risk_score"] - simulated_score, 1)

        # Population benefiting directly
        pop_benefiting = int(location.population * (cool_roof_frac * 0.45 + canopy_frac * 0.5 + 0.15))
        pop_benefiting = min(location.population, max(500, pop_benefiting))

        # Plausible uncertainty range (+/- 25%)
        range_low = round(max(0.0, actual_reduction * 0.75), 1)
        range_high = round(actual_reduction * 1.25, 1)

        assumptions: List[str] = [
            f"Cool roof albedo assumed >= 0.70 with {cool_roofs_adoption_pct:.0f}% compliant roof area.",
            f"Urban tree canopy expansion of {green_cover_expansion_pct:.0f}% with mature crown transpiration.",
            f"{misting_shelters_count} localized misting shelters operating at 100% capacity during peak hours.",
            f"Outdoor work schedule shifted by {shift_outdoor_hours_by} hour(s) to avoid peak solar irradiance (12:00 - 15:00).",
        ]

        disclaimer = "SIMULATION ESTIMATE: Microclimate perturbation outputs carry theoretical uncertainty bounds and do not represent validated physical field sensor recordings."

        return {
            "location_id": location.id,
            "city": location.city,
            "ward_name": location.ward_name,
            "baseline_risk_score": baseline_risk["risk_score"],
            "simulated_risk_score": simulated_score,
            "risk_reduction_points": actual_reduction,
            "range_low": range_low,
            "range_high": range_high,
            "assumptions": assumptions,
            "baseline_wbgt_c": baseline_thermal["wbgt_c"],
            "simulated_wbgt_c": simulated_wbgt,
            "estimated_uhi_reduction_c": total_uhi_reduction,
            "population_protected_count": pop_benefiting,
            "is_demo": True,
            "is_model_backed": False,
            "demo_label": "DEMO DATA (Urban Resilience What-If Simulation)",
            "disclaimer": disclaimer,
            "provenance": create_provenance(
                source="synthetic",
                is_synthetic=True,
                is_model_backed=False,
                completeness=1.0,
                quality_score=0.90,
            ),
        }
