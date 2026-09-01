"""
Token and Entity Shielding Pre/Post-processor for IndicTrans2.
Shields technical tokens, HTML tags, currencies, URLs, and template variables
from distortion during neural machine translation.
"""

import re
from typing import List, Tuple, Dict


class TokenShield:
    """
    Replaces vulnerable tokens with inert placeholders before translation,
    then accurately restores original strings post-translation.
    """

    # Exact token patterns that MUST NOT be translated
    PATTERNS = [
        r"\{\{\s*[\w\.\-]+\s*\}\}",              # Jinja / Handlebars: {{ name }}
        r"\{[\w\.\-]+\}",                         # Python / React f-string: {name}
        r"<[^>]+>",                               # HTML / XML tags: <span class="badge">, <b>, </a>
        r"(?:₹|Rs\.?|INR)\s*[\d,]+(?:\.\d+)?",    # Currency: ₹50,000, Rs. 1,200, INR 1000
        r"https?://\S+|www\.\S+",                 # URLs: https://jansetu.gov.in
        r"[\w\.-]+@[\w\.-]+\.\w+",                # Email addresses: help@jansetu.in
        r"#[A-Za-z0-9_\-]+",                      # Hashtag/ID formats: #JS-998822
        r"\b[A-Z]{2,}[-_][A-Z0-9-_]+\b",          # Formatted IDs: KA-2024-X89, SCH_01
    ]

    COMPILED_REGEX = re.compile(r"|".join(PATTERNS))

    @classmethod
    def protect(cls, text: str) -> Tuple[str, Dict[str, str]]:
        """
        Replaces matched patterns with placeholder tags like __TOKEN_0__.
        """
        if not text:
            return text, {}

        token_map: Dict[str, str] = {}
        counter = 0

        def _replacer(match: re.Match) -> str:
            nonlocal counter
            placeholder = f"__TOKEN_{counter}__"
            token_map[placeholder] = match.group(0)
            counter += 1
            return placeholder

        protected_text = cls.COMPILED_REGEX.sub(_replacer, text)
        return protected_text, token_map

    @classmethod
    def restore(cls, translated_text: str, token_map: Dict[str, str]) -> str:
        """
        Restores preserved tokens from placeholders with robust spacing and casing tolerance.
        """
        if not translated_text or not token_map:
            return translated_text

        result = translated_text
        for placeholder, original in token_map.items():
            token_num = placeholder.split("_")[2]
            variations = [
                re.escape(placeholder),
                re.escape(placeholder.lower()),
                re.escape(placeholder.replace("_", " _ ").strip()),
                re.escape(placeholder.replace("__", "__ ")),
                re.escape(placeholder.replace("__", " __")),
                r"__\s*token\s*_\s*" + re.escape(token_num) + r"\s*__",
                r"__\s*TOKEN\s*_\s*" + re.escape(token_num) + r"\s*__",
            ]
            pattern = r"|".join(variations)
            result = re.sub(pattern, lambda _: original, result, flags=re.IGNORECASE)

        return result

    @classmethod
    def protect_batch(cls, texts: List[str]) -> Tuple[List[str], List[Dict[str, str]]]:
        """
        Protects a batch of texts in one go.
        """
        protected_list = []
        maps_list = []
        for t in texts:
            p_text, t_map = cls.protect(t)
            protected_list.append(p_text)
            maps_list.append(t_map)
        return protected_list, maps_list

    @classmethod
    def restore_batch(cls, translated_texts: List[str], token_maps: List[Dict[str, str]]) -> List[str]:
        """
        Restores a batch of translated texts using corresponding token maps.
        """
        return [
            cls.restore(trans, t_map)
            for trans, t_map in zip(translated_texts, token_maps)
        ]
