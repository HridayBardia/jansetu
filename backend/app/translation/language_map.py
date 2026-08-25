"""
Single source of truth for all supported languages and their IndicTrans2 codes.

Uses the official AI4Bharat IndicTrans2 language codes.
Reference: https://github.com/AI4Bharat/IndicTrans2
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class LanguageDef:
    """Definition of a supported language."""
    code: str               # Short code used by frontend (e.g., "hi")
    indictrans_code: str    # IndicTrans2 BCP-47 tag (e.g., "hin_Deva")
    name: str               # English name
    native_name: str        # Native script name
    script: str             # Unicode script name
    is_rtl: bool = False    # Right-to-left script
    has_devanagari_variant: bool = False  # For languages with Devanagari alternative
    has_bengali_variant: bool = False     # For languages with Bengali alternative
    locale_file: str = ""   # Frontend locale JSON filename (without .json)

    def __post_init__(self):
        if not self.locale_file:
            self.locale_file = self.code


# ─── Language Registry ───────────────────────────────────────────────
# All 22 scheduled Indian languages + English

LANGUAGES: Dict[str, LanguageDef] = {
    "en": LanguageDef(
        code="en",
        indictrans_code="eng_Latn",
        name="English",
        native_name="English",
        script="Latin",
        locale_file="en",
    ),
    "hi": LanguageDef(
        code="hi",
        indictrans_code="hin_Deva",
        name="Hindi",
        native_name="हिन्दी",
        script="Devanagari",
        locale_file="hi",
    ),
    "bn": LanguageDef(
        code="bn",
        indictrans_code="ben_Beng",
        name="Bengali",
        native_name="বাংলা",
        script="Bengali",
        locale_file="bn",
    ),
    "te": LanguageDef(
        code="te",
        indictrans_code="tel_Telu",
        name="Telugu",
        native_name="తెలుగు",
        script="Telugu",
        locale_file="te",
    ),
    "mr": LanguageDef(
        code="mr",
        indictrans_code="mar_Deva",
        name="Marathi",
        native_name="मराठी",
        script="Devanagari",
        locale_file="mr",
    ),
    "ta": LanguageDef(
        code="ta",
        indictrans_code="tam_Taml",
        name="Tamil",
        native_name="தமிழ்",
        script="Tamil",
        locale_file="ta",
    ),
    "gu": LanguageDef(
        code="gu",
        indictrans_code="guj_Gujr",
        name="Gujarati",
        native_name="ગુજરાતી",
        script="Gujarati",
        locale_file="gu",
    ),
    "ur": LanguageDef(
        code="ur",
        indictrans_code="urd_Arab",
        name="Urdu",
        native_name="اردو",
        script="Arabic",
        is_rtl=True,
        locale_file="ur",
    ),
    "kn": LanguageDef(
        code="kn",
        indictrans_code="kan_Knda",
        name="Kannada",
        native_name="ಕನ್ನಡ",
        script="Kannada",
        locale_file="kn",
    ),
    "ml": LanguageDef(
        code="ml",
        indictrans_code="mal_Mlym",
        name="Malayalam",
        native_name="മലയാളം",
        script="Malayalam",
        locale_file="ml",
    ),
    "or": LanguageDef(
        code="or",
        indictrans_code="ory_Orya",
        name="Odia",
        native_name="ଓଡ଼ିଆ",
        script="Odia",
        locale_file="or",
    ),
    "pa": LanguageDef(
        code="pa",
        indictrans_code="pan_Guru",
        name="Punjabi",
        native_name="ਪੰਜਾਬੀ",
        script="Gurmukhi",
        locale_file="pa",
    ),
    "as": LanguageDef(
        code="as",
        indictrans_code="asm_Beng",
        name="Assamese",
        native_name="অসমীয়া",
        script="Bengali",
        locale_file="as",
    ),
    "mai": LanguageDef(
        code="mai",
        indictrans_code="mai_Deva",
        name="Maithili",
        native_name="मैथिली",
        script="Devanagari",
        locale_file="mai",
    ),
    "sat": LanguageDef(
        code="sat",
        indictrans_code="sat_Olck",
        name="Santali",
        native_name="ᱥᱟᱱᱛᱟᱲᱤ",
        script="OlChiki",
        locale_file="sat",
    ),
    "ks": LanguageDef(
        code="ks",
        indictrans_code="kas_Arab",
        name="Kashmiri",
        native_name="कॉशुर",
        script="Arabic",
        is_rtl=True,
        has_devanagari_variant=True,
        locale_file="ks",
    ),
    "sd": LanguageDef(
        code="sd",
        indictrans_code="snd_Arab",
        name="Sindhi",
        native_name="سنڌي",
        script="Arabic",
        is_rtl=True,
        has_devanagari_variant=True,
        locale_file="sd",
    ),
    "ne": LanguageDef(
        code="ne",
        indictrans_code="npi_Deva",
        name="Nepali",
        native_name="नेपाली",
        script="Devanagari",
        locale_file="ne",
    ),
    "sa": LanguageDef(
        code="sa",
        indictrans_code="san_Deva",
        name="Sanskrit",
        native_name="संस्कृतम्",
        script="Devanagari",
        locale_file="sa",
    ),
    "gom": LanguageDef(
        code="gom",
        indictrans_code="gom_Deva",
        name="Konkani",
        native_name="कोंकणी",
        script="Devanagari",
        locale_file="gom",
    ),
    "brx": LanguageDef(
        code="brx",
        indictrans_code="brx_Deva",
        name="Bodo",
        native_name="बड़ो",
        script="Devanagari",
        locale_file="brx",
    ),
    "doi": LanguageDef(
        code="doi",
        indictrans_code="doi_Deva",
        name="Dogri",
        native_name="डोगरी",
        script="Devanagari",
        locale_file="doi",
    ),
    "mni": LanguageDef(
        code="mni",
        indictrans_code="mni_Beng",
        name="Manipuri",
        native_name="মৈতৈলোন্",
        script="Bengali",
        has_bengali_variant=True,
        locale_file="mni",
    ),
}

# Short code → IndicTrans2 code mapping
CODE_TO_INDICTRANS: Dict[str, str] = {k: v.indictrans_code for k, v in LANGUAGES.items()}

# IndicTrans2 code → short code mapping (reverse)
INDICTRANS_TO_CODE: Dict[str, str] = {v.indictrans_code: k for k, v in LANGUAGES.items()}

# RTL language codes
RTL_CODES = {k for k, v in LANGUAGES.items() if v.is_rtl}

# Language pairs that IndicTrans2 supports natively
SUPPORTED_PAIRS: List[Tuple[str, str]] = [
    (src, tgt)
    for src in LANGUAGES
    for tgt in LANGUAGES
    if src != tgt
]

# Preserved terms that should NOT be translated
PRESERVED_TERMS = [
    # Government IDs & Programs
    "Aadhaar", "PAN", "PAN Card", "GST", "GSTIN", "ITR", "CBIC",
    "DigiLocker", "UMANG", "MyGov", "NAD",
    # PM Schemes
    "PM-KISAN", "PM-Kisan", "PM Kisan", "Pradhan Mantri Kisan Samman Nidhi",
    "PM MUDRA", "Pradhan Mantri Mudra Yojana",
    "PM-Vidyalaxmi", "Pradhan Mantri Vidyalakshmi Yojana",
    "PM Awas Yojana", "Pradhan Mantri Awas Yojana",
    "PM Jan Dhan Yojana", "Pradhan Mantri Jan Dhan Yojana",
    "PM Ujjwala Yojana",
    "PM Ayushman Bharat", "Ayushman Bharat",
    "PM Garib Kalyan Yojana",
    # State-specific
    "Nadakacheri", "Sakala", "e-Karmika", "SSP",
    "Jan Aadhaar", "Nadakacheri AJSK",
    "MYSY", "Mukhyamantri Yuva Swavalamban Yojana",
    "Pudhumai Penn", "Anupriti Pratibha",
    "Vidya Lakshmi", "Vidya Laxmi",
    # Document types
    "Aadhaar Card", "PAN Card", "Ration Card", "Voter ID",
    "Driving License", "Passport",
    # Legal/Business
    "LLP", "Pvt Ltd", "Private Limited",
    "MSME", "Udyam", "Udyog Aadhaar",
    "FSSAI", "Shops and Establishment",
    # Digital
    "e-KYC", "e-Sign", "e-Stamp",
    "GeM", "Government e-Marketplace",
    "e-Way Bill",
]

# Script range mapping for language detection
SCRIPT_RANGES = [
    (0x0900, 0x097F, ["hi", "mr", "mai", "gom", "brx", "doi", "ne", "sa", "ks"]),
    (0x0980, 0x09FF, ["bn", "as", "mni"]),
    (0x0A00, 0x0A7F, ["pa"]),
    (0x0A80, 0x0AFF, ["gu"]),
    (0x0B00, 0x0B7F, ["or"]),
    (0x0B80, 0x0BFF, ["ta"]),
    (0x0C00, 0x0C7F, ["te"]),
    (0x0C80, 0x0CFF, ["kn"]),
    (0x0D00, 0x0D7F, ["ml"]),
    (0x0600, 0x06FF, ["ur", "ks", "sd"]),
    (0xA800, 0xA82F, ["sat"]),  # Ol Chiki
]

# Romanized keyword detection for transliterated input
ROMANIZED_KEYWORDS: Dict[str, List[str]] = {
    "hi": ["mujhe", "chahiye", "batao", "kaise", "mera", "meri", "karna", "hai", "karo",
           "yojana", "rahta", "rahti", "student", "shiksha", "chhatravritti", "me", "mein",
           "ke", "liye", "aur", "sabhyata", "banana", "start", "kharidna", "dena", "karna",
           "hospital", "school", "college", "jagah", "jameen", "zameen", "ghar", "dukan"],
    "kn": ["nange", "beku", "yava", "dalli", "yavudhu", "madodu", "yojane", "vidyarthi",
           "sahaya", "bekagide", "madi", "maadu", "naanu", "naaku", "idhe"],
    "ta": ["enaku", "venum", "eppadi", "yendha", "manavar", "seiya", "poganum"],
    "te": ["naaku", "kaavali", "yela", "pathakam", "vidyarthi", "cheddam", "ali"],
    "mr": ["mala", "pahije", "kasa", "yojana", "sathyasodhak", "karaycha", "pahijet"],
    "bn": ["amar", "chaile", "kibhabe", "prakalpa", "chhatro", "korte", "chi"],
    "gu": ["mane", "joie", "kem", "yojana", "vidyarthi", "karvu", "che", "hatu",
           "banavo", "start", "karo", "su", "tem", "apde"],
    "ur": ["mujhe", "chahiye", "zaroorat", "janab", "hai", "karna", "banana"],
    "ml": ["enikku", "venam", "paddhathi", "njan", "cheyyan"],
    "or": ["mokute", "darakar", "yojana", "mu", "karibi"],
    "pa": ["mennu", "chahida", "yojana", "mainu", "banana"],
    "as": ["mok", "lagibo", "yojana", "moe", "banabo"],
}


class LanguageMap:
    """Utility class for language code translation and lookup."""

    @staticmethod
    def get_all() -> Dict[str, LanguageDef]:
        """Return all language definitions."""
        return LANGUAGES

    @staticmethod
    def get(code: str) -> Optional[LanguageDef]:
        """Get language definition by short code."""
        return LANGUAGES.get(code)

    @staticmethod
    def get_indictrans_code(code: str) -> str:
        """Convert short code to IndicTrans2 BCP-47 tag."""
        lang = LANGUAGES.get(code)
        if lang:
            return lang.indictrans_code
        return "eng_Latn"  # Default to English

    @staticmethod
    def from_indictrans_code(it_code: str) -> str:
        """Convert IndicTrans2 BCP-47 tag to short code."""
        return INDICTRANS_TO_CODE.get(it_code, "en")

    @staticmethod
    def is_rtl(code: str) -> bool:
        """Check if a language uses RTL script."""
        return code in RTL_CODES

    @staticmethod
    def get_supported_codes() -> List[str]:
        """Return all supported language short codes."""
        return list(LANGUAGES.keys())

    @staticmethod
    def get_display_list() -> List[Dict[str, str]]:
        """Return language list formatted for frontend display."""
        return [
            {
                "code": lang.code,
                "name": lang.name,
                "native_name": lang.native_name,
                "is_rtl": lang.is_rtl,
            }
            for lang in LANGUAGES.values()
        ]


# Module-level alias
LANGUAGE_MAP = LanguageMap
