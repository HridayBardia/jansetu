"""
Pydantic schemas for Translation API request/response models.
Supports single string, array batching, token preservation, and health diagnostics.
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator


class TranslateRequest(BaseModel):
    """Single text translation request."""
    text: str = Field(..., min_length=1, max_length=10000, description="Text to translate")
    source_language: str = Field(
        default="auto",
        description="Source language code (e.g., 'en', 'hi', 'eng_Latn') or 'auto'"
    )
    target_language: str = Field(..., description="Target language code (e.g., 'hi', 'gu', 'hin_Deva')")
    category: str = Field(
        default="dynamic",
        description="Content category: 'static', 'dynamic', 'scheme', 'document'"
    )
    preserve_tokens: bool = Field(
        default=True,
        description="Shield HTML tags, currencies, and variable placeholders"
    )

    @field_validator("target_language")
    @classmethod
    def validate_target_language(cls, v):
        from app.translation.language_map import LanguageMap
        if v not in LanguageMap.get_supported_codes() and v != "auto" and "_" not in v:
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
    latency_ms: Optional[float] = 0.0


class BatchItem(BaseModel):
    text: str
    source_language: str = "auto"
    target_language: Optional[str] = None


class BatchTranslateRequest(BaseModel):
    """Batch translation request supporting both array of items and flat array of strings."""
    items: Optional[List[BatchItem]] = Field(
        default=None,
        description="List of translation items with individual language pairs"
    )
    texts: Optional[List[str]] = Field(
        default=None,
        description="Flat array of strings to translate"
    )
    source_language: Optional[str] = Field(
        default="auto",
        description="Global source language (applied if texts is provided or item inherits)"
    )
    target_language: Optional[str] = Field(
        default=None,
        description="Global target language (e.g., 'hin_Deva', 'hi')"
    )
    preserve_tokens: bool = Field(
        default=True,
        description="Shield HTML tags, currencies, and variable placeholders"
    )
    category: str = Field(
        default="dynamic",
        description="Content category for caching: 'static', 'dynamic', 'scheme'"
    )


class BatchTranslateResponse(BaseModel):
    """Batch translation response."""
    translations: List[str] = Field(default_factory=list, description="Array of translated strings")
    results: List[TranslateResponse] = Field(default_factory=list, description="Detailed itemized results")
    source_language: Optional[str] = None
    target_language: Optional[str] = None
    total: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    model_translations: int = 0
    fallback_count: int = 0
    latency_ms: float = 0.0


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
        description="Field names that should NEVER be translated"
    )


class TranslationHealthResponse(BaseModel):
    """Health check response for the translation engine."""
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
