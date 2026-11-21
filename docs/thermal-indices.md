# ThermaGrid — Thermal Stress Indices Specification

---

## 1. Wet Bulb Globe Temperature (WBGT)

### Citation & Standard
- **ISO 7243:2017:** Ergonomics of the thermal environment — Assessment of heat stress using the WBGT index. International Organization for Standardization, Geneva.
- **Stull, R. (2011):** Wet-bulb temperature from relative humidity and air temperature. *Journal of Applied Meteorology and Climatology*, 50(11), 2267–2269.
- **Lemke, B., & Kjellstrom, T. (2012):** Calculating workplace WBGT from meteorological data. *Industrial Health*, 50(4), 267–278.

### Governing Formula
- **Outdoor with Direct Solar Radiation (ISO 7243 §5.1):**
  $$\text{WBGT} = 0.7 \cdot T_{nw} + 0.2 \cdot T_g + 0.1 \cdot T_a$$
- **Indoor or Outdoor in Shade ($S \le 10\text{ W/m}^2$):**
  $$\text{WBGT} = 0.7 \cdot T_{nw} + 0.3 \cdot T_g$$

Where:
- $T_a$: Dry-bulb air temperature (°C)
- $T_{nw}$: Natural wet-bulb temperature (°C) approximated via Stull (2011):
  $$T_{nw} = T_a \arctan(0.151977\sqrt{RH + 8.313659}) + \arctan(T_a + RH) - \arctan(RH - 1.676331) + 0.00391838 \cdot RH^{1.5}\arctan(0.023101 \cdot RH) - 4.686035$$
- $T_g$: Black globe temperature (°C) estimated from solar irradiance $S$ ($\text{W/m}^2$) and wind speed $v$ ($\text{m/s}$):
  $$T_g = T_a + \frac{S \cdot 0.015}{\max(0.5, v)^{0.25}}$$

### Screening Action Limits (ISO 7243 Acclimatized Workers at ~300W):
- $\text{WBGT} < 26.0^\circ C$: Safe / Continuous physical work (100% work / 0% rest)
- $26.0^\circ C \le \text{WBGT} < 28.0^\circ C$: Caution (75% work / 25% rest cycle)
- $28.0^\circ C \le \text{WBGT} < 30.0^\circ C$: High Risk (50% work / 50% rest cycle)
- $30.0^\circ C \le \text{WBGT} < 32.2^\circ C$: Very High Risk (25% work / 75% rest cycle)
- $\text{WBGT} \ge 32.2^\circ C$: Stop Work / Critical emergency

---

## 2. Universal Thermal Climate Index (UTCI)

### Citation & Standard
- **Bröde, P., et al. (2012):** Deriving the operational procedure for the Universal Thermal Climate Index (UTCI). *International Journal of Biometeorology*, 56(3), 481–494.
- **Fiala, D., et al. (2012):** UTCI-Fiala multi-node model of human thermoregulation. *Int J Biometeorol*, 56(3), 429–441.

### Governing Principles
The UTCI equivalent temperature is defined as the isothermal temperature of the reference environment that causes the same dynamic thermoregulatory strain in a human walking at $4\text{ km/h}$ ($135\text{ W/m}^2$).
It is computed using the operational 6th-order polynomial regression combining air temperature $T_a$, vapor pressure $P_a$ (kPa), 10m wind velocity $v_{10m}$, and mean radiant temperature $T_{mrt}$.

### Thermal Stress Categories (Bröde et al. 2012):
- $> +46^\circ C$: Extreme heat stress
- $+38^\circ C \text{ to } +46^\circ C$: Very strong heat stress
- $+32^\circ C \text{ to } +38^\circ C$: Strong heat stress
- $+26^\circ C \text{ to } +32^\circ C$: Moderate heat stress
- $+9^\circ C \text{ to } +26^\circ C$: Thermal comfort zone (No thermal stress)

---

## 3. NOAA National Weather Service (NWS) Heat Index

### Citation & Standard
- **Rothfusz, L. P. (1990):** The heat index equation. NWS Southern Region Technical Attachment SR/SSD 90-23.
- **Steadman, R. G. (1979):** The assessment of sultriness. *Journal of Applied Meteorology*, 18(7), 861–873.

### Governing Formula
For $T \ge 80^\circ F$ ($26.7^\circ C$) and $RH \ge 40\%$:
$$\text{HI} = -42.379 + 2.04901523 T + 10.14333127 RH - 0.22475541 T \cdot RH - 0.00683783 T^2 - 0.05481717 RH^2 + 0.00122874 T^2 RH + 0.00085282 T \cdot RH^2 - 0.00000199 T^2 RH^2$$
Subject to Steadman's linear equation for low apparent temperature and Rothfusz adjustments for low ($RH < 13\%$) and high ($RH > 85\%$) humidity conditions.
