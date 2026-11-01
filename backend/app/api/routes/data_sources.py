"""
Data Sources and Provenance Registry endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.data_source import DataSource
from app.schemas.data_source import DataSourceOut

router = APIRouter(prefix="/data-sources", tags=["Data Sources"])


@router.get("", response_model=List[DataSourceOut])
def list_data_sources(db: Session = Depends(get_db)):
    """
    Returns full metadata and provenance for all meteorological, demographic,
    and GIS datasets integrated into ThermaGrid.
    """
    return db.query(DataSource).all()
