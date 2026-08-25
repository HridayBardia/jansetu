"""
Pydantic schemas for Translation API request/response models.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class TranslateRequest(BaseModel):
    """Single text translation request."""
    text: str = Field(..., min_length=1, max_length=10000, description="Text to translate")
    source_language: str = Field(
        default="auto",
        description="Source language code (e.g., 'en', 'hi') or 'auto' for detection"
    )
    target_language: str = Field(..., description="Target language code (e.g., 'hi', 'gu')")
    category: str = Field(
        default="dynamic",
        description="Content category: 'static', 'dynamic', 'scheme', 'document'"
    )

    @field_validator("target_language")
    @classmethod
    def validate_target_language(cls, v):
        from app.translation.language_map import LanguageMap
        if v not in LanguageMap.get_supported_codes() and v != "auto":
            raise ValueError(f"Unsupported target language: {v}")
        return v


class TranslateResponse(BaseModel):
    """Single text translation response."""
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    detected_language: Optional[str] = None
    from_cache: bool = False
    engine: str = "indictrans2"  # or "fallback", "cache", "dictionary"


class BatchTranslateRequest(BaseModel):
    """Batch translation request for multiple texts."""
    items: List[TranslateRequest] = Field(
        ..., min_length=1, max_length=100,
        description="List of translation items"
    )
    target_language: Optional[str] = Field(
        default=None,
        description="Global target language override (applied to all items if set)"
    )


class BatchTranslateResponse(BaseModel):
    """Batch translation response."""
    results: List[TranslateResponse]
    total: int
    cache_hits: int
    model_translations: int
    fallback_count: int


class DetectLanguageRequest(BaseModel):
    """Language detection request."""
    text: str = Field(..., min_length=1, max_length=10000)
    fallback_language: str = Field(default="en")


class DetectLanguageResponse(BaseModel):
    """Language detection response."""
    detected_language: str
    confidence: float
    language_name: str
    native_name: str


class TranslateStructuredRequest(BaseModel):
    """
    Translate a structured JSON object, translating only human-readable fields.
    Preserves IDs, URLs, numbers, dates, and keys.
    """
    data: Dict[str, Any] = Field(..., description="Structured data to translate")
    target_language: str = Field(..., description="Target language code")
    source_language: str = Field(default="auto")
    translate_fields: List[str] = Field(
        default=[
            "title", "description", "name", "summary", "label",
            "text", "message", "heading", "subtitle", "placeholder",
            "reason", "benefits", "explanation", "next_steps",
            "official_name", "why_matches", "documents", "schemes",
        ],
        description="Field names whose values should be translated"
    )
    skip_fields: List[str] = Field(
        default=[
            "id", "url", "email", "phone", "date", "created_at",
            "updated_at", "scheme_id", "application_url", "status",
            "document_type", "mime_type", "file_name", "language_code",
            "source_url", "official_source_url", "verification_status",
        ],
        description="Field names whose values should NEVER be translated"
    )


class TranslationHealthResponse(BaseModel):
    """Translation engine health status."""
    engine_status: str
    model_status: str
    model_id: str
    device: str
    supported_languages: int
    cache_status: str
    cache_entries: int
    cache_hit_rate: float
    average_latency_ms: float
    total_translations: int
    last_health_check: str


class TranslationMetrics(BaseModel):
    """Translation engine performance metrics."""
    translation_count: int
    cache_hit_count: int
    cache_miss_count: int
    cache_hit_rate_percent: float
    average_latency_ms: float
    model_load_time_seconds: float
    translation_errors: int
    model_status: str
    device: str
    supported_languages: int
