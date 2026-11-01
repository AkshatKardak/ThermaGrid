"""
Heat Action Plan (HAP) Recommendation Service.
Deterministic, rule-based mappings of risk band and dominant drivers
to official NDMA / Municipal Heat Action Plan trigger directives.

STRICT RULE: No LLMs for safety-critical heat wave advisories.
"""

from typing import Dict, Any, List


# Official NDMA 2020 Heat Action Plan Triggers & Standard Operating Procedures (SOPs)
def get_recommendations_for_risk(
    risk_band: str,
    top_driver: str,
    is_worker: bool = False,
    is_authority: bool = False,
) -> Dict[str, Any]:
    """
    Returns specific, actionable directives for Citizens, Workers, or Municipal Authorities.
    """
    band = risk_band.lower()

    if band in ["extreme", "veryhigh"]:
        alert_grade = "Red Alert (Severe Heat Emergency)"
        summary = "Extreme thermal stress hazard. Critical risk of heat stroke under direct exposure."
        citizen_actions = [
            "Remain strictly indoors in shaded or air-cooled environments between 11:00 AM and 04:30 PM.",
            "Maintain continuous hydration: consume ORS, tender coconut water, buttermilk (chaas), and salted lemon water.",
            "Do not leave children or elderly persons in parked vehicles or unventilated tin-roof rooms.",
            "Locate and utilize your nearest municipal cooling shelter immediately if home temperature exceeds 38°C.",
            "Watch for heat emergency red flags: cessation of sweating, hot dry skin, confusion, vomiting (call 108 immediately).",
        ]
        worker_actions = [
            "MANDATORY: Cease strenuous outdoor physical labor between 12:00 PM and 04:00 PM (NDMA Directive).",
            "Enforce 15 min work / 45 min shaded rest cycles for essential tasks.",
            "Hydrate with at least 750ml to 1 liter of electrolyte solution per hour.",
            "Loosen tight clothing; wear broad-brim hats and wet cooling neck towels.",
        ]
        authority_actions = [
            "Activate all designated public cooling centres and community AC halls on 24x7 standby.",
            "Deploy emergency water tankers to high-vulnerability informal settlements and construction sites.",
            "Adjust outdoor municipal worker shifts to early morning (06:00 - 11:00 AM).",
            "Issue emergency SMS broadcast and mobilize municipal loudspeaker vans in informal settlements.",
            "Stock dedicated ice packs, IV fluids, and oral rehydration salts at all Urban Primary Health Centres (UPHCs).",
        ]
    elif band == "high":
        alert_grade = "Orange Alert (High Heat Warning)"
        summary = "Significant thermal strain. Heat cramps and exhaustion likely with prolonged outdoor activity."
        citizen_actions = [
            "Minimize direct sunlight exposure between 12:00 PM and 03:30 PM.",
            "Carry an umbrella, wear loose, light-colored cotton clothing, and wear sunglasses.",
            "Increase daily fluid intake even when not thirsty; avoid caffeinated beverages and alcohol.",
            "Check on elderly neighbors and infants twice daily.",
        ]
        worker_actions = [
            "Implement 30 min work / 30 min shaded rest cycles.",
            "Set up shaded rest canopies with potable water jars and electrolyte packets.",
            "Designate buddy-system to monitor coworkers for dizziness, pale skin, or heavy sweating.",
        ]
        authority_actions = [
            "Open public transit air-conditioned concourses as temporary cooling zones.",
            "Inspect construction sites for mandatory shade and drinking water provision compliance.",
            "Keep emergency medical response units on high-readiness alert.",
        ]
    elif band == "moderate":
        alert_grade = "Yellow Alert (Heat Advisory)"
        summary = "Moderate thermal discomfort. Tolerable with standard precautions."
        citizen_actions = [
            "Stay well hydrated throughout the day (at least 2.5 - 3 liters).",
            "Wear sunscreen and carry water when traveling.",
            "Ensure proper cross-ventilation in residential rooms.",
        ]
        worker_actions = [
            "Take 15-minute breaks every hour in shade.",
            "Drink 250ml water every 20-30 minutes.",
        ]
        authority_actions = [
            "Review water tanker logistics and verify water fountain operations in public parks and bus terminals.",
            "Disseminate daily heat awareness infographics via municipal portals and social handles.",
        ]
    else:
        alert_grade = "Green / Normal (Safe)"
        summary = "Thermal conditions within safe baseline limits."
        citizen_actions = [
            "Maintain regular hydration and normal outdoor activities.",
        ]
        worker_actions = [
            "Standard occupational safety protocols apply.",
        ]
        authority_actions = [
            "Routine monitoring and normal public health preparedness.",
        ]

    # Custom targeted tip based on the dominant environmental driver
    driver_lower = top_driver.lower()
    if "informal" in driver_lower or "tin" in driver_lower:
        driver_specific_directive = "High tin-roof vulnerability: apply white lime/reflective coating to roofs to reduce indoor heat by up to 4°C."
    elif "worker" in driver_lower:
        driver_specific_directive = "High outdoor workforce vulnerability: enforce contractor hydration stops and mandatory rest shacks."
    elif "canopy" in driver_lower or "vegetation" in driver_lower:
        driver_specific_directive = "Severe canopy deficit: utilize shaded pedestrian transit corridors and municipal misting hubs."
    elif "elderly" in driver_lower:
        driver_specific_directive = "High senior citizen concentration: activate volunteer health visits and daily telephonic check-ins."
    else:
        driver_specific_directive = "High ambient hazard: strictly observe peak sun avoidance intervals."

    return {
        "risk_band": band,
        "alert_grade": alert_grade,
        "summary": summary,
        "driver_specific_directive": driver_specific_directive,
        "citizen_actions": citizen_actions,
        "worker_actions": worker_actions,
        "authority_actions": authority_actions,
        "disclaimer": "ThermaGrid provides relative risk and decision support. For medical emergencies, always call emergency medical services (108).",
    }
