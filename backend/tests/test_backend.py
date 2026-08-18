import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.dependency_engine import DependencyEngine
from app.services.eligibility_engine import EligibilityEngine
from app.models.schemas import JourneyStepSchema, StepDependencySchema, EligibilityRuleSchema

client = TestClient(app)

from app.api.v1.router import get_current_user
from app.models.db_models import UserDB
from tests.conftest import TestingSessionLocal

_mock_user_cache = None

def get_or_create_mock_user():
    global _mock_user_cache
    if _mock_user_cache is None:
        db = TestingSessionLocal()
        user = db.query(UserDB).filter(UserDB.username == "test_backend_user").first()
        if not user:
            from app.core.security import hash_pin
            user = UserDB(
                id="test-backend-user-id",
                username="test_backend_user",
                pin_hash=hash_pin("123456"),
                full_name="Test User",
                mobile_number="+919876543210",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        db.close()
        _mock_user_cache = user
    return _mock_user_cache

def override_get_current_user():
    return get_or_create_mock_user()


@pytest.fixture(autouse=True)
def mock_auth():
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]


def test_health_and_readiness():
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] in ("healthy", "ok")

    res_ready = client.get("/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"

def test_goal_analysis_api():
    res = client.post("/api/v1/ai/goals/analyze", json={"message": "I want to start a small business in Bangalore"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["goal"] == "business"
    assert data["location_state"] == "Karnataka"
    assert len(data["context_questions"]) > 0

def test_dependency_engine_unit():
    steps = [
        JourneyStepSchema(id="1", step_key="step_1", title="S1", description="D1", state="COMPLETED"),
        JourneyStepSchema(id="2", step_key="step_2", title="S2", description="D2", state="LOCKED")
    ]
    deps = [
        StepDependencySchema(step_key="step_2", prerequisite_step_key="step_1")
    ]

    has_cycle = DependencyEngine.detect_cycles(steps, deps)
    assert has_cycle is False

    resolved = DependencyEngine.resolve_step_states(steps, deps)
    assert resolved[1].state == "AVAILABLE"

def test_eligibility_engine_unit():
    rule = EligibilityRuleSchema(field="annual_family_income", operator="<=", value=250000, explanation="Under 2.5L")
    res = EligibilityEngine.evaluate_eligibility([rule], {"annual_family_income": 200000})
    assert res.status == "VERIFIED_ELIGIBLE"

def test_journey_generation_api():
    res = client.post("/api/v1/journeys/generate", json={
        "goal_category": "business",
        "life_event": "business_formation",
        "title": "Test Business Journey",
        "context_data": {"business_structure": "Sole Proprietorship"}
    })
    assert res.status_code == 200
    journey_id = res.json()["data"]["journey_id"]
    assert journey_id is not None

    # Get journey details
    res_get = client.get(f"/api/v1/journeys/{journey_id}")
    assert res_get.status_code == 200
    jdata = res_get.json()["data"]
    assert len(jdata["steps"]) == 6
    assert jdata["next_best_action"] is not None

def test_step_completion_flow():
    # Generate journey
    res = client.post("/api/v1/journeys/generate", json={
        "goal_category": "education",
        "life_event": "higher_education_funding",
        "title": "Test Education Journey",
        "context_data": {}
    })
    journey_id = res.json()["data"]["journey_id"]

    # Complete Step 1
    res_comp = client.post(f"/api/v1/journeys/{journey_id}/steps/eligibility_check/complete")
    assert res_comp.status_code == 200

    # Verify Step 2 is unlocked
    res_get = client.get(f"/api/v1/journeys/{journey_id}")
    jdata = res_get.json()["data"]
    step_2 = next(s for s in jdata["steps"] if s["step_key"] == "document_prep")
    assert step_2["state"] in ["AVAILABLE", "IN_PROGRESS"]

def test_rag_and_sources_api():
    res_sources = client.get("/api/v1/sources")
    assert res_sources.status_code == 200
    assert len(res_sources.json()["data"]) > 0

    res_chat = client.post("/api/v1/ai/chat", json={"query": "What documents are required for GST?"})
    assert res_chat.status_code == 200
    assert len(res_chat.json()["data"]["citations"]) > 0

def test_admin_diagnostics():
    res = client.get("/api/v1/admin/diagnostics")
    assert res.status_code == 200
    assert res.json()["data"]["database"] == "connected"

if __name__ == "__main__":
    pytest.main(["-v", __file__])
