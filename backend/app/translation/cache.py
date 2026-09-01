"""
Translation Cache - Multi-tier Redis + In-Memory LRU Cache with TTL support.

Provides lightning-fast lookups for previously translated strings.
Uses SHA-256 cache keys combining source language, target language, and text hash.
"""

import os
import hashlib
import time
import threading
from typing import Optional, Dict, List, Tuple, Any
import logging

logger = logging.getLogger("jansetu.translation")


class TranslationCache:
    """
    Thread-safe multi-tier translation cache:
    1. Redis Cache (distributed, persistent across worker processes)
    2. In-Memory LRU Cache (low-latency fallback if Redis is unavailable)

    Cache key format: f"trans:{source_lang}:{target_lang}:{sha256(text)}"
    """

    def __init__(
        self,
        static_ttl: int = 86400 * 30,     # 30 days for static UI strings
        dynamic_ttl: int = 3600,          # 1 hour for dynamic content
        scheme_ttl: int = 86400,          # 24 hours for scheme descriptions
        max_entries: int = 50000,         # Max memory cache entries
        redis_host: Optional[str] = None,
        redis_port: Optional[int] = None,
        redis_db: int = 0,
        redis_password: Optional[str] = None,
    ):
        self._cache: Dict[str, Tuple[str, float]] = {}  # key -> (translation, expiry)
        self._lock = threading.Lock()
        self._stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0,
            "sets": 0,
            "redis_hits": 0,
        }
        self.static_ttl = static_ttl
        self.dynamic_ttl = dynamic_ttl
        self.scheme_ttl = scheme_ttl
        self.max_entries = max_entries

        # Configure Redis if available
        self.redis_client = None
        host = redis_host or os.getenv("REDIS_HOST", "localhost")
        port = redis_port or int(os.getenv("REDIS_PORT", "6379"))
        password = redis_password or os.getenv("REDIS_PASSWORD", None)

        try:
            import redis
            client = redis.Redis(
                host=host,
                port=port,
                db=redis_db,
                password=password,
                socket_timeout=1.5,
                decode_responses=True,
            )
            client.ping()
            self.redis_client = client
            logger.info("Translation cache connected to Redis at %s:%s", host, port)
        except Exception as e:
            logger.info("Redis not active (%s). Operating with in-memory LRU cache.", str(e))
            self.redis_client = None

    @staticmethod
    def _make_key(source_lang: str, target_lang: str, text: str) -> str:
        """Generate cache key from language pair and text."""
        raw = f"{source_lang}:{target_lang}:{text.strip()}"
        content_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        return f"trans:{source_lang}:{target_lang}:{content_hash}"

    def _get_ttl(self, category: str) -> int:
        if category == "static":
            return self.static_ttl
        if category == "scheme":
            return self.scheme_ttl
        return self.dynamic_ttl

    def get(
        self,
        source_lang: str,
        target_lang: str,
        text: str,
        category: str = "dynamic",
    ) -> Optional[str]:
        """
        Look up a cached translation.
        """
        if not text or not text.strip():
            return None

        key = self._make_key(source_lang, target_lang, text)

        # 1. Check Redis first if available
        if self.redis_client:
            try:
                cached = self.redis_client.get(key)
                if cached is not None:
                    with self._lock:
                        self._stats["hits"] += 1
                        self._stats["redis_hits"] += 1
                    return cached
            except Exception as e:
                logger.debug("Redis lookup error: %s", e)

        # 2. Check In-Memory Cache
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
        """
        if not text or not text.strip() or translation is None:
            return

        key = self._make_key(source_lang, target_lang, text)
        ttl = self._get_ttl(category)
        expiry = time.time() + ttl

        # 1. Set in Redis
        if self.redis_client:
            try:
                self.redis_client.setex(key, ttl, translation)
            except Exception as e:
                logger.debug("Redis set error: %s", e)

        # 2. Set in Memory Cache
        with self._lock:
            if len(self._cache) >= self.max_entries and key not in self._cache:
                self._evict_oldest()

            self._cache[key] = (translation, expiry)
            self._stats["sets"] += 1

    def get_batch(
        self,
        items: List[Tuple[str, str, str]],
        category: str = "dynamic",
    ) -> Dict[int, str]:
        """
        Look up multiple translations at once using Redis MGET or batch in-memory queries.

        Args:
            items: List of (source_lang, target_lang, text) tuples

        Returns:
            Dict mapping index -> cached translation (only hits)
        """
        results: Dict[int, str] = {}
        if not items:
            return results

        keys = [self._make_key(src, tgt, text) if text and text.strip() else None for src, tgt, text in items]

        # Redis MGET
        if self.redis_client:
            valid_keys = [k for k in keys if k is not None]
            if valid_keys:
                try:
                    redis_vals = self.redis_client.mget(valid_keys)
                    val_map = {k: v for k, v in zip(valid_keys, redis_vals) if v is not None}
                    for i, key in enumerate(keys):
                        if key and key in val_map:
                            results[i] = val_map[key]
                            with self._lock:
                                self._stats["hits"] += 1
                                self._stats["redis_hits"] += 1
                except Exception as e:
                    logger.debug("Redis batch lookup error: %s", e)

        # Fill remaining misses from Memory Cache
        now = time.time()
        with self._lock:
            for i, (src, tgt, text) in enumerate(items):
                if i in results or not text or not text.strip():
                    continue

                key = keys[i]
                entry = self._cache.get(key)
                if entry is not None:
                    translation, expiry = entry
                    if now <= expiry:
                        results[i] = translation
                        self._stats["hits"] += 1
                    else:
                        del self._cache[key]
                        self._stats["misses"] += 1
                else:
                    self._stats["misses"] += 1

        return results

    def set_batch(
        self,
        items: List[Tuple[str, str, str, str]],
        category: str = "dynamic",
    ) -> None:
        """
        Store a batch of (source_lang, target_lang, original_text, translated_text) in cache.
        """
        if not items:
            return

        ttl = self._get_ttl(category)
        expiry = time.time() + ttl

        # Redis Pipeline
        if self.redis_client:
            try:
                pipe = self.redis_client.pipeline()
                for src, tgt, text, translation in items:
                    if text and text.strip() and translation is not None:
                        key = self._make_key(src, tgt, text)
                        pipe.setex(key, ttl, translation)
                pipe.execute()
            except Exception as e:
                logger.debug("Redis batch set error: %s", e)

        # In-Memory Cache
        with self._lock:
            for src, tgt, text, translation in items:
                if text and text.strip() and translation is not None:
                    key = self._make_key(src, tgt, text)
                    if len(self._cache) >= self.max_entries and key not in self._cache:
                        self._evict_oldest()
                    self._cache[key] = (translation, expiry)
                    self._stats["sets"] += 1

    def clear(self) -> None:
        """Clear all cache entries."""
        if self.redis_client:
            try:
                # Flush Redis keys with prefix
                keys = self.redis_client.keys("trans:*")
                if keys:
                    self.redis_client.delete(*keys)
            except Exception as e:
                logger.debug("Redis clear error: %s", e)

        with self._lock:
            self._cache.clear()
            logger.info("Translation cache cleared")

    def _evict_oldest(self) -> None:
        """Remove the oldest 10% of entries when at capacity."""
        if not self._cache:
            return
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
                "redis_connected": self.redis_client is not None,
                "memory_entries": len(self._cache),
                "hits": self._stats["hits"],
                "misses": self._stats["misses"],
                "redis_hits": self._stats["redis_hits"],
                "hit_rate_percent": round(hit_rate, 1),
                "sets": self._stats["sets"],
                "evictions": self._stats["evictions"],
                "max_memory_entries": self.max_entries,
            }


# Module-level singleton
translation_cache = TranslationCache()
