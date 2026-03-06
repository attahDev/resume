"""
slowapi rate limiter — keyed by IP address.
Import limiter and attach to FastAPI app.
Import rate_limit_exceeded_handler and register as exception handler.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "detail": str(exc.detail),
            "retry_after": "Please wait before making another request.",
        },
    )
