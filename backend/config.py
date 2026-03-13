from pydantic_settings import BaseSettings
from pydantic import field_validator
from cryptography.fernet import Fernet
import base64


class Settings(BaseSettings):
    SECRET_KEY: str
    ENCRYPTION_KEY: str
    GROQ_API_KEY: str = ""
    LLM_BASE_URL: str = "https://api.groq.com/openai/v1"
    MODEL_VERSION: str = "llama-3.3-70b-versatile"
    DATABASE_URL: str
    DATABASE_URL_DIRECT: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    ENV: str = "development"
    MAX_FILE_SIZE_MB: int = 5
    DAILY_FREE_LIMIT: int = 10
    GUEST_LIFETIME_LIMIT: int = 3
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long.")
        return v

    @field_validator("ENCRYPTION_KEY")
    @classmethod
    def validate_encryption_key(cls, v: str) -> str:
        try:
            key_bytes = v.encode()
            # Fernet requires URL-safe base64-encoded 32-byte key
            decoded = base64.urlsafe_b64decode(key_bytes)
            if len(decoded) != 32:
                raise ValueError()
            Fernet(key_bytes)  # full validation
        except Exception:
            raise ValueError(
                "ENCRYPTION_KEY must be a valid Fernet key. "
                "Generate with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )
        return v

    def get_allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
