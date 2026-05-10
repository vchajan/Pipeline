from datetime import datetime
from typing import Any

from pydantic import Field

from app.models.enums import LoadType, PipelineEngine, ProcessingMode, TargetLayer
from app.schemas.common import ApiModel


class PipelineBase(ApiModel):
    dataset_id: int
    name: str
    description: str | None = None
    schedule: str | None = None
    active: bool = True
    engine: PipelineEngine = PipelineEngine.PYTHON
    processing_mode: ProcessingMode = ProcessingMode.BATCH
    load_type: LoadType = LoadType.FULL
    target_layer: TargetLayer = TargetLayer.STAGING


class PipelineCreate(PipelineBase):
    pass


class PipelineUpdate(ApiModel):
    dataset_id: int | None = None
    name: str | None = None
    description: str | None = None
    schedule: str | None = None
    active: bool | None = None
    engine: PipelineEngine | None = None
    processing_mode: ProcessingMode | None = None
    load_type: LoadType | None = None
    target_layer: TargetLayer | None = None


class PipelineRead(PipelineBase):
    id: int
    created_at: datetime
    updated_at: datetime


class PipelineVersionBase(ApiModel):
    version_number: int
    config_json: dict[str, Any] = Field(default_factory=dict)
    active: bool = False
    created_by: int | None = None


class PipelineVersionCreate(PipelineVersionBase):
    pass


class PipelineVersionRead(PipelineVersionBase):
    id: int
    pipeline_id: int
    created_at: datetime
