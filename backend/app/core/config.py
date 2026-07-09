import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CrimeVision"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # DATABASE
    # Using a placeholder for local development. Will be overridden by environment variable for Supabase.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/crimevision")

    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # SMTP
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "localhost")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 1025))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "noreply@ksp.gov.in")
    
    # AI Config
    GEMINI_API_KEY: str = ""
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
