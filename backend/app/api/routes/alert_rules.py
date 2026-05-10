from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.deps import AdminUser, get_db
from app.schemas.alert import AlertRuleCreate, AlertRuleRead, AlertRuleUpdate
from app.services import alert_service


router = APIRouter(prefix="/alert-rules", tags=["alert rules"])
DbSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=AlertRuleRead, status_code=201)
def create_alert_rule(payload: AlertRuleCreate, db: DbSession, _user: AdminUser):
    return alert_service.create_alert_rule(db, payload)


@router.get("", response_model=list[AlertRuleRead])
def list_alert_rules(db: DbSession):
    return alert_service.list_alert_rules(db)


@router.get("/{rule_id}", response_model=AlertRuleRead)
def get_alert_rule(rule_id: int, db: DbSession):
    return alert_service.get_alert_rule(db, rule_id)


@router.patch("/{rule_id}", response_model=AlertRuleRead)
def update_alert_rule(rule_id: int, payload: AlertRuleUpdate, db: DbSession, _user: AdminUser):
    return alert_service.update_alert_rule(db, rule_id, payload)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert_rule(rule_id: int, db: DbSession, _user: AdminUser):
    alert_service.delete_alert_rule(db, rule_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
