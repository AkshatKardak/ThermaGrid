# ThermaGrid — System Architecture

**Initiative:** National Climate Early-Warning & Decision Support Initiative  
**Objective:** Hyperlocal Human Thermal-Stress Early-Warning and Decision-Support Platform.

---

## 1. Architectural Philosophy

ThermaGrid transforms meteorological observations into life-safety decision support. Rather than presenting generic city-wide ambient temperatures, the platform answers:
- **Who** is at risk (outdoor workers, elderly, infants, slum residents)?
- **Where** does risk concentrate (ward-level boundaries, heat islands, tree canopy deficits)?
- **When** does it peak (diurnal curves, 3–5 day lead forecasts)?
- **Why** is a ward at risk (factor contributions: thermal hazard vs built environment vs demographics)?
- **What action** must be taken (rule-based SOP directives aligned with NDMA Heat Action Plan guidelines)?

```
┌────────────────────────────────────────────────────────────────────────┐
│                          End-to-End Pipeline                           │
│  Data  ──►  Thermal Stress  ──►  Analytics  ──►  Forecast  ──►  Action  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Structure

```
thermagrid/
├─ frontend/           # React 19 + Vite + TypeScript + Tailwind CSS
├─ backend/            # FastAPI + SQLAlchemy + Pydantic v2
├─ analytics/          # Importable Python package (thermal_indices, spatial, risk, ML)
├─ data/               # Raw and processed staged datasets
├─ database/           # PostGIS migrations and seed definitions
├─ docs/               # Scientific methodology, risk models, thermal indices
├─ tests/              # Backend, analytics, and frontend test suites
└─ scripts/            # Ingestion, computation, training, and seeding CLI scripts
```

---

## 3. Technology Stack Justification

| Concern | MERN (Express + Mongo) | FastAPI + PostGIS (Chosen) |
| :--- | :--- | :--- |
| **Data Analysis & ML** | Node lacks equivalents of SciPy, scikit-learn, GeoPandas | Python-native; analytics package is directly importable by API |
| **Thermal Indices (WBGT/UTCI)** | Must be shelled out or re-implemented in JS | Exact reference equations using NumPy and SciPy |
| **Spatial Joins & GIS** | Mongo geospatial lacks polygon reprojection & spatial joins | PostGIS industry standard for administrative ward polygons |
| **Atmospheric Science Alignment** | Non-standard | Standard scientific python stack |

---

## 4. Layer Responsibilities

### 4.1 Analytics Package (`analytics/`)
- Pure, typed scientific functions with zero external API dependencies.
- Reference implementations for **WBGT (ISO 7243:2017)**, **UTCI (Bröde et al. 2012)**, and **Heat Index (Rothfusz 1990)**.
- Spatial analytics: Haversine proximity, point-in-polygon ray casting, Getis-Ord Gi* hotspot clustering.
- Risk composition: Hazard ($H$) × Exposure ($E$) × Vulnerability ($V$) with deterministic natural-language explanations.
- ML forecasting: Persistence baseline, Linear Ridge benchmark, and Quantile Gradient Boosting regressor with 80% confidence interval bands.

### 4.2 Backend API (`backend/app/`)
- Thin orchestration layer wrapping the `analytics` package.
- Single cached `Settings` singleton via `pydantic-settings`.
- PostGIS database connection with automatic fallback to local SQLite for zero-configuration development.
- Endpoints for auth, locations, weather, thermal indices, risk scores, forecasts, simulation, cooling centres, and alerts.
- Configurable risk thresholds stored in database (`risk_config`).

#### Database Migrations & Baseline Hygiene
For an existing database initially built with `Base.metadata.create_all()`:
1. Baseline the schema state by stamping the initial migration revision:
   ```bash
   alembic stamp d634376abde2
   ```
2. Apply subsequent additive schema migrations:
   ```bash
   alembic upgrade head
   ```
This guarantees migration history integrity without attempting to duplicate tables already present in the database.

### 4.3 Frontend UI (`frontend/`)
- Design system: "Midnight Climate" palette locked in tokens.
- Single `config/env.ts` reading `import.meta.env`.
- Real-time React Query data hooks and Zustand store.
- Interactive Leaflet dark basemap with ward choropleth polygons and cooling shelter markers.
- 3D National Thermal Globe with mobile fallback and `prefers-reduced-motion` compliance.
