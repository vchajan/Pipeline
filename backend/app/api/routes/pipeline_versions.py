from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.pipeline import PipelineVersionCreate, PipelineVersionRead
from app.services import pipeline_service


router = APIRouter(tags=["pipeline versions"])
DbSession = Annotated[Session, Depends(get_db)]


@router.post("/pipelines/{pipeline_id}/versions", response_model=PipelineVersionRead, status_code=201)
def create_pipeline_version(pipeline_id: int, payload: PipelineVersionCreate, db: DbSession):
    return pipeline_service.create_pipeline_version(db, pipeline_id, payload)


@router.get("/pipelines/{pipeline_id}/versions", response_model=list[PipelineVersionRead])
def list_pipeline_versions(pipeline_id: int, db: DbSession):
    return pipeline_service.list_pipeline_versions(db, pipeline_id)


@router.patch("/pipeline-versions/{version_id}/activate", response_model=PipelineVersionRead)
def activate_pipeline_version(version_id: int, db: DbSession):
    return pipeline_service.activate_pipeline_version(db, version_id)
