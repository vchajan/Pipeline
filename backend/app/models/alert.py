from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AlertConditionType, AlertSeverity, AlertStatus
from app.models.types import enum_column_type


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    pipeline_id: Mapped[int] = mapped_column(
        ForeignKey("pipelines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    condition_type: Mapped[AlertConditionType] = mapped_column(
        enum_column_type(AlertConditionType, "alert_condition_type"),
        nullable=False,
    )
    threshold_seconds: Mapped[int | None] = mapped_column(Integer)
    threshold_records: Mapped[int | None] = mapped_column(Integer)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    pipeline = relationship("Pipeline", back_populates="alert_rules")
    events = relationship(
        "AlertEvent",
        back_populates="rule",
        cascade="all, delete-orphan",
    )


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    rule_id: Mapped[int] = mapped_column(
        ForeignKey("alert_rules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    run_id: Mapped[int | None] = mapped_column(ForeignKey("job_runs.id", ondelete="SET NULL"))
    pipeline_id: Mapped[int | None] = mapped_column(
        ForeignKey("pipelines.id", ondelete="SET NULL"),
        index=True,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[AlertSeverity] = mapped_column(
        enum_column_type(AlertSeverity, "alert_severity"),
        nullable=False,
        default=AlertSeverity.MEDIUM,
    )
    status: Mapped[AlertStatus] = mapped_column(
        enum_column_type(AlertStatus, "alert_status"),
        nullable=False,
        default=AlertStatus.OPEN,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    acknowledged_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    resolved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    rule = relationship("AlertRule", back_populates="events")
    run = relationship("JobRun", back_populates="alert_events")
    pipeline = relationship("Pipeline", back_populates="alert_events")
    acknowledger = relationship(
        "User",
        back_populates="acknowledged_alerts",
        foreign_keys=[acknowledged_by],
    )
    resolver = relationship(
        "User",
        back_populates="resolved_alerts",
        foreign_keys=[resolved_by],
    )
