import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "AI Citizen Journey Engine API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    @property
    def DATABASE_URL(self) -> str:
        if os.getenv("DATABASE_URL"):
            return os.getenv("DATABASE_URL")
        
        import shutil
        import tempfile
        local_db = "./citizen_journey.db"
        tmp_db = os.path.join(tempfile.gettempdir(), "citizen_journey.db")
        
        is_serverless = bool(os.getenv("VERCEL") or os.getenv("VERCEL_REGION") or os.getenv("AWS_EXECUTION_ENV"))
        is_readonly = os.path.exists(local_db) and not os.access(local_db, os.W_OK)
        
        if is_serverless or is_readonly:
            if os.path.exists(local_db) and not os.path.exists(tmp_db):
                try:
                    shutil.copy2(local_db, tmp_db)
                except Exception:
                    pass
            # SQLite requires an absolute path or forward slashes, so we use absolute format
            return f"sqlite:///{tmp_db.replace(os.sep, '/')}"
            
        return f"sqlite:///{local_db}"

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
