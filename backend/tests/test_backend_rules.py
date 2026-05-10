from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.models.alert import AlertEvent
from app.models.dataset import Dataset
from app.models.enums import AlertConditionType, JobRunStatus
from app.models.pipeline import Pipeline
from app.models.run import JobRun, JobRunStep
from app.schemas.alert import AlertRuleCreate
from app.schemas.dataset import DatasetCreate
from app.schemas.pipeline import PipelineCreate, PipelineVersionCreate
from app.schemas.run import JobRunCreate, JobRunUpdate
from app.services import alert_service, dataset_service, pipeline_service, run_service
from app.services.exceptions import BusinessRuleError
from app.workers import pipeline_jobs


ADMIN_HEADERS = {"X-Demo-User-Id": "1"}
OPERATOR_HEADERS = {"X-Demo-User-Id": "2"}
VIEWER_HEADERS = {"X-Demo-User-Id": "3"}


def dataset_payload(name: str = "Orders") -> dict:
    return {
        "name": name,
        "description": "Source data for testing",
        "owner": "Data Team",
        "source_type": "csv_file",
        "schema_version": "v1",
    }


def pipeline_payload(dataset_id: int, *, active: bool = True) -> dict:
    return {
        "dataset_id": dataset_id,
        "name": "Orders daily load",
        "description": "Daily simulated pipeline",
        "schedule": None,
        "active": active,
        "engine": "python",
        "processing_mode": "batch",
        "load_type": "incremental",
        "target_layer": "l1_clean",
    }


def create_dataset(db: Session, name: str = "Orders") -> Dataset:
    return dataset_service.create_dataset(db, DatasetCreate(**dataset_payload(name)))


def create_pipeline(db: Session, dataset_id: int, *, active: bool = True) -> Pipeline:
    return pipeline_service.create_pipeline(
        db,
        PipelineCreate(**pipeline_payload(dataset_id, active=active)),
    )


def test_create_dataset(client) -> None:
    response = client.post("/datasets", json=dataset_payload(), headers=ADMIN_HEADERS)

    assert response.status_code == 201
    payload = response.json()
    assert payload["id"] == 1
    assert payload["name"] == "Orders"
    assert payload["source_type"] == "csv_file"


def test_create_pipeline_requires_existing_dataset(client) -> None:
    response = client.post(
        "/pipelines",
        json=pipeline_payload(dataset_id=999),
        headers=ADMIN_HEADERS,
    )

    assert response.status_code == 400
    assert "existing Dataset" in response.json()["detail"]


def test_inactive_pipeline_cannot_run(client, db_session: Session) -> None:
    dataset = create_dataset(db_session)
    pipeline = create_pipeline(db_session, dataset.id, active=False)

    response = client.post(
        f"/pipelines/{pipeline.id}/run",
        json={"trigger_type": "manual"},
        headers=OPERATOR_HEADERS,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Pipeline can run only when active is true"


def test_run_creates_job_run_and_steps(client, db_session: Session, monkeypatch) -> None:
    monkeypatch.setattr(pipeline_service, "enqueue_pipeline_run", lambda run_id: "job-id")
    dataset = create_dataset(db_session)
    pipeline = create_pipeline(db_session, dataset.id)

    response = client.post(
        f"/pipelines/{pipeline.id}/run",
        json={"trigger_type": "manual"},
        headers=OPERATOR_HEADERS,
    )

    assert response.status_code == 201
    run_id = response.json()["id"]
    run = db_session.get(JobRun, run_id)
    steps = db_session.scalars(
        select(JobRunStep).where(JobRunStep.run_id == run_id).order_by(JobRunStep.order_index)
    ).all()
    assert run is not None
    assert run.status == JobRunStatus.QUEUED
    assert [step.name for step in steps] == ["extract", "transform", "load"]
    assert all(step.status.value == "pending" for step in steps)


def test_invalid_run_transition_is_rejected(db_session: Session, monkeypatch) -> None:
    monkeypatch.setattr(pipeline_service, "enqueue_pipeline_run", lambda run_id: "job-id")
    dataset = create_dataset(db_session)
    pipeline = create_pipeline(db_session, dataset.id)
    run = pipeline_service.create_pipeline_run(
        db_session,
        pipeline.id,
        JobRunCreate(trigger_type="manual"),
    )

    try:
        run_service.update_run(db_session, run.id, JobRunUpdate(status=JobRunStatus.SUCCESS))
    except BusinessRuleError as exc:
        assert "Invalid run transition" in exc.message
    else:
        raise AssertionError("Expected queued -> success transition to be rejected")


def test_failed_run_creates_alert(
    db_session: Session,
    db_session_factory: sessionmaker[Session],
    monkeypatch,
) -> None:
    monkeypatch.setattr(pipeline_service, "enqueue_pipeline_run", lambda run_id: "job-id")
    monkeypatch.setattr(pipeline_jobs, "SessionLocal", db_session_factory)
    monkeypatch.setattr(pipeline_jobs, "_sleep_for_step", lambda config: None)

    dataset = create_dataset(db_session)
    pipeline = create_pipeline(db_session, dataset.id)
    pipeline_service.create_pipeline_version(
        db_session,
        pipeline.id,
        PipelineVersionCreate(
            version_number=1,
            active=True,
            config_json={
                "force_failure": True,
                "fail_step": "transform",
                "runtime_seconds": 5,
                "records_processed": 100,
            },
        ),
    )
    alert_service.create_alert_rule(
        db_session,
        AlertRuleCreate(
            pipeline_id=pipeline.id,
            name="Run failed",
            condition_type=AlertConditionType.RUN_FAILED,
            enabled=True,
        ),
    )
    run = pipeline_service.create_pipeline_run(
        db_session,
        pipeline.id,
        JobRunCreate(trigger_type="manual"),
    )

    pipeline_jobs.process_pipeline_run(run.id)
    db_session.expire_all()

    persisted_run = db_session.get(JobRun, run.id)
    alerts = db_session.scalars(select(AlertEvent)).all()
    assert persisted_run is not None
    assert persisted_run.status == JobRunStatus.FAILED
    assert len(alerts) == 1
    assert alerts[0].run_id == run.id
    assert "failed" in alerts[0].message


def test_viewer_cannot_create_dataset(client) -> None:
    response = client.post("/datasets", json=dataset_payload(), headers=VIEWER_HEADERS)

    assert response.status_code == 403


def test_operator_can_start_pipeline(client, db_session: Session, monkeypatch) -> None:
    monkeypatch.setattr(pipeline_service, "enqueue_pipeline_run", lambda run_id: "job-id")
    dataset = create_dataset(db_session)
    pipeline = create_pipeline(db_session, dataset.id)

    response = client.post(
        f"/pipelines/{pipeline.id}/run",
        json={"trigger_type": "manual"},
        headers=OPERATOR_HEADERS,
    )

    assert response.status_code == 201
    assert response.json()["status"] == "queued"
    assert response.json()["created_by"] == 2


def test_admin_can_create_alert_rule(client, db_session: Session) -> None:
    dataset = create_dataset(db_session)
    pipeline = create_pipeline(db_session, dataset.id)

    response = client.post(
        "/alert-rules",
        json={
            "pipeline_id": pipeline.id,
            "name": "Runtime threshold",
            "condition_type": "runtime_exceeded",
            "threshold_seconds": 10,
            "threshold_records": None,
            "enabled": True,
        },
        headers=ADMIN_HEADERS,
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Runtime threshold"
