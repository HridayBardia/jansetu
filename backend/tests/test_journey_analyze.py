import sys
import os
import time
import pytest
from fastapi import Depends
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.api.v1.router import get_current_user, get_db
from app.models.db_models import UserDB
from app.services.demo_vault_service import DemoVaultService

client = TestClient(app)

# Active user target for mock auth override
active_mock_username = "hriday"

def override_get_current_user(db: Session = Depends(get_db)):
    from app.services.ingestion_engine import IngestionEngine
    from app.models.db_models import SchemeDB
    if db.query(SchemeDB).count() == 0:
        IngestionEngine.seed_database(db)
        
    user = db.query(UserDB).filter(UserDB.username == active_mock_username).first()
    if not user:
        from app.core.security import hash_pin
        full_names = {"hriday": "Hriday Bardia", "ayush": "Ayush Chauhan", "varad": "Varad Kanade"}
        user = UserDB(
            id=f"demo_citizen_{active_mock_username}",
            username=active_mock_username,
            pin_hash=hash_pin("123456"),
            full_name=full_names.get(active_mock_username, active_mock_username.title()),
            mobile_number="+919876543210" if active_mock_username == "hriday" else "+918830482422"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        # Seed vault
        DemoVaultService.seed_user_vault(db, user)
    return user

@pytest.fixture(autouse=True)
def mock_auth():
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]

