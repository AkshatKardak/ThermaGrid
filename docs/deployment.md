# Production Deployment Guide & Checklist

ThermaGrid is deployed across two decoupled tiers:
- **Frontend SPA:** [Netlify](https://www.netlify.com/) static single-page application (React 19 + Vite 8).
- **Backend API:** [Render](https://render.com/) Python web service (FastAPI + Uvicorn).
- **Database:** External PostgreSQL instance (e.g. [Neon](https://neon.tech/) or [Supabase](https://supabase.com/) free tier, or a paid Render PostgreSQL). Do **not** use Render's free PostgreSQL tier because it expires after 30 days and deletes all stored ward and risk data.

---

## First-Deploy Numbered Checklist

### 1. Provision an External PostgreSQL Database
Create a managed PostgreSQL database on Neon, Supabase, or a paid Render Postgres instance.
- Obtain the standard connection string (`DATABASE_URL`), e.g.:
  `postgresql://<user>:<password>@<host>/<database>?sslmode=require`
- Note: Plain `postgresql://` URLs work out-of-the-box via SQLAlchemy 2.1.6 and psycopg v3. Do not rewrite to `+psycopg2`.

### 2. Configure Render Web Service Environment Variables
In the Render dashboard (or via the Blueprint using [`render.yaml`](../render.yaml)), create a new Web Service pointing to `AkshatKardak/ThermaGrid` on branch `main`.

Configure the following environment variables in the Render Dashboard (under **Environment**):

| Variable | Description | Example / Setting |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string from Step 1 | `postgresql://<user>:<password>@<host>/<database>?sslmode=require` |
| `CORS_ORIGINS` | Exact Netlify production origin (**CRITICAL**) | `https://<your-site>.netlify.app` |
| `CLERK_SECRET_KEY` | Clerk backend secret key | `sk_live_...` or `sk_test_...` |
| `CLERK_JWKS_URL` | Clerk JWKS URL for JWT signature verification | `https://<clerk-domain>.clerk.accounts.dev/.well-known/jwks.json` |
| `CLERK_ISSUER` | Clerk token issuer URL | `https://<clerk-domain>.clerk.accounts.dev` |
| `RESEND_API_KEY` | Resend API key for alert notifications | `re_...` |
| `ALLOW_SYNTHETIC_RISK` | Allow synthetic risk generator when telemetry is stale | `"true"` (for demo); `"false"` (strict operational) |
| `SCHEDULER_ENABLED` | Background APScheduler telemetry cron jobs | `"false"` on free tier; `"true"` on paid instances |
| `ALLOW_SQLITE_FALLBACK`| Fallback to local SQLite if Postgres connection fails | `"false"` in production |
| `APP_ENV` | Application environment name | `production` |
| `DEBUG` | FastAPI debug mode | `"false"` |

> [!WARNING]
> **CORS Configuration:** Setting `CORS_ORIGINS` to `localhost` in production will cause all browser requests from Netlify to fail with HTTP CORS policy errors. Enter the exact Netlify domain (e.g. `https://<your-app>.netlify.app`).

### 3. Deploy the Backend API
Trigger the Render deploy.
- **Build Command:** `pip install -r backend/requirements.txt`
- **Start Command:** `cd backend && alembic upgrade head && python ../scripts/seed_database.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`
- The start command automatically applies schema migrations (`alembic upgrade head`) and executes the idempotent database seeder (`scripts/seed_database.py`) before uvicorn boots, preventing 404s on fresh deployments.

### 4. Verify Backend Health and API Documentation
Once the build completes and Render reports the service live:
1. Open `https://<api-host>.onrender.com/health` in your browser.
   - Verify it responds with HTTP 200:
     ```json
     {"status": "healthy", "db": "up", "app": "ThermaGrid API", "environment": "production", "version": "0.1.0"}
     ```
2. Open `https://<api-host>.onrender.com/docs` to inspect the Swagger UI.
3. Test a live data endpoint: `GET https://<api-host>.onrender.com/api/v1/locations` to verify that ward rows exist.
   *(If the start command was manually overridden without the seeder, open the Render Shell and run `python scripts/seed_database.py`).*

### 5. Deploy Frontend SPA to Netlify
Create a new site in Netlify linked to the repository.
- **Base directory:** `frontend`
- **Build command:** `npm ci && npm run build`
- **Publish directory:** `dist`
- Configure the following two environment variables in **Site configuration > Environment variables** (do not commit secrets to `netlify.toml`):

| Variable | Description | Example / Setting |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Canonical backend API URL (including `/api/v1`) | `https://<api-host>.onrender.com/api/v1` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key for client-side authentication | `pk_live_...` or `pk_test_...` |

### 6. Verify Frontend Boot and Clerk Configuration
Trigger a Netlify deploy and open the production Netlify URL (`https://<your-site>.netlify.app`):
- Confirm the application loads the landing page and authentication layout past the Clerk initialization screen.
- Verify that no white screen or Clerk configuration missing error appears.

### 7. Confirm End-to-End CORS and API Data Flow
Open the browser Developer Tools (**Network** tab):
1. Navigate across the dashboard wards, thermal metrics, and cooling centre explorer.
2. Confirm that requests to `https://<api-host>.onrender.com/api/v1/...` return HTTP 200 with appropriate CORS headers (`Access-Control-Allow-Origin: https://<your-site>.netlify.app`).
3. Verify there are no red CORS failures in the Console tab.

---

## Free-Tier Operational Constraints

When deploying on Render's free tier, keep the following hardware constraints in mind:
- **RAM Limits:** Free instances provide **512 MB RAM**. ThermaGrid's idle RSS sits at approximately **~348 MB**. Single-worker Uvicorn (`--workers 1`) is strictly required to prevent Out-Of-Memory (OOM) process termination.
- **Inactivity Spin-Down:** Free instances spin down after **15 minutes** of idle traffic. The first request after a period of inactivity may incur a cold-start delay of 30–50 seconds while the container initializes.
- **APScheduler Background Jobs:** Background cron jobs (`SCHEDULER_ENABLED`) cannot reliably ingest hourly weather feeds on a container that spins down when idle. Scheduled telemetry ingestion requires an upgraded persistent instance.

---

## Granting Authority Access

The municipal authority console (`/app/authority`) provides ward-level risk rankings, intervention queue management, and emergency alert broadcast dispatching. Access requires verified administrative role permissions:

1. Sign in to the application using standard authentication.
2. In the Clerk Dashboard, navigate to **Users** -> select the user -> **Metadata** -> **Public**.
3. Set the metadata key:
   ```json
   {
     "role": "authority"
   }
   ```
4. Sign out and sign back in to refresh the session claims. The municipal authority navigation tab and `/app/authority` console will unlock.

