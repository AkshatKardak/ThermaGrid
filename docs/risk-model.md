# ThermaGrid — Hyperlocal Human Thermal Risk Model Specification

---

## 1. Conceptual Framework

ThermaGrid evaluates hyperlocal heat risk by operationalizing the **IPCC Assessment Report 6 (AR6) Working Group II** risk framework and the **National Disaster Management Authority (NDMA)** *National Guidelines for Preparation of Action Plan – Prevention and Management of Heat Wave (2020)*:

$$\text{Risk} = \text{Hazard} \times \text{Exposure} \times \text{Vulnerability}$$

To guarantee scientific rigor, prevent double-counting, and maintain life-safety integrity, the mathematical model in [`analytics/src/risk/scoring.py`](file:///home/akshat/Desktop/Practice/Heatwaves/analytics/src/risk/scoring.py) adheres strictly to the empirical formulations below.

---

## 2. Component Formulations

### 2.1 Thermal Hazard ($H \in [0, 100]$) — `[Empirical: ISO 7243:2017]`

Thermal hazard is derived **strictly from Wet Bulb Globe Temperature (WBGT)**:

$$H = \text{clamp}\left(0.0, 100.0, \frac{\text{WBGT} - 22.0}{12.0} \times 100.0\right)$$

- **Baseline ($0.0$ hazard):** $\text{WBGT} \le 22.0^\circ\text{C}$ (safe occupational threshold for continuous physical labor).
- **Critical Ceiling ($100.0$ hazard):** $\text{WBGT} \ge 34.0^\circ\text{C}$ (extreme physiological heat exhaustion and imminent heat stroke threshold under ISO 7243).
- **No Multi-Metric Summing:** Earlier draft specifications proposed summing WBGT, UTCI, Heat Index, and Air Temperature ($0.40 \cdot H_{\text{WBGT}} + 0.30 \cdot H_{\text{UTCI}} + 0.20 \cdot H_{\text{HI}} + 0.10 \cdot H_{T_a}$). **The production code explicitly refuses to sum these metrics.** Because WBGT, UTCI, and Heat Index share underlying physical variables (dry-bulb temperature, vapor pressure/relative humidity, solar radiation), summing them into a composite hazard score double-counts the physical signal.
- **Diagnostic Role:** Universal Thermal Climate Index (UTCI) and NOAA Heat Index (HI) are calculated and exposed strictly as secondary physiological diagnostics (`diagnostics.utci_c`, `diagnostics.heat_index_c`), never added to the composite hazard score.

---

### 2.2 Exposure Index ($E \in [0, 1]$) — `[Calibrated Assumption: NDMA 2020]`

The exposure index measures the volume of the human population physically situated in the thermal hazard zone and the proportion engaged in outdoor manual labor:

$$E = 0.55 \cdot E_{\text{dens}} + 0.45 \cdot E_{\text{worker}}$$

Where:
- $E_{\text{dens}} = \min\left(1.0, \max\left(0.0, \frac{\text{Population Density per km}^2}{50,000.0}\right)\right)$ `[Calibrated Assumption]`: Reference upper density benchmark set to $50,000/\text{km}^2$ (representative of dense metropolitan wards in Mumbai, Delhi, and Kolkata). Weight: $0.55$.
- $E_{\text{worker}} = \min(1.0, \max(0.0, \text{OutdoorWorkerRatio}))$ `[Upper-Bound Proxy]`: Fraction of workforce engaged in outdoor labor (Cultivators + Agricultural Labourers + Other Workers from Census PCA). Weight: $0.45$.

For composite scoring, exposure is scaled to $E_{100} = E \times 100.0 \in [0, 100]$.

---

### 2.3 Vulnerability Index ($V \in [0, 1]$) — `[Socio-Spatial Synthesis]`

Vulnerability synthesizes physiological susceptibility, built-environment thermal trapping, microclimatic vegetative deficits, and access to adaptive cooling infrastructure:

$$V = 0.25 \cdot V_{\text{demo}} + 0.35 \cdot V_{\text{housing}} + 0.20 \cdot V_{\text{canopy}} + 0.20 \cdot V_{\text{cooling}}$$

| Sub-Component | Formulation | Weight | Epistemic Status | Justification & Standard |
| :--- | :--- | :---: | :---: | :--- |
| **Demographic Fragility ($V_{\text{demo}}$)** | $\min(1.0, \text{ElderlyRatio} \times 3.5 + \text{ChildrenRatio} \times 2.5)$ | $0.25$ | `[Assumption]` | Standardized on Age 60+ (MoSPI / Census ORGI) and Age $\le 5$. Captures impaired thermoregulation and reduced physiological sweating efficiency. |
| **Housing Envelope ($V_{\text{housing}}$)** | $\min(1.0, \max(0.0, \text{InformalSettlementRatio}))$ | $0.35$ | `[Empirical: Mahadevia 2020]` | Measures uninsulated tin, asbestos, and dense informal roofs that amplify indoor temperatures by $+3^\circ\text{C}$ to $+6^\circ\text{C}$ above ambient. |
| **Vegetation Deficit ($V_{\text{canopy}}$)** | $\min(1.0, \max(0.0, 1.0 - \text{TreeCanopyFraction}))$ | $0.20$ | `[Empirical: USGS Landsat LST]` | Absence of urban tree canopy buffer eliminates evapotranspirative cooling and increases sensible heat flux. |
| **Cooling Deficit ($V_{\text{cooling}}$)** | $\min(1.0, \max(0.0, \text{CoolingAccessDeficit}))$ | $0.20$ | `[Assumption]` | Fraction of ward population without residential AC or access to shaded drinking/cooling stations within 500m. |

- **Missing Data Handling:** If un-sourced indicators (`informal_settlement_ratio`, `tree_canopy_fraction`, `cooling_access_deficit`) are missing from municipal records, they evaluate to explicit `NULL` and render as "unavailable" rather than fabricating zero or baseline constants.
- For composite scoring, vulnerability is scaled to $V_{100} = V \times 100.0 \in [0, 100]$.

---

### 2.4 Adaptive Capacity ($AC \in [0, 100]$) — `[Derived Indicator]`

Adaptive capacity measures the community's structural ability to withstand and mitigate extreme heat:

$$AC = 100.0 \times (1.0 - \text{CoolingAccessDeficit})$$

- **Honesty Rule:** When `cooling_access_deficit` is `NULL`, `adaptive_capacity` evaluates strictly to `NULL`. The platform never injects arbitrary constant fallbacks (such as $60.0$).

---

### 2.5 Composite Risk Score ($S \in [0, 100]$) — `[Weighted Synthesis]`

The overall risk score is calculated as a bounded linear combination:

$$S = \text{clamp}\left(0.0, 100.0, w_H \cdot H + w_E \cdot E_{100} + w_V \cdot V_{100}\right)$$

Default statutory weights (overridable in database via `risk_config` table):
- $w_H = 0.50$ (Thermal Hazard): `[Empirical: Primary Physical Trigger]`
- $w_E = 0.25$ (Population & Worker Exposure): `[Assumption / NDMA 2020]`
- $w_V = 0.25$ (Socio-Spatial Vulnerability): `[Assumption / NDMA 2020]`

---

## 3. Risk Bands & Heat Action Plan (HAP) Tiers

The 0–100 composite score maps deterministically to color-coded operational alert tiers:

| Score Range | Risk Band | Label | Alert Color | Operational SOP (NDMA HAP Directive) |
| :---: | :---: | :---: | :---: | :--- |
| **0.0 – 24.9** | `safe` | Low / Safe | `#2FA37C` | Normal ambient comfort. Standard routine hydration. |
| **25.0 – 49.9** | `moderate` | Moderate | `#E8C547` | Yellow Advisory: Evening cross-ventilation, workplace hydration reminders. |
| **50.0 – 69.9** | `high` | High Risk | `#F59E0B` | Orange Warning: Mandate outdoor worker rest cycles, prepare cooling shelters. |
| **70.0 – 84.9** | `veryhigh` | Very High Risk | `#FF704F` | Red Alert: Suspend heavy noon labor, activate emergency misting stations. |
| **85.0 – 100.0** | `extreme` | Extreme / Emergency | `#C31D3C` | Crimson Crisis: Immediate emergency welfare checks, public cooling centre activation. |

---

## 4. Deterministic Factor Breakdown & Evidence Attribution

To eliminate model hallucination in civil protection and emergency operations, **ThermaGrid uses zero generative LLMs in the calculation or explanation pipeline**.

### Mathematical Factor Share Formulation
Each individual driver's percentage contribution to total risk is computed from its exact weighted component points:

$$\text{Share}_i = \frac{\text{Component}_i}{\text{Total Components}} \times 100.0$$

Where:
- $\text{Component}_{\text{thermal}} = w_H \cdot H$
- $\text{Component}_{\text{workers}} = w_E \cdot (0.45 \cdot \text{WorkerRatio} \times 100.0)$
- $\text{Component}_{\text{density}} = w_E \cdot (0.55 \cdot E_{\text{dens}} \times 100.0)$
- $\text{Component}_{\text{housing}} = w_V \cdot (0.35 \cdot V_{\text{housing}} \times 100.0)$
- $\text{Component}_{\text{canopy}} = w_V \cdot (0.20 \cdot V_{\text{canopy}} \times 100.0)$
- $\text{Component}_{\text{demographics}} = w_V \cdot (0.25 \cdot V_{\text{demo}} \times 100.0)$
- $\text{Component}_{\text{cooling}} = w_V \cdot (0.20 \cdot V_{\text{cooling}} \times 100.0)$

The factors are sorted in descending order of relative impact, and the top two drivers are deterministically formatted into evidence-based natural language explanations backed directly by measured telemetry.
