"""
JANSETU Translation Engine - AI4Bharat IndicTrans2 Integration

Provides server-side multilingual translation for all 22 scheduled Indian languages.
Uses a hybrid strategy: pretranslated static dictionaries + IndicTrans2 for dynamic content.
"""

from app.translation.service import translation_service
from app.translation.language_map import LanguageMap, LANGUAGE_MAP

__all__ = ["translation_service", "LanguageMap", "LANGUAGE_MAP"]
