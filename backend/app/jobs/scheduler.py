import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.jobs.tasks import ingest_weather, compute_thermal, evaluate_alerts

log = logging.getLogger(__name__)

# Standard APScheduler instance configured for Indian Standard Time
scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")


def start_scheduler() -> None:
    """
    Initializes and starts scheduled tasks:
    - Ingest weather hourly
    - Recompute thermal indices hourly
    - Evaluate emergency heat alerts every 15 minutes
    """
    try:
        scheduler.add_job(
            ingest_weather,
            IntervalTrigger(hours=1),
            id="ingest",
            replace_existing=True,
            max_instances=1,
        )
        scheduler.add_job(
            compute_thermal,
            IntervalTrigger(hours=1),
            id="thermal",
            replace_existing=True,
            max_instances=1,
        )
        scheduler.add_job(
            evaluate_alerts,
            IntervalTrigger(minutes=15),
            id="alerts",
            replace_existing=True,
            max_instances=1,
        )
        scheduler.start()
        log.info("[SCHEDULER] APScheduler started successfully in Asia/Kolkata timezone.")
    except Exception as e:
        log.warning(f"[SCHEDULER] Could not start APScheduler: {e}")


def stop_scheduler() -> None:
    """Gracefully halts scheduler during FastAPI lifespan shutdown."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        log.info("[SCHEDULER] APScheduler stopped.")
