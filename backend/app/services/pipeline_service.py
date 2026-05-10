from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.alert import AlertEvent
from app.models.dataset import Dataset
from app.models.enums import JobRunStatus, JobRunStepStatus
from app.models.pipeline import Pipeline, PipelineVersion
from app.models.run import JobRun, JobRunStep
from app.schemas.pipeline import PipelineCreate, PipelineUpdate, PipelineVersionCreate
from app.schemas.run import JobRunCreate
from app.services.exceptions import BusinessRuleError, NotFoundError
from app.workers.queue import enqueue_pipeline_run


DEFAULT_RUN_STEPS = ("extract", "transform", "load")


def create_pipeline(db: Session, payload: PipelineCreate) -> Pipeline:
    if db.get(Dataset, payload.dataset_id) is None:
        raise BusinessRuleError("Pipeline can be created only for an existing Dataset")

    pipeline = Pipeline(**payload.model_dump())
    db.add(pipeline)
    db.commit()
    db.refresh(pipeline)
    return pipeline


def list_pipelines(db: Session) -> list[Pipeline]:
    return list(db.scalars(select(Pipeline).order_by(Pipeline.id)))


def get_pipeline(db: Session, pipeline_id: int) -> Pipeline:
    pipeline = db.get(Pipeline, pipeline_id)
    if pipeline is None:
        raise NotFoundError("Pipeline not found")
    return pipeline


def update_pipeline(db: Session, pipeline_id: int, payload: PipelineUpdate) -> Pipeline:
    pipeline = get_pipeline(db, pipeline_id)
    values = payload.model_dump(exclude_unset=True)
    if "dataset_id" in values and db.get(Dataset, values["dataset_id"]) is None:
        raise BusinessRuleError("Pipeline can reference only an existing Dataset")

    for field, value in values.items():
        setattr(pipeline, field, value)
    db.commit()
    db.refresh(pipeline)
    return pipeline


def list_pipeline_runs(db: Session, pipeline_id: int) -> list[JobRun]:
    get_pipeline(db, pipeline_id)
    return list(
        db.scalars(
            select(JobRun)
            .where(JobRun.pipeline_id == pipeline_id)
            .order_by(JobRun.created_at.desc(), JobRun.id.desc())
        )
    )


def list_pipeline_alerts(db: Session, pipeline_id: int) -> list[AlertEvent]:
    get_pipeline(db, pipeline_id)
    return list(
        db.scalars(
            select(AlertEvent)
            .where(AlertEvent.pipeline_id == pipeline_id)
            .order_by(AlertEvent.created_at.desc(), AlertEvent.id.desc())
        )
    )


def create_pipeline_version(
    db: Session,
    pipeline_id: int,
    payload: PipelineVersionCreate,
) -> PipelineVersion:
    get_pipeline(db, pipeline_id)
    version = PipelineVersion(pipeline_id=pipeline_id, **payload.model_dump())
    if version.active:
        db.execute(
            update(PipelineVersion)
            .where(PipelineVersion.pipeline_id == pipeline_id)
            .values(active=False)
        )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def list_pipeline_versions(db: Session, pipeline_id: int) -> list[PipelineVersion]:
    get_pipeline(db, pipeline_id)
    return list(
        db.scalars(
            select(PipelineVersion)
            .where(PipelineVersion.pipeline_id == pipeline_id)
            .order_by(PipelineVersion.version_number)
        )
    )


def get_pipeline_version(db: Session, version_id: int) -> PipelineVersion:
    version = db.get(PipelineVersion, version_id)
    if version is None:
        raise NotFoundError("Pipeline version not found")
    return version


def activate_pipeline_version(db: Session, version_id: int) -> PipelineVersion:
    version = get_pipeline_version(db, version_id)
    db.execute(
        update(PipelineVersion)
        .where(PipelineVersion.pipeline_id == version.pipeline_id)
        .values(active=False)
    )
    version.active = True
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def create_pipeline_run(db: Session, pipeline_id: int, payload: JobRunCreate) -> JobRun:
    pipeline = get_pipeline(db, pipeline_id)
    if not pipeline.active:
        raise BusinessRuleError("Pipeline can run only when active is true")

    active_version = db.scalar(
        select(PipelineVersion).where(
            PipelineVersion.pipeline_id == pipeline_id,
            PipelineVersion.active.is_(True),
        )
    )

    run = JobRun(
        pipeline_id=pipeline_id,
        pipeline_version_id=active_version.id if active_version else None,
        trigger_type=payload.trigger_type,
        status=JobRunStatus.QUEUED,
        created_by=payload.created_by,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    steps = [
        JobRunStep(
            run_id=run.id,
            name=name,
            order_index=index,
            status=JobRunStepStatus.PENDING,
        )
        for index, name in enumerate(DEFAULT_RUN_STEPS, start=1)
    ]
    db.add_all(steps)
    db.commit()
    db.refresh(run)
    try:
        enqueue_pipeline_run(run.id)
    except Exception as exc:
        db.delete(run)
        db.commit()
        raise BusinessRuleError("Failed to enqueue pipeline run") from exc
    return run
