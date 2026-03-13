import re
import hashlib
import base64
from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def _prepare(plain: str) -> str:
    """SHA-256 + base64 encode before bcrypt — removes 72-byte limit."""
    return base64.b64encode(hashlib.sha256(plain.encode()).digest()).decode()


def hash_password(plain: str) -> str:
    return _pwd_context.hash(_prepare(plain))


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(_prepare(plain), hashed)


def check_password_strength(plain: str) -> list[str]:
    errors: list[str] = []
    if len(plain) < 8:
        errors.append("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", plain):
        errors.append("Password must contain at least one uppercase letter.")
    if not re.search(r"\d", plain):
        errors.append("Password must contain at least one number.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+\[\]\\;'/`~]", plain):
        errors.append("Password must contain at least one special character.")
    return errors