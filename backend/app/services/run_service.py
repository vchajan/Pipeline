from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import JobRunStatus
from app.models.run import JobRun
from app.schemas.run import JobRunUpdate
from app.services.exceptions import BusinessRuleError, NotFoundError


ALLOWED_RUN_TRANSITIONS: dict[JobRunStatus, set[JobRunStatus]] = {
    JobRunStatus.PENDING: {JobRunStatus.QUEUED},
    JobRunStatus.QUEUED: {JobRunStatus.RUNNING, JobRunStatus.CANCELLED},
    JobRunStatus.RUNNING: {
        JobRunStatus.SUCCESS,
        JobRunStatus.FAILED,
        JobRunStatus.CANCELLED,
    },
    JobRunStatus.SUCCESS: set(),
    JobRunStatus.FAILED: set(),
    JobRunStatus.CANCELLED: set(),
}


def list_runs(db: Session) -> list[JobRun]:
    return list(db.scalars(select(JobRun).order_by(JobRun.created_at.desc(), JobRun.id.desc())))


def get_run(db: Session, run_id: int) -> JobRun:
    run = db.get(JobRun, run_id)
    if run is None:
        raise NotFoundError("Run not found")
    return run


def update_run(db: Session, run_id: int, payload: JobRunUpdate) -> JobRun:
    run = get_run(db, run_id)
    values = payload.model_dump(exclude_unset=True)
    requested_status = values.get("status")
    if requested_status is not None:
        _validate_transition(run.status, requested_status)

    for field, value in values.items():
        setattr(run, field, value)
    db.commit()
    db.refresh(run)
    return run


def cancel_run(db: Session, run_id: int) -> JobRun:
    run = get_run(db, run_id)
    _validate_transition(run.status, JobRunStatus.CANCELLED)
    run.status = JobRunStatus.CANCELLED
    db.commit()
    db.refresh(run)
    return run


def _validate_transition(current: JobRunStatus, requested: JobRunStatus) -> None:
    if requested == current:
        return
    if requested not in ALLOWED_RUN_TRANSITIONS[current]:
        raise BusinessRuleError(f"Invalid run transition: {current.value} -> {requested.value}")
