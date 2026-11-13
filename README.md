# ThermaGrid

<div align="center">
  <img src="frontend/public/thermagrid-logo.png" alt="ThermaGrid Logo" width="220" />
  <p><strong>Hyperlocal Human Thermal-Stress Early-Warning & Municipal Decision-Support System</strong></p>
  <p>Built by <a href="https://github.com/AkshatKardak">Akshat Kardak</a> · Released under the MIT Licence</p>
</div>

---

## Overview

ThermaGrid evaluates hyperlocal human thermal strain across Indian urban wards by coupling synoptic numerical weather models, authoritative ground telemetry, and microclimatic built-environment vulnerability metrics. 

The system computes physiological heat stress indices (ISO 7243 WBGT, UTCI, NOAA Heat Index) and models multi-hour indoor thermal phase delay across building archetypes to support municipal disaster response and public health action plans.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion |
| **Backend** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Uvicorn |
| **Spatial & Analytics** | GeoPandas, NumPy, SciPy, react-simple-maps, d3-geo, Leaflet |
| **Database & Cache** | PostgreSQL, PostGIS, SQLite (development fallback) |
| **Auth & Ingestion** | Clerk, Open-Meteo API, IMD Telemetry Network |

---

## System Architecture

```mermaid
flowchart LR
    A["React SPA\n(Vite + Tailwind + Recharts)"] -->|HTTPS / REST API| B["FastAPI Backend\n(Liljegren WBGT + Risk Engine)"]
    B -->|SQLAlchemy 2.0| C["PostgreSQL + PostGIS\n(Spatial Wards & Telemetry)"]
    B -->|Hourly Ingestion| D["External Telemetry\n(Open-Meteo & IMD AWS)"]
```

---

## Heat Vulnerability Formulation

The composite ward thermal stress score is formulated across four normalized dimensions:

$$R = w_h H + w_e E + w_v V - w_a A$$

- **Hazard ($H$):** Dynamic biometeorological stress derived via Liljegren (2008) Wet-Bulb Globe Temperature (WBGT), Universal Thermal Climate Index (UTCI), and NOAA Heat Index.
- **Exposure ($E$):** Population density, child/elderly age dependency ratios, and outdoor labor fractions.
- **Vulnerability ($V$):** Uninsulated corrugated tin/asbestos roof fraction, informal housing density, and baseline disease burden.
- **Adaptive Capacity ($A$):** Urban tree canopy fraction, municipal cooling centre proximity, and hospital bed availability.

---

## Quick Start

### 1. Repository Setup

```bash
git clone https://github.com/AkshatKardak/ThermaGrid.git
cd ThermaGrid
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed initial ward spatial geodata and telemetry
python seed.py

# Start development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`. Interactive OpenAPI documentation is hosted at `http://localhost:8000/docs`.

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

The frontend application will be accessible at `http://localhost:5173`.

---

## Municipal Authority Console Access

The authority command console (`/app/authority`) provides ward-level risk rankings, intervention queue management, and emergency alert broadcast dispatching. Access requires verified administrative role permissions:

1. Sign in to the application using standard authentication.
2. In the Clerk Dashboard, navigate to **Users** &rarr; select the user &rarr; **Metadata** &rarr; **Public**.
3. Set the metadata key:
   ```json
   {
     "role": "authority"
   }
   ```
4. Sign out and sign back in to refresh the session claims. The municipal authority navigation tab and `/app/authority` console will unlock.

---

## Deployment

### Netlify (Frontend)

The repository root contains `netlify.toml` configured for automated SPA builds:

- **Build Base:** `frontend`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`
- **Environment Variables Required:**
  - `VITE_API_BASE_URL` (points to the Render backend, e.g., `https://thermagrid-api.onrender.com/api/v1`)
  - `VITE_CLERK_PUBLISHABLE_KEY` (Clerk publishable key)

### Render (Backend)

The repository root includes `render.yaml` defining a web service:

- **Runtime:** Python 3.12
- **Build Command:** `pip install -r backend/requirements.txt`
- **Start Command:** `cd backend && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`
- **Health Check Path:** `/health`
- **Environment Variables Required:**
  - `DATABASE_URL` (PostgreSQL connection string)
  - `ALLOW_SQLITE_FALLBACK` (`false` in production)
  - `SCHEDULER_ENABLED` (`true` for scheduled ingestion)
  - `CORS_ORIGINS` (comma-separated allowed origins, e.g., `https://thermagrid.netlify.app`)

---

## Licence & Citations

- Distributed under the [MIT Licence](LICENSE).
- Meteorological calculations implement the Liljegren et al. (2008) Wet-Bulb Globe Temperature formulation and Rothfusz (1990) National Weather Service Heat Index algorithms.
- Boundary geometries conform to official Survey of India administrative boundary standards.
