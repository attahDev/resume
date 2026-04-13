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
                # FIX: was samesite="lax" which blocks cookies on cross-site POST requests.
                # Frontend is on Vercel, backend is on Render — they are cross-site.
                # "lax" meant the gfp cookie was set on page load but never sent back on
                # /upload/resume or /analyze POST calls, so the backend generated a fresh
                # fingerprint each time and couldn't match the uploaded resume.
                # Must be "none" (with secure=True) to work cross-site, same as the
                # refresh token cookie.
                samesite="none",
                secure=True,   # required by browsers when samesite="none"
                max_age=2_592_000,  # 30 days
            )

        return response


def get_guest_fingerprint_hash(request: Request) -> str:

    from backend.services.guest import hash_fingerprint
    raw = getattr(request.state, "guest_fingerprint", None)
    if not raw:
        # Fallback — generate ephemeral fingerprint if middleware was bypassed
        raw = generate_fingerprint()
    return hash_fingerprint(raw)
