import logging
import random
from datetime import UTC, datetime
from time import monotonic, sleep
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import SessionLocal
from app.models.alert import AlertEvent, AlertRule
from app.models.enums import (
    AlertConditionType,
    AlertSeverity,
    AlertStatus,
    HeartbeatStatus,
    JobRunStatus,
    JobRunStepStatus,
)
from app.models.operational import AuditLog, OutboxEvent, WorkerHeartbeat
from app.models.run import JobRun, JobRunStep


logger = logging.getLogger(__name__)
STEP_NAMES = ("extract", "transform", "load")


def process_pipeline_run(run_id: int) -> None:
    logger.info("Starting pipeline run job run_id=%s", run_id)
    with SessionLocal() as db:
        run = _load_run(db, run_id)
        worker_id = _worker_id()
        heartbeat = _upsert_worker_heartbeat(
            db,
            worker_id=worker_id,
            status=HeartbeatStatus.RUNNING,
            current_run_id=run_id,
        )

        started = monotonic()
        config = _run_config(run)
        rng = _random_for_run(run_id, config)
        failed_step_name = _configured_failed_step(config, rng)
        total_records = _records_processed(config, rng)

        try:
            run.status = JobRunStatus.RUNNING
            run.started_at = datetime.now(UTC)
            db.commit()
            logger.info("Run %s moved to running", run_id)

            steps = _ordered_steps(run)
            if not steps:
                steps = _create_default_steps(db, run)

            step_records = _split_records(total_records, len(steps))
            failed_step: JobRunStep | None = None

            for index, step in enumerate(steps):
                _start_step(db, step)
                _sleep_for_step(config)

                if step.name == failed_step_name:
                    failed_step = step
                    _finish_step(
                        db,
                        step,
                        status=JobRunStepStatus.FAILED,
                        records_processed=step_records[index],
                        error_message=f"Simulated failure in {step.name}",
                    )
                    logger.info("Run %s step %s failed", run_id, step.name)
                    break

                _finish_step(
                    db,
                    step,
                    status=JobRunStepStatus.SUCCESS,
                    records_processed=step_records[index],
                )
                logger.info("Run %s step %s succeeded", run_id, step.name)

            _finish_run(
                db,
                run,
                status=JobRunStatus.FAILED if failed_step else JobRunStatus.SUCCESS,
                runtime_seconds=_runtime_seconds(config, started),
                records_processed=sum(
                    step.records_processed or 0 for step in _ordered_steps(run)
                ),
                error_message=failed_step.error_message if failed_step else None,
            )
            _evaluate_alert_rules(db, run)
            _write_audit_and_outbox(db, run)
            heartbeat.processed_jobs += 1
            _upsert_worker_heartbeat(
                db,
                worker_id=worker_id,
                status=HeartbeatStatus.IDLE,
                current_run_id=None,
                processed_jobs=heartbeat.processed_jobs,
            )
            db.commit()
            logger.info("Finished run %s with status=%s", run_id, run.status.value)
        except Exception as exc:
            logger.exception("Run %s failed with unhandled worker error", run_id)
            db.rollback()
            run = _load_run(db, run_id)
            run.status = JobRunStatus.FAILED
            run.finished_at = datetime.now(UTC)
            run.error_message = str(exc)
            _upsert_worker_heartbeat(
                db,
                worker_id=worker_id,
                status=HeartbeatStatus.ERROR,
                current_run_id=run_id,
            )
            _evaluate_alert_rules(db, run)
            _write_audit_and_outbox(db, run)
            db.commit()
            raise


def _load_run(db: Session, run_id: int) -> JobRun:
    run = db.scalar(
        select(JobRun)
        .where(JobRun.id == run_id)
        .options(
            selectinload(JobRun.pipeline_version),
            selectinload(JobRun.steps),
            selectinload(JobRun.pipeline),
        )
    )
    if run is None:
        raise ValueError(f"JobRun {run_id} was not found")
    return run


def _run_config(run: JobRun) -> dict[str, Any]:
    if run.pipeline_version and run.pipeline_version.config_json:
        return run.pipeline_version.config_json
    return {}


def _random_for_run(run_id: int, config: dict[str, Any]) -> random.Random:
    seed = config.get("random_seed", run_id)
    return random.Random(seed)


def _configured_failed_step(config: dict[str, Any], rng: random.Random) -> str | None:
    if config.get("force_success") is True or config.get("force_status") == "success":
        return None

    configured_step = config.get("fail_step")
    if configured_step in STEP_NAMES:
        return configured_step

    if config.get("force_failure") is True or config.get("force_status") == "failed":
        return "transform"

    probability = float(config.get("failure_probability", 0))
    if probability > 0 and rng.random() < probability:
        return rng.choice(STEP_NAMES)
    return None


def _records_processed(config: dict[str, Any], rng: random.Random) -> int:
    if "records_processed" in config:
        return max(0, int(config["records_processed"]))

    records_min = int(config.get("records_min", 500))
    records_max = int(config.get("records_max", 5000))
    if records_max < records_min:
        records_min, records_max = records_max, records_min
    return rng.randint(records_min, records_max)


def _runtime_seconds(config: dict[str, Any], started: float) -> int:
    if "runtime_seconds" in config:
        return max(0, int(config["runtime_seconds"]))

    min_runtime = int(config.get("min_runtime_seconds", 3))
    max_runtime = int(config.get("max_runtime_seconds", 10))
    if max_runtime < min_runtime:
        min_runtime, max_runtime = max_runtime, min_runtime

    elapsed = int(monotonic() - started)
    return max(min_runtime, min(max_runtime, elapsed or min_runtime))


def _ordered_steps(run: JobRun) -> list[JobRunStep]:
    return sorted(run.steps, key=lambda step: step.order_index)


