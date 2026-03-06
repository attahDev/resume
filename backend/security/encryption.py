"""
Fernet AES-256 encryption for resume PII.
Failed decryption logs a warning (no PII) and raises ValueError.
"""
import logging
from cryptography.fernet import Fernet, InvalidToken

from backend.config import settings

logger = logging.getLogger(__name__)

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(settings.ENCRYPTION_KEY.encode())
    return _fernet


def encrypt_text(plaintext: str) -> str:
    """Encrypt a UTF-8 string. Returns URL-safe base64 token."""
    return _get_fernet().encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_text(token: str) -> str:
    """Decrypt a Fernet token. Raises ValueError on failure."""
    try:
        return _get_fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        logger.warning("Decryption failed — token invalid or key mismatch")
        raise ValueError("Decryption failed")
    except Exception:
        logger.warning("Unexpected decryption error")
        raise ValueError("Decryption failed")
