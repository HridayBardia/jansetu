"""
JANSETU Translation Service - Main orchestrator.

Provides the public API for all translation operations.
Uses a hybrid resilient strategy:
1. Multi-tier Redis / Memory Cache (fastest)
2. Token & Entity Shielding (protects {variables}, HTML tags, ₹50,000, and government IDs)
3. IndicTrans2 neural model via IndicTransToolkit (high-accuracy batched translation)
4. Graceful dictionary & LLM / English fallback (always available)
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
    INDICTRANS_TO_CODE,
)
from app.translation.cache import translation_cache
from app.translation.detector import language_detector
from app.translation.model_manager import model_manager, ModelStatus
from app.translation.token_shield import TokenShield
from app.translation.universal_dict import lookup_translation

logger = logging.getLogger("jansetu.translation")


class TranslationService:
    """
    Main translation service providing:
    - Single text translation with token shielding
    - Parallel batch translation
    - Structured JSON payload translation
    - Language detection
    - Health & hardware monitoring
    - Graceful multi-tier fallback chain
    """

    def __init__(self):
        self._error_count = 0
        self._total_translations = 0

    def _normalize_lang_code(self, code: str) -> str:
        """Normalizes input language code to short format or IndicTrans format."""
        if not code or code == "auto":
            return "auto"
        # If already in BCP-47 IndicTrans format, map to short code if needed
        if code in INDICTRANS_TO_CODE:
            return INDICTRANS_TO_CODE[code]
        return code.lower()

    def _to_indictrans_code(self, code: str) -> str:
        """Converts short code or returns valid IndicTrans BCP-47 tag."""
        if code in CODE_TO_INDICTRANS:
            return CODE_TO_INDICTRANS[code]
        if code in INDICTRANS_TO_CODE:
            return code
        return "eng_Latn"

    # ─── Public API ───────────────────────────────────────────────────

    def translate(
        self,
        text: str,
        target_language: str,
        source_language: str = "auto",
        category: str = "dynamic",
        preserve_tokens: bool = True,
    ) -> Dict[str, Any]:
        """
        Translate text to the target language.
        """
        start_time = time.perf_counter()

        if not text or not text.strip():
            return self._empty_result(text, target_language, source_language)

        text = text.strip()
        self._total_translations += 1

        norm_target = self._normalize_lang_code(target_language)
        norm_source = self._normalize_lang_code(source_language)

        # Step 1: Detect source language if auto
        detected_lang = norm_source
        if norm_source == "auto":
            detected_lang, _ = language_detector.detect(
                text, fallback_language=norm_target
            )
        else:
            detected_lang = norm_source

        # Step 2: If source == target, return as-is
        if detected_lang == norm_target:
            return {
                "original_text": text,
                "translated_text": text,
                "source_language": detected_lang,
                "target_language": norm_target,
                "detected_language": detected_lang,
                "from_cache": False,
                "engine": "passthrough",
                "latency_ms": round((time.perf_counter() - start_time) * 1000, 2),
            }

        # Step 3: Check cache
        cached = translation_cache.get(detected_lang, norm_target, text, category)
        if cached is not None:
            return {
                "original_text": text,
                "translated_text": cached,
                "source_language": detected_lang,
                "target_language": norm_target,
                "detected_language": detected_lang,
                "from_cache": True,
                "engine": "cache",
                "latency_ms": round((time.perf_counter() - start_time) * 1000, 2),
            }

        # Step 3.5: Master Universal Dictionary Check (0ms 100% accurate)
        dict_trans = lookup_translation(text, norm_target)
        if dict_trans:
            translation_cache.set(detected_lang, norm_target, text, dict_trans, category)
            return {
                "original_text": text,
                "translated_text": dict_trans,
                "source_language": detected_lang,
                "target_language": norm_target,
                "detected_language": detected_lang,
                "from_cache": False,
                "engine": "dictionary",
                "latency_ms": round((time.perf_counter() - start_time) * 1000, 2),
            }

        # Step 4: Token & Entity Shielding
        protected_text = text
        token_map = {}
        if preserve_tokens:
            protected_text, token_map = TokenShield.protect(text)

        # Step 5: IndicTrans2 Model Inference
        translated = None
        engine = "fallback"

        if model_manager.is_ready:
            src_it = self._to_indictrans_code(detected_lang)
            tgt_it = self._to_indictrans_code(norm_target)

            t0 = time.time()
            translated = model_manager.translate(protected_text, src_it, tgt_it)
            t_elapsed = time.time() - t0

            if translated:
                engine = "indictrans2"
                logger.debug(
                    "Model translation: %s->%s in %.3fs",
                    detected_lang,
                    norm_target,
                    t_elapsed,
                )

        # Step 6: Fallback if model is unavailable or degraded
        if translated is None:
            translated = self._fallback_translate(
                protected_text, detected_lang, norm_target
            )
            engine = "fallback"

        # Step 7: Restore shielded tokens
        if preserve_tokens and token_map:
            translated = TokenShield.restore(translated, token_map)

        # Step 8: Write to cache
        translation_cache.set(
            detected_lang, norm_target, text, translated, category
        )

        return {
            "original_text": text,
            "translated_text": translated,
            "source_language": detected_lang,
            "target_language": norm_target,
            "detected_language": detected_lang,
            "from_cache": False,
            "engine": engine,
            "latency_ms": round((time.perf_counter() - start_time) * 1000, 2),
        }

    def translate_batch(
        self,
        items: List[Dict[str, str]],
        global_target: Optional[str] = None,
        preserve_tokens: bool = True,
        category: str = "dynamic",
    ) -> Dict[str, Any]:
        """
        Translate multiple texts at once with batch cache lookups and batched neural inference.
        """
        start_time = time.perf_counter()
        if not items:
            return {
                "results": [],
                "translations": [],
                "total": 0,
                "cache_hits": 0,
                "cache_misses": 0,
                "model_translations": 0,
                "fallback_count": 0,
                "latency_ms": 0.0,
            }

        norm_global_tgt = self._normalize_lang_code(global_target) if global_target else None

        cache_lookups = []
        for item in items:
            text = item.get("text", "")
            src = self._normalize_lang_code(item.get("source_language", "auto"))
            tgt = norm_global_tgt or self._normalize_lang_code(item.get("target_language", "en"))
            cache_lookups.append((src, tgt, text))

        cached_results = translation_cache.get_batch(cache_lookups, category)

        results: List[Dict[str, Any]] = [{}] * len(items)
        missing_indices: List[int] = []

        cache_hits = 0
        model_translations = 0
        fallback_count = 0

        # Group cache hits
        for i, item in enumerate(items):
            text = item.get("text", "")
            src = self._normalize_lang_code(item.get("source_language", "auto"))
            tgt = norm_global_tgt or self._normalize_lang_code(item.get("target_language", "en"))

            if not text or not text.strip():
                results[i] = self._empty_result(text, tgt, src)
            elif i in cached_results:
                results[i] = {
                    "original_text": text,
                    "translated_text": cached_results[i],
                    "source_language": src,
                    "target_language": tgt,
                    "detected_language": None,
                    "from_cache": True,
                    "engine": "cache",
                    "latency_ms": 0.0,
                }
                cache_hits += 1
            else:
                missing_indices.append(i)

        # Batch translate misses using Dictionary / IndicTrans2 model
        if missing_indices:
            # Group remaining misses by language pair
            pair_groups: Dict[Tuple[str, str], List[Tuple[int, str]]] = {}
            for idx in missing_indices:
                item = items[idx]
                text = item.get("text", "").strip()
                src = self._normalize_lang_code(item.get("source_language", "auto"))
                tgt = norm_global_tgt or self._normalize_lang_code(item.get("target_language", "en"))

                if src == "auto":
                    src, _ = language_detector.detect(text, fallback_language="en")

                # Check Master Dictionary first
                dict_match = lookup_translation(text, tgt)
                if dict_match:
                    results[idx] = {
                        "original_text": text,
                        "translated_text": dict_match,
                        "source_language": src,
                        "target_language": tgt,
                        "detected_language": src,
                        "from_cache": False,
                        "engine": "dictionary",
                        "latency_ms": 0.0,
                    }
                    translation_cache.set(src, tgt, text, dict_match, category)
                    continue

                pair_key = (src, tgt)
                if pair_key not in pair_groups:
                    pair_groups[pair_key] = []
                pair_groups[pair_key].append((idx, text))

            # Process each language pair batch
            pairs_to_cache = []

            for (src, tgt), group in pair_groups.items():
                group_indices = [g[0] for g in group]
                group_texts = [g[1] for g in group]

                # Step A: Token Shielding
                if preserve_tokens:
                    protected_texts, token_maps = TokenShield.protect_batch(group_texts)
                else:
                    protected_texts = group_texts
                    token_maps = [{} for _ in group_texts]

                # Step B: Model Translation
                model_outputs = [None] * len(group_texts)
                used_engine = "fallback"

                if model_manager.is_ready and src != tgt:
                    src_it = self._to_indictrans_code(src)
                    tgt_it = self._to_indictrans_code(tgt)
                    model_outputs = model_manager.translate_batch(protected_texts, src_it, tgt_it)
                    used_engine = "indictrans2"

                # Step C: Fallback & Token Restoration
                for orig_idx, orig_text, p_text, m_out, t_map in zip(
                    group_indices, group_texts, protected_texts, model_outputs, token_maps
                ):
                    if src == tgt:
                        final_text = orig_text
                        curr_engine = "passthrough"
                    elif m_out is not None:
                        final_text = TokenShield.restore(m_out, t_map) if preserve_tokens else m_out
                        curr_engine = "indictrans2"
                        model_translations += 1
                    else:
                        fb = self._fallback_translate(p_text, src, tgt)
                        final_text = TokenShield.restore(fb, t_map) if preserve_tokens else fb
                        curr_engine = "fallback"
                        fallback_count += 1

                    results[orig_idx] = {
                        "original_text": orig_text,
                        "translated_text": final_text,
                        "source_language": src,
                        "target_language": tgt,
                        "detected_language": src,
                        "from_cache": False,
                        "engine": curr_engine,
                        "latency_ms": 0.0,
                    }

                    pairs_to_cache.append((src, tgt, orig_text, final_text))

            # Cache the new translations
            if pairs_to_cache:
                translation_cache.set_batch(pairs_to_cache, category)

        translations = [r.get("translated_text", "") for r in results]
        total_latency = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "results": results,
            "translations": translations,
            "source_language": items[0].get("source_language", "auto") if items else "auto",
            "target_language": norm_global_tgt or (items[0].get("target_language", "en") if items else "en"),
            "total": len(results),
            "cache_hits": cache_hits,
            "cache_misses": len(missing_indices),
            "model_translations": model_translations,
            "fallback_count": fallback_count,
            "latency_ms": total_latency,
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
        """
        if target_language == "en" and source_language in ("en", "auto"):
            return data

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
            "cache_entries": cache_stats.get("memory_entries", 0),
            "cache_hit_rate": cache_stats.get("hit_rate_percent", 0.0),
            "redis_connected": cache_stats.get("redis_connected", False),
            "average_latency_ms": round(
                model_health.get("average_latency_seconds", 0) * 1000, 1
            ),
            "total_translations": self._total_translations,
            "last_health_check": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "model_load_time": model_health.get("load_time_seconds", 0),
            "inference_count": model_health.get("inference_count", 0),
            "system_metrics": model_health,
        }

    # ─── Internal Helpers ────────────────────────────────────────────

    def _fallback_translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
    ) -> str:
        """
        Fallback translation when the neural model is unavailable or starting up.
        Uses the multi-language master dictionary engine for instant, 100% accurate localization.
        """
        if not text or not text.strip():
            return text

        norm_target = self._normalize_lang_code(target_lang)
        if norm_target == "en":
            return text

        matched = lookup_translation(text, norm_target)
        if matched:
            return matched

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
            return data

        if isinstance(data, dict):
            result = {}
            for key, value in data.items():
                if key in skip_fields:
                    result[key] = value
                elif isinstance(value, str) and key in translate_fields:
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
            "latency_ms": 0.0,
        }


# Module-level singleton
translation_service = TranslationService()
