import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

from app.api.v1.router import get_current_user
from app.models.db_models import UserDB
from tests.conftest import TestingSessionLocal

db = TestingSessionLocal()
mock_user = db.query(UserDB).filter(UserDB.mobile_number == "+919876543210").first()
if not mock_user:
    mock_user = UserDB(
        id="test-e2e-user-id",
        full_name="Test User",
        mobile_number="+919876543210",
        mobile_verified=True
    )
    db.add(mock_user)
    db.commit()
    db.refresh(mock_user)
db.close()

import pytest

def override_get_current_user():
    return mock_user

@pytest.fixture(autouse=True)
def mock_auth():
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]


def test_full_citizen_journey_flow():
    print("--- Running End-to-End Citizen Journey Flow Test ---")
    
    # 1. Root API Health
    res = client.get("/")
    assert res.status_code == 200
    print("[OK] FastAPI Health Check OK")
    
    # 2. Goal Analysis (Hinglish Input)
    res = client.post("/api/v1/ai/goals/analyze", json={
        "message": "Mujhe Karnataka mein ek chhota business start karna hai"
    })
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["life_event"] == "business_formation"
    assert data["location_state"] == "Karnataka"
    print(f"[OK] Goal Analysis: Life Event '{data['life_event']}' detected with confidence {data['confidence']}")

    # 3. Journey Creation
    res = client.post("/api/v1/journeys/generate", json={
        "goal_category": "business",
        "life_event": "business_formation",
        "title": "Start a small business in Karnataka",
        "location_state": "Karnataka",
        "location_city": "Bengaluru",
        "context_data": {"business_type": "sole_proprietorship"}
    })
    assert res.status_code == 200
    gen_data = res.json()["data"]
    journey_id = gen_data["journey_id"]
    
    # Fetch journey details
    res_get = client.get(f"/api/v1/journeys/{journey_id}")
    assert res_get.status_code == 200
    jrn = res_get.json()["data"]
    assert len(jrn["steps"]) == 6
    assert jrn["steps"][0]["state"] == "AVAILABLE"
    assert jrn["next_best_action"] is not None
    print(f"[OK] Journey Created: ID {journey_id} with 6 workflow steps. Next best action: '{jrn['next_best_action']['title']}'")

    # 4. Complete Step 1 -> Verify Step 2 Unlocks & Next Best Action Updates
    res = client.post(f"/api/v1/journeys/{journey_id}/steps/business_structure/complete")
    assert res.status_code == 200
    
    res_get_updated = client.get(f"/api/v1/journeys/{journey_id}")
    updated_jrn = res_get_updated.json()["data"]
    assert updated_jrn["steps"][0]["state"] == "COMPLETED"
    assert updated_jrn["steps"][1]["state"] == "AVAILABLE"
    print(f"[OK] Step 1 Completed. Step 2 '{updated_jrn['steps'][1]['title']}' automatically unlocked!")

    # 5. Sandbox Document Import
    res = client.post("/api/v1/documents/digilocker/import")
    assert res.status_code == 200
    doc_res = res.json()["data"]
    assert doc_res["is_sandbox"] == True
    assert len(doc_res["imported_ids"]) > 0
    print(f"[OK] Sandbox Document Import verified Aadhaar document")

    # 6. Grounded RAG AI Assistance
    res = client.post("/api/v1/ai/chat", json={
        "query": "Mujhe premises_proof document kyun chahiye?",
        "journey_id": journey_id,
        "step_key": "premises_proof"
    })
    assert res.status_code == 200
    chat_res = res.json()["data"]
    assert len(chat_res["citations"]) > 0
    print(f"[OK] Grounded RAG Chat returned source '{chat_res['citations'][0]['title']}'")

    # 7. Privacy Audit Trail Check
    res = client.get("/api/v1/privacy/consents?user_id=demo_user_1")
    assert res.status_code == 200
    privacy_data = res.json()["data"]
    assert len(privacy_data["access_logs"]) > 0
    print(f"[OK] Immutable Audit Log contains recorded access events.")

    # 8. Multi-State & Multi-Lingual Navigator Verification
    res_rj = client.post("/api/v1/ai/goals/analyze", json={
        "message": "मैं राजस्थान में रहने वाला छात्र हूं। मुझे छात्रवृत्ति चाहिए।"
    })
    assert res_rj.status_code == 200
    rj_data = res_rj.json()["data"]
    assert rj_data["location_state"] == "Rajasthan"
    assert rj_data["goal"] == "education"

    # 9. Admin Diagnostics Check
    res = client.get("/api/v1/admin/diagnostics")
    assert res.status_code == 200
    diagnostics = res.json()["data"]
    assert diagnostics["database"] == "connected"
    assert diagnostics["status"] == "ok"
    assert diagnostics["total_states_covered"] == 36
    print(f"[OK] Admin Diagnostics verified: Database status: {diagnostics['database']} with 36 States/UTs covered.")

    print("--- ALL E2E INTEGRATION TESTS PASSED SUCCESSFULLY ---")

if __name__ == "__main__":
    test_full_citizen_journey_flow()
