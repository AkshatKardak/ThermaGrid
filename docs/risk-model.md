# ThermaGrid — Hyperlocal Human Thermal Risk Model

---

## 1. Conceptual Framework

ThermaGrid adheres strictly to the IPCC Assessment Report 6 (AR6) WGII Risk Framework and the NDMA National Heat Action Plan Guidelines (2020):

$$\text{Risk} = \text{Hazard} \times \text{Exposure} \times \text{Vulnerability}$$

---

## 2. Component Formulations

### 2.1 Thermal Hazard ($H \in [0, 100]$)
Composes multi-metric heat stress with empirical weights prioritizing WBGT and UTCI:
$$H = 0.40 \cdot H_{\text{WBGT}} + 0.30 \cdot H_{\text{UTCI}} + 0.20 \cdot H_{\text{HI}} + 0.10 \cdot H_{T_a}$$

Where each index is linearly normalized against clinical risk bounds:
- $H_{\text{WBGT}} = \text{clamp}\left(0, 100, \frac{\text{WBGT} - 22.0}{12.0} \times 100\right)$
- $H_{\text{UTCI}} = \text{clamp}\left(0, 100, \frac{\text{UTCI} - 24.0}{20.0} \times 100\right)$
- $H_{\text{HI}} = \text{clamp}\left(0, 100, \frac{\text{HI} - 26.0}{22.0} \times 100\right)$

### 2.2 Exposure Index ($E \in [0, 1]$)
Evaluates the physical human population volume and the concentration of outdoor laborers who cannot retreat to air-conditioned enclosures:
$$E = 0.55 \cdot \min\left(1.0, \frac{\text{Density}}{50,000}\right) + 0.45 \cdot \text{WorkerRatio}$$

### 2.3 Vulnerability Index ($V \in [0, 1]$)
Integrates demographic physiological fragility, built-environment heat trapping, and adaptive capacity deficit:
$$V = 0.25 \cdot V_{\text{demo}} + 0.35 \cdot V_{\text{housing}} + 0.20 \cdot V_{\text{canopy}} + 0.20 \cdot V_{\text{cooling}}$$

Where:
- $V_{\text{demo}} = \min(1.0, \text{ElderlyRatio} \times 3.5 + \text{ChildrenRatio} \times 2.5)$
- $V_{\text{housing}} = \text{InformalHousingRatio}$ (tin/asbestos roofs, uninsulated masonry)
- $V_{\text{canopy}} = 1.0 - \text{TreeCanopyFraction}$ (vegetative deficit)
- $V_{\text{cooling}} = \text{CoolingAccessDeficit}$ (fraction unserved by AC shelters or drinking hubs)

### 2.4 Composite Risk Score ($S \in [0, 100]$)
$$S = \min\left(100.0, w_H \cdot H + w_E \cdot (E \times 100) + w_V \cdot (V \times 100)\right)$$
Default configurable weights: $w_H = 0.50$, $w_E = 0.25$, $w_V = 0.25$ (overridable via `risk_config` table).

---

## 3. Deterministic Explanation Generation

To prevent hallucination in life-safety operations, **no LLMs are utilized for risk explanations**.
Instead, the exact mathematical share of each factor is calculated:
$$\text{Share}_i = \frac{\text{Component}_i}{\sum \text{Components}} \times 100\%$$
The top two dominant drivers are ranked and injected into parameterized natural-language templates reflecting NDMA Heat Action Plan guidelines.
