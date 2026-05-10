from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.operational import SystemStatus
from app.services import system_service


router = APIRouter(prefix="/system", tags=["system"])
DbSession = Annotated[Session, Depends(get_db)]


@router.get("/status", response_model=SystemStatus)
def get_system_status(db: DbSession):
    return system_service.get_system_status(db)
