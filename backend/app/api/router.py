from fastapi import APIRouter

from app.api.routes import (
    alert_rules,
    alerts,
    audit_logs,
    dashboard,
    datasets,
    pipeline_versions,
    pipelines,
    runs,
    system,
)


api_router = APIRouter()
api_router.include_router(datasets.router)
api_router.include_router(pipelines.router)
api_router.include_router(pipeline_versions.router)
api_router.include_router(runs.router)
api_router.include_router(alert_rules.router)
api_router.include_router(alerts.router)
api_router.include_router(dashboard.router)
api_router.include_router(system.router)
api_router.include_router(audit_logs.router)
