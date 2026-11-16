"""
Hyperlocal Risk Scoring Model.
Composes Hazard (thermal stress) × Exposure (population, outdoor workers)
× Vulnerability (demographics, informal settlement, vegetative deficit, cooling access)
into a normalized 0-100 score, factor contributions, and deterministic explanations.

Citations:
1. IPCC AR6 WGII Chapter 16: Key Risks Across Sectors and Regions (Hazard-Exposure-Vulnerability framework).
2. National Disaster Management Authority (NDMA), Government of India (2020):
   National Guidelines for Preparation of Action Plan - Prevention and Management of Heat Wave.
3. WHO/WMO (2015): Heatwaves and Health: Guidance on Warning-System Development.
"""

from typing import Any


def compute_thermal_hazard_score(wbgt_c: float) -> float:
    """
    Thermal hazard from WBGT ONLY.

    WBGT is the single occupational heat-stress standard (ISO 7243) and is the
    metric the rest of the pipeline is validated against. UTCI and Heat Index
    share temperature/humidity inputs with WBGT; summing them into one hazard
    score double-counts the same physical signal. They are returned as
    diagnostics (see compute_composite_risk), never added to the composite.
    """
    wbgt_norm = max(0.0, min(100.0, (wbgt_c - 22.0) * (100.0 / 12.0)))
    return round(wbgt_norm, 2)


def compute_exposure_index(
    population_density_per_km2: float,
    outdoor_worker_ratio: float,
) -> float:
    """
    Computes exposure index (0.0 - 1.0) based on population density and
    fraction of outdoor workforce (construction, street hawking, sanitation, delivery).
    """
    # Max reference urban density: 60,000 / km² (e.g. dense Mumbai/Delhi wards)
    dens_norm = min(1.0, max(0.0, population_density_per_km2 / 50000.0))
    worker_norm = min(1.0, max(0.0, outdoor_worker_ratio))

    exposure = (0.55 * dens_norm) + (0.45 * worker_norm)
    return round(exposure, 4)


def compute_vulnerability_index(
    elderly_ratio: float,  # fraction age >= 65
    children_ratio: float,  # fraction age <= 5
    informal_settlement_ratio: float,  # slum / tin-roof / poorly insulated housing
    vegetation_deficit_ratio: float,  # 1.0 - NDVI or tree canopy cover deficit
    cooling_access_deficit: float,  # fraction of ward lacking AC / cooling center proximity
) -> float:
    """
    Computes vulnerability index (0.0 - 1.0) combining physiological vulnerability,
    housing quality / microclimate surface characteristics, and adaptive capacity deficit.
    """
    # Age vulnerability (0.0 to ~0.35 in Indian urban demographics)
    demo_vuln = min(1.0, (elderly_ratio * 3.5) + (children_ratio * 2.5))

    # Built-environment & microclimate vulnerability
    housing_vuln = min(1.0, max(0.0, informal_settlement_ratio))
    veg_deficit = min(1.0, max(0.0, vegetation_deficit_ratio))

    # Adaptive capacity deficit
    cool_deficit = min(1.0, max(0.0, cooling_access_deficit))

    vulnerability = (
        (0.25 * demo_vuln) + (0.35 * housing_vuln) + (0.20 * veg_deficit) + (0.20 * cool_deficit)
    )
    return round(vulnerability, 4)


