"""
Database engine and session management with PostgreSQL/PostGIS support
and graceful SQLite fallback for local development without active Docker container.
"""

import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

db_url = settings.DATABASE_URL
engine = None

# Attempt primary connection (Postgres/PostGIS)
try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 3} if "postgresql" in db_url else {},
    )
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Successfully connected to primary database (PostgreSQL/PostGIS).")
except Exception as e:
    logger.warning(
        f"Primary database connection ({db_url}) failed: {e}. "
        f"Falling back to local SQLite database: {settings.FALLBACK_SQLITE_URL}"
    )
    db_url = settings.FALLBACK_SQLITE_URL
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False} if "sqlite" in db_url else {},
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
