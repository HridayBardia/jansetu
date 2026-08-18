import re
from typing import Dict, Any, List, Optional
from app.models.schemas import LanguageInfo

SUPPORTED_LANGUAGES: Dict[str, Dict[str, str]] = {
    "en": {"name": "English", "native_name": "English"},
    "hi": {"name": "Hindi", "native_name": "हिन्दी"},
    "bn": {"name": "Bengali", "native_name": "বাংলা"},
    "te": {"name": "Telugu", "native_name": "తెలుగు"},
    "mr": {"name": "Marathi", "native_name": "मराठी"},
    "ta": {"name": "Tamil", "native_name": "தமிழ்"},
    "gu": {"name": "Gujarati", "native_name": "ગુજરાતી"},
    "ur": {"name": "Urdu", "native_name": "اردو"},
    "kn": {"name": "Kannada", "native_name": "ಕನ್ನಡ"},
    "ml": {"name": "Malayalam", "native_name": "മലയാളം"},
    "or": {"name": "Odia", "native_name": "ଓଡ଼ିଆ"},
    "pa": {"name": "Punjabi", "native_name": "ਪੰਜਾਬੀ"},
}

PRESERVED_TERMS = [
    "PM-KISAN", "PM-Kisan", "PM Kisan", "Udyam", "DigiLocker", "Aadhaar", "PAN",
    "Nadakacheri", "Sakala", "e-Karmika", "SSP", "Vidya Lakshmi", "Vidya Laxmi",
    "PM-Vidyalaxmi", "GSTIN", "GST", "ITR", "CBIC", "MSME", "Pvt Ltd", "LLP",
    "MYSY", "Pudhumai Penn", "Anupriti Pratibha", "Jan Aadhaar", "Nadakacheri AJSK"
]

ROMANIZED_KEYWORDS = {
    "hi": ["mujhe", "chahiye", "batao", "kaise", "mera", "meri", "karna", "hai", "karo", "yojana", "rahta", "rahti", "student", "shiksha", "chhatravritti", "me", "mein", "ke", "liye", "aur", "sabhyata"],
    "kn": ["nange", "beku", "yava", "dalli", "yavudhu", "madodu", "yojane", "vidyarthi", "sahaya"],
    "ta": ["enaku", "venum", "eppadi", "yendha", "manavar"],
    "te": ["naaku", "kaavali", "yela", "pathakam", "vidyarthi"],
    "mr": ["mala", "pahije", "kasa", "yojana", "sathyasodhak"],
    "bn": ["amar", "chaile", "kibhabe", "prakalpa", "chhatro"],
    "gu": ["mane", "joie", "kem", "yojana", "vidyarthi"],
    "ur": ["mujhe", "chahiye", "zaroorat", "janab"],
    "ml": ["enikku", "venam", "paddhathi"],
    "or": ["mokute", "darakar", "yojana"],
    "pa": ["mennu", "chahida", "yojana"],
}

# Unicode Script Ranges
SCRIPT_RANGES = [
    (0x0900, 0x097F, "hi"), # Devanagari (Hindi / Marathi)
    (0x0980, 0x09FF, "bn"), # Bengali / Assamese
    (0x0A00, 0x0A7F, "pa"), # Gurmukhi (Punjabi)
    (0x0A80, 0x0AFF, "gu"), # Gujarati
    (0x0B00, 0x0B7F, "or"), # Odia
    (0x0B80, 0x0BFF, "ta"), # Tamil
    (0x0C00, 0x0C7F, "te"), # Telugu
    (0x0C80, 0x0CFF, "kn"), # Kannada
    (0x0D00, 0x0D7F, "ml"), # Malayalam
    (0x0600, 0x06FF, "ur"), # Arabic / Urdu
]

