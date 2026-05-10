from datetime import datetime

from app.models.enums import UserRole
from app.schemas.common import ApiModel


class AuthUserRead(ApiModel):
    id: int
    email: str
    display_name: str
    role: UserRole
    external_subject: str | None
    created_at: datetime
