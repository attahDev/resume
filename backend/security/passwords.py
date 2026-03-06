"""
Password hashing (bcrypt, rounds=12) and strength validation.
"""
import re
from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(plain: str) -> str:
    """Return bcrypt hash of plain-text password."""
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the bcrypt hash."""
    return _pwd_context.verify(plain, hashed)


def check_password_strength(plain: str) -> list[str]:
    """
    Return a list of error strings. Empty list = password is strong enough.
    Rules: min 8 chars, 1 uppercase, 1 number, 1 special character.
    """
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
