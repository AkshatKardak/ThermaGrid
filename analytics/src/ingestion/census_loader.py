"""
Demographic and socio-economic vulnerability data loader.
Sources: Census of India, NFHS-5, Slum Rehabilitation Authority, Municipal Corporations.
"""

from typing import Dict, Any, List, Optional


# Representative ward benchmarks for key Indian metropolitan areas
METROPOLITAN_WARD_BENCHMARKS = [
    {
        "city": "Mumbai",
        "ward_code": "WARD_ME",
        "ward_name": "Ward M/East (Govandi / Shivaji Nagar)",
        "latitude": 19.0558,
        "longitude": 72.9315,
        "population": 807720,
        "area_sq_km": 14.5,
        "population_density": 55705,
        "outdoor_worker_ratio": 0.42,
        "informal_settlement_ratio": 0.68,
        "tree_canopy_fraction": 0.04,
        "elderly_ratio": 0.065,
        "children_ratio": 0.098,
        "cooling_access_deficit": 0.75,
        "hospital_count": 3,
        "drinking_water_deficit": 0.58,
        "characteristics": "High tin-roof slum density, near Deonar landfill, severe canopy deficit, heavy concentration of informal waste pickers and street vendors.",
    },
    {
        "city": "Mumbai",
        "ward_code": "WARD_A",
        "ward_name": "Ward A (Colaba / Fort / Nariman Point)",
        "latitude": 18.9220,
        "longitude": 72.8347,
        "population": 185120,
        "area_sq_km": 12.5,
        "population_density": 14810,
        "outdoor_worker_ratio": 0.16,
        "informal_settlement_ratio": 0.08,
        "tree_canopy_fraction": 0.32,
        "elderly_ratio": 0.115,
        "children_ratio": 0.052,
        "cooling_access_deficit": 0.22,
        "hospital_count": 8,
        "drinking_water_deficit": 0.12,
        "characteristics": "Coastal sea breeze buffer, heritage stone buildings, high tree cover, affluent commercial and residential district.",
    },
    {
        "city": "Mumbai",
        "ward_code": "WARD_HE",
        "ward_name": "Ward H/East (Bandra East / Khar East)",
        "latitude": 19.0607,
        "longitude": 72.8536,
        "population": 557233,
        "area_sq_km": 13.5,
        "population_density": 41276,
        "outdoor_worker_ratio": 0.34,
        "informal_settlement_ratio": 0.54,
        "tree_canopy_fraction": 0.09,
        "elderly_ratio": 0.075,
        "children_ratio": 0.082,
        "cooling_access_deficit": 0.62,
        "hospital_count": 5,
        "drinking_water_deficit": 0.45,
        "characteristics": "High transit density (Bandra Terminus), mixed informal settlements along railway corridors, Western Express Highway asphalt heat retention.",
    },
    {
        "city": "Mumbai",
        "ward_code": "WARD_KW",
        "ward_name": "Ward K/West (Andheri West / Juhu / Versova)",
        "latitude": 19.1197,
        "longitude": 72.8468,
        "population": 749360,
        "area_sq_km": 23.4,
        "population_density": 32024,
        "outdoor_worker_ratio": 0.24,
        "informal_settlement_ratio": 0.30,
        "tree_canopy_fraction": 0.18,
        "elderly_ratio": 0.090,
        "children_ratio": 0.065,
        "cooling_access_deficit": 0.38,
        "hospital_count": 11,
        "drinking_water_deficit": 0.25,
        "characteristics": "Mixed high-rise and dense coastal fishing villages; moderate green cover along Juhu belt.",
    },
    {
        "city": "Delhi",
        "ward_code": "WARD_CC",
        "ward_name": "Chandni Chowk / Old Delhi",
        "latitude": 28.6506,
        "longitude": 77.2303,
        "population": 360000,
        "area_sq_km": 5.2,
        "population_density": 69230,
        "outdoor_worker_ratio": 0.48,
        "informal_settlement_ratio": 0.45,
        "tree_canopy_fraction": 0.03,
        "elderly_ratio": 0.088,
        "children_ratio": 0.085,
        "cooling_access_deficit": 0.70,
        "hospital_count": 4,
        "drinking_water_deficit": 0.52,
        "characteristics": "Hyper-dense commercial bazaar, zero vegetation, extreme thermal mass from brick/concrete, high concentration of head-loaders and rickshaw pullers.",
    },
    {
        "city": "Delhi",
        "ward_code": "WARD_ROHINI",
        "ward_name": "Rohini Sector 16-20",
        "latitude": 28.7383,
        "longitude": 77.1086,
        "population": 420000,
        "area_sq_km": 16.8,
        "population_density": 25000,
        "outdoor_worker_ratio": 0.22,
        "informal_settlement_ratio": 0.15,
        "tree_canopy_fraction": 0.15,
        "elderly_ratio": 0.095,
        "children_ratio": 0.070,
        "cooling_access_deficit": 0.35,
        "hospital_count": 6,
        "drinking_water_deficit": 0.20,
        "characteristics": "Planned residential DDA sectors with broad roads, asphalt heating, and suburban parks.",
    },
]


def get_ward_demographics(ward_code: str) -> Optional[Dict[str, Any]]:
    for w in METROPOLITAN_WARD_BENCHMARKS:
        if w["ward_code"] == ward_code:
            return w
    return None


def list_all_wards() -> List[Dict[str, Any]]:
    return METROPOLITAN_WARD_BENCHMARKS
