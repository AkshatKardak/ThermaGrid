# ThermaGrid

> **Hyperlocal Human Thermal-Stress Early-Warning and Decision-Support Platform**  
> *National Climate Early-Warning & Decision Support Initiative*  
> Aligned with NDMA National Heat Action Plan Guidelines (2020) and ISO 7243:2017 standards.

---

## 1. Executive Summary

**ThermaGrid** transforms coarse meteorological forecasts into actionable, ward-level life-safety decision support. Rather than presenting generic city-wide temperatures, the platform answers:
- **Who is at risk?** (Elderly, outdoor workers, dense informal settlement dwellers)
- **Where?** (High-resolution municipal ward polygons with built-environment vulnerability)
- **When does it peak?** (Hourly thermal-stress trajectories with 3-5 day lead times)
- **Why?** (Hazard × Exposure × Vulnerability factor attribution with natural-language drivers)
- **What action to take?** (Automated Heat Action Plan triggers and emergency resource queues)

### Scientific Pipeline
$$\text{Data} \longrightarrow \text{Thermal Stress} \longrightarrow \text{Analytics} \longrightarrow \text{Forecast} \longrightarrow \text{Risk} \longrightarrow \text{Action}$$

---

## 2. Architecture & Technology Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, Three.js 3D visual layer, MapLibre GL, Recharts, TanStack Query, Zustand.
- **Backend:** FastAPI (Python 3.12+), Pydantic Settings, SQLAlchemy ORM, GeoAlchemy2.
- **Database:** PostgreSQL + PostGIS *(with automatic local SQLite fallback for dev)*.
- **Analytics & ML:** NumPy, SciPy, scikit-learn (Quantile Gradient Boosting for WBGT/UTCI forecasting), GeoPandas, Shapely.
- **Auth & Services:** Clerk authentication, Sentry error monitoring, Resend email alerts, Meta WhatsApp Cloud API, APScheduler.

---

## 3. Monorepo Structure

```
heatsense-india/ (ThermaGrid)
├── .env.example                 # Root environment template
├── .gitignore                   # Excludes packages, virtualenvs, .env, and caches
├── docker-compose.yml           # PostGIS container definition
├── pytest.ini                   # Python test configuration
│
├── frontend/                    # React 19 + TypeScript + Tailwind v4
│   ├── .env.example
│   ├── index.html
│   └── src/
│       ├── three/               # 3D visual layer (RiskGlobe, WardHeatCity, TerrainFlythrough)
│       ├── components/          # Maps (MapLibre), dashboard, risk widgets
│       ├── pages/               # Landing, Citizen, Worker, Authority, Analytics, Simulation, About
│       └── store/               # Zustand application store
│
├── backend/                     # FastAPI Application
│   ├── .env.example
│   └── app/
│       ├── api/routes/          # Locations, weather, thermal, risk, alerts, simulation
│       ├── core/                # Config, Clerk auth, constants
│       ├── db/                  # Session, seed, models
│       ├── jobs/                # APScheduler hourly weather and 15-min alert tasks
│       └── services/            # AlertService, RiskService, WeatherService
│
├── analytics/                   # Python Analytics & ML Package
│   └── src/
│       ├── thermal_indices/     # ISO 7243 WBGT, Bröde UTCI, Rothfusz Heat Index
│       ├── spatial/             # Point-in-polygon, UHI delta, Getis-Ord Gi*
│       ├── risk/                # Hazard × Exposure × Vulnerability composite scoring
│       └── forecasting/         # Quantile Gradient Boosting ML forecaster
│
└── docs/                        # Architecture, data sources, methodology & thermal models
```

---

## 4. Quick Start

### 4.1 Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # On Windows (source .venv/bin/activate on Unix)
pip install -r requirements.txt
fastapi dev app/main.py     # http://localhost:8000
```

### 4.2 Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### 4.3 Automated Verification
```bash
# Run backend and analytics unit test suite
pytest -c pytest.ini -v

# Run frontend production build
npm --prefix frontend run build
```

---

## 5. License & Attributions

Free & Open Source under the [MIT License](LICENSE).  
Meteorological observations powered by IMD, ISRO Bhuvan, and Open-Meteo.
