from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.operational import DashboardSummary
from app.services import dashboard_service


router = APIRouter(prefix="/dashboard", tags=["dashboard"])
DbSession = Annotated[Session, Depends(get_db)]


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: DbSession):
    return dashboard_service.get_dashboard_summary(db)
