from datetime import datetime

from app.models.enums import JobRunStatus, TriggerType
from app.schemas.common import ApiModel


class JobRunCreate(ApiModel):
    trigger_type: TriggerType = TriggerType.MANUAL
    created_by: int | None = None


class JobRunUpdate(ApiModel):
    status: JobRunStatus | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    runtime_seconds: int | None = None
    records_processed: int | None = None
    error_message: str | None = None


class JobRunRead(ApiModel):
    id: int
    pipeline_id: int
    pipeline_version_id: int | None
    trigger_type: TriggerType
    status: JobRunStatus
    started_at: datetime | None
    finished_at: datetime | None
    runtime_seconds: int | None
    records_processed: int | None
    error_message: str | None
    created_by: int | None
    created_at: datetime
