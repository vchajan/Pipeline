from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.operational import AuditLogRead
from app.services import audit_service


router = APIRouter(prefix="/audit-logs", tags=["audit logs"])
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[AuditLogRead])
def list_audit_logs(db: DbSession):
    return audit_service.list_audit_logs(db)
