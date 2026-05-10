from typing import Any

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis import Redis
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.db.session import engine


settings = get_settings()

app = FastAPI(
    title=settings.project_name,
    version="0.1.0",
    description="Simulation API for monitoring dataset pipeline runs.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "backend",
        "environment": settings.environment,
    }


@app.get("/ready", response_model=None)
def ready() -> Any:
    checks: dict[str, str] = {
        "database": "unknown",
        "redis": "not_configured",
    }

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except SQLAlchemyError:
        checks["database"] = "error"

    if settings.redis_url:
        try:
            redis_client = Redis.from_url(
                settings.redis_url,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            redis_client.ping()
            checks["redis"] = "ok"
        except Exception:
            checks["redis"] = "error"

    is_ready = all(value in {"ok", "not_configured"} for value in checks.values())
    payload = {
        "status": "ready" if is_ready else "not_ready",
        "checks": checks,
    }

    if is_ready:
        return payload

    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content=payload,
    )
