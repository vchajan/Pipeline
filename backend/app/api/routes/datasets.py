from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import AdminUser, get_db
from app.schemas.dataset import DatasetCreate, DatasetRead, DatasetUpdate
from app.services import dataset_service


router = APIRouter(prefix="/datasets", tags=["datasets"])
DbSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=DatasetRead, status_code=201)
def create_dataset(payload: DatasetCreate, db: DbSession, _user: AdminUser):
    return dataset_service.create_dataset(db, payload)


@router.get("", response_model=list[DatasetRead])
def list_datasets(db: DbSession):
    return dataset_service.list_datasets(db)


@router.get("/{dataset_id}", response_model=DatasetRead)
def get_dataset(dataset_id: int, db: DbSession):
    return dataset_service.get_dataset(db, dataset_id)


@router.patch("/{dataset_id}", response_model=DatasetRead)
def update_dataset(dataset_id: int, payload: DatasetUpdate, db: DbSession, _user: AdminUser):
    return dataset_service.update_dataset(db, dataset_id, payload)
