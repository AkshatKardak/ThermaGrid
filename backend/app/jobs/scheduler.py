import logging
import hashlib
from contextlib import contextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.jobs.tasks import ingest_weather, compute_thermal, evaluate_alerts

log = logging.getLogger(__name__)

# Standard APScheduler instance configured for Indian Standard Time
scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")


def _lock_id_from_name(name: str) -> int:
    """Computes a stable signed 64-bit integer from a lock name for pg_try_advisory_lock."""
    h = int(hashlib.sha256(name.encode("utf-8")).hexdigest()[:15], 16)
    return h % (2**63 - 1)


@contextmanager
def advisory_lock(db: Session, name: str):
    """
    Acquires a PostgreSQL session-level advisory lock using a 64-bit key derived from `name`.
    If database dialect is not PostgreSQL (e.g. SQLite in dev/test), safely yields True.
    Yields True if acquired, False if already held by another worker.
    """
    bind = db.get_bind()
    is_postgres = "postgres" in bind.dialect.name.lower()
    if not is_postgres:
        yield True
        return

    lock_id = _lock_id_from_name(name)
    try:
        result = db.execute(text("SELECT pg_try_advisory_lock(:lock_id)"), {"lock_id": lock_id}).scalar()
        acquired = bool(result)
    except Exception as ex:
        log.warning(f"[SCHEDULER] Error testing advisory lock '{name}': {ex}")
        acquired = False

    try:
        yield acquired
    finally:
        if acquired:
            try:
                db.execute(text("SELECT pg_advisory_unlock(:lock_id)"), {"lock_id": lock_id})
                db.commit()
            except Exception as ex:
                log.warning(f"[SCHEDULER] Error unlocking advisory lock '{name}': {ex}")


async def locked_job_runner(job_fn, name: str):
    """Executes job_fn only if this instance holds the advisory lock for the job."""
    with SessionLocal() as db:
        with advisory_lock(db, f"scheduler:{name}") as acquired:
            if not acquired:
                log.info(f"[SCHEDULER] Job '{name}' skipped: locked by another worker.")
                return
            log.info(f"[SCHEDULER] Acquired lock for job '{name}'. Starting execution.")
            await job_fn()


def start_scheduler() -> None:
    """
    Initializes and starts scheduled tasks:
    - Ingest weather hourly
    - Recompute thermal indices hourly
    - Evaluate emergency heat alerts every 15 minutes
    """
    try:
        scheduler.add_job(
            lambda: locked_job_runner(ingest_weather, "ingest"),
            IntervalTrigger(hours=1),
            id="ingest",
            replace_existing=True,
            max_instances=1,
        )
        scheduler.add_job(
            lambda: locked_job_runner(compute_thermal, "thermal"),
            IntervalTrigger(hours=1),
            id="thermal",
            replace_existing=True,
            max_instances=1,
        )
        scheduler.add_job(
            lambda: locked_job_runner(evaluate_alerts, "alerts"),
            IntervalTrigger(minutes=15),
            id="alerts",
            replace_existing=True,
            max_instances=1,
        )
        scheduler.start()
        log.info("[SCHEDULER] APScheduler started successfully in Asia/Kolkata timezone with advisory locks.")
    except Exception as e:
        log.warning(f"[SCHEDULER] Could not start APScheduler: {e}")


def stop_scheduler() -> None:
    """Gracefully halts scheduler during FastAPI lifespan shutdown."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        log.info("[SCHEDULER] APScheduler stopped.")
