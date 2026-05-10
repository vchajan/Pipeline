from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import OperatorUser, get_db
from app.schemas.run import JobRunRead, JobRunUpdate
from app.services import run_service


router = APIRouter(prefix="/runs", tags=["runs"])
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[JobRunRead])
def list_runs(db: DbSession):
    return run_service.list_runs(db)


@router.get("/{run_id}", response_model=JobRunRead)
def get_run(run_id: int, db: DbSession):
    return run_service.get_run(db, run_id)


@router.patch("/{run_id}", response_model=JobRunRead)
def update_run(run_id: int, payload: JobRunUpdate, db: DbSession, _user: OperatorUser):
    return run_service.update_run(db, run_id, payload)


@router.patch("/{run_id}/cancel", response_model=JobRunRead)
def cancel_run(run_id: int, db: DbSession, _user: OperatorUser):
    return run_service.cancel_run(db, run_id)
