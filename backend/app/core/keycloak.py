import logging
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


logger = logging.getLogger(__name__)


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
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.keycloak_issuer_url,
            options={"verify_aud": False},
        )
    except InvalidTokenError as exc:
        logger.warning("Keycloak token validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Keycloak token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if not _token_matches_client(claims, settings.keycloak_client_id, settings.keycloak_audience):
        logger.warning(
            "Keycloak token rejected because it does not match the configured client. "
            "azp=%r aud=%r expected_client=%r expected_audience=%r",
            claims.get("azp"),
            claims.get("aud"),
            settings.keycloak_client_id,
            settings.keycloak_audience,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Keycloak token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return claims


def _token_matches_client(
    claims: dict[str, Any],
    expected_client_id: str,
    expected_audience: str,
) -> bool:
    """Accept local Keycloak tokens that identify the configured frontend client.

    Keycloak public-client access tokens often contain the frontend client in `azp`
    without also including it as an `aud` value. For this project we therefore
    validate the issuer and signature with PyJWT, then accept either a matching
    audience or a matching authorised party (`azp`).
    """

    expected_values = {expected_client_id, expected_audience}

    audience = claims.get("aud")
    if isinstance(audience, str) and audience in expected_values:
        return True
    if isinstance(audience, list) and any(str(item) in expected_values for item in audience):
        return True

    authorised_party = claims.get("azp")
    return isinstance(authorised_party, str) and authorised_party in expected_values
