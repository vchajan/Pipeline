from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import HeartbeatStatus
from app.models.types import enum_column_type


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    actor_email: Mapped[str | None] = mapped_column(String(255), index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_id: Mapped[str | None] = mapped_column(String(100), index=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    actor = relationship("User", back_populates="audit_logs")


class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    aggregate_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    aggregate_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    payload_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    processed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class WorkerHeartbeat(Base):
    __tablename__ = "worker_heartbeats"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    worker_id: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    status: Mapped[HeartbeatStatus] = mapped_column(
        enum_column_type(HeartbeatStatus, "heartbeat_status"),
        nullable=False,
        default=HeartbeatStatus.STARTING,
        index=True,
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    processed_jobs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_run_id: Mapped[int | None] = mapped_column(ForeignKey("job_runs.id", ondelete="SET NULL"))

    current_run = relationship("JobRun", back_populates="worker_heartbeats")


class SchedulerHeartbeat(Base):
    __tablename__ = "scheduler_heartbeats"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    scheduler_id: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    last_tick_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    status: Mapped[HeartbeatStatus] = mapped_column(
        enum_column_type(HeartbeatStatus, "heartbeat_status"),
        nullable=False,
        default=HeartbeatStatus.STARTING,
        index=True,
    )
    created_runs_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
