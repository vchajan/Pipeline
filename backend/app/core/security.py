from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.keycloak import validate_keycloak_token
from app.models.enums import UserRole
from app.models.user import User


DEMO_USERS: dict[int, dict[str, str | UserRole]] = {
    1: {
        "email": "admin@example.local",
        "display_name": "Demo Admin",
        "role": UserRole.ADMIN,
        "external_subject": "demo:admin",
    },
    2: {
        "email": "operator@example.local",
        "display_name": "Demo Operator",
        "role": UserRole.OPERATOR,
        "external_subject": "demo:operator",
    },
    3: {
        "email": "viewer@example.local",
        "display_name": "Demo Viewer",
        "role": UserRole.VIEWER,
        "external_subject": "demo:viewer",
    },
}


def authenticate_keycloak_user(db: Session, token: str) -> User:
    claims = validate_keycloak_token(token)
    subject = claims.get("sub")
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing subject",
        )

    role = _role_from_claims(claims)
    email = claims.get("email") or f"{subject}@keycloak.local"
    display_name = (
        claims.get("name")
        or claims.get("preferred_username")
        or claims.get("email")
        or "Keycloak User"
    )

    user = db.scalar(select(User).where(User.external_subject == subject))
    if user is None:
        user = User(
            email=email,
            display_name=display_name,
            role=role,
            external_subject=subject,
        )
        db.add(user)
    else:
        user.email = email
        user.display_name = display_name
        user.role = role

    db.commit()
    db.refresh(user)
    return user


def authenticate_demo_user(db: Session, demo_user_id: str) -> User:
    try:
        user_id = int(demo_user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid demo user id",
        ) from exc

    demo_data = DEMO_USERS.get(user_id)
    if demo_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown demo user",
        )

    user = db.get(User, user_id)
    if user is None:
        user = User(id=user_id, **demo_data)
        db.add(user)
    else:
        user.email = str(demo_data["email"])
        user.display_name = str(demo_data["display_name"])
        user.role = demo_data["role"]
        user.external_subject = str(demo_data["external_subject"])

    db.commit()
    db.refresh(user)
    return user


def _role_from_claims(claims: dict[str, Any]) -> UserRole:
    roles = set()
    roles.update(claims.get("roles", []))
    roles.update(claims.get("realm_access", {}).get("roles", []))

    resource_access = claims.get("resource_access", {})
    for client_roles in resource_access.values():
        roles.update(client_roles.get("roles", []))

    normalized_roles = {str(role).lower() for role in roles}
    if UserRole.ADMIN.value in normalized_roles:
        return UserRole.ADMIN
    if UserRole.OPERATOR.value in normalized_roles:
        return UserRole.OPERATOR
    return UserRole.VIEWER
