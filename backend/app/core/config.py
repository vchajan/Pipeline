from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    project_name: str = Field(default="Big Data Pipeline Monitor", alias="PROJECT_NAME")
    environment: str = Field(default="local", alias="ENVIRONMENT")

    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    sqlite_database_url: str = Field(
        default="sqlite:///./pipeline_monitor.db",
        alias="SQLITE_DATABASE_URL",
    )
    redis_url: str | None = Field(default=None, alias="REDIS_URL")
    rq_queue_name: str = Field(default="pipeline-runs", alias="RQ_QUEUE_NAME")
    scheduler_id: str = Field(default="local-scheduler", alias="SCHEDULER_ID")
    scheduler_interval_seconds: int = Field(default=30, alias="SCHEDULER_INTERVAL_SECONDS")

    auth_mode: str = Field(default="keycloak", alias="AUTH_MODE")
    demo_auth_enabled: bool = Field(default=True, alias="DEMO_AUTH_ENABLED")
    backend_cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:8088", "http://localhost:5173"],
        alias="BACKEND_CORS_ORIGINS",
    )

    keycloak_url: str = Field(default="http://localhost:8080", alias="KEYCLOAK_URL")
    keycloak_internal_url: str = Field(
        default="http://keycloak:8080",
        alias="KEYCLOAK_INTERNAL_URL",
    )
    keycloak_realm: str = Field(default="pipeline-monitor", alias="KEYCLOAK_REALM")
    keycloak_client_id: str = Field(
        default="pipeline-monitor-web",
        alias="KEYCLOAK_CLIENT_ID",
    )
    keycloak_audience: str = Field(
        default="pipeline-monitor-web",
        alias="KEYCLOAK_AUDIENCE",
    )

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def sqlalchemy_database_url(self) -> str:
        return self.database_url or self.sqlite_database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