def test_1_australia_study_query():
    global active_mock_username
    active_mock_username = "hriday"
    
    payload = {
        "query": "I am living in Udaipur and I wanna go to Australia for masters",
        "domicile_state": "Rajasthan"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    
    assert data["intent"]["primary"] == "STUDY_ABROAD"
    assert data["location"]["destination"] == "Australia"
    assert data["location"]["current_location"] == "Udaipur"
    assert data["location"]["domicile_state"] == "Rajasthan"
    
    # Check schemes loaded (Rajiv Gandhi Scholarship should match Rajasthan domicile)
    schemes = data["schemes"]
    assert any(s["id"] == "sch_rj_rgs" for s in schemes)

def test_2_canada_study_query():
    global active_mock_username
    active_mock_username = "hriday"
    
    payload = {
        "query": "I want to study in Canada for graduation",
        "domicile_state": "Rajasthan"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    
    assert data["intent"]["primary"] == "STUDY_ABROAD"
    assert data["location"]["destination"] == "Canada"

def test_3_rajasthan_scholarship():
    payload = {
        "query": "I want a scholarship",
        "domicile_state": "Rajasthan"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    data = res.json()["data"]
    
    assert any(s["id"] == "sch_rj_anupriti" for s in data["schemes"])

def test_4_karnataka_scholarship():
    payload = {
        "query": "I need a scholarship",
        "domicile_state": "Karnataka"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    data = res.json()["data"]
    
    # SSP Karnataka is for Karnataka domicile
    assert any(s["id"] == "sch_ka_ssp" for s in data["schemes"])

def test_5_driving_licence():
    payload = {
        "query": "I want to renew my driving licence",
        "domicile_state": "Rajasthan"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    data = res.json()["data"]
    
    assert data["intent"]["primary"] == "DRIVING_LICENCE"
    assert any("Passport" not in d["name"] for d in data["documents"]["needed"])

def test_6_business_registration():
    payload = {
        "query": "I want to start a shop company",
        "domicile_state": "Gujarat"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    data = res.json()["data"]
    
    assert data["intent"]["primary"] == "BUSINESS_REGISTRATION"
    assert any(d["type"] == "RENT_AGREEMENT" for d in data["documents"]["needed"])

def test_7_farmer_schemes():
    payload = {
        "query": "I am a farmer and I want government help",
        "domicile_state": "Rajasthan"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    data = res.json()["data"]
    
    assert data["intent"]["primary"] == "FARMER_BENEFITS"

def test_8_missing_documents():
    # Hriday does not have a Passport in vault
    global active_mock_username
    active_mock_username = "hriday"
    
    payload = {
        "query": "I want to go to Australia for masters",
        "domicile_state": "Rajasthan"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    data = res.json()["data"]
    
    needed = [d["type"] for d in data["documents"]["needed"]]
    assert "PASSPORT" in needed

def test_9_existing_documents():
    global active_mock_username
    active_mock_username = "hriday"
    
    payload = {
        "query": "I want to go to Australia for masters",
        "domicile_state": "Rajasthan"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    data = res.json()["data"]
    
    available = [d["type"] for d in data["documents"]["available"]]
    assert "AADHAAR" in available
    assert "PAN" in available

def test_10_expired_documents():
    payload = {
        "query": "I want to renew driving licence",
        "domicile_state": "Rajasthan"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    data = res.json()["data"]
    assert "documents" in data

def test_11_conditional_documents():
    payload = {
        "query": "I want to go to Australia for masters",
        "domicile_state": "Rajasthan"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    data = res.json()["data"]
    
    needed = data["documents"]["needed"]
    english_doc = next(d for d in needed if d["type"] == "ENGLISH_TEST")
    assert english_doc["status"] == "Conditional"

def test_12_domicile_filtering():
    # Domicile state: Karnataka -> Should NOT get Rajasthan Rajiv Gandhi Scholarship
    payload = {
        "query": "I want to study abroad in Canada",
        "domicile_state": "Karnataka"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    data = res.json()["data"]
    
    assert not any(s["id"] == "sch_rj_rgs" for s in data["schemes"])

def test_13_central_schemes():
    for state in ["Rajasthan", "Karnataka", "Gujarat"]:
        payload = {
            "query": "I want to study abroad",
            "domicile_state": state
        }
        res = client.post("/api/v1/journey/analyze", json=payload)
        data = res.json()["data"]
        assert any(s["level"] == "CENTRAL" for s in data["schemes"])

def test_14_state_schemes():
    payload = {
        "query": "I want to study in university",
        "domicile_state": "Gujarat"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    data = res.json()["data"]
    assert any(s["id"] == "sch_gj_mysy" for s in data["schemes"])

def test_15_no_matching_scheme():
    payload = {
        "query": "I want to buy a spaceship",
        "domicile_state": "Rajasthan"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    data = res.json()["data"]
    assert len(data["schemes"]) == 0 or all(s["category"] != "spaceship" for s in data["schemes"])

def test_16_ambiguous_query():
    payload = {
        "query": "help me with documents",
        "domicile_state": "Rajasthan"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    assert res.status_code == 200

def test_17_multiple_intents():
    payload = {
        "query": "I want a scholarship and renew my driving licence",
        "domicile_state": "Rajasthan"
    }
    res = client.post("/api/v1/journey/analyze", json=payload)
    assert res.status_code == 200

def test_18_different_users():
    global active_mock_username
    
    # Hriday
    active_mock_username = "hriday"
    payload = {"query": "I want to study abroad", "domicile_state": "Rajasthan"}
    res1 = client.post("/api/v1/journey/analyze", json=payload)
    needed1 = [d["type"] for d in res1.json()["data"]["documents"]["needed"]]
    assert "PASSPORT" in needed1
    
    # Ayush
    active_mock_username = "ayush"
    res2 = client.post("/api/v1/journey/analyze", json=payload)
    available2 = [d["type"] for d in res2.json()["data"]["documents"]["available"]]
    assert "PASSPORT" in available2

def test_19_document_authorization():
    payload = {"query": "I want to study abroad", "domicile_state": "Rajasthan"}
    res = client.post("/api/v1/journey/analyze", json=payload)
    assert res.status_code == 200

def test_20_fast_response():
    payload = {
        "query": "I am living in Udaipur and I wanna go to Australia for masters",
        "domicile_state": "Rajasthan"
    }
    start = time.time()
    res = client.post("/api/v1/journey/analyze", json=payload)
    duration = time.time() - start
    assert res.status_code == 200
    # Response must be fast (under 1 second)
    assert duration < 1.0