def compute_composite_risk(
    temp_c: float,
    wbgt_c: float,
    utci_c: float,
    heat_index_c: float,
    population_density_per_km2: float,
    outdoor_worker_ratio: float,
    elderly_ratio: float = 0.08,
    children_ratio: float = 0.07,
    informal_settlement_ratio: float = 0.20,
    vegetation_deficit_ratio: float = 0.50,
    cooling_access_deficit: float = 0.40,
    weight_hazard: float = 0.50,
    weight_exposure: float = 0.25,
    weight_vulnerability: float = 0.25,
    is_demo: bool = False,
) -> dict[str, Any]:
    """
    Evaluates comprehensive ward-level human thermal risk score (0 - 100),
    computes factor contribution percentages, and constructs an evidence-based
    deterministic natural-language explanation.
    """
    # utci_c, heat_index_c, temp_c retained for diagnostics only — not part of the composite.
    hazard = compute_thermal_hazard_score(wbgt_c)  # WBGT only
    exposure = compute_exposure_index(population_density_per_km2, outdoor_worker_ratio)
    vulnerability = compute_vulnerability_index(
        elderly_ratio,
        children_ratio,
        informal_settlement_ratio,
        vegetation_deficit_ratio,
        cooling_access_deficit,
    )
    adaptive_capacity = round(100.0 * (1.0 - cooling_access_deficit), 2)

    # Normalize exposure and vulnerability to 0-100 scale
    exp_100 = exposure * 100.0
    vuln_100 = vulnerability * 100.0

    raw_score = (
        (weight_hazard * hazard) + (weight_exposure * exp_100) + (weight_vulnerability * vuln_100)
    )
    score = round(max(0.0, min(100.0, raw_score)), 1)

    # Risk Band classification
    if score < 25.0:
        band = "safe"
        band_label = "Low / Safe"
        alert_color = "#2FA37C"
    elif 25.0 <= score < 50.0:
        band = "moderate"
        band_label = "Moderate"
        alert_color = "#E8C547"
    elif 50.0 <= score < 70.0:
        band = "high"
        band_label = "High Risk"
        alert_color = "#F59E0B"
    elif 70.0 <= score < 85.0:
        band = "veryhigh"
        band_label = "Very High Risk"
        alert_color = "#FF704F"
    else:
        band = "extreme"
        band_label = "Extreme / Emergency"
        alert_color = "#C31D3C"

    # Compute Factor Contributions (Exact relative share of total risk points)
    # Sub-factors breakdown
    h_component = weight_hazard * hazard
    e_component = weight_exposure * exp_100
    v_component = weight_vulnerability * vuln_100
    total_component = max(0.1, h_component + e_component + v_component)

    # Granular factor breakdown
    factor_thermal = round((h_component / total_component) * 100.0, 1)
    factor_worker_exposure = round(
        ((weight_exposure * (outdoor_worker_ratio * 45.0)) / total_component) * 100.0, 1
    )
    factor_pop_density = round(
        (
            (weight_exposure * (min(1.0, population_density_per_km2 / 50000.0) * 55.0))
            / total_component
        )
        * 100.0,
        1,
    )
    factor_housing = round(
        ((weight_vulnerability * (informal_settlement_ratio * 35.0)) / total_component) * 100.0,
        1,
    )
    factor_vegetation = round(
        ((weight_vulnerability * (vegetation_deficit_ratio * 20.0)) / total_component) * 100.0,
        1,
    )
    factor_demographics = round(
        (
            (weight_vulnerability * (min(1.0, elderly_ratio * 3.5 + children_ratio * 2.5) * 25.0))
            / total_component
        )
        * 100.0,
        1,
    )
    factor_cooling_deficit = round(
        ((weight_vulnerability * (cooling_access_deficit * 20.0)) / total_component) * 100.0,
        1,
    )

    factors_list = [
        {
            "name": "Thermal Stress (WBGT / UTCI)",
            "share_pct": factor_thermal,
            "value_unit": f"WBGT {wbgt_c:.1f}°C",
        },
        {
            "name": "Outdoor Labor Exposure",
            "share_pct": factor_worker_exposure,
            "value_unit": f"{outdoor_worker_ratio * 100:.0f}% workforce",
        },
        {
            "name": "Informal / Tin-Roof Housing",
            "share_pct": factor_housing,
            "value_unit": f"{informal_settlement_ratio * 100:.0f}% informal",
        },
        {
            "name": "Population Density",
            "share_pct": factor_pop_density,
            "value_unit": f"{population_density_per_km2:,.0f}/km²",
        },
        {
            "name": "Canopy / Green Cover Deficit",
            "share_pct": factor_vegetation,
            "value_unit": f"{vegetation_deficit_ratio * 100:.0f}% deficit",
        },
        {
            "name": "Elderly & Child Population",
            "share_pct": factor_demographics,
            "value_unit": f"{(elderly_ratio + children_ratio) * 100:.0f}% vulnerable",
        },
        {
            "name": "Cooling Shelter Deficit",
            "share_pct": factor_cooling_deficit,
            "value_unit": f"{cooling_access_deficit * 100:.0f}% unserved",
        },
    ]
    # Sort factors by impact
    factors_list.sort(key=lambda x: x["share_pct"], reverse=True)

    # Deterministic natural-language explanation generated from real factors
    top_driver_1 = factors_list[0]["name"]
    top_driver_2 = factors_list[1]["name"]

    if band in ["extreme", "veryhigh"]:
        explanation = (
            f"{band_label} thermal risk ({score}/100) driven predominantly by severe {top_driver_1.lower()} "
            f"({factors_list[0]['value_unit']}) compounded by high {top_driver_2.lower()} "
            f"({factors_list[1]['value_unit']}). Immediate activation of Heat Action Plan triggers recommended."
        )
    elif band == "high":
        explanation = (
            f"{band_label} ({score}/100) primarily attributed to elevated {top_driver_1.lower()} "
            f"({factors_list[0]['value_unit']}) and notable {top_driver_2.lower()}. "
            f"Outdoor worker rest cycles and cooling point availability should be enforced."
        )
    elif band == "moderate":
        explanation = (
            f"Moderate risk ({score}/100) with primary stress from {top_driver_1.lower()}. "
            f"Vulnerability factors remain buffered by adequate canopy or lower density."
        )
    else:
        explanation = "Safe thermal comfort range. Ambient conditions within standard physiological tolerance."

    return {
        "risk_score": score,
        "band": band,
        "band_label": band_label,
        "alert_color": alert_color,
        "hazard_score": hazard,
        "exposure_index": exposure,
        "vulnerability_index": vulnerability,
        "factor_breakdown": factors_list,
        "explanation": explanation,
        "is_demo": is_demo,
        "weights": {
            "hazard": weight_hazard,
            "exposure": weight_exposure,
            "vulnerability": weight_vulnerability,
        },
        "sub_scores": {
            "thermal_hazard": hazard,
            "population_exposure": exp_100,
            "social_vulnerability": vuln_100,
            "adaptive_capacity": adaptive_capacity,
        },
        "diagnostics": {
            "utci_c": utci_c,
            "heat_index_c": heat_index_c,
            "temperature_c": temp_c,
        },
    }
