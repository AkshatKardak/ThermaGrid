"""
Heat Action Plan interventions and SOP directives by location.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.risk_service import RiskService
from app.services.recommendation_service import get_recommendations_for_risk

router = APIRouter(prefix="/interventions", tags=["Interventions"])


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
