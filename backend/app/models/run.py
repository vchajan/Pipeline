from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import JobRunStatus, JobRunStepStatus, TriggerType
from app.models.types import enum_column_type


class JobRun(Base):
    __tablename__ = "job_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    pipeline_id: Mapped[int] = mapped_column(
        ForeignKey("pipelines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pipeline_version_id: Mapped[int | None] = mapped_column(
        ForeignKey("pipeline_versions.id", ondelete="SET NULL"),
        index=True,
    )
    trigger_type: Mapped[TriggerType] = mapped_column(
        enum_column_type(TriggerType, "trigger_type"),
        nullable=False,
    )
    status: Mapped[JobRunStatus] = mapped_column(
        enum_column_type(JobRunStatus, "job_run_status"),
        nullable=False,
        default=JobRunStatus.PENDING,
        index=True,
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    runtime_seconds: Mapped[int | None] = mapped_column(Integer)
    records_processed: Mapped[int | None] = mapped_column(Integer)
    error_message: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    pipeline = relationship("Pipeline", back_populates="runs")
    pipeline_version = relationship("PipelineVersion", back_populates="runs")
    creator = relationship(
        "User",
        back_populates="created_job_runs",
        foreign_keys=[created_by],
    )
    steps = relationship(
        "JobRunStep",
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="JobRunStep.order_index",
    )
    alert_events = relationship("AlertEvent", back_populates="run")
    worker_heartbeats = relationship("WorkerHeartbeat", back_populates="current_run")


class JobRunStep(Base):
    __tablename__ = "job_run_steps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    run_id: Mapped[int] = mapped_column(
        ForeignKey("job_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[JobRunStepStatus] = mapped_column(
        enum_column_type(JobRunStepStatus, "job_run_step_status"),
        nullable=False,
        default=JobRunStepStatus.PENDING,
        index=True,
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    records_processed: Mapped[int | None] = mapped_column(Integer)
    error_message: Mapped[str | None] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    run = relationship("JobRun", back_populates="steps")
