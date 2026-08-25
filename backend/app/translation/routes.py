"""
Translation API Routes.

Provides REST endpoints for:
- Single text translation
- Batch translation
- Language detection
- Structured data translation
- Engine health check
- Translation metrics
"""

import time
import logging
from fastapi import APIRouter, HTTPException, Request

from app.translation.service import translation_service
from app.translation.cache import translation_cache
from app.translation.model_manager import model_manager
from app.translation.language_map import LanguageMap
from app.translation.schemas import (
    TranslateRequest,
    TranslateResponse,
    BatchTranslateRequest,
    BatchTranslateResponse,
    DetectLanguageRequest,
    DetectLanguageResponse,
    TranslateStructuredRequest,
    TranslationHealthResponse,
)

logger = logging.getLogger("jansetu.translation")

translation_router = APIRouter(prefix="/translation", tags=["Translation"])


def get_request_id(request: Request) -> str:
    import uuid
    return getattr(request.state, "request_id", str(uuid.uuid4()))


def success_response(data, request: Request):
    from app.models.schemas import APIResponse
    return APIResponse(success=True, data=data, request_id=get_request_id(request))


# ─── Single Translation ─────────────────────────────────────────────

@translation_router.post("/translate")
def translate_text(req: TranslateRequest, request: Request):
    """
    Translate text to the target language.

    If source_language is 'auto', the engine will detect the source language.
    """
    try:
        result = translation_service.translate(
            text=req.text,
            target_language=req.target_language,
            source_language=req.source_language,
            category=req.category,
        )
        return success_response(result, request)
    except Exception as e:
        logger.error(f"Translation error: {e}", exc_info=True)
        # Never let translation errors break the app
        return success_response({
            "original_text": req.text,
            "translated_text": req.text,
            "source_language": req.source_language,
            "target_language": req.target_language,
            "detected_language": req.source_language,
            "from_cache": False,
            "engine": "error_fallback",
        }, request)


# ─── Batch Translation ──────────────────────────────────────────────

@translation_router.post("/translate/batch")
def translate_batch(req: BatchTranslateRequest, request: Request):
    """
    Translate multiple texts at once. Significantly reduces latency
    compared to individual translate calls.
    """
    try:
        items = [
            {
                "text": item.text,
                "source_language": item.source_language,
                "target_language": item.target_language,
            }
            for item in req.items
        ]
        result = translation_service.translate_batch(
            items, global_target=req.target_language
        )
        return success_response(result, request)
    except Exception as e:
        logger.error(f"Batch translation error: {e}", exc_info=True)
        # Return original texts on error
        fallback_results = [
            {
                "original_text": item.text,
                "translated_text": item.text,
                "source_language": item.source_language,
                "target_language": item.target_language,
                "detected_language": None,
                "from_cache": False,
                "engine": "error_fallback",
            }
            for item in req.items
        ]
        return success_response({
            "results": fallback_results,
            "total": len(fallback_results),
            "cache_hits": 0,
            "model_translations": 0,
            "fallback_count": len(fallback_results),
        }, request)


# ─── Language Detection ─────────────────────────────────────────────

@translation_router.post("/detect")
def detect_language(req: DetectLanguageRequest, request: Request):
    """
    Detect the language of input text.
    Uses Unicode script analysis and Romanized keyword matching.
    """
    try:
        result = translation_service.detect_language(
            text=req.text,
            fallback_language=req.fallback_language,
        )
        return success_response(result, request)
    except Exception as e:
        logger.error(f"Language detection error: {e}", exc_info=True)
        return success_response({
            "detected_language": req.fallback_language,
            "confidence": 0.0,
            "language_name": "English",
            "native_name": "English",
        }, request)


# ─── Structured Translation ────────────────────────────────────────

@translation_router.post("/translate/structured")
def translate_structured(req: TranslateStructuredRequest, request: Request):
    """
    Translate human-readable fields in a structured JSON object.
    Preserves IDs, URLs, numbers, dates, and other non-translatable data.
    """
    try:
        result = translation_service.translate_structured(
            data=req.data,
            target_language=req.target_language,
            source_language=req.source_language,
            translate_fields=req.translate_fields,
            skip_fields=req.skip_fields,
        )
        return success_response(result, request)
    except Exception as e:
        logger.error(f"Structured translation error: {e}", exc_info=True)
        return success_response(req.data, request)


# ─── Language List ──────────────────────────────────────────────────

@translation_router.get("/languages")
def list_supported_languages(request: Request):
    """Return all supported languages with their codes and metadata."""
    langs = LanguageMap.get_display_list()
    return success_response(langs, request)


# ─── Health Check ───────────────────────────────────────────────────

@translation_router.get("/health")
def translation_health(request: Request):
    """
    Translation engine health status.
    Used by Admin dashboard to show translation engine status.
    """
    try:
        health = translation_service.get_health()
        return success_response(health, request)
    except Exception as e:
        logger.error(f"Health check error: {e}", exc_info=True)
        return success_response({
            "engine_status": "DEGRADED",
            "model_status": "UNKNOWN",
            "model_id": "unknown",
            "device": "unknown",
            "supported_languages": len(LanguageMap.get_all()),
            "cache_status": "ACTIVE",
            "cache_entries": 0,
            "cache_hit_rate": 0.0,
            "average_latency_ms": 0,
            "total_translations": 0,
            "last_health_check": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }, request)


# ─── Cache Management ───────────────────────────────────────────────

@translation_router.get("/cache/stats")
def cache_stats(request: Request):
    """Return translation cache statistics."""
    stats = translation_cache.get_stats()
    return success_response(stats, request)


@translation_router.post("/cache/clear")
def clear_cache(request: Request):
    """Clear all translation cache entries."""
    translation_cache.clear()
    return success_response({"message": "Translation cache cleared"}, request)
