# ThermaGrid Dataset Provenance & Metadata Registry

This document records the authoritative public datasets ingested by ThermaGrid, including their licensing, spatial/temporal resolution, columns populated, and methodology constraints.

---

## 1. Primary Datasets

| # | Dataset | Columns Populated | Source URL | Format | License | Resolution |
|---|---|---|---|---|---|---|
| **1** | **BMC / Mumbai Administrative Ward Boundaries** | `geometry_geojson`, `ward_code`, `ward_name`, `area_sq_km` | [data.opencity.in](https://data.opencity.in) · [yashveeeeeer.github.io/india-geodata](https://yashveeeeeer.github.io/india-geodata) | GeoJSON / SHP | Open Data Commons Open Database License (ODbL) | Ward boundary vector polygons (24 BMC Administrative Wards) |
| **2** | **Census of India 2011, Ward Primary Census Abstract (PCA)** | `population`, `population_density_per_km2`, `elderly_ratio`, `children_ratio`, `outdoor_worker_ratio` | [censusindia.gov.in](https://censusindia.gov.in/census.website/en/data/population-finder) | CSV / XLSX | Open Government Data (OGD) Platform India | Decennial administrative ward aggregates (2011 Vintage) |
| **3** | **Open-Meteo Archive & Numerical Forecast (ERA5-Land & ECMWF/GFS)** | `temperature_c`, `rel_humidity_pct`, `wind_speed_ms`, `solar_radiation_wm2`, `apparent_temperature_c` | [archive-api.open-meteo.com](https://archive-api.open-meteo.com/v1/archive) · [api.open-meteo.com](https://api.open-meteo.com/v1) | JSON API | Creative Commons Attribution 4.0 International (CC BY 4.0) | 1.1 km – 9.0 km downscaled point observations, Hourly cadence |
| **4** | **USGS Landsat 8/9 Collection 2 Level-2 Surface Temperature & Reflectance** | LST (Land Surface Temperature), NDVI, NDBI, NDWI (feeds `analytics/src/remote_sensing/`) | [earthexplorer.usgs.gov](https://earthexplorer.usgs.gov) | GeoTIFF | Public Domain (U.S. Geological Survey) | 30 m spatial resolution, 16-day revisit |
| **5** | **India State & UT Administrative Boundaries** | State/UT vector polygons, `NAME_1`, `TYPE_1` | [github.com/geohacker/india](https://github.com/geohacker/india) · [datameet/maps](https://github.com/datameet/maps) | GeoJSON (`frontend/src/assets/geo/india-states.json`) | Public Domain / CC0 / ODbL | State & UT boundary polygons (35 administrative units) |

---

## 2. Methodology & Compliance Rules

### A. Geodesic Ward Geometry & Area Calculation
- **Area Computation:** `area_sq_km` is computed directly from the geodesic boundary coordinates using spherical polygon integration rather than copied from external descriptive tables.
- **Normalisation:** Municipal ward codes are normalised into canonical uppercase alphanumeric identifiers (`WARD_A` through `WARD_T`).

### B. Demographic Vintage & Derivations
- **Census Vintage:** Demographics adhere strictly to **Census of India 2011** District Census Handbook definitions for Mumbai City and Mumbai Suburban districts. Vintage is documented in `description` per ward (`census_vintage: "2011"`).
- **Derived Ratios:**
  - `elderly_ratio`: Derived from Census 2011 age 60+ population share.
  - `children_ratio`: Derived from Census 2011 age 0–6 population share.
  - `outdoor_worker_ratio`: Proxy derived from Census 2011 Main Other Workers categories (transport, construction, street vendors, manual labor).

### C. Zero Fabrication Policy (Unsourced Attributes)
- Attributes without verified, open, ward-level empirical datasets (`informal_settlement_ratio`, `tree_canopy_fraction`, `cooling_access_deficit`) are stored strictly as `NULL`.
- The user interface truthfully renders these attributes as **`unavailable`** rather than interpolating synthetic figures.

### D. Weather Provenance & Truthful Tagging
- Upstream numerical meteorological feeds tag each observation with its origin:
  - Observed/Reanalysis: `is_demo=False`, `source_name="Open-Meteo ECMWF/GFS"`.
  - Fallback / Synthetic: If upstream APIs are unreachable, observations are flagged with `is_demo=True` and `source_name="synthetic"`. Synthetic observations are never recorded as observed.