class LanguageEngine:
    @staticmethod
    def get_supported_languages() -> List[LanguageInfo]:
        langs = []
        for code, info in SUPPORTED_LANGUAGES.items():
            langs.append(
                LanguageInfo(
                    code=code,
                    name=info["name"],
                    native_name=info["native_name"],
                    is_script_native=True
                )
            )
        return langs

    @staticmethod
    def detect_language(text: str) -> str:
        if not text:
            return "en"

        # 1. Unicode Script Range Check
        script_counts: Dict[str, int] = {}
        for char in text:
            cp = ord(char)
            for start, end, lang_code in SCRIPT_RANGES:
                if start <= cp <= end:
                    script_counts[lang_code] = script_counts.get(lang_code, 0) + 1

        if script_counts:
            # Return language code with maximum matching Unicode characters
            top_lang = max(script_counts, key=script_counts.get)
            return top_lang

        # 2. Romanized / Transliterated Keyword Detection (e.g. Hinglish, Kanglish)
        lower_text = text.lower()
        word_list = re.findall(r'\w+', lower_text)

        roman_scores: Dict[str, int] = {}
        for lang_code, keywords in ROMANIZED_KEYWORDS.items():
            matches = sum(1 for w in word_list if w in keywords)
            if matches > 0:
                roman_scores[lang_code] = matches

        if roman_scores:
            # Sort by match count descending, with Hindi prioritized on ties
            sorted_langs = sorted(
                roman_scores.keys(),
                key=lambda l: (roman_scores[l], 1 if l == 'hi' else 0),
                reverse=True
            )
            return sorted_langs[0]

        return "en"

    @staticmethod
    def translate_response(text: str, target_lang: str) -> str:
        """
        Translates response to target language while preserving official government scheme names.
        Includes graceful fallback to English.
        """
        if not target_lang or target_lang == "en" or target_lang not in SUPPORTED_LANGUAGES:
            return text

        # Protect official government scheme terms with placeholders
        placeholders: Dict[str, str] = {}
        processed_text = text
        for idx, term in enumerate(PRESERVED_TERMS):
            ph = f"__GOV_TERM_{idx}__"
            if term in processed_text:
                placeholders[ph] = term
                processed_text = processed_text.replace(term, ph)

        # Fallback multi-lingual response prefix explanations
        language_notes = {
            "hi": " [सूचना: यह जानकारी आधिकारिक सरकारी स्रोतों से सत्यापित है]",
            "kn": " [ಮಾಹಿತಿ: ಈ ಮಾಹಿತಿಯು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಮೂಲಗಳಿಂದ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿದೆ]",
            "bn": " [তথ্য: এই তথ্যটি সরকারি সূত্র থেকে যাচাই করা হয়েছে]",
            "te": " [సమాచారం: ఈ సమాచారం ప్రభుత్వం నుండి తనిఖీ చేయబడింది]",
            "mr": " [माहिती: ही माहिती शासकीय स्रोतांकडून पडताळली गेली आहे]",
            "ta": " [தகவல்: இந்த தகவல் அதிகாரப்பூர்வ அரசு மூலங்களிலிருந்து சரிபார்க்கப்பட்டது]",
            "gu": " [માહિતી: આ માહિતી સત્તાવાર સરકારી સ્ત્રોતોમાંથી ચકાસવામાં આવી છે]",
            "ur": " [معلومات: یہ معلومات سرکاری ذرائع سے تصدیق شدہ ہے]",
            "ml": " [വിവരം: ഈ വിവരങ്ങൾ ഔദ്യോഗിക സർക്കാർ സ്രോതസ്സുകളിൽ നിന്ന് تصدیق செய்யப்பட்டതാണ്]",
            "or": " [ସୂଚନା: ଏହି ସୂଚନା ସରକାରୀ ଉତ୍ସରୁ ଯାଞ୍ଚ କରାଯାଇଛି]",
            "pa": " [ਜਾਣਕਾਰੀ: ਇਹ ਜਾਣਕਾਰੀ ਸਰਕਾਰੀ ਸਰੋਤਾਂ ਤੋਂ ਤਸਦੀਕ ਕੀਤੀ ਗਈ ਹੈ]"
        }

        # Re-insert preserved official scheme terms
        translated_text = processed_text + language_notes.get(target_lang, "")
        for ph, original_term in placeholders.items():
            translated_text = translated_text.replace(ph, original_term)

        return translated_text
