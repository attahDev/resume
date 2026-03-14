
import hashlib
import logging
import tempfile
from io import BytesIO
import pdfplumber
import pytesseract
from pdf2image import convert_from_bytes
from docx import Document

from backend.security.sanitise import sanitise_text

logger = logging.getLogger("resume_analyzer")


def generate_file_hash(file_bytes: bytes) -> str:
    
    return hashlib.sha256(file_bytes).hexdigest()


async def extract_text_from_file(file_bytes: bytes, mime_type: str) -> str:

    if mime_type == "application/pdf":
        return extract_from_pdf(file_bytes)
    if "wordprocessingml" in mime_type:
        return extract_from_docx(file_bytes)
    raise ValueError(f"Unsupported file type: {mime_type}")


def extract_from_pdf(file_bytes: bytes) -> str:


    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        text_parts = []
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

        text = "\n".join(text_parts)

        # If too little text extracted, likely a scanned PDF — try OCR
        if len(text.strip()) < 100:
            logger.info("pdf_parser", extra={"action": "ocr_fallback"})
            text = extract_from_scanned_pdf(file_bytes)

        return sanitise_text(text)

    except Exception as e:
        logger.warning("pdf_parse_failed", extra={"error": type(e).__name__})
        raise ValueError("PDF parse failed. Please ensure the file is not corrupted.")
    finally:
        if tmp_path:
            import os
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


def extract_from_scanned_pdf(file_bytes: bytes) -> str:

    MAX_PAGES = 10

    images = convert_from_bytes(file_bytes, dpi=200)
    images = images[:MAX_PAGES]

    text_parts = []
    for image in images:
        page_text = pytesseract.image_to_string(image)
        if page_text:
            text_parts.append(page_text)

    return sanitise_text("\n".join(text_parts))


def extract_from_docx(file_bytes: bytes) -> str:

    try:
        doc = Document(BytesIO(file_bytes))
        text_parts = [para.text for para in doc.paragraphs if para.text.strip()]
        return sanitise_text("\n".join(text_parts))
    except Exception as e:
        logger.warning("docx_parse_failed", extra={"error": type(e).__name__})
        raise ValueError("DOCX parse failed. Please ensure the file is not corrupted.")