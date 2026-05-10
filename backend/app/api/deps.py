from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.permissions import ensure_admin, ensure_operator
from app.core.security import authenticate_demo_user, authenticate_keycloak_user
from app.db.session import SessionLocal
from app.models.user import User


bearer_scheme = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    demo_user_id: Annotated[str | None, Header(alias="X-Demo-User-Id")] = None,
) -> User:
    settings = get_settings()

    if credentials and credentials.scheme.lower() == "bearer":
        return authenticate_keycloak_user(db, credentials.credentials)

    if settings.demo_auth_enabled and demo_user_id:
        return authenticate_demo_user(db, demo_user_id)

    if settings.auth_mode == "demo" and settings.demo_auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Demo-User-Id header is required",
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(current_user: CurrentUser) -> User:
    return ensure_admin(current_user)


def require_operator(current_user: CurrentUser) -> User:
    return ensure_operator(current_user)


AdminUser = Annotated[User, Depends(require_admin)]
OperatorUser = Annotated[User, Depends(require_operator)]
