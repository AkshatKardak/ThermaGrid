"""
ThermaGrid - FastAPI Application Entry Point.
"""

import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.alerts import router as alerts_router
from app.api.routes.analytics import router as analytics_router

# Route imports
from app.api.routes.auth import router as auth_router
from app.api.routes.cooling_centres import router as cooling_centres_router
from app.api.routes.data_sources import router as data_sources_router
from app.api.routes.dependents import router as dependents_router
from app.api.routes.forecast import router as forecast_router
from app.api.routes.interventions import router as interventions_router
from app.api.routes.locations import router as locations_router
from app.api.routes.planner import router as planner_router
from app.api.routes.reports import router as reports_router
from app.api.routes.risk import router as risk_router
from app.api.routes.subscriptions import router as subscriptions_router
from app.api.routes.thermal import router as thermal_router
from app.api.routes.weather import router as weather_router
from app.api.routes.worker import router as worker_router
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.db.base import Base
from app.db.session import engine
from app.jobs.scheduler import start_scheduler, stop_scheduler

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
        settings.scheduler_enabled
        and settings.app_env != "testing"
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
        logger.info(
            f"{request.method} {request.url.path} completed in {process_time:.4f}s [status {response.status_code}]"
        )
        return response

    # Response caching middleware (TTL: 10m for observations, 1h for forecasts)
    from starlette.responses import Response as StarletteResponse

    from app.core.cache import get_cache_ttl, response_cache

    @app.middleware("http")
    async def cache_middleware(request: Request, call_next):
        if request.method != "GET":
            return await call_next(request)

        ttl = get_cache_ttl(request.url.path)
        if ttl is None:
            return await call_next(request)

        query_str = "&".join(sorted(f"{k}={v}" for k, v in request.query_params.multi_items()))
        cache_key = f"{request.url.path}?{query_str}"

        cached = response_cache.get(cache_key)
        if cached is not None:
            body, status_code, headers, media_type = cached
            res = StarletteResponse(content=body, status_code=status_code, media_type=media_type)
            for h_name, h_val in headers:
                if h_name.lower() not in [
                    "content-length",
                    "content-type",
                    "cache",
                    "x-cache",
                ]:
                    res.headers[h_name] = h_val
            res.headers["cache"] = "hit"
            res.headers["X-Cache"] = "hit"
            return res

        response = await call_next(request)
        if response.status_code == 200:
            body = [chunk async for chunk in response.body_iterator]
            full_body = b"".join(body)

            headers_to_cache = [
                (k, v)
                for k, v in response.headers.items()
                if k.lower() not in ["cache", "x-cache", "x-process-time-seconds"]
            ]
            response_cache.set(
                cache_key,
                full_body,
                response.status_code,
                headers_to_cache,
                response.media_type,
                ttl,
            )

            res = StarletteResponse(
                content=full_body,
                status_code=response.status_code,
                media_type=response.media_type,
            )
            for k, v in response.headers.items():
                res.headers[k] = v
            res.headers["cache"] = "miss"
            res.headers["X-Cache"] = "miss"
            return res

        response.headers["cache"] = "miss"
        response.headers["X-Cache"] = "miss"
        return response

    # Upstream data / weather outage exception handler
    from app.core.errors import DataSourceUnavailable

    @app.exception_handler(DataSourceUnavailable)
    async def weather_unavailable_handler(request: Request, exc: DataSourceUnavailable):
        logger.warning(f"Upstream outage at {request.url.path}: {exc}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "detail": str(exc),
                "retry_after": 300,
                "stale": False,
                "upstream_outage": True,
            },
            headers={"Retry-After": "300"},
        )

    # ValueError Exception Handler (e.g. Entity not found or validation error)
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        msg = str(exc)
        if "not found" in msg.lower():
            logger.info(f"Resource not found at {request.url.path}: {msg}")
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": msg},
            )
        logger.warning(f"Bad request value error at {request.url.path}: {msg}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": msg},
        )

    # Global Exception Handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An internal server error occurred. Please contact system administrator."
            },
        )

    # Health check endpoint (Render uses it to decide the service is live)
    @app.get("/health", tags=["Health"])
    def health_check():
        from sqlalchemy import text

        db_status = "down"
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                db_status = "up"
        except Exception as e:
            logger.error(f"Health check DB ping failed: {e}")
            db_status = "down"

        status_code = (
            status.HTTP_200_OK if db_status == "up" else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return JSONResponse(
            status_code=status_code,
            content={
                "status": "healthy" if db_status == "up" else "unhealthy",
                "db": db_status,
                "app": settings.app_name,
                "environment": settings.app_env,
                "version": "0.1.0",
            },
        )

    # Mount API Routers on /api/v1, /api, and root
    for prefix in ["/api/v1", "/api", ""]:
        app.include_router(auth_router, prefix=prefix)
        app.include_router(locations_router, prefix=prefix)
        app.include_router(weather_router, prefix=prefix)
        app.include_router(thermal_router, prefix=prefix)
        app.include_router(risk_router, prefix=prefix)
        app.include_router(analytics_router, prefix=prefix)
        app.include_router(forecast_router, prefix=prefix)
        app.include_router(interventions_router, prefix=prefix)
        app.include_router(cooling_centres_router, prefix=prefix)
        app.include_router(alerts_router, prefix=prefix)
        app.include_router(data_sources_router, prefix=prefix)
        app.include_router(planner_router, prefix=prefix)
        app.include_router(subscriptions_router, prefix=prefix)
        app.include_router(dependents_router, prefix=prefix)
        app.include_router(worker_router, prefix=prefix)
        app.include_router(reports_router, prefix=prefix)

    return app


app = create_application()
