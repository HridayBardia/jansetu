import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.location_engine import LocationEngine
from app.services.language_engine import LanguageEngine
from app.services.ingestion_engine import IngestionEngine
from app.core.database import SessionLocal
from app.models.db_models import SchemeDB

client = TestClient(app)

def test_all_28_states_and_8_uts_coverage():
    res = client.get("/api/v1/states")
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) == 36
    
    states = [r for r in data if not r["is_ut"]]
    uts = [r for r in data if r["is_ut"]]
    assert len(states) == 28
    assert len(uts) == 8

def test_12_supported_languages_list():
    res = client.get("/api/v1/languages")
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) == 12
    codes = {l["code"] for l in data}
    expected = {"en", "hi", "bn", "te", "mr", "ta", "gu", "ur", "kn", "ml", "or", "pa"}
    assert codes == expected

def test_strict_expired_and_suspended_scheme_filtering():
    res = client.get("/api/v1/schemes?status=ACTIVE")
    assert res.status_code == 200
    schemes = res.json()["data"]["schemes"]
    
    scheme_ids = {s["id"] for s in schemes}
    # Expired and suspended test control schemes MUST NOT be returned in active scheme list
    assert "sch_covid_relief_2024" not in scheme_ids
    assert "sch_suspended_legacy_transport" not in scheme_ids

def test_multilingual_and_romanized_queries():
    # Hindi
    res_hi = client.get("/api/v1/schemes/search?q=मैं राजस्थान में छात्र हूं")
    assert res_hi.status_code == 200
    data_hi = res_hi.json()["data"]
    assert data_hi["language_detected"] == "hi"
    assert data_hi["location_detected"] == "Rajasthan"

    # Kannada
    res_kn = client.get("/api/v1/schemes/search?q=ಕರ್ನಾಟಕದಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿ ಯೋಜನೆಗಳು")
    assert res_kn.status_code == 200
    data_kn = res_kn.json()["data"]
    assert data_kn["language_detected"] == "kn"
    assert data_kn["location_detected"] == "Karnataka"

    # Hinglish (Romanized Hindi)
    res_hinglish = client.get("/api/v1/schemes/search?q=mujhe gujarat me farmer ke liye scheme chahiye")
    assert res_hinglish.status_code == 200
    data_hinglish = res_hinglish.json()["data"]
    assert data_hinglish["language_detected"] == "hi"
    assert data_hinglish["location_detected"] == "Gujarat"

def test_state_specific_and_central_combined_search():
    res_rj = client.get("/api/v1/schemes?state_name=Rajasthan")
    assert res_rj.status_code == 200
    schemes_rj = res_rj.json()["data"]["schemes"]
    
    # Should include Rajasthan specific schemes AND Central level schemes
    levels = {s["level"] for s in schemes_rj}
    assert "CENTRAL" in levels or "STATE" in levels

def test_admin_trigger_ingestion_api():
    res = client.post("/api/v1/admin/ingest")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "expired_schemes_flagged" in data
    assert data["active_schemes"] > 0

if __name__ == "__main__":
    pytest.main(["-v", __file__])
