"""
File upload guard.
1. Size check
2. Read bytes
3. True MIME detection via python-magic (not Content-Type header)
4. Whitelist check
5. Filename sanitisation
"""
import re
from fastapi import UploadFile, HTTPException, status

from backend.config import settings

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

_SAFE_FILENAME = re.compile(r"[^a-zA-Z0-9.\-_]")


async def validate_upload(file: UploadFile) -> bytes:
    """
    Validate and return file bytes.
    Raises HTTPException 413 (too large) or 400 (bad type / bad file).
    """
    import magic  # python-magic — lazy import so stub files still load

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    # Step 1 — size guard via Content-Length if available
    content_length = file.size
    if content_length is not None and content_length > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB.",
        )

    # Step 2 — read all bytes
    file_bytes = await file.read()

    # Step 3 — enforce size on actual bytes
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB.",
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # Step 4 — detect TRUE MIME type from bytes (not header)
    detected_mime = magic.from_buffer(file_bytes, mime=True)
    if detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a PDF or DOCX file.",
        )

    # Step 5 — sanitise filename
    if file.filename:
        file.filename = _SAFE_FILENAME.sub("_", file.filename)

    return file_bytes
