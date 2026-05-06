from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


app = FastAPI(
    title="Big Data Pipeline Monitor",
    description="School project API for evidencing, running and monitoring data pipelines.",
    version="0.1.0",
)


# -----------------------------
# Enums
# -----------------------------

class RunStatus(str, Enum):
    pending = "pending"
    running = "running"
    success = "success"
    failed = "failed"


class AlertSeverity(str, Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class AlertStatus(str, Enum):
    open = "open"
    resolved = "resolved"


# -----------------------------
# Schemas
# -----------------------------

class DatasetCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    owner: str = Field(..., min_length=1)
    schemaVersion: str = Field(default="v1")


class Dataset(BaseModel):
    id: str
    name: str
    description: Optional[str]
    owner: str
    schemaVersion: str
    createdAt: datetime


class PipelineCreate(BaseModel):
    name: str = Field(..., min_length=1)
    datasetId: str
    schedule: Optional[str] = None
    active: bool = True


class Pipeline(BaseModel):
    id: str
    name: str
    datasetId: str
    schedule: Optional[str]
    active: bool
    createdAt: datetime


class JobRun(BaseModel):
    id: str
    pipelineId: str
    status: RunStatus
    startedAt: Optional[datetime] = None
    finishedAt: Optional[datetime] = None
    runtimeSeconds: Optional[int] = None
    recordsProcessed: int = 0
    errorMessage: Optional[str] = None


class RunUpdate(BaseModel):
    status: RunStatus
    recordsProcessed: Optional[int] = 0
    errorMessage: Optional[str] = None


class AlertRuleCreate(BaseModel):
    pipelineId: str
    name: str = Field(..., min_length=1)
    runtimeThresholdSeconds: Optional[int] = None
    active: bool = True
    severity: AlertSeverity = AlertSeverity.warning


class AlertRule(BaseModel):
    id: str
    pipelineId: str
    name: str
    runtimeThresholdSeconds: Optional[int]
    active: bool
    severity: AlertSeverity
    createdAt: datetime


class AlertEvent(BaseModel):
    id: str
    alertRuleId: Optional[str]
    pipelineId: str
    runId: Optional[str]
    message: str
    severity: AlertSeverity
    status: AlertStatus
    createdAt: datetime


# -----------------------------
# In-memory database
# Later you can replace this with SQLAlchemy/PostgreSQL.
# -----------------------------

datasets: Dict[str, Dataset] = {}
pipelines: Dict[str, Pipeline] = {}
runs: Dict[str, JobRun] = {}
alert_rules: Dict[str, AlertRule] = {}
alerts: Dict[str, AlertEvent] = {}


# -----------------------------
# Helper functions / business logic
# -----------------------------

def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def get_dataset_or_404(dataset_id: str) -> Dataset:
    dataset = datasets.get(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


def get_pipeline_or_404(pipeline_id: str) -> Pipeline:
    pipeline = pipelines.get(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return pipeline


def get_run_or_404(run_id: str) -> JobRun:
    run = runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


def create_alert(
    pipeline_id: str,
    run_id: Optional[str],
    message: str,
    severity: AlertSeverity = AlertSeverity.warning,
    alert_rule_id: Optional[str] = None,
) -> AlertEvent:
    alert = AlertEvent(
        id=str(uuid4()),
        alertRuleId=alert_rule_id,
        pipelineId=pipeline_id,
        runId=run_id,
        message=message,
        severity=severity,
        status=AlertStatus.open,
        createdAt=now_utc(),
    )
    alerts[alert.id] = alert
    return alert


def evaluate_alert_rules(run: JobRun) -> None:
    for rule in alert_rules.values():
        if not rule.active:
            continue

        if rule.pipelineId != run.pipelineId:
            continue

        if run.status == RunStatus.failed:
            create_alert(
                pipeline_id=run.pipelineId,
                run_id=run.id,
                alert_rule_id=rule.id,
                severity=rule.severity,
                message=f"Pipeline run failed: {run.errorMessage or 'Unknown error'}",
            )

        if (
            rule.runtimeThresholdSeconds is not None
            and run.runtimeSeconds is not None
            and run.runtimeSeconds > rule.runtimeThresholdSeconds
        ):
            create_alert(
                pipeline_id=run.pipelineId,
                run_id=run.id,
                alert_rule_id=rule.id,
                severity=rule.severity,
                message=f"Runtime threshold exceeded: {run.runtimeSeconds}s > {rule.runtimeThresholdSeconds}s",
            )


# -----------------------------
# Root / health
# -----------------------------

@app.get("/")
def root():
    return {
        "app": "Big Data Pipeline Monitor",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


# -----------------------------
# Dataset endpoints
# -----------------------------

@app.post("/datasets", response_model=Dataset, status_code=201)
def create_dataset(payload: DatasetCreate):
    dataset = Dataset(
        id=str(uuid4()),
        name=payload.name,
        description=payload.description,
        owner=payload.owner,
        schemaVersion=payload.schemaVersion,
        createdAt=now_utc(),
    )
    datasets[dataset.id] = dataset
    return dataset


@app.get("/datasets", response_model=List[Dataset])
def list_datasets():
    return list(datasets.values())


@app.get("/datasets/{dataset_id}", response_model=Dataset)
def get_dataset(dataset_id: str):
    return get_dataset_or_404(dataset_id)


# -----------------------------
# Pipeline endpoints
# -----------------------------

@app.post("/pipelines", response_model=Pipeline, status_code=201)
def create_pipeline(payload: PipelineCreate):
    get_dataset_or_404(payload.datasetId)

    pipeline = Pipeline(
        id=str(uuid4()),
        name=payload.name,
        datasetId=payload.datasetId,
        schedule=payload.schedule,
        active=payload.active,
        createdAt=now_utc(),
    )
    pipelines[pipeline.id] = pipeline
    return pipeline


@app.get("/pipelines", response_model=List[Pipeline])
def list_pipelines():
    return list(pipelines.values())


@app.get("/pipelines/{pipeline_id}", response_model=Pipeline)
def get_pipeline(pipeline_id: str):
    return get_pipeline_or_404(pipeline_id)


@app.post("/pipelines/{pipeline_id}/run", response_model=JobRun, status_code=201)
def run_pipeline(pipeline_id: str):
    pipeline = get_pipeline_or_404(pipeline_id)

    if not pipeline.active:
        raise HTTPException(status_code=400, detail="Pipeline is not active")

    run = JobRun(
        id=str(uuid4()),
        pipelineId=pipeline.id,
        status=RunStatus.running,
        startedAt=now_utc(),
    )
    runs[run.id] = run
    return run


# -----------------------------
# Run endpoints
# -----------------------------

@app.get("/runs", response_model=List[JobRun])
def list_runs(
    pipelineId: Optional[str] = None,
    status: Optional[RunStatus] = None,
):
    result = list(runs.values())

    if pipelineId:
        result = [run for run in result if run.pipelineId == pipelineId]

    if status:
        result = [run for run in result if run.status == status]

    return result


@app.get("/runs/{run_id}", response_model=JobRun)
def get_run(run_id: str):
    return get_run_or_404(run_id)


@app.patch("/runs/{run_id}", response_model=JobRun)
def update_run(run_id: str, payload: RunUpdate):
    run = get_run_or_404(run_id)

    allowed_transitions = {
        RunStatus.pending: [RunStatus.running],
        RunStatus.running: [RunStatus.success, RunStatus.failed],
        RunStatus.success: [],
        RunStatus.failed: [],
    }

    if payload.status not in allowed_transitions[run.status]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition: {run.status} -> {payload.status}",
        )

    finished_at = None
    runtime_seconds = None

    if payload.status in [RunStatus.success, RunStatus.failed]:
        finished_at = now_utc()

        if run.startedAt:
            runtime_seconds = int((finished_at - run.startedAt).total_seconds())

    updated_run = run.model_copy(
        update={
            "status": payload.status,
            "finishedAt": finished_at or run.finishedAt,
            "runtimeSeconds": runtime_seconds or run.runtimeSeconds,
            "recordsProcessed": payload.recordsProcessed or 0,
            "errorMessage": payload.errorMessage,
        }
    )

    runs[run_id] = updated_run

    if updated_run.status == RunStatus.failed:
        create_alert(
            pipeline_id=updated_run.pipelineId,
            run_id=updated_run.id,
            message=updated_run.errorMessage or "Pipeline run failed",
            severity=AlertSeverity.critical,
        )

    evaluate_alert_rules(updated_run)

    return updated_run


# -----------------------------
# Alert rule endpoints
# -----------------------------

@app.post("/alert-rules", response_model=AlertRule, status_code=201)
def create_alert_rule(payload: AlertRuleCreate):
    get_pipeline_or_404(payload.pipelineId)

    rule = AlertRule(
        id=str(uuid4()),
        pipelineId=payload.pipelineId,
        name=payload.name,
        runtimeThresholdSeconds=payload.runtimeThresholdSeconds,
        active=payload.active,
        severity=payload.severity,
        createdAt=now_utc(),
    )
    alert_rules[rule.id] = rule
    return rule


@app.get("/alert-rules", response_model=List[AlertRule])
def list_alert_rules():
    return list(alert_rules.values())


@app.get("/alert-rules/{rule_id}", response_model=AlertRule)
def get_alert_rule(rule_id: str):
    rule = alert_rules.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    return rule


# -----------------------------
# Alert endpoints
# -----------------------------

@app.get("/alerts", response_model=List[AlertEvent])
def list_alerts(
    pipelineId: Optional[str] = None,
    status: Optional[AlertStatus] = None,
):
    result = list(alerts.values())

    if pipelineId:
        result = [alert for alert in result if alert.pipelineId == pipelineId]

    if status:
        result = [alert for alert in result if alert.status == status]

    return result


@app.get("/alerts/{alert_id}", response_model=AlertEvent)
def get_alert(alert_id: str):
    alert = alerts.get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert