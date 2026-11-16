"""
Reports and compliance exports API route.
"""

from fastapi import APIRouter, Query, Response

from app.services.reports.hap_report import generate_hap_compliance_pdf

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/hap")
def get_hap_compliance_report(
    from_date: str | None = Query(
        None, alias="from", description="Start date YYYY-MM-DD or DD Month YYYY"
    ),
    to_date: str | None = Query(
        None, alias="to", description="End date YYYY-MM-DD or DD Month YYYY"
    ),
    city: str = Query("Mumbai", description="City municipal corporation"),
):
    """
    Generates and returns an institutional one-page Heat Action Plan (HAP)
    compliance audit report as a downloadable / viewable PDF document.
    """
    pdf_bytes = generate_hap_compliance_pdf(
        from_date=from_date,
        to_date=to_date,
        city=city,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="HAP_Compliance_Report_{city}.pdf"',
            "Content-Type": "application/pdf",
        },
    )
