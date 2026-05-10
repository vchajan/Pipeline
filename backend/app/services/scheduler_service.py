import logging
from datetime import UTC, datetime, timedelta

from croniter import CroniterBadCronError, croniter
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.enums import HeartbeatStatus, JobRunStatus, JobRunStepStatus, TriggerType
from app.models.operational import SchedulerHeartbeat
from app.models.pipeline import Pipeline, PipelineVersion
from app.models.run import JobRun, JobRunStep
from app.services.pipeline_service import DEFAULT_RUN_STEPS
from app.workers.queue import enqueue_pipeline_run


logger = logging.getLogger(__name__)


def run_scheduler_tick(db: Session, now: datetime | None = None) -> int:
    settings = get_settings()
    tick_time = now or datetime.now(UTC)
    created_runs = 0

    try:
        heartbeat = _upsert_scheduler_heartbeat(
            db,
            scheduler_id=settings.scheduler_id,
            status=HeartbeatStatus.RUNNING,
            tick_time=tick_time,
        )

        pipelines = _active_scheduled_pipelines(db)
        logger.info("Scheduler tick checking %s active scheduled pipeline(s)", len(pipelines))

        for pipeline in pipelines:
            schedule_window = _schedule_window(pipeline.schedule, tick_time)
            if schedule_window is None:
                continue

            due_at, next_due_at = schedule_window
            if _scheduled_run_exists(db, pipeline.id, due_at, next_due_at):
                logger.debug(
                    "Skipping duplicate scheduled run for pipeline_id=%s window=%s",
                    pipeline.id,
                    due_at.isoformat(),
                )
                continue

            run = _create_scheduled_run(db, pipeline)
            try:
                enqueue_pipeline_run(run.id)
            except Exception:
                logger.exception("Failed to enqueue scheduled run_id=%s", run.id)
                db.delete(run)
                db.commit()
                raise

            created_runs += 1
            logger.info(
                "Created scheduled run_id=%s pipeline_id=%s due_at=%s",
                run.id,
                pipeline.id,
                due_at.isoformat(),
            )

        _upsert_scheduler_heartbeat(
            db,
            scheduler_id=settings.scheduler_id,
            status=HeartbeatStatus.IDLE,
            tick_time=tick_time,
            created_runs_count=(heartbeat.created_runs_count or 0) + created_runs,
        )
        return created_runs
    except Exception:
        db.rollback()
        _upsert_scheduler_heartbeat(
            db,
            scheduler_id=settings.scheduler_id,
            status=HeartbeatStatus.ERROR,
            tick_time=tick_time,
        )
        logger.exception("Scheduler tick failed")
        raise


def _active_scheduled_pipelines(db: Session) -> list[Pipeline]:
    return list(
        db.scalars(
            select(Pipeline)
            .where(
                Pipeline.active.is_(True),
                Pipeline.schedule.is_not(None),
                Pipeline.schedule != "",
            )
            .order_by(Pipeline.id)
        )
    )


def _schedule_window(schedule: str | None, now: datetime) -> tuple[datetime, datetime] | None:
    if not schedule:
        return None

    try:
        due_at = croniter(schedule, now + timedelta(seconds=1)).get_prev(datetime)
        next_due_at = croniter(schedule, due_at).get_next(datetime)
        return _ensure_utc(due_at), _ensure_utc(next_due_at)
    except (CroniterBadCronError, ValueError):
        logger.warning("Skipping invalid cron schedule: %s", schedule)
        return None


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _scheduled_run_exists(
    db: Session,
    pipeline_id: int,
    due_at: datetime,
    next_due_at: datetime,
) -> bool:
    existing_run_id = db.scalar(
        select(JobRun.id)
        .where(
            JobRun.pipeline_id == pipeline_id,
            JobRun.trigger_type == TriggerType.SCHEDULED,
            JobRun.created_at >= due_at,
            JobRun.created_at < next_due_at,
        )
        .limit(1)
    )
    return existing_run_id is not None


def _create_scheduled_run(db: Session, pipeline: Pipeline) -> JobRun:
    active_version = db.scalar(
        select(PipelineVersion).where(
            PipelineVersion.pipeline_id == pipeline.id,
            PipelineVersion.active.is_(True),
        )
    )
    run = JobRun(
        pipeline_id=pipeline.id,
        pipeline_version_id=active_version.id if active_version else None,
        trigger_type=TriggerType.SCHEDULED,
        status=JobRunStatus.QUEUED,
    )
    db.add(run)
    db.flush()
    db.add_all(
        [
            JobRunStep(
                run_id=run.id,
                name=name,
                order_index=index,
                status=JobRunStepStatus.PENDING,
            )
            for index, name in enumerate(DEFAULT_RUN_STEPS, start=1)
        ]
    )
    db.commit()
    db.refresh(run)
    return run


def _upsert_scheduler_heartbeat(
    db: Session,
    scheduler_id: str,
    status: HeartbeatStatus,
    tick_time: datetime,
    created_runs_count: int | None = None,
) -> SchedulerHeartbeat:
    heartbeat = db.scalar(
        select(SchedulerHeartbeat).where(SchedulerHeartbeat.scheduler_id == scheduler_id)
    )
    if heartbeat is None:
        heartbeat = SchedulerHeartbeat(scheduler_id=scheduler_id, created_runs_count=0)
        db.add(heartbeat)

    heartbeat.status = status
    heartbeat.last_tick_at = tick_time
    if created_runs_count is not None:
        heartbeat.created_runs_count = created_runs_count
    db.commit()
    db.refresh(heartbeat)
    return heartbeat
