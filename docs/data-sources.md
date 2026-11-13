# ThermaGrid — Authoritative Data Sources & Provenance Registry

Every dataset integrated into ThermaGrid follows strict provenance logging as mandated by Rule §7.

---

## 1. Provenance Inventory

| Dataset Name | Authoritative Provider | URL | Spatial Resolution | Temporal Resolution | Date Range | License | Key Variables | Update Frequency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Open-Meteo Global Weather API** | Open-Meteo GmbH (ECMWF & GFS Ensemble) | [open-meteo.com](https://open-meteo.com) | 1.0 km – 11.0 km (interpolated point-downscaled) | Hourly | 1940 – Present + 7-Day Forecast | CC BY 4.0 | 2m Air Temp, Relative Humidity, 10m Wind Speed, Direct Normal Solar Irradiance, Shortwave Radiation | Hourly |
| **IMD Automatic Weather Station (AWS) Network** | India Meteorological Department (Govt. of India) | [mausam.imd.gov.in](https://mausam.imd.gov.in) | Surface Station Points | 15-minute / Hourly | 1980 – Present | Government Open Data License (GODL) | Dry-bulb Temperature, Maximum Temperature, Relative Humidity, Wind Velocity | Real-time (15 min) |
| **Census of India & Socio-Economic Registry** | Office of the Registrar General & Census Commissioner, MHA | [censusindia.gov.in](https://censusindia.gov.in) | Ward / Sub-District Level | Decennial + Annual Projections | 2011 – 2024 Projections | Open Government Data (OGD) Platform India | Total Population, Elderly (≥65), Children (≤5), Slum Population, Outdoor Workforce Fraction | Annual adjustments |
| **ISRO Bhuvan High-Resolution LULC** | National Remote Sensing Centre (NRSC) / ISRO | [bhuvan.nrsc.gov.in](https://bhuvan.nrsc.gov.in) | 5.0 m (LISS-IV / Cartosat) | Seasonal / Annual | 2018 – 2024 | ISRO Bhuvan Open Access License | Normalized Difference Vegetation Index (NDVI), Impervious Surface Fraction, Tree Canopy Cover | Bi-annual |
| **OpenStreetMap Urban Infrastructure** | OpenStreetMap Contributors | [openstreetmap.org](https://www.openstreetmap.org) | Vector Polygons & Points | Continuous Dynamic | 2004 – Present | Open Database License (ODbL) | Ward Boundaries, Hospitals, Primary Health Centres, Cooling Shelters, Transit Concourse Hubs | Daily |

---

## 2. Ingestion & Quality Control Protocol

All ingested observational telemetry passes through `analytics/src/cleaning/validator.py`:
- **Physical Bounds Check:**
  - Ambient Dry-Bulb Temperature: $-5.0^\circ C \le T_a \le 56.0^\circ C$
  - Relative Humidity: $0.0\% \le RH \le 100.0\%$
  - 10m Wind Speed: $0.0 \le v \le 65.0\text{ m/s}$
  - Solar Irradiance: $0.0 \le S \le 1400.0\text{ W/m}^2$
- **Synthetic / Fallback Tagging:** Any missing or synthetic telemetry is explicitly tagged with `is_demo=true` and labeled `DEMO DATA` in both API responses and UI components.
