"""
Guest cookie middleware.
Sets httpOnly 'gfp' cookie on every request if not already present.
Attaches raw fingerprint to request.state for use in route handlers.
Raw value never stored — only hash_fingerprint(raw) goes to DB.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from backend.services.guest import generate_fingerprint
from backend.config import settings


class GuestCookieMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        raw_fp = request.cookies.get("gfp")
        is_new = False

        if not raw_fp:
            raw_fp = generate_fingerprint()
            is_new = True

        # Attach to request state so route handlers can read it
        request.state.guest_fingerprint = raw_fp

        response = await call_next(request)

        if is_new:
            response.set_cookie(
                key="gfp",
                value=raw_fp,
                httponly=True,
                samesite="lax",
                secure=(settings.ENV == "production"),
                max_age=2_592_000,  # 30 days
            )

        return response


def get_guest_fingerprint_hash(request: Request) -> str:
    """
    FastAPI dependency — returns SHA-256 hash of the raw guest fingerprint.
    Use this in route handlers; never use the raw value directly.
    """
    from backend.services.guest import hash_fingerprint
    raw = getattr(request.state, "guest_fingerprint", None)
    if not raw:
        # Fallback — generate ephemeral fingerprint if middleware was bypassed
        raw = generate_fingerprint()
    return hash_fingerprint(raw)