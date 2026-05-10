from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.alert import AlertEventRead
from app.services import alert_service


router = APIRouter(prefix="/alerts", tags=["alerts"])
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[AlertEventRead])
def list_alerts(db: DbSession):
    return alert_service.list_alerts(db)


@router.get("/{alert_id}", response_model=AlertEventRead)
def get_alert(alert_id: int, db: DbSession):
    return alert_service.get_alert(db, alert_id)


@router.patch("/{alert_id}/acknowledge", response_model=AlertEventRead)
def acknowledge_alert(alert_id: int, db: DbSession):
    return alert_service.acknowledge_alert(db, alert_id)


@router.patch("/{alert_id}/resolve", response_model=AlertEventRead)
def resolve_alert(alert_id: int, db: DbSession):
    return alert_service.resolve_alert(db, alert_id)
