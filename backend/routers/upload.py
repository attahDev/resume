

import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, File, UploadFile, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.models.resume import Resume
from backend.security.file_guard import validate_upload
from backend.security.encryption import encrypt_text
from backend.security.auth import get_optional_user
from backend.middleware.guest_cookie import get_guest_fingerprint_hash
from backend.services.parser import extract_text_from_file, generate_file_hash
from backend.security.rate_limit import limiter

import magic

logger = logging.getLogger("resume_analyzer")

router = APIRouter()


@router.post("/resume")
@limiter.limit("20/hour")
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
    fingerprint_hash: str = Depends(get_guest_fingerprint_hash),
):

    # Step 1 — validate: size + MIME whitelist + filename sanitisation
    file_bytes = await validate_upload(file)

    # Step 2 — detect true MIME type from bytes
    detected_mime = magic.from_buffer(file_bytes, mime=True)

    # Step 3 — generate content hash for deduplication
    file_hash = generate_file_hash(file_bytes)

    # Step 4 — determine owner
    owner_id = str(current_user.id) if current_user else None
    guest_fp = None if current_user else fingerprint_hash

    # Step 5 — cache check: return existing resume if same file already uploaded
    if owner_id:
        existing = await db.execute(
            select(Resume).where(
                Resume.file_hash == file_hash,
                Resume.user_id == current_user.id,
            )
        )
    else:
        existing = await db.execute(
            select(Resume).where(
                Resume.file_hash == file_hash,
                Resume.guest_fingerprint == guest_fp,
            )
        )

    cached = existing.scalar_one_or_none()
    if cached:
        logger.info("upload", extra={"action": "cache_hit"})
        # Decrypt just enough for preview — not stored
        from backend.security.encryption import decrypt_text
        try:
            preview_text = decrypt_text(cached.encrypted_text)[:150]
        except ValueError:
            preview_text = ""
        return {
            "resume_id": str(cached.id),
            "file_name": cached.file_name,
            "char_count": len(preview_text),
            "preview": preview_text,
            "cached": True,
        }

    # Step 6 — extract text from file
    extracted_text = await extract_text_from_file(file_bytes, detected_mime)

    if len(extracted_text.strip()) < 50:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail="Could not extract readable text from this file. Please ensure it is not blank or image-only.",
        )

    # Step 7 — encrypt before saving
    encrypted = encrypt_text(extracted_text)

    # Step 8 — save Resume row
    resume = Resume(
        user_id=current_user.id if current_user else None,
        guest_fingerprint=guest_fp,
        encrypted_text=encrypted,
        file_hash=file_hash,
        file_name=file.filename or "resume",
        raw_text_expires=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)

    logger.info("upload", extra={"action": "resume_saved"})

    # Preview — shown to user only, never stored or logged
    preview = extracted_text[:150]

    return {
        "resume_id": str(resume.id),
        "file_name": resume.file_name,
        "char_count": len(extracted_text),
        "preview": preview,
        "cached": False,
    }