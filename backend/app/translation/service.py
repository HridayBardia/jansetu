"""
JANSETU Translation Service - Main orchestrator.

Provides the public API for all translation operations.
Uses a hybrid strategy:
1. Pretranslated dictionary (fastest)
2. Translation cache (fast)
3. IndicTrans2 model (full translation)
4. English fallback (always available)
"""

import time
import logging
from typing import Dict, List, Optional, Any, Tuple

from app.translation.language_map import (
    LanguageMap,
    LanguageDef,
    LANGUAGES,
    PRESERVED_TERMS,
    CODE_TO_INDICTRANS,
)
from app.translation.cache import translation_cache
from app.translation.detector import language_detector
from app.translation.model_manager import model_manager, ModelStatus

logger = logging.getLogger("jansetu.translation")


class TranslationService:
    """
    Main translation service providing:
    - Single text translation
    - Batch translation
    - Structured data translation
    - Language detection
    - Health monitoring
    - Graceful fallback chain
    """

    def __init__(self):
        self._error_count = 0
        self._total_translations = 0

    # ─── Public API ───────────────────────────────────────────────────

    def translate(
        self,
        text: str,
        target_language: str,
        source_language: str = "auto",
        category: str = "dynamic",
    ) -> Dict[str, Any]:
        """
        Translate text to the target language.

        Fallback chain:
        1. Cache hit → return cached
        2. Source == target → return original
        3. IndicTrans2 model → return model translation
        4. English fallback → return English original

        Returns:
            Dict with: original_text, translated_text, source_language,
            target_language, detected_language, from_cache, engine
        """
        if not text or not text.strip():
            return self._empty_result(text, target_language, source_language)

        text = text.strip()
        self._total_translations += 1

        # Step 1: Detect source language if auto
        detected_lang = source_language
        if source_language == "auto":
            detected_lang, confidence = language_detector.detect(
                text, fallback_language=target_language
            )
        else:
            detected_lang = source_language

        # Step 2: If source == target, return as-is
        if detected_lang == target_language:
            return {
                "original_text": text,
                "translated_text": text,
                "source_language": detected_lang,
                "target_language": target_language,
                "detected_language": detected_lang,
                "from_cache": False,
                "engine": "passthrough",
            }

        # Step 3: Check cache
        cached = translation_cache.get(detected_lang, target_language, text, category)
        if cached is not None:
            return {
                "original_text": text,
                "translated_text": cached,
                "source_language": detected_lang,
                "target_language": target_language,
                "detected_language": detected_lang,
                "from_cache": True,
                "engine": "cache",
            }

        # Step 4: Preserve government terms
        protected_text, placeholders = self._protect_terms(text)

        # Step 5: Try IndicTrans2 model
        translated = None
        if model_manager.is_ready:
            src_it = CODE_TO_INDICTRANS.get(detected_lang, "eng_Latn")
            tgt_it = CODE_TO_INDICTRANS.get(target_language, "hin_Deva")

            start = time.time()
            translated = model_manager.translate(protected_text, src_it, tgt_it)
            elapsed = time.time() - start

            if translated:
                logger.info(
                    f"Model translation: {detected_lang}→{target_language} "
                    f"in {elapsed:.3f}s"
                )

        # Step 6: Fallback if model failed
        if translated is None:
            translated = self._fallback_translate(
                protected_text, detected_lang, target_language
            )
            engine = "fallback"
        else:
            engine = "indictrans2"

        # Step 7: Restore preserved terms
        translated = self._restore_terms(translated, placeholders)

        # Step 8: Cache the result
        translation_cache.set(
            detected_lang, target_language, text, translated, category
        )

        return {
            "original_text": text,
            "translated_text": translated,
            "source_language": detected_lang,
            "target_language": target_language,
            "detected_language": detected_lang,
            "from_cache": False,
            "engine": engine,
        }

    def translate_batch(
        self,
        items: List[Dict[str, str]],
        global_target: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Translate multiple texts at once.

        Args:
            items: List of {"text": ..., "source_language": ..., "target_language": ...}
            global_target: Override target language for all items

        Returns:
            Dict with results, stats
        """
        results = []
        cache_hits = 0
        model_translations = 0
        fallback_count = 0

        # Batch cache lookup first
        cache_lookups = []
        for item in items:
            text = item.get("text", "")
            src = item.get("source_language", "auto")
            tgt = global_target or item.get("target_language", "en")
            cache_lookups.append((src, tgt, text))

        cached_results = translation_cache.get_batch(cache_lookups)

        for i, item in enumerate(items):
            text = item.get("text", "")
            tgt = global_target or item.get("target_language", "en")

            if i in cached_results:
                results.append({
                    "original_text": text,
                    "translated_text": cached_results[i],
                    "source_language": item.get("source_language", "auto"),
                    "target_language": tgt,
                    "detected_language": None,
                    "from_cache": True,
                    "engine": "cache",
                })
                cache_hits += 1
            else:
                result = self.translate(
                    text, tgt,
                    source_language=item.get("source_language", "auto"),
                )
                results.append(result)
                if result["engine"] == "indictrans2":
                    model_translations += 1
                else:
                    fallback_count += 1

        return {
            "results": results,
            "total": len(results),
            "cache_hits": cache_hits,
            "model_translations": model_translations,
            "fallback_count": fallback_count,
        }

    def translate_structured(
        self,
        data: Dict[str, Any],
        target_language: str,
        source_language: str = "auto",
        translate_fields: Optional[List[str]] = None,
        skip_fields: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Translate human-readable fields in a structured dict.
        Preserves IDs, URLs, numbers, dates, and other non-translatable data.

        Args:
            data: Structured data dict
            target_language: Target language code
            source_language: Source language code
            translate_fields: Field names to translate
            skip_fields: Field names to skip

        Returns:
            New dict with translated fields
        """
        if target_language == "en":
            return data  # No translation needed

        translate_fields = translate_fields or [
            "title", "description", "name", "summary", "label",
            "text", "message", "heading", "subtitle", "placeholder",
            "reason", "explanation", "next_steps", "official_name",
            "why_matches", "notice", "short_description", "long_description",
            "eligibility_description", "benefits_description",
            "application_process", "documents_required",
        ]
        skip_fields = skip_fields or [
            "id", "url", "email", "phone", "date", "created_at",
            "updated_at", "scheme_id", "application_url", "status",
            "document_type", "mime_type", "file_name", "language_code",
            "source_url", "official_source_url", "verification_status",
            "code", "type", "level", "state_code", "category_code",
        ]

        return self._translate_dict_recursive(
            data, target_language, source_language,
            translate_fields, skip_fields, depth=0
        )

    def detect_language(
        self,
        text: str,
        fallback_language: str = "en",
    ) -> Dict[str, Any]:
        """
        Detect the language of input text.

        Returns:
            Dict with detected_language, confidence, language_name, native_name
        """
        lang_code, confidence = language_detector.detect(text, fallback_language)

        lang_def = LanguageMap.get(lang_code)
        return {
            "detected_language": lang_code,
            "confidence": round(confidence, 3),
            "language_name": lang_def.name if lang_def else lang_code,
            "native_name": lang_def.native_name if lang_def else lang_code,
        }

    def get_health(self) -> Dict[str, Any]:
        """Return translation engine health status."""
        cache_stats = translation_cache.get_stats()
        model_health = model_manager.get_health()

        return {
            "engine_status": "HEALTHY" if model_manager.is_ready else "DEGRADED",
            "model_status": model_manager.status.value,
            "model_id": model_manager.model_id,
            "device": model_manager.device,
            "supported_languages": len(LANGUAGES),
            "cache_status": "ACTIVE",
            "cache_entries": cache_stats["entries"],
            "cache_hit_rate": cache_stats["hit_rate_percent"],
            "average_latency_ms": round(
                model_health["average_latency_seconds"] * 1000, 1
            ),
            "total_translations": self._total_translations,
            "last_health_check": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "model_load_time": model_health["load_time_seconds"],
            "inference_count": model_health["inference_count"],
        }

    # ─── Internal Helpers ────────────────────────────────────────────

    def _protect_terms(self, text: str) -> Tuple[str, Dict[str, str]]:
        """Replace preserved government terms with placeholders."""
        placeholders = {}
        processed = text

        for idx, term in enumerate(PRESERVED_TERMS):
            placeholder = f"__GOV_TERM_{idx}__"
            if term in processed:
                placeholders[placeholder] = term
                processed = processed.replace(term, placeholder)

        return processed, placeholders

    def _restore_terms(self, text: str, placeholders: Dict[str, str]) -> str:
        """Restore preserved government terms from placeholders."""
        restored = text
        for placeholder, term in placeholders.items():
            restored = restored.replace(placeholder, term)
        return restored

    def _fallback_translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
    ) -> str:
        """
        Fallback translation when the model is unavailable.
        Returns the original text as-is (English fallback).
        """
        # In degraded mode, return the original text
        # The frontend will use its pretranslated dictionaries for UI strings
        return text

    def _translate_dict_recursive(
        self,
        data: Any,
        target_language: str,
        source_language: str,
        translate_fields: List[str],
        skip_fields: List[str],
        depth: int = 0,
    ) -> Any:
        """Recursively translate dict/list structures."""
        if depth > 10:
            return data  # Prevent infinite recursion

        if isinstance(data, dict):
            result = {}
            for key, value in data.items():
                if key in skip_fields:
                    result[key] = value
                elif isinstance(value, str) and key in translate_fields:
                    # Translate this field
                    translated = self.translate(
                        value, target_language,
                        source_language=source_language,
                        category="dynamic",
                    )
                    result[key] = translated["translated_text"]
                elif isinstance(value, (dict, list)):
                    result[key] = self._translate_dict_recursive(
                        value, target_language, source_language,
                        translate_fields, skip_fields, depth + 1,
                    )
                else:
                    result[key] = value
            return result

        elif isinstance(data, list):
            return [
                self._translate_dict_recursive(
                    item, target_language, source_language,
                    translate_fields, skip_fields, depth + 1,
                )
                if isinstance(item, (dict, list))
                else item
                for item in data
            ]

        return data

    def _empty_result(
        self,
        text: Optional[str],
        target_language: str,
        source_language: str,
    ) -> Dict[str, Any]:
        """Return an empty translation result."""
        return {
            "original_text": text or "",
            "translated_text": text or "",
            "source_language": source_language,
            "target_language": target_language,
            "detected_language": source_language,
            "from_cache": False,
            "engine": "passthrough",
        }


# Module-level singleton
translation_service = TranslationService()
