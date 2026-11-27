<p align="center">
  <img src="frontend/public/thermagrid-logo.png" alt="ThermaGrid Logo" width="220" />
</p>

# ThermaGrid

Hyperlocal urban heat-stress intelligence and municipal decision-support system for Indian cities.

**Live Deployment**: [https://thermagrid.netlify.app/](https://thermagrid.netlify.app/)

<p align="center">
  <a href="#problem-statement">Problem Statement</a> ·
  <a href="#solution">Solution</a> ·
  <a href="#core-features">Core Features</a> ·
  <a href="#unique-features">Unique Features</a> ·
  <a href="#system-architecture-and-folder-structure">System Architecture and Folder Structure</a> ·
  <a href="#screenshots">Screenshots</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#how-to-clone-and-run">How to Clone and Run</a> ·
  <a href="#environment-variables">Environment Variables</a>
</p>

---

## Problem Statement

Urban heat in Indian cities is severely heterogeneous. Macro-scale meteorological reporting typically issues a single temperature reading for an entire metropolitan agglomeration. However, surface thermal conditions, relative humidity, wind obstruction, and solar radiation vary sharply across administrative wards due to localized urban morphology and canopy cover.

City-average temperature figures obscure lethal localized heat extremes. Dense informal settlements with non-insulated tin roofing, high built-density, and absent vegetative canopy experience microclimatic temperatures significantly higher than coastal, suburban, or tree-lined areas within the same municipal corporation.

Socio-economically vulnerable cohorts face disproportional physiological strain during heatwave intervals. Outdoor workers (construction laborers, delivery personnel, street vendors), young children, and elderly residents in informal dwellings encounter continuous thermal stress without mechanical cooling access.

Existing India Meteorological Department (IMD) heatwave alerts operate at synoptic regional scales. Municipal disaster management authorities require granular, ward-level indices to direct life-saving interventions, open emergency cooling shelters, enforce occupational work-rest cycles, and deploy hydration points where vulnerability is highest.

---

## Solution

ThermaGrid delivers an end-to-end biometeorological analytics pipeline and decision-support system. It continuously ingests surface meteorological telemetry and numerical weather forecasts, evaluates multi-index physiological heat stress metrics, layers built-environment vulnerability parameters, and computes one deterministic composite risk score per municipal ward.

The platform synthesizes atmospheric conditions with physical urban realities: roof thermal inertia, demographic age profiles, outdoor worker concentrations, and informal housing prevalence derived from Census 2011 Primary Census Abstract data.

Outputs are surfaced through dual specialized interfaces: a citizen-facing portal providing individualized safe-window activity planning and indoor exposure advisories, and a municipal authority console offering live spatial heat maps, intervention queue dispatching, and automated Heat Action Plan (HAP) reporting.

The automated operational flow executes across four structured stages:

1. Telemetry Ingestion: Hourly collection of downscaled surface meteorology (dry-bulb temperature, relative humidity, wind speed, solar radiation) from open numerical weather grids.
2. Biophysical Index Computation: Parallel calculation of ISO 7243 Wet-Bulb Globe Temperature (WBGT), Universal Thermal Climate Index (UTCI), and NOAA Heat Index.
3. Vulnerability Synthesis: Integration of thermal hazard scores with ward demographic exposure, housing envelope lag, and cooling deficit indicators.
4. Actionable Delivery: Exposing composite scores via REST API, public web dashboard, and automated early-warning email notifications.

---

## Core Features

- Per-Ward Risk Scoring: Computes composite ward-level human thermal risk scores (0-100), factor breakdown attribution, and deterministic severity explanations.
- Biophysical Thermal Indices: Evaluates ISO 7243 WBGT, UTCI, NOAA Heat Index, and Humidex across current and historical observation windows.
- Multi-Day Risk Forecasting: Generates 3 to 5-day predictive risk trajectories with upper and lower statistical confidence intervals.
- Cooling Centre Registry: Inventories verified municipal hydration and cooling shelters with geodesic nearest-facility distance calculations and directions.
- Alert Notification Dispatch: Dispatches verified emergency heat advisories to citizen email subscribers based on custom risk thresholds.
- Occupational Shift Advisories: Produces worker safety cards, hydration volume requirements (mL/hr), and work-rest ratios calibrated to metabolic work rates.
- Activity Safe-Window Planner: Convolves diurnal risk curves against activity-specific exertion thresholds to find safe daily time intervals.
- Heat Action Plan (HAP) Reporting: Compiles and generates official Heat Action Plan executive audit PDF documents.
- Care-Circle Dependents: Scopes multi-ward thermal risk tracking for elderly family members and vulnerable individuals.
- Municipal Authority Console: Provides executive mission-control overview, ward risk rankings, intervention queue dispatching, and jurisdiction scoping.
- Administrative Locations Registry: Manages spatial boundaries, demographic attributes, and topological hierarchy mappings across wards and districts.
- State and City Coverage: Spans every Indian state and union territory across 92 distinct cities, providing city-level (district) analytics where ward boundaries are unavailable and ward-level drill-down for Mumbai and Delhi.

---

## Unique Features

- Indoor thermal lag model: 4 building archetypes (tin roof top floor, RCC top floor, RCC ground, AC) with distinct lag hours and indoor delta, predicting indoor peak hours after outdoor solar peak.
- Dual-engine physiological indices: ISO 7243 WBGT (Stull wet-bulb + simplified globe temperature) and 6th-order polynomial UTCI, with exact measured deviations against reference tables (max WBGT deviation 0.3300 degC across 12 atmospheric conditions, max UTCI deviation 1.47 degC; point to [Physics Validation Documentation](docs/physics-validation.md) for the full reference table and citations).
- Activity safe-window planner: sliding-window convolution across the diurnal curve that computes when specific activities (walk, commute, exercise, outdoor work) can be safely conducted.
- Nocturnal recovery evaluation: tropical night detection (minimum temperature >= 25 degC) over the 20:00 to 06:00 window, identifying cumulative cardiovascular strain.
- Empirical backtest validation: Ahmedabad May 2010 heatwave hindcast with reported MAE and correlation r, tested against documented observational data (point to [Ahmedabad 2010 Backtest Report](docs/backtest/ahmedabad-2010.md)).
- Composite vulnerability indexing: integrating biophysical heat indices with Census 2011 PCA demographics (informal housing, outdoor worker share, elderly/child ratios, cooling deficits).
- Reproducible dataset registry: 9 open public datasets with licenses, provenance, and automated verification scripts (point to [Dataset Registry](docs/datasets.md)).

---

## System Architecture and Folder Structure

ThermaGrid uses a decoupled micro-architecture designed for low-latency spatial queries and reproducible numerical computation. The backend is built with FastAPI, SQLAlchemy 2.0, Pydantic v2, and PostgreSQL with PostGIS-compatible bounding-box indexing (featuring an automated SQLite dev fallback). The frontend is a React 19 single-page application built on Vite, Tailwind CSS, Leaflet spatial mapping, and TanStack Query. The offline analytical core is powered by NumPy, SciPy, and Numba for high-performance biometeorological formula evaluation.

```text
ThermaGrid/
├── analytics/              # Biometeorological algorithms and physics engines
│   ├── config/             # Archetypes, weights, and index configuration YAMLs
│   └── src/                # WBGT, UTCI, Heat Index, and remote sensing models
├── backend/                # FastAPI application tier
│   ├── app/
│   │   ├── api/routes/     # REST endpoint routers (risk, thermal, planner, etc.)
│   │   ├── core/           # Security, authentication, and application settings
│   │   ├── db/             # SQLAlchemy engine, sessions, and database seeder
│   │   ├── jobs/           # Scheduled APScheduler background telemetry tasks
│   │   ├── models/         # Database ORM models (Location, Risk, Alert, etc.)
│   │   ├── schemas/        # Pydantic validation request/response schemas
│   │   └── services/       # Core business logic and external integration clients
│   ├── migrations/         # Alembic database schema migrations
│   └── requirements.txt    # Pinned Python package dependencies
├── data/                   # Boundary vectors, Census tables, and local registries
│   └── raw/                # Mumbai ward vectors and India cities registry
├── docs/                   # Engineering, deployment, and validation documentation
├── frontend/               # React 19 + TypeScript + Vite single-page application
│   ├── public/             # Static public assets and logo images
│   └── src/
│       ├── components/     # UI building blocks (cards, charts, maps, navbar)
│       ├── config/         # India spatial metadata and hierarchy configs
│       ├── hooks/          # TanStack Query data-fetching hooks
│       ├── pages/          # Citizen dashboard and Authority control views
│       └── store/          # Zustand application state management
├── screenshots/            # UI application view captures
├── scripts/                # Database seeding, backtesting, and data fetch CLI tools
└── tests/                  # Integration test suite and physics benchmarks
```

---

## Screenshots

Live Application: [https://thermagrid.netlify.app/](https://thermagrid.netlify.app/)

### 1. Interactive Landing Page and 3D Microclimate Explorer
![ThermaGrid Landing Page](screenshots/Landing_Section.png)
*Real-time urban heat index overview, live temperature strips, city switcher, and 3D microclimate architectural models.*

### 2. Municipal Authority Mission-Control Console
![Authority Decision Console](screenshots/Authority_Dashboard.png)
*Executive command deck featuring interactive choropleth ward heat maps, critical threshold alarms, and automated ward prioritization.*

### 3. Hyperlocal Heat Risk Diagnostics and Thermal Lag
![Heat Risk Diagnostics](screenshots/heat_risk.png)
*Biometeorological hazard card calculating ISO 7243 WBGT, UTCI, NOAA Heat Index, and building archetype thermal wavefront delay.*

### 4. Occupational Health and Worker Shift Planning
![Worker Shift Advisory](screenshots/worker_section.png)
*Metabolic work-rate calibrated shift planner delivering hourly WBGT projections, required work-rest intervals, and hydration quotas.*

### 5. Municipal Interventions and Rapid Response Dispatch
![Intervention Queue](screenshots/Intervention.png)
*Intervention command center dispatching mobile water tankers, opening cooling shelters, and monitoring operational mitigation impacts.*

### 6. Vulnerability Analytics and Cross-Ward Benchmarking
![Ward Vulnerability Analytics](screenshots/Analysis.png)
*Comparative ward distribution charts, Census 2011 vulnerability factors, and canopy deficit metrics.*

---

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Leaflet, Framer Motion, TanStack Query |
| Backend | FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, PostgreSQL (psycopg v3), SQLite fallback |
| Data and analytics | NumPy, SciPy, Numba, Shapely, PyYAML |
| Auth and infra | Clerk JWT, Resend API, Docker (local development) |

---

## How to Clone and Run

Experience the live deployed system at [https://thermagrid.netlify.app/](https://thermagrid.netlify.app/) or run locally:

1. Clone repository
   ```bash
   git clone https://github.com/AkshatKardak/ThermaGrid.git
   cd ThermaGrid
   ```

2. Backend setup
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   ```

3. Database setup
   ```bash
   alembic upgrade head
   python ../scripts/seed_database.py
   ```
   Note: SQLite fallback is used automatically when DATABASE_URL is not set. For containerised deployments, see [Deployment Guide](docs/deployment.md).

4. Start backend server
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. Frontend setup
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```

6. Run tests
   ```bash
   cd ..
   pytest --cov=backend/app --cov=analytics/src --cov-fail-under=70
   cd frontend && npm test
   python scripts/backtest.py --check
   ```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description / Purpose | Example / Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string using psycopg v3 driver | `postgresql+psycopg://heatsense:...@localhost:5432/heatsense` |
| `APP_NAME` | Service name identifier displayed in API telemetry | `ThermaGrid API` |
| `APP_ENV` | Operational environment mode (`development`, `production`, `testing`) | `development` |
| `DEBUG` | Verbose debug logging and interactive OpenAPI schema toggle | `true` |
| `API_V1_PREFIX` | Version 1 API routing namespace prefix | `/api/v1` |
| `LOG_LEVEL` | Application logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | `INFO` |
| `CORS_ORIGINS` | Comma-separated whitelist of allowed client browser origins | `http://localhost:5173,https://thermagrid.netlify.app` |
| `ALLOW_SQLITE_FALLBACK` | Permitted automatic fallback to local SQLite when DATABASE_URL is unset | `true` |
| `SCHEDULER_ENABLED` | Scheduled background hourly weather ingestion and risk indexing toggle | `false` |
| `ALLOW_SYNTHETIC_RISK` | Allow calibrated fallback telemetry when live weather API is down (demo only) | `false` |
| `CLERK_SECRET_KEY` | Server-side secret key for verifying Clerk JWT session tokens | `sk_test_...` |
| `CLERK_JWKS_URL` | JWKS endpoint URL for asymmetric JWT cryptographic verification | `https://<domain>/.well-known/jwks.json` |
| `CLERK_ISSUER` | Expected JWT issuer claim identifying the Clerk authentication instance | `https://<domain>` |
| `CLERK_AUTHORIZED_PARTIES` | Permitted origins allowed in the `azp` JWT claims | `http://localhost:5173,https://thermagrid.netlify.app` |
| `RESEND_API_KEY` | Resend API token for automated emergency heat advisory email dispatch | `re_...` |
| `ALERT_FROM_EMAIL` | Sender email address for outgoing citizen thermal advisories | `ThermaGrid <onboarding@resend.dev>` |
| `ALERT_PROVIDER` | Emergency alert notification dispatcher backend (`resend` or `none`) | `resend` |
| `ALERT_THRESHOLD` | Composite risk score threshold (0-100) that triggers emergency dispatch | `80` |
| `ALERT_COOLDOWN_MINUTES` | Minimum cooldown between successive ward alert dispatches | `180` |
| `ALERT_MAX_PER_DAY` | Maximum emergency alerts allowed per ward per calendar day | `2` |
| `ALERT_SEASON_BUDGET` | Maximum cumulative alerts per ward for the entire summer heat season | `40` |
| `OPEN_METEO_BASE_URL` | Open-Meteo live numerical weather forecast API endpoint | `https://api.open-meteo.com/v1` |
| `OPEN_METEO_ARCHIVE_URL` | Open-Meteo historical ERA5 reanalysis archive API endpoint | `https://archive-api.open-meteo.com/v1` |
| `MODEL_ARTIFACT_PATH` | File path to pre-trained biometeorological forecasting model pickle | `../analytics/models/forecast_model.pkl` |

### Frontend (`frontend/.env`)

| Variable | Description / Purpose | Example / Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend FastAPI REST endpoint | `https://thermagrid.onrender.com/api/v1` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Public authentication key for Clerk user accounts and role verification | `pk_test_...` |
| `VITE_MAP_STYLE_URL` | Vector/raster basemap tile style specification JSON | `https://tiles.openfreemap.org/styles/positron` |
| `VITE_MAPBOX_TOKEN` | Optional Mapbox API access token for custom raster satellite layers | *(optional)* |
| `VITE_APP_NAME` | Application title presented in browser header and metadata | `ThermaGrid` |
| `VITE_ENABLE_3D` | Enable WebGL 3D urban heat island skyline and thermal lag buildings | `true` |
| `VITE_ENABLE_ANALYTICS` | Enable advanced historical heat calendar and scatter plots | `true` |
| `VITE_DEFAULT_CITY` | Default focal city selected on application initial load | `Mumbai` |

---

<div align="center">

### Empowering Climate-Resilient Cities Across India

ThermaGrid bridges atmospheric science and municipal emergency response — converting complex thermodynamic physics into lifesaving, ward-level interventions for every citizen.

**[Launch Live Application](https://thermagrid.netlify.app/)** · **[Explore Repository](https://github.com/AkshatKardak/ThermaGrid)** · **[Report Feedback](https://github.com/AkshatKardak/ThermaGrid/issues)**

Architected and engineered with dedication by [Akshat Kardak](https://github.com/AkshatKardak) · Released under the [MIT License](LICENSE)

</div>
