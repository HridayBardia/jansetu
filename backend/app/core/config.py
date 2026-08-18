import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "AI Citizen Journey Engine API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./citizen_journey.db")
    
    # AI Config
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "mock")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-citizen-journey-key-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # OTP Provider Config
    OTP_PROVIDER: str = os.getenv("OTP_PROVIDER", "dev") # dev, msg91, twilio
    DEV_OTP_MODE: bool = os.getenv("DEV_OTP_MODE", "true").lower() in ("true", "1", "yes")
    
    # MSG91 Provider & OTP Widget Config
    MSG91_WIDGET_ID: str = os.getenv("MSG91_WIDGET_ID", "366872725377313536323534")
    MSG91_AUTH_KEY: str = os.getenv("MSG91_AUTH_KEY", "")
    MSG91_TOKEN_AUTH: str = os.getenv("MSG91_TOKEN_AUTH", "")
    MSG91_TEMPLATE_ID: str = os.getenv("MSG91_TEMPLATE_ID", "")
    MSG91_SENDER_ID: str = os.getenv("MSG91_SENDER_ID", "CITIZN")

    
    # Twilio Provider & WhatsApp Verify Config
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_SERVICE_SID: str = os.getenv("TWILIO_SERVICE_SID", "")
    TWILIO_VERIFY_SERVICE_SID: str = os.getenv("TWILIO_VERIFY_SERVICE_SID", os.getenv("TWILIO_SERVICE_SID", ""))
    TWILIO_WHATSAPP_SENDER: str = os.getenv("TWILIO_WHATSAPP_SENDER", "+917016918865")
    WHATSAPP_BUSINESS_PHONE_NUMBER: str = os.getenv("WHATSAPP_BUSINESS_PHONE_NUMBER", "+917016918865")
    
    DEV_OTP_MODE: bool = os.getenv("DEV_OTP_MODE", "true").lower() in ("true", "1", "yes")
    DEV_AUTH_MODE: bool = os.getenv("DEV_AUTH_MODE", os.getenv("DEV_OTP_MODE", "true")).lower() in ("true", "1", "yes")
    OTP_CHANNEL: str = os.getenv("OTP_CHANNEL", "whatsapp") # whatsapp, sms

    
    # OTP Operational Security
    OTP_EXPIRY_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60

settings = Settings()


