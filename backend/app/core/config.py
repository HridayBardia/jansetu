import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "AI Citizen Journey Engine API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", 
        "sqlite:////tmp/citizen_journey.db" if os.getenv("VERCEL") else "sqlite:///./citizen_journey.db"
    )

    # AI Config
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "mock")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Security & Auth (Username + PIN)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-citizen-journey-key-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Login rate limiting
    LOGIN_MAX_ATTEMPTS: int = 5               # Max failed login attempts per window
    LOGIN_WINDOW_SECONDS: int = 300           # 5-minute rolling window

settings = Settings()
