"""
Spatial analytics package for ThermaGrid.
"""

from .ward_joins import haversine_distance_km, point_in_polygon_ray_casting, find_nearest_cooling_centres
from .uhi import estimate_uhi_intensity
from .hotspots import compute_ward_hotspots

__all__ = [
    "haversine_distance_km",
    "point_in_polygon_ray_casting",
    "find_nearest_cooling_centres",
    "estimate_uhi_intensity",
    "compute_ward_hotspots",
]
