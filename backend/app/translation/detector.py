"""
Language Detection Engine.

Uses Unicode script range analysis and Romanized keyword matching to detect
the source language of input text. This is separate from translation.
"""

import re
from typing import Dict, Optional, Tuple
from collections import Counter
import logging

from app.translation.language_map import (
    SCRIPT_RANGES,
    ROMANIZED_KEYWORDS,
    LANGUAGES,
)

logger = logging.getLogger("jansetu.translation")


class LanguageDetector:
    """
    Detects the language of input text using multiple strategies:
    1. Unicode script range analysis (most reliable for native scripts)
    2. Romanized keyword matching (for transliterated input)
    3. Fallback to user's selected language or English
    """

    @staticmethod
    def detect(
        text: str,
        fallback_language: str = "en",
        confidence_threshold: float = 0.3,
    ) -> Tuple[str, float]:
        """
        Detect the language of the given text.

        Args:
            text: Input text to analyze
            fallback_language: Language to return when detection is uncertain
            confidence_threshold: Minimum confidence to override fallback

        Returns:
            Tuple of (language_code, confidence_score)
        """
        if not text or not text.strip():
            return fallback_language, 0.0

        text = text.strip()

        # Strategy 1: Unicode Script Range Detection
        script_lang, script_confidence = LanguageDetector._detect_by_script(text)
        if script_confidence >= confidence_threshold:
            return script_lang, script_confidence

        # Strategy 2: Romanized Keyword Detection
        roman_lang, roman_confidence = LanguageDetector._detect_by_romanized(text)
        if roman_confidence >= confidence_threshold:
            return roman_lang, roman_confidence

        # Strategy 3: Mixed script detection (e.g., Hindi-English mix)
        if script_lang and roman_lang and script_lang == roman_lang:
            return script_lang, max(script_confidence, roman_confidence)

        # Fallback: Use the highest confidence detection or user's language
        if script_confidence > roman_confidence and script_confidence > 0:
            return script_lang, script_confidence

        if roman_confidence > 0:
            return roman_lang, roman_confidence

        return fallback_language, 0.0

    @staticmethod
    def _detect_by_script(text: str) -> Tuple[str, float]:
        """
        Detect language by analyzing Unicode script ranges.

        Returns the language with the most characters in its script range.
        """
        # Count characters by script range
        script_counts: Dict[str, int] = Counter()

        for char in text:
            cp = ord(char)
            for start, end, lang_codes in SCRIPT_RANGES:
                if start <= cp <= end:
                    # Distribute to all candidate languages for this script
                    # But weight primary language higher
                    if lang_codes:
                        script_counts[lang_codes[0]] += 1
                    break

        if not script_counts:
            return "", 0.0

        # Get total non-ASCII characters
        total_indic_chars = sum(script_counts.values())
        total_chars = len(text)

        if total_chars == 0:
            return "", 0.0

        # Get the top language
        top_lang, top_count = script_counts.most_common(1)[0]

        # Confidence = proportion of script characters vs total meaningful characters
        # (excluding spaces, punctuation, digits)
        meaningful_chars = sum(1 for c in text if c.isalpha())
        if meaningful_chars == 0:
            return "", 0.0

        confidence = top_count / meaningful_chars

        return top_lang, confidence

    @staticmethod
    def _detect_by_romanized(text: str) -> Tuple[str, float]:
        """
        Detect language from Romanized/transliterated text using keyword matching.

        Useful for inputs like "mujhe jaipur me hospital banana hai" (Hindi in Latin script).
        """
        # Tokenize
        lower_text = text.lower()
        words = set(re.findall(r'\b\w+\b', lower_text))

        if not words:
            return "", 0.0

        # Score each language
        scores: Dict[str, int] = {}
        for lang_code, keywords in ROMANIZED_KEYWORDS.items():
            matches = sum(1 for w in words if w in keywords)
            if matches > 0:
                scores[lang_code] = matches

        if not scores:
            return "", 0.0

        # Sort by score, with Hindi as tiebreaker (most common Romanized Indic language)
        sorted_langs = sorted(
            scores.keys(),
            key=lambda l: (scores[l], 1 if l == "hi" else 0),
            reverse=True,
        )

        top_lang = sorted_langs[0]
        top_score = scores[top_lang]

        # Confidence based on keyword density
        confidence = min(1.0, top_score / max(len(words), 1) * 3)

        return top_lang, confidence

    @staticmethod
    def detect_batch(
        texts: list,
        fallback_language: str = "en",
    ) -> list:
        """
        Detect language for multiple texts at once.

        Returns:
            List of (language_code, confidence) tuples
        """
        return [
            LanguageDetector.detect(text, fallback_language)
            for text in texts
        ]


# Module-level singleton
language_detector = LanguageDetector()
