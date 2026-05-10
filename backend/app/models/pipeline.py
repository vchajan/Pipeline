from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import LoadType, PipelineEngine, ProcessingMode, TargetLayer
from app.models.types import enum_column_type


class Pipeline(Base):
    __tablename__ = "pipelines"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    schedule: Mapped[str | None] = mapped_column(String(100))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    engine: Mapped[PipelineEngine] = mapped_column(
        enum_column_type(PipelineEngine, "pipeline_engine"),
        nullable=False,
        default=PipelineEngine.PYTHON,
    )
    processing_mode: Mapped[ProcessingMode] = mapped_column(
        enum_column_type(ProcessingMode, "processing_mode"),
        nullable=False,
        default=ProcessingMode.BATCH,
    )
    load_type: Mapped[LoadType] = mapped_column(
        enum_column_type(LoadType, "load_type"),
        nullable=False,
        default=LoadType.FULL,
    )
    target_layer: Mapped[TargetLayer] = mapped_column(
        enum_column_type(TargetLayer, "target_layer"),
        nullable=False,
        default=TargetLayer.STAGING,
    )
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

    dataset = relationship("Dataset", back_populates="pipelines")
    versions = relationship(
        "PipelineVersion",
        back_populates="pipeline",
        cascade="all, delete-orphan",
    )
    runs = relationship("JobRun", back_populates="pipeline", cascade="all, delete-orphan")
    alert_rules = relationship(
        "AlertRule",
        back_populates="pipeline",
        cascade="all, delete-orphan",
    )
    alert_events = relationship("AlertEvent", back_populates="pipeline")


class PipelineVersion(Base):
    __tablename__ = "pipeline_versions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    pipeline_id: Mapped[int] = mapped_column(
        ForeignKey("pipelines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    config_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    pipeline = relationship("Pipeline", back_populates="versions")
    creator = relationship(
        "User",
        back_populates="created_pipeline_versions",
        foreign_keys=[created_by],
    )
    runs = relationship("JobRun", back_populates="pipeline_version")
