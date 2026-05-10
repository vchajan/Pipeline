from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.alert import AlertEvent, AlertRule
from app.models.enums import AlertStatus
from app.models.pipeline import Pipeline
from app.schemas.alert import AlertRuleCreate, AlertRuleUpdate
from app.services.exceptions import BusinessRuleError, NotFoundError


def create_alert_rule(db: Session, payload: AlertRuleCreate) -> AlertRule:
    if db.get(Pipeline, payload.pipeline_id) is None:
        raise BusinessRuleError("AlertRule can be created only for an existing Pipeline")
    rule = AlertRule(**payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def list_alert_rules(db: Session) -> list[AlertRule]:
    return list(db.scalars(select(AlertRule).order_by(AlertRule.id)))


def get_alert_rule(db: Session, rule_id: int) -> AlertRule:
    rule = db.get(AlertRule, rule_id)
    if rule is None:
        raise NotFoundError("Alert rule not found")
    return rule


def update_alert_rule(db: Session, rule_id: int, payload: AlertRuleUpdate) -> AlertRule:
    rule = get_alert_rule(db, rule_id)
    values = payload.model_dump(exclude_unset=True)
    if "pipeline_id" in values and db.get(Pipeline, values["pipeline_id"]) is None:
        raise BusinessRuleError("AlertRule can reference only an existing Pipeline")

    for field, value in values.items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule


def delete_alert_rule(db: Session, rule_id: int) -> None:
    rule = get_alert_rule(db, rule_id)
    db.delete(rule)
    db.commit()


def list_alerts(db: Session) -> list[AlertEvent]:
    return list(
        db.scalars(select(AlertEvent).order_by(AlertEvent.created_at.desc(), AlertEvent.id.desc()))
    )


def get_alert(db: Session, alert_id: int) -> AlertEvent:
    alert = db.get(AlertEvent, alert_id)
    if alert is None:
        raise NotFoundError("Alert not found")
    return alert


def acknowledge_alert(db: Session, alert_id: int, user_id: int | None = None) -> AlertEvent:
    alert = get_alert(db, alert_id)
    if alert.status == AlertStatus.RESOLVED:
        raise BusinessRuleError("Resolved alerts cannot be acknowledged")
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_at = datetime.now(UTC)
    alert.acknowledged_by = user_id
    db.commit()
    db.refresh(alert)
    return alert


def resolve_alert(db: Session, alert_id: int, user_id: int | None = None) -> AlertEvent:
    alert = get_alert(db, alert_id)
    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.now(UTC)
    alert.resolved_by = user_id
    db.commit()
    db.refresh(alert)
    return alert
