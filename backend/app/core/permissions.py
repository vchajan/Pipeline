from fastapi import HTTPException, status

from app.models.enums import UserRole
from app.models.user import User


def ensure_role(user: User, allowed_roles: set[UserRole]) -> User:
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return user


def ensure_admin(user: User) -> User:
    return ensure_role(user, {UserRole.ADMIN})


def ensure_operator(user: User) -> User:
    return ensure_role(user, {UserRole.ADMIN, UserRole.OPERATOR})
