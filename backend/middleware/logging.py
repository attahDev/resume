import re
import time
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from pythonjsonlogger.jsonlogger import JsonFormatter

# Configure JSON logger
_handler = logging.StreamHandler()
_handler.setFormatter(
    JsonFormatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
)

logger = logging.getLogger("resume_analyzer")
logger.setLevel(logging.INFO)
if not logger.handlers:
    logger.addHandler(_handler)

# PII patterns
_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_PHONE_RE = re.compile(r"(\+?\d[\d\s\-().]{7,}\d)")


def scrub_pii(value: str) -> str:
    if not isinstance(value, str):
        return value
    if len(value) > 200:
        return "[CONTENT TRUNCATED]"
    value = _EMAIL_RE.sub("[EMAIL REDACTED]", value)
    value = _PHONE_RE.sub("[PHONE REDACTED]", value)
    return value


class PIILoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.monotonic()
        response = await call_next(request)
        duration_ms = round((time.monotonic() - start) * 1000)

        logger.info(
            "request",
            extra={
                "route": scrub_pii(str(request.url.path)),
                "method": request.method,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response
