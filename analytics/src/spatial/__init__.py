"""
Spatial analytics package for ThermaGrid.
"""

from .hotspots import compute_ward_hotspots
from .uhi import estimate_uhi_intensity
from .ward_joins import (
    find_nearest_cooling_centres,
    haversine_distance_km,
    point_in_polygon_ray_casting,
)

__all__ = [
    "compute_ward_hotspots",
    "estimate_uhi_intensity",
    "find_nearest_cooling_centres",
    "haversine_distance_km",
    "point_in_polygon_ray_casting",
]
