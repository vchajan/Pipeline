from functools import lru_cache
from typing import Any

from fastapi import HTTPException, status

from app.core.config import get_settings

try:
    import jwt
    from jwt import InvalidTokenError, PyJWKClient
except ImportError:  # pragma: no cover - exercised only when deps are missing locally.
    jwt = None
    InvalidTokenError = Exception
    PyJWKClient = None


@lru_cache
def _jwks_client() -> PyJWKClient:
    if PyJWKClient is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PyJWT with crypto support is required for Keycloak authentication",
        )
    return PyJWKClient(get_settings().keycloak_jwks_uri)


def validate_keycloak_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    if jwt is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PyJWT with crypto support is required for Keycloak authentication",
        )

    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.keycloak_audience,
            issuer=settings.keycloak_issuer_url,
        )
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Keycloak token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
