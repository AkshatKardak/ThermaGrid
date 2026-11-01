"""
Spatial analytics module: Ward boundaries, point-in-polygon assignment,
and spatial aggregation.
"""

from typing import List, Dict, Any, Optional, Tuple
import math


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates in kilometers.
    """
    r = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def point_in_polygon_ray_casting(
    point: Tuple[float, float],
    polygon_coords: List[Tuple[float, float]],
) -> bool:
    """
    Standard Jordan curve theorem / ray casting algorithm to check if
    (lat, lon) is inside a polygon.
    polygon_coords: list of (lat, lon) tuples.
    """
    x, y = point[0], point[1]
    n = len(polygon_coords)
    inside = False

    p1x, p1y = polygon_coords[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon_coords[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y

    return inside


def find_nearest_cooling_centres(
    user_lat: float,
    user_lon: float,
    centres: List[Dict[str, Any]],
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Finds and ranks nearest cooling centres/shelters to a given location.
    """
    results = []
    for c in centres:
        c_lat = c.get("latitude")
        c_lon = c.get("longitude")
        if c_lat is not None and c_lon is not None:
            dist = round(haversine_distance_km(user_lat, user_lon, c_lat, c_lon), 2)
            c_copy = dict(c)
            c_copy["distance_km"] = dist
            results.append(c_copy)

    results.sort(key=lambda x: x["distance_km"])
    return results[:limit]
