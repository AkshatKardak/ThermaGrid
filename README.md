<p align="center">
  <img src="frontend/public/thermagrid-logo.png" alt="ThermaGrid Logo" width="220" />
</p>

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

# ThermaGrid

Hyperlocal urban heat-stress intelligence and municipal decision-support system for Indian cities.

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

- Per-Ward Risk Scoring (`/api/v1/risk`): Computes composite ward-level human thermal risk scores (0-100), factor breakdown attribution, and deterministic severity explanations.
- Biophysical Thermal Indices (`/api/v1/thermal`): Evaluates ISO 7243 WBGT, UTCI, NOAA Heat Index, and Humidex across current and historical observation windows.
- Multi-Day Risk Forecasting (`/api/v1/risk/forecast`): Generates 3 to 5-day predictive risk trajectories with upper and lower statistical confidence intervals.
- Cooling Centre Registry (`/api/v1/cooling-centres`): Inventories verified municipal hydration and cooling shelters with geodesic nearest-facility distance calculations and directions.
- Alert Notification Dispatch (`/api/v1/alerts`, `/api/v1/subscriptions`): Dispatches verified emergency heat advisories to citizen email subscribers based on custom risk thresholds.
- Occupational Shift Advisories (`/api/v1/worker`): Produces worker safety cards, hydration volume requirements (mL/hr), and work-rest ratios calibrated to metabolic work rates.
- Activity Safe-Window Planner (`/api/v1/planner`): Convolves diurnal risk curves against activity-specific exertion thresholds to find safe daily time intervals.
- Heat Action Plan (HAP) Reporting (`/api/v1/reports`): Compiles and generates official Heat Action Plan (HAP) executive audit PDF documents.
- Care-Circle Dependents (`/api/v1/dependents`): Scopes multi-ward thermal risk tracking for elderly family members and vulnerable individuals.
- Municipal Authority Console (`/api/v1/authority`): Provides executive mission-control overview, ward risk rankings, intervention queue dispatching, and jurisdiction scoping.
- Administrative Locations Registry (`/api/v1/locations`): Manages spatial boundaries, demographic attributes, and topological hierarchy mappings across wards and districts.
- State and city coverage: the location selector spans every state and union territory, with city-level (district) analytics where ward boundaries are not available and ward-level drill-down for Mumbai and Delhi.

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
├── scripts/                # Database seeding, backtesting, and data fetch CLI tools
└── tests/                  # Integration test suite and physics benchmarks
```

---

## Screenshots

<!-- TODO: Add screenshots once the deployment URL is live -->

| View | Description | Status |
|---|---|---|
| Citizen Dashboard | Real-time ward thermal risk overview, biophysical metrics, and life-safety advisories | _pending_ |
| Authority Decision Console | Mission-control spatial command deck, intervention queue, and ward rankings | _pending_ |
| Safe-Window Planner | Diurnal sliding-window activity planner and outdoor exposure recommendations | _pending_ |

_Screenshots will be captured and added following production deployment._

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
   cd frontend && npm test -- --run
   python scripts/backtest.py --check
   ```

---

## Environment Variables

### Backend

| Variable | Purpose |
|---|---|
| POSTGRES_USER | Database superuser username |
| POSTGRES_PASSWORD | Database superuser password |
| POSTGRES_DB | Target PostgreSQL database name |
| POSTGRES_PORT | PostgreSQL listening network port |
| DATABASE_URL | Primary PostgreSQL connection string |
| APP_ENV | Operational environment identifier |
| DEBUG | Debugging and diagnostic log toggle |
| API_V1_PREFIX | Routing prefix for version 1 API endpoints |
| CORS_ORIGINS | Permitted client browser origins |
| ALLOW_SQLITE_FALLBACK | Local SQLite fallback enablement |
| SCHEDULER_ENABLED | Background cron job execution toggle |
| ALLOW_SYNTHETIC_RISK | Synthetic fallback telemetry generator toggle |
| CLERK_SECRET_KEY | Server-side Clerk authentication secret |
| CLERK_JWKS_URL | JSON Web Key Set signature validation endpoint |
| CLERK_ISSUER | Expected JWT token issuer claim |
| CLERK_AUTHORIZED_PARTIES | Permitted client party authentication origins |
| RESEND_API_KEY | Resend email dispatch integration key |

### Frontend

| Variable | Purpose |
|---|---|
| VITE_API_BASE_URL | Backend API endpoint base URL |
| VITE_CLERK_PUBLISHABLE_KEY | Client-side Clerk publishable key |
| VITE_MAP_STYLE_URL | Basemap tile layer style definition |
| VITE_MAPBOX_TOKEN | Mapbox mapping service access token |
| VITE_APP_NAME | Application display brand title |
| VITE_ENABLE_3D | Three-dimensional map feature toggle |
| VITE_ENABLE_ANALYTICS | Client telemetry and analytics toggle |
| VITE_DEFAULT_CITY | Initial municipal city loaded on boot |

---

<p align="center">
  Built by <a href="https://github.com/AkshatKardak">Akshat Kardak</a> · Released under the MIT Licence
</p>
