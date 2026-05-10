from datetime import datetime

from app.models.enums import DatasetSourceType
from app.schemas.common import ApiModel


class DatasetBase(ApiModel):
    name: str
    description: str | None = None
    owner: str | None = None
    source_type: DatasetSourceType
    schema_version: str | None = None


class DatasetCreate(DatasetBase):
    pass


class DatasetUpdate(ApiModel):
    name: str | None = None
    description: str | None = None
    owner: str | None = None
    source_type: DatasetSourceType | None = None
    schema_version: str | None = None


class DatasetRead(DatasetBase):
    id: int
    created_at: datetime
    updated_at: datetime
