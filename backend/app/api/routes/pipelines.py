from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import AdminUser, OperatorUser, get_db
from app.schemas.alert import AlertEventRead
from app.schemas.pipeline import PipelineCreate, PipelineRead, PipelineUpdate
from app.schemas.run import JobRunCreate, JobRunRead
from app.services import pipeline_service


router = APIRouter(prefix="/pipelines", tags=["pipelines"])
DbSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=PipelineRead, status_code=201)
def create_pipeline(payload: PipelineCreate, db: DbSession, _user: AdminUser):
    return pipeline_service.create_pipeline(db, payload)


@router.get("", response_model=list[PipelineRead])
def list_pipelines(db: DbSession):
    return pipeline_service.list_pipelines(db)


@router.get("/{pipeline_id}", response_model=PipelineRead)
def get_pipeline(pipeline_id: int, db: DbSession):
    return pipeline_service.get_pipeline(db, pipeline_id)


@router.patch("/{pipeline_id}", response_model=PipelineRead)
def update_pipeline(pipeline_id: int, payload: PipelineUpdate, db: DbSession, _user: AdminUser):
    return pipeline_service.update_pipeline(db, pipeline_id, payload)


@router.post("/{pipeline_id}/run", response_model=JobRunRead, status_code=201)
def create_pipeline_run(
    pipeline_id: int,
    payload: JobRunCreate,
    db: DbSession,
    current_user: OperatorUser,
):
    payload = payload.model_copy(update={"created_by": current_user.id})
    return pipeline_service.create_pipeline_run(db, pipeline_id, payload)


@router.get("/{pipeline_id}/runs", response_model=list[JobRunRead])
def list_pipeline_runs(pipeline_id: int, db: DbSession):
    return pipeline_service.list_pipeline_runs(db, pipeline_id)


@router.get("/{pipeline_id}/alerts", response_model=list[AlertEventRead])
def list_pipeline_alerts(pipeline_id: int, db: DbSession):
    return pipeline_service.list_pipeline_alerts(db, pipeline_id)
