from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.operational import AuditLog


def list_audit_logs(db: Session) -> list[AuditLog]:
    return list(
        db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc(), AuditLog.id.desc()))
    )
