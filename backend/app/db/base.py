from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Imported for Alembic metadata discovery.
from app.models import (  # noqa: E402,F401
    AlertEvent,
    AlertRule,
    AuditLog,
    Dataset,
    JobRun,
    JobRunStep,
    OutboxEvent,
    Pipeline,
    PipelineVersion,
    SchedulerHeartbeat,
    User,
    WorkerHeartbeat,
)
