# ThermaGrid — Technical Limitations & Operational Scope

As mandated by scientific transparency standards and Rule §9:

---

## 1. Meteorological Spatial Resolution Caveat

> **Important Notice:** Ward-level risk differentiation in ThermaGrid is achieved through **hyperlocal vulnerability and microclimate attribution**, not hyper-dense physical weather stations in every single ward.
- Numerical Weather Prediction (NWP) grids operate at $1.0\text{ km}$ to $11.0\text{ km}$ spatial resolution.
- The differences in ward risk grades (e.g. Ward M/East vs Ward A under identical synoptic weather) reflect real differences in population density, informal tin-roof housing density, tree canopy deficit, and outdoor workforce ratios.
- Future phases will integrate dense IoT urban canopy temperature sensor networks as municipal corporations expand telemetry hardware.

---

## 2. Non-Medical Public Health Scope

- ThermaGrid provides relative environmental hazard and socio-spatial vulnerability indices.
- Outputs **do not predict individual clinical diagnoses or direct mortality counts**.
- Individual susceptibility varies with pre-existing cardiovascular conditions, dehydration status, acclimatization, medications, and individual physiology.
- In all medical emergencies, users must contact the National Emergency Ambulance Service (108).

---

## 3. Offline & Simulated Data Tagging

- Any simulated data or fallback conditions generated during offline development or network unavailability are strictly tagged with `is_demo=true`.
- The user interface and API serialize this as a prominent `DEMO DATA` badge to maintain absolute data integrity.
- Never are synthetic metrics or fabricated model scores presented as real physical observations.
