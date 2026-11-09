"""
ThermaGrid - FastAPI Application Entry Point.
"""

import os
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.db.base import Base
from app.db.session import engine
from app.jobs.scheduler import start_scheduler, stop_scheduler

# Route imports
from app.api.routes.auth import router as auth_router
from app.api.routes.locations import router as locations_router
from app.api.routes.weather import router as weather_router
from app.api.routes.thermal import router as thermal_router
from app.api.routes.risk import router as risk_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.forecast import router as forecast_router
from app.api.routes.simulation import router as simulation_router
from app.api.routes.interventions import router as interventions_router
from app.api.routes.cooling_centres import router as cooling_centres_router
from app.api.routes.alerts import router as alerts_router
from app.api.routes.data_sources import router as data_sources_router
from app.api.routes.planner import router as planner_router
from app.api.routes.subscriptions import router as subscriptions_router
from app.api.routes.dependents import router as dependents_router
from app.api.routes.worker import router as worker_router

setup_logging()
logger = logging.getLogger("thermagrid.main")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan:
    1. Initializes database schema
    2. Starts APScheduler background weather & alert cron tasks
    3. Yields for request processing
    4. Halts scheduler gracefully on shutdown
    """
    logger.info(f"Starting {settings.app_name} in [{settings.app_env}] mode.")
    # schema managed by Alembic — run: alembic upgrade head
    if settings.app_env == "development" and settings.debug:
        Base.metadata.create_all(bind=engine)
    should_run_scheduler = (
        settings.app_env != "testing"
        and os.getenv("TESTING") != "true"
        and os.getenv("PYTEST_CURRENT_TEST") is None
    )
    if should_run_scheduler:
        start_scheduler()
    yield
    if should_run_scheduler:
        stop_scheduler()
    logger.info(f"Shutting down {settings.app_name}.")


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Hyperlocal human thermal-stress early-warning and decision-support platform.",
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request execution timer & access logging
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time-Seconds"] = str(round(process_time, 4))
        logger.info(f"{request.method} {request.url.path} completed in {process_time:.4f}s [status {response.status_code}]")
        return response

    # Global Exception Handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred. Please contact system administrator."},
        )

    # Health check endpoint
    @app.get("/health", tags=["Health"])
    def health_check():
        return {
            "status": "healthy",
            "app": settings.app_name,
            "environment": settings.app_env,
            "version": "0.1.0",
        }

    # Mount API Routers
    api_prefix = settings.api_v1_prefix
    for prefix in set([api_prefix, "/api"]):
        app.include_router(auth_router, prefix=prefix)
        app.include_router(locations_router, prefix=prefix)
        app.include_router(weather_router, prefix=prefix)
        app.include_router(thermal_router, prefix=prefix)
        app.include_router(risk_router, prefix=prefix)
        app.include_router(analytics_router, prefix=prefix)
        app.include_router(forecast_router, prefix=prefix)
        app.include_router(simulation_router, prefix=prefix)
        app.include_router(interventions_router, prefix=prefix)
        app.include_router(cooling_centres_router, prefix=prefix)
        app.include_router(alerts_router, prefix=prefix)
        app.include_router(data_sources_router, prefix=prefix)
        app.include_router(planner_router, prefix=prefix)
        app.include_router(subscriptions_router, prefix=prefix)
        app.include_router(dependents_router, prefix=prefix)
        app.include_router(worker_router, prefix=prefix)

    return app


app = create_application()
