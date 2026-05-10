from fastapi import APIRouter

from app.api.deps import CurrentUser
from app.schemas.auth import AuthUserRead


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AuthUserRead)
def get_me(current_user: CurrentUser):
    return current_user
