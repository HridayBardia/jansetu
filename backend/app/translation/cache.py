"""
Translation Cache - In-memory implementation with TTL support.

Provides fast lookups for previously translated strings.
Uses hash-based cache keys combining source language, target language, and text hash.
"""

import hashlib
import time
import threading
from typing import Optional, Dict, Tuple, Any
import logging

logger = logging.getLogger("jansetu.translation")


class TranslationCache:
    """
    Thread-safe in-memory translation cache with TTL-based expiration.

    Cache key format: sha256(f"{source_lang}:{target_lang}:{text}")
    """

    def __init__(
        self,
        static_ttl: int = 86400 * 30,     # 30 days for static UI strings
        dynamic_ttl: int = 3600,            # 1 hour for dynamic content
        scheme_ttl: int = 86400,            # 24 hours for scheme descriptions
        max_entries: int = 50000,           # Max cache entries
    ):
        self._cache: Dict[str, Tuple[str, float]] = {}  # key -> (translation, expiry)
        self._lock = threading.Lock()
        self._stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0,
            "sets": 0,
        }
        self.static_ttl = static_ttl
        self.dynamic_ttl = dynamic_ttl
        self.scheme_ttl = scheme_ttl
        self.max_entries = max_entries

    @staticmethod
    def _make_key(source_lang: str, target_lang: str, text: str) -> str:
        """Generate cache key from language pair and text."""
        raw = f"{source_lang}:{target_lang}:{text}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def get(
        self,
        source_lang: str,
        target_lang: str,
        text: str,
        category: str = "dynamic",
    ) -> Optional[str]:
        """
        Look up a cached translation.

        Args:
            source_lang: Source language code (e.g., "en")
            target_lang: Target language code (e.g., "hi")
            text: The text to look up
            category: Cache category ("static", "dynamic", "scheme")

        Returns:
            Cached translation or None if not found/expired.
        """
        if not text or not text.strip():
            return None

        key = self._make_key(source_lang, target_lang, text)

        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                self._stats["misses"] += 1
                return None

            translation, expiry = entry
            if time.time() > expiry:
                del self._cache[key]
                self._stats["misses"] += 1
                return None

            self._stats["hits"] += 1
            return translation

    def set(
        self,
        source_lang: str,
        target_lang: str,
        text: str,
        translation: str,
        category: str = "dynamic",
    ) -> None:
        """
        Store a translation in cache.

        Args:
            source_lang: Source language code
            target_lang: Target language code
            text: Original text
            translation: Translated text
            category: Cache category for TTL selection
        """
        if not text or not text.strip():
            return

        key = self._make_key(source_lang, target_lang, text)

        # Select TTL based on category
        if category == "static":
            ttl = self.static_ttl
        elif category == "scheme":
            ttl = self.scheme_ttl
        else:
            ttl = self.dynamic_ttl

        expiry = time.time() + ttl

        with self._lock:
            # Evict oldest entries if at capacity
            if len(self._cache) >= self.max_entries and key not in self._cache:
                self._evict_oldest()

            self._cache[key] = (translation, expiry)
            self._stats["sets"] += 1

    def invalidate(
        self,
        source_lang: Optional[str] = None,
        target_lang: Optional[str] = None,
    ) -> int:
        """
        Invalidate cache entries optionally filtered by language pair.

        Returns:
            Number of entries invalidated.
        """
        count = 0
        with self._lock:
            keys_to_delete = []
            for key, (translation, expiry) in self._cache.items():
                # We can't easily reverse the key to check languages,
                # so for targeted invalidation, we clear all
                if source_lang is None and target_lang is None:
                    keys_to_delete.append(key)
                else:
                    # For targeted invalidation, delete all (can't filter by key alone)
                    keys_to_delete.append(key)

            for key in keys_to_delete:
                del self._cache[key]
                count += 1

        return count

    def clear(self) -> None:
        """Clear all cache entries."""
        with self._lock:
            self._cache.clear()
            logger.info("Translation cache cleared")

    def _evict_oldest(self) -> None:
        """Remove the oldest 10% of entries when at capacity."""
        if not self._cache:
            return

        # Sort by expiry time and remove the oldest 10%
        entries = sorted(self._cache.items(), key=lambda x: x[1][1])
        evict_count = max(1, len(entries) // 10)

        for key, _ in entries[:evict_count]:
            del self._cache[key]

        self._stats["evictions"] += evict_count

    def get_stats(self) -> Dict[str, Any]:
        """Return cache statistics."""
        with self._lock:
            total = self._stats["hits"] + self._stats["misses"]
            hit_rate = (self._stats["hits"] / total * 100) if total > 0 else 0
            return {
                "entries": len(self._cache),
                "hits": self._stats["hits"],
                "misses": self._stats["misses"],
                "hit_rate_percent": round(hit_rate, 1),
                "sets": self._stats["sets"],
                "evictions": self._stats["evictions"],
                "max_entries": self.max_entries,
            }

    def get_batch(
        self,
        items: list,
        category: str = "dynamic",
    ) -> Dict[int, str]:
        """
        Look up multiple translations at once.

        Args:
            items: List of (source_lang, target_lang, text) tuples
            category: Cache category

        Returns:
            Dict mapping index -> cached translation (only hits)
        """
        results = {}
        for i, (src, tgt, text) in enumerate(items):
            cached = self.get(src, tgt, text, category)
            if cached is not None:
                results[i] = cached
        return results


# Module-level singleton
translation_cache = TranslationCache()
