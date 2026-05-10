from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.alert import AlertEvent
from app.models.dataset import Dataset
from app.models.enums import AlertStatus, JobRunStatus
from app.models.pipeline import Pipeline
from app.models.run import JobRun


def get_dashboard_summary(db: Session) -> dict:
    runs_by_status = {status.value: 0 for status in JobRunStatus}
    for status_value, count in db.execute(
        select(JobRun.status, func.count(JobRun.id)).group_by(JobRun.status)
    ):
        runs_by_status[status_value.value] = count

    return {
        "datasets_count": db.scalar(select(func.count(Dataset.id))) or 0,
        "pipelines_count": db.scalar(select(func.count(Pipeline.id))) or 0,
        "active_pipelines_count": db.scalar(
            select(func.count(Pipeline.id)).where(Pipeline.active.is_(True))
        )
        or 0,
        "runs_count": db.scalar(select(func.count(JobRun.id))) or 0,
        "open_alerts_count": db.scalar(
            select(func.count(AlertEvent.id)).where(AlertEvent.status == AlertStatus.OPEN)
        )
        or 0,
        "runs_by_status": runs_by_status,
    }
