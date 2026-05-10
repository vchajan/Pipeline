from datetime import datetime

from app.models.enums import AlertConditionType, AlertSeverity, AlertStatus
from app.schemas.common import ApiModel


class AlertRuleBase(ApiModel):
    pipeline_id: int
    name: str
    condition_type: AlertConditionType
    threshold_seconds: int | None = None
    threshold_records: int | None = None
    enabled: bool = True


class AlertRuleCreate(AlertRuleBase):
    pass


class AlertRuleUpdate(ApiModel):
    pipeline_id: int | None = None
    name: str | None = None
    condition_type: AlertConditionType | None = None
    threshold_seconds: int | None = None
    threshold_records: int | None = None
    enabled: bool | None = None


class AlertRuleRead(AlertRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime


class AlertEventRead(ApiModel):
    id: int
    rule_id: int
    run_id: int | None
    pipeline_id: int | None
    message: str
    severity: AlertSeverity
    status: AlertStatus
    created_at: datetime
    acknowledged_at: datetime | None
    resolved_at: datetime | None
    acknowledged_by: int | None
    resolved_by: int | None
