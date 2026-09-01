"""
Automated Test Suite for IndicTrans2 Integration, Token Shielding, and Translation Microservice.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.translation.token_shield import TokenShield
from app.translation.cache import translation_cache
from app.translation.service import translation_service
from app.translation.language_map import LanguageMap


client = TestClient(app)


class TestTokenShield:
    def test_placeholder_protection(self):
        text = "Hello {name}, your appointment is at {{ time }}."
        protected, token_map = TokenShield.protect(text)
        assert "__TOKEN_0__" in protected
        assert "__TOKEN_1__" in protected
        assert token_map["__TOKEN_0__"] == "{name}"
        assert token_map["__TOKEN_1__"] == "{{ time }}"

        # Simulate neural translation altering casing or spacing
        mock_translated = "नमस्ते __token_0__, आपका अपॉइंटमेंट __TOKEN_1__ पर है।"
        restored = TokenShield.restore(mock_translated, token_map)
        assert "{name}" in restored
        assert "{{ time }}" in restored

    def test_html_and_currency_protection(self):
        text = "You are eligible for a subsidy of ₹50,000 under <span class='badge'>PM-KISAN</span>. Apply at https://pmkisan.gov.in."
        protected, token_map = TokenShield.protect(text)

        assert "₹50,000" not in protected
        assert "<span class='badge'>" not in protected
        assert "https://pmkisan.gov.in" not in protected

        # Verify that restoring the protected string accurately brings back all shielded tokens
        restored = TokenShield.restore(protected, token_map)

        assert "₹50,000" in restored
        assert "<span class='badge'>" in restored
        assert "PM-KISAN" in restored
        assert "</span>" in restored
        assert "https://pmkisan.gov.in" in restored

    def test_batch_protection(self):
        texts = [
            "Welcome {user} to JanSetu.",
            "Contact support at help@jansetu.in for application #JS-998822."
        ]
        protected_list, maps_list = TokenShield.protect_batch(texts)
        assert len(protected_list) == 2
        assert len(maps_list) == 2

        restored_list = TokenShield.restore_batch(protected_list, maps_list)
        assert restored_list == texts


class TestTranslationCache:
    def test_cache_set_and_get(self):
        src, tgt, text, trans = "en", "hi", "Apply for Certificate", "प्रमाणपत्र के लिए आवेदन करें"
        translation_cache.set(src, tgt, text, trans)
        cached = translation_cache.get(src, tgt, text)
        assert cached == trans

    def test_batch_cache(self):
        items = [
            ("en", "hi", "Submit Application", "आवेदन जमा करें"),
            ("en", "hi", "Download PDF", "पीडीएफ डाउनलोड करें"),
        ]
        translation_cache.set_batch(
            [(s, t, txt, tr) for s, t, txt, tr in items]
        )

        lookups = [("en", "hi", "Submit Application"), ("en", "hi", "Download PDF"), ("en", "hi", "Uncached String")]
        batch_results = translation_cache.get_batch(lookups)

        assert 0 in batch_results
        assert batch_results[0] == "आवेदन जमा करें"
        assert 1 in batch_results
        assert batch_results[1] == "पीडीएफ डाउनलोड करें"
        assert 2 not in batch_results

    def test_cache_stats(self):
        stats = translation_cache.get_stats()
        assert "memory_entries" in stats
        assert "hits" in stats
        assert "misses" in stats


class TestTranslationEndpoints:
    def test_single_translation_endpoint(self):
        res = client.post("/api/v1/translate", json={
            "text": "Welcome to JanSetu Portal",
            "source_language": "en",
            "target_language": "hi",
            "preserve_tokens": True,
        })
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert "translated_text" in data["data"]
        assert data["data"]["target_language"] == "hi"

    def test_batch_translation_strings_endpoint(self):
        res = client.post("/api/v1/translate-batch", json={
            "texts": [
                "Scheme Application",
                "Subsidy amount ₹25,000",
                "Your ID is {id}"
            ],
            "source_language": "en",
            "target_language": "hi",
            "preserve_tokens": True,
        })
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert "translations" in data["data"]
        assert len(data["data"]["translations"]) == 3
        # Check token preservation
        assert "₹25,000" in data["data"]["translations"][1]
        assert "{id}" in data["data"]["translations"][2]

    def test_health_endpoint(self):
        res = client.get("/api/v1/translation/health")
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert "engine_status" in data["data"]
        assert "supported_languages" in data["data"]
        assert data["data"]["supported_languages"] >= 22

    def test_structured_translation(self):
        res = client.post("/api/v1/translate/structured", json={
            "data": {
                "id": "SCH-1234",
                "title": "Solar Rooftop Subsidy",
                "amount": 50000,
                "url": "https://gov.in/solar",
                "details": {
                    "description": "Financial assistance for domestic solar power installations."
                }
            },
            "target_language": "hi",
            "source_language": "en"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        # Structural keys must remain intact
        assert data["data"]["id"] == "SCH-1234"
        assert data["data"]["amount"] == 50000
        assert data["data"]["url"] == "https://gov.in/solar"
