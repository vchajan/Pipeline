from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models.operational import SchedulerHeartbeat, WorkerHeartbeat


def get_system_status(db: Session) -> dict:
    db.execute(text("SELECT 1"))
    workers = list(
        db.scalars(select(WorkerHeartbeat).order_by(WorkerHeartbeat.last_seen_at.desc()))
    )
    scheduler = db.scalar(
        select(SchedulerHeartbeat).order_by(SchedulerHeartbeat.last_tick_at.desc())
    )
    return {
        "database": "ok",
        "workers": workers,
        "scheduler": scheduler,
    }
