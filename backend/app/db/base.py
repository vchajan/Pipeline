from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def import_models() -> None:
    """Import model modules so Alembic can discover Base metadata."""
    from app.models import (  # noqa: F401
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
