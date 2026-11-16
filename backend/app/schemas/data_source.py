"""
Pydantic schemas for Data Sources and Provenance.
"""

from pydantic import BaseModel, ConfigDict


class DataSourceOut(BaseModel):
    id: int
    name: str
    provider: str
    url: str
    spatial_resolution: str
    temporal_resolution: str
    date_range: str
    license: str
    variables: str
    update_frequency: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)
