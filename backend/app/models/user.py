from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import UserRole
from app.models.types import enum_column_type


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        enum_column_type(UserRole, "user_role"),
        nullable=False,
        default=UserRole.VIEWER,
    )
    external_subject: Mapped[str | None] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    created_pipeline_versions = relationship(
        "PipelineVersion",
        back_populates="creator",
        foreign_keys="PipelineVersion.created_by",
    )
    created_job_runs = relationship(
        "JobRun",
        back_populates="creator",
        foreign_keys="JobRun.created_by",
    )
    acknowledged_alerts = relationship(
        "AlertEvent",
        back_populates="acknowledger",
        foreign_keys="AlertEvent.acknowledged_by",
    )
    resolved_alerts = relationship(
        "AlertEvent",
        back_populates="resolver",
        foreign_keys="AlertEvent.resolved_by",
    )
    audit_logs = relationship("AuditLog", back_populates="actor")
