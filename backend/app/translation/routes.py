"""
Translation API Routes.

Provides REST endpoints for:
- Single text translation (/translate, /api/v1/translate)
- Batch translation (/translate/batch, /translate-batch, /api/v1/translate-batch)
- Language detection (/detect, /api/v1/detect)
- Structured data translation (/translate/structured)
- Engine health check (/health, /api/v1/health/translation)
- Translation cache statistics
"""

import time
import logging
from typing import List, Dict, Any, Optional, Union
from fastapi import APIRouter, Request

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

translation_router = APIRouter(tags=["Translation"])


def get_request_id(request: Request) -> str:
    import uuid
    return getattr(request.state, "request_id", str(uuid.uuid4()))


def success_response(data: Any, request: Request):
    from app.models.schemas import APIResponse
    return APIResponse(success=True, data=data, request_id=get_request_id(request))


# ─── Single Translation ─────────────────────────────────────────────

@translation_router.post("/translation/translate")
@translation_router.post("/api/v1/translate")
def translate_text(req: TranslateRequest, request: Request):
    """
    Translate single text to the target language.
    Shields tokens, HTML tags, currencies, and technical IDs.
    """
    try:
        result = translation_service.translate(
            text=req.text,
            target_language=req.target_language,
            source_language=req.source_language,
            category=req.category,
            preserve_tokens=req.preserve_tokens,
        )
        return success_response(result, request)
    except Exception as e:
        logger.error("Translation error: %s", e, exc_info=True)
        fallback = {
            "original_text": req.text,
            "translated_text": req.text,
            "source_language": req.source_language,
            "target_language": req.target_language,
            "detected_language": req.source_language,
            "from_cache": False,
            "engine": "error_fallback",
            "latency_ms": 0.0,
        }
        return success_response(fallback, request)


# ─── Batch Translation ──────────────────────────────────────────────

@translation_router.post("/translation/translate/batch")
@translation_router.post("/translation/translate-batch")
@translation_router.post("/api/v1/translate/batch")
@translation_router.post("/api/v1/translate-batch")
def translate_batch(req: BatchTranslateRequest, request: Request):
    """
    Translate multiple texts in a single batch.
    Supports either:
    1. Flat list of strings via `texts: ["string 1", "string 2"]`
    2. Itemized list via `items: [{"text": "...", "source_language": "...", "target_language": "..."}]`
    """
    try:
        items_payload = []
        global_target = req.target_language

        if req.texts is not None:
            for t in req.texts:
                items_payload.append({
                    "text": t,
                    "source_language": req.source_language or "auto",
                    "target_language": global_target or "en",
                })
        elif req.items is not None:
            for item in req.items:
                items_payload.append({
                    "text": item.text,
                    "source_language": item.source_language,
                    "target_language": item.target_language or global_target or "en",
                })
        else:
            items_payload = []

        result = translation_service.translate_batch(
            items_payload,
            global_target=global_target,
            preserve_tokens=req.preserve_tokens,
            category=req.category,
        )
        return success_response(result, request)
    except Exception as e:
        logger.error("Batch translation error: %s", e, exc_info=True)
        raw_texts = req.texts or ([item.text for item in req.items] if req.items else [])
        fallback_results = [
            {
                "original_text": t,
                "translated_text": t,
                "source_language": req.source_language or "auto",
                "target_language": req.target_language or "en",
                "detected_language": None,
                "from_cache": False,
                "engine": "error_fallback",
                "latency_ms": 0.0,
            }
            for t in raw_texts
        ]
        return success_response({
            "results": fallback_results,
            "translations": raw_texts,
            "source_language": req.source_language or "auto",
            "target_language": req.target_language or "en",
            "total": len(raw_texts),
            "cache_hits": 0,
            "cache_misses": len(raw_texts),
            "model_translations": 0,
            "fallback_count": len(raw_texts),
            "latency_ms": 0.0,
        }, request)


# ─── Language Detection ─────────────────────────────────────────────

@translation_router.post("/translation/detect")
@translation_router.post("/api/v1/detect")
def detect_language(req: DetectLanguageRequest, request: Request):
    """
    Detect the language of input text using Unicode script analysis and keyword matching.
    """
    try:
        result = translation_service.detect_language(
            text=req.text,
            fallback_language=req.fallback_language,
        )
        return success_response(result, request)
    except Exception as e:
        logger.error("Language detection error: %s", e, exc_info=True)
        return success_response({
            "detected_language": req.fallback_language,
            "confidence": 0.0,
            "language_name": "English",
            "native_name": "English",
        }, request)


# ─── Structured JSON Translation ────────────────────────────────────

@translation_router.post("/translation/translate/structured")
@translation_router.post("/api/v1/translate/structured")
def translate_structured(req: TranslateStructuredRequest, request: Request):
    """
    Translate human-readable fields in a structured JSON object.
    Preserves IDs, URLs, numbers, dates, and non-translatable fields.
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
        logger.error("Structured translation error: %s", e, exc_info=True)
        return success_response(req.data, request)


# ─── Language List ──────────────────────────────────────────────────

@translation_router.get("/translation/languages")
@translation_router.get("/api/v1/languages")
def list_supported_languages(request: Request):
    """Return all supported languages with their codes and metadata."""
    langs = LanguageMap.get_display_list()
    return success_response(langs, request)


# ─── Health Check ───────────────────────────────────────────────────

@translation_router.get("/translation/health")
@translation_router.get("/api/v1/translation/health")
def translation_health(request: Request):
    """
    Translation engine health status and GPU memory metrics.
    """
    try:
        health = translation_service.get_health()
        return success_response(health, request)
    except Exception as e:
        logger.error("Health check error: %s", e, exc_info=True)
        return success_response({
            "engine_status": "DEGRADED",
            "model_status": "UNKNOWN",
            "model_id": "unknown",
            "device": "unknown",
            "supported_languages": len(LanguageMap.get_all()),
            "cache_status": "ACTIVE",
            "cache_entries": 0,
            "cache_hit_rate": 0.0,
            "redis_connected": False,
            "average_latency_ms": 0,
            "total_translations": 0,
            "last_health_check": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }, request)


# ─── Cache Management ───────────────────────────────────────────────

@translation_router.get("/translation/cache/stats")
@translation_router.get("/api/v1/translation/cache/stats")
def cache_stats(request: Request):
    """Return translation cache statistics."""
    stats = translation_cache.get_stats()
    return success_response(stats, request)


@translation_router.post("/translation/cache/clear")
@translation_router.post("/api/v1/translation/cache/clear")
def clear_cache(request: Request):
    """Clear all translation cache entries."""
    translation_cache.clear()
    return success_response({"message": "Translation cache cleared"}, request)
