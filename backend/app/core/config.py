"""
Application configuration management using pydantic-settings.
Reads environment variables strictly from .env and system environment.
"""

from functools import lru_cache
from typing import List
import os
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
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Database
    database_url: str = "postgresql+psycopg://heatsense:heatsense_secure_pass_demo@localhost:5432/heatsense"
    fallback_sqlite_url: str = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'heatsense_dev.db')}"

    # Clerk (auth)
    clerk_secret_key: str = ""
    clerk_jwks_url: str = ""
    clerk_issuer: str = ""
    clerk_authorized_parties: str = "http://localhost:5173"

    # Sentry
    sentry_dsn: str = ""

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
    def API_V1_PREFIX(self) -> str: return self.api_v1_prefix
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