def _create_default_steps(db: Session, run: JobRun) -> list[JobRunStep]:
    steps = [
        JobRunStep(
            run_id=run.id,
            name=name,
            order_index=index,
            status=JobRunStepStatus.PENDING,
        )
        for index, name in enumerate(STEP_NAMES, start=1)
    ]
    db.add_all(steps)
    db.flush()
    run.steps = steps
    return steps


def _split_records(total_records: int, steps_count: int) -> list[int]:
    if steps_count <= 0:
        return []
    base = total_records // steps_count
    records = [base for _ in range(steps_count)]
    records[-1] += total_records - sum(records)
    return records


def _start_step(db: Session, step: JobRunStep) -> None:
    step.status = JobRunStepStatus.RUNNING
    step.started_at = datetime.now(UTC)
    db.commit()


def _finish_step(
    db: Session,
    step: JobRunStep,
    status: JobRunStepStatus,
    records_processed: int,
    error_message: str | None = None,
) -> None:
    step.status = status
    step.finished_at = datetime.now(UTC)
    step.records_processed = records_processed
    step.error_message = error_message
    db.commit()


def _finish_run(
    db: Session,
    run: JobRun,
    status: JobRunStatus,
    runtime_seconds: int,
    records_processed: int,
    error_message: str | None,
) -> None:
    run.status = status
    run.finished_at = datetime.now(UTC)
    run.runtime_seconds = runtime_seconds
    run.records_processed = records_processed
    run.error_message = error_message
    db.commit()


def _sleep_for_step(config: dict[str, Any]) -> None:
    sleep_seconds = float(config.get("step_sleep_seconds", 0.05))
    sleep(max(0, min(sleep_seconds, 1.0)))


def _evaluate_alert_rules(db: Session, run: JobRun) -> None:
    rules = db.scalars(
        select(AlertRule).where(
            AlertRule.pipeline_id == run.pipeline_id,
            AlertRule.enabled.is_(True),
        )
    )
    failed_steps = [step for step in _ordered_steps(run) if step.status == JobRunStepStatus.FAILED]

    for rule in rules:
        message = _alert_message(rule, run, failed_steps)
        if message is None:
            continue
        db.add(
            AlertEvent(
                rule_id=rule.id,
                run_id=run.id,
                pipeline_id=run.pipeline_id,
                message=message,
                severity=_alert_severity(rule),
                status=AlertStatus.OPEN,
            )
        )


def _alert_message(
    rule: AlertRule,
    run: JobRun,
    failed_steps: list[JobRunStep],
) -> str | None:
    if rule.condition_type == AlertConditionType.RUN_FAILED and run.status == JobRunStatus.FAILED:
        return f"Run {run.id} failed for pipeline {run.pipeline_id}"

    if (
        rule.condition_type == AlertConditionType.RUNTIME_EXCEEDED
        and rule.threshold_seconds is not None
        and run.runtime_seconds is not None
        and run.runtime_seconds > rule.threshold_seconds
    ):
        return (
            f"Run {run.id} runtime {run.runtime_seconds}s exceeded "
            f"threshold {rule.threshold_seconds}s"
        )

    if (
        rule.condition_type == AlertConditionType.RECORDS_BELOW_THRESHOLD
        and rule.threshold_records is not None
        and run.records_processed is not None
        and run.records_processed < rule.threshold_records
    ):
        return (
            f"Run {run.id} processed {run.records_processed} records, below "
            f"threshold {rule.threshold_records}"
        )

    if rule.condition_type == AlertConditionType.STEP_FAILED and failed_steps:
        names = ", ".join(step.name for step in failed_steps)
        return f"Run {run.id} failed step(s): {names}"

    return None


def _alert_severity(rule: AlertRule) -> AlertSeverity:
    if rule.condition_type in {AlertConditionType.RUN_FAILED, AlertConditionType.STEP_FAILED}:
        return AlertSeverity.HIGH
    if rule.condition_type == AlertConditionType.RUNTIME_EXCEEDED:
        return AlertSeverity.MEDIUM
    return AlertSeverity.LOW


def _write_audit_and_outbox(db: Session, run: JobRun) -> None:
    db.add(
        AuditLog(
            actor_user_id=run.created_by,
            action="pipeline_run_completed",
            entity_type="JobRun",
            entity_id=str(run.id),
            metadata_json={
                "pipeline_id": run.pipeline_id,
                "status": run.status.value,
                "records_processed": run.records_processed,
            },
        )
    )
    db.add(
        OutboxEvent(
            event_type="job_run.completed",
            aggregate_type="JobRun",
            aggregate_id=str(run.id),
            payload_json={
                "run_id": run.id,
                "pipeline_id": run.pipeline_id,
                "status": run.status.value,
            },
        )
    )


def _upsert_worker_heartbeat(
    db: Session,
    worker_id: str,
    status: HeartbeatStatus,
    current_run_id: int | None,
    processed_jobs: int | None = None,
) -> WorkerHeartbeat:
    heartbeat = db.scalar(select(WorkerHeartbeat).where(WorkerHeartbeat.worker_id == worker_id))
    if heartbeat is None:
        heartbeat = WorkerHeartbeat(worker_id=worker_id, processed_jobs=0)
        db.add(heartbeat)

    heartbeat.status = status
    heartbeat.current_run_id = current_run_id
    heartbeat.last_seen_at = datetime.now(UTC)
    if processed_jobs is not None:
        heartbeat.processed_jobs = processed_jobs
    db.commit()
    db.refresh(heartbeat)
    return heartbeat


def _worker_id() -> str:
    import os

    return os.getenv("WORKER_ID", "local-worker")
