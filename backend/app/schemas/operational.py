from datetime import datetime

from app.models.enums import HeartbeatStatus
from app.schemas.common import ApiModel


class AuditLogRead(ApiModel):
    id: int
    actor_user_id: int | None
    actor_email: str | None
    action: str
    entity_type: str
    entity_id: str | None
    metadata_json: dict | None
    created_at: datetime


class DashboardSummary(ApiModel):
    datasets_count: int
    pipelines_count: int
    active_pipelines_count: int
    runs_count: int
    open_alerts_count: int
    runs_by_status: dict[str, int]


class WorkerHeartbeatRead(ApiModel):
    worker_id: str
    status: HeartbeatStatus
    last_seen_at: datetime
    processed_jobs: int
    current_run_id: int | None


class SchedulerHeartbeatRead(ApiModel):
    scheduler_id: str
    status: HeartbeatStatus
    last_tick_at: datetime
    created_runs_count: int


class SystemStatus(ApiModel):
    database: str
    workers: list[WorkerHeartbeatRead]
    scheduler: SchedulerHeartbeatRead | None
