import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.language_engine import LanguageEngine

def test_language_detection():
    # Native Scripts
    assert LanguageEngine.detect_language("मैं राजस्थान में रहता हूं") == "hi"
    assert LanguageEngine.detect_language("ಕರ್ನಾಟಕದಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಯೋಜನೆಗಳು") == "kn"
    assert LanguageEngine.detect_language("আমার স্কলারশিপ দরকার") == "bn"
    assert LanguageEngine.detect_language("எனக்கு உதவித்தொகை வேண்டும்") == "ta"

    # Romanized / Transliterated
    assert LanguageEngine.detect_language("mujhe rajasthan ki scholarship batao") == "hi"
    assert LanguageEngine.detect_language("nange karnataka dalli student scheme beku") == "kn"

def test_12_supported_languages():
    langs = LanguageEngine.get_supported_languages()
    assert len(langs) == 12
    codes = {l.code for l in langs}
    expected = {"en", "hi", "bn", "te", "mr", "ta", "gu", "ur", "kn", "ml", "or", "pa"}
    assert codes == expected

def test_government_term_preservation():
    text = "Apply for PM-KISAN and Udyam registration online"
    translated_hi = LanguageEngine.translate_response(text, "hi")
    assert "PM-KISAN" in translated_hi
    assert "Udyam" in translated_hi
