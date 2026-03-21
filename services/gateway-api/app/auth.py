"""
NeuroOps Gateway API — Lightweight Auth Layer
Issues signed JWTs from env-configured credentials.
Intentionally simple: suitable for demo / experimental platform use.
No database required — credentials come from environment variables.
"""

import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

logger = logging.getLogger("gateway-api.auth")

# ---------------------------------------------------------------------------
# Configuration (from environment)
# ---------------------------------------------------------------------------

PLATFORM_USER     = os.getenv("PLATFORM_USER",     "admin")
PLATFORM_PASSWORD = os.getenv("PLATFORM_PASSWORD", "neuroops2024")
PLATFORM_SECRET   = os.getenv("PLATFORM_SECRET",   "neuroops-platform-secret-change-in-production")
TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", "8"))

_bearer_scheme = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------------------
# Token helpers
# ---------------------------------------------------------------------------

def _create_token(username: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "iat": now,
        "exp": now + timedelta(hours=TOKEN_EXPIRE_HOURS),
        "platform": "neuroops-unified",
    }
    return jwt.encode(payload, PLATFORM_SECRET, algorithm="HS256")


def verify_token(token: str) -> Optional[dict]:
    """Verify a JWT token. Returns payload dict or None if invalid/expired."""
    try:
        return jwt.decode(token, PLATFORM_SECRET, algorithms=["HS256"])
    except Exception:
        return None


async def optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> Optional[str]:
    """Dependency that returns the username if a valid token is provided, else None."""
    if not credentials:
        return None
    payload = verify_token(credentials.credentials)
    return payload.get("sub") if payload else None


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/auth", tags=["Auth"])


class TokenRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: str
    platform: str = "NeuroOps Unified Platform"


@router.post("/token", response_model=TokenResponse)
async def login(req: TokenRequest):
    """
    Authenticate and receive a JWT access token.

    Credentials are configured via PLATFORM_USER and PLATFORM_PASSWORD
    environment variables. Default: admin / neuroops2024.

    This is an internal platform auth layer — not a production SSO system.
    """
    if req.username != PLATFORM_USER or req.password != PLATFORM_PASSWORD:
        logger.warning("Failed login attempt for user: %s", req.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    token = _create_token(req.username)
    logger.info("Token issued for user: %s", req.username)
    return TokenResponse(
        access_token=token,
        expires_in=TOKEN_EXPIRE_HOURS * 3600,
        user=req.username,
    )


@router.get("/verify")
async def verify(token: str):
    """Verify a token string. Returns user info if valid."""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {
        "valid": True,
        "user": payload.get("sub"),
        "expires_at": datetime.fromtimestamp(payload["exp"], tz=timezone.utc).isoformat(),
    }
