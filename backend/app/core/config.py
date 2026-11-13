"""
Application configuration management using pydantic-settings.
Reads environment variables strictly from .env and system environment.
"""

from functools import lru_cache
from typing import List
import os
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    app_name: str = "ThermaGrid API"
    app_env: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    api_prefix: str = "/api/v1"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    scheduler_enabled: bool = True
    allow_sqlite_fallback: bool = True

    # Database
    database_url: str = Field(default="", description="Postgres DSN — required, no default")
    fallback_sqlite_url: str = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'heatsense_dev.db')}"

    # Risk Data Gates
    allow_synthetic_risk: bool = False
    max_observation_age_min: int = 180
    min_completeness: float = 0.9

    @model_validator(mode="after")
    def _require_db_url(self):
        if not self.database_url and self.app_env != "development":
            raise ValueError("DATABASE_URL must be set")
        return self

    # Clerk (auth)
    clerk_secret_key: str = ""
    clerk_jwks_url: str = ""
    clerk_issuer: str = ""
    clerk_authorized_parties: str = "http://localhost:5173"

    # Resend (email)
    resend_api_key: str = ""
    alert_from_email: str = "ThermaGrid <onboarding@resend.dev>"

    # WhatsApp Cloud API (test number)
    whatsapp_phone_id: str = ""
    whatsapp_waba_id: str = ""
    whatsapp_token: str = ""

    # Alerts
    alert_provider: str = "none"  # resend | whatsapp | none
    alert_threshold: float = 80.0
    alert_cooldown_minutes: int = 180
    alert_max_per_day: int = 2
    alert_season_budget: int = 40
    sms_enabled: bool = False
    textbelt_key: str = "textbelt"
    demo_alert_phone: str = ""

    # Weather
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"
    open_meteo_archive_url: str = "https://archive-api.open-meteo.com/v1"

    # ML Artifacts
    model_artifact_path: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "analytics", "models", "forecast_model.pkl"
    )
    model_metrics_path: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "analytics", "models", "metrics.json"
    )

    # Thermal Defaults
    wbgt_method: str = "iso7243_approx"
    default_clothing_insulation: float = 0.5

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    # Backward-compatibility uppercase properties
    @property
    def APP_NAME(self) -> str: return self.app_name
    @property
    def APP_ENV(self) -> str: return self.app_env
    @property
    def DEBUG(self) -> bool: return self.debug
    @property
    def SCHEDULER_ENABLED(self) -> bool: return self.scheduler_enabled
    @property
    def ALLOW_SQLITE_FALLBACK(self) -> bool: return self.allow_sqlite_fallback
    @property
    def API_V1_PREFIX(self) -> str: return self.api_prefix
    @property
    def API_PREFIX(self) -> str: return self.api_prefix
    @property
    def LOG_LEVEL(self) -> str: return self.log_level
    @property
    def DATABASE_URL(self) -> str: return self.database_url
    @property
    def FALLBACK_SQLITE_URL(self) -> str: return self.fallback_sqlite_url
    @property
    def CORS_ORIGINS(self) -> str: return self.cors_origins
    @property
    def cors_origins_list(self) -> List[str]: return self.cors_origin_list
    @property
    def ALERT_PROVIDER(self) -> str: return self.alert_provider
    @property
    def ALERT_THRESHOLD(self) -> float: return self.alert_threshold
    @property
    def ALERT_COOLDOWN_MINUTES(self) -> int: return self.alert_cooldown_minutes
    @property
    def ALERT_MAX_PER_DAY(self) -> int: return self.alert_max_per_day
    @property
    def ALERT_SEASON_BUDGET(self) -> int: return self.alert_season_budget
    @property
    def SMS_ENABLED(self) -> bool: return self.sms_enabled
    @property
    def TEXTBELT_KEY(self) -> str: return self.textbelt_key
    @property
    def DEMO_ALERT_PHONE(self) -> str: return self.demo_alert_phone
    @property
    def OPEN_METEO_BASE_URL(self) -> str: return self.open_meteo_base_url
    @property
    def OPEN_METEO_ARCHIVE_URL(self) -> str: return self.open_meteo_archive_url
    @property
    def MODEL_ARTIFACT_PATH(self) -> str: return self.model_artifact_path
    @property
    def MODEL_METRICS_PATH(self) -> str: return self.model_metrics_path
    @property
    def WBGT_METHOD(self) -> str: return self.wbgt_method
    @property
    def DEFAULT_CLOTHING_INSULATION(self) -> float: return self.default_clothing_insulation


@lru_cache
def get_settings() -> Settings:
    return Settings()
