import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.api.v1.router import get_current_user
from app.models.db_models import UserDB
from tests.conftest import TestingSessionLocal

client = TestClient(app)
_mock_user_cache = None

def get_or_create_mock_user():
    global _mock_user_cache
    if _mock_user_cache is None:
        db = TestingSessionLocal()
        user = db.query(UserDB).filter(UserDB.username == "test_e2e_user").first()
        if not user:
            from app.core.security import hash_pin
            user = UserDB(
                id="test-e2e-user-id",
                username="test_e2e_user",
                pin_hash=hash_pin("123456"),
                full_name="Test User",
                mobile_number="+919876543210",
                role="SYSTEM_ADMIN"
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

def test_workflow_crud():
    # 1. List workflows
    response = client.get("/api/v1/workflows")
    assert response.status_code == 200
    workflows = response.json()["data"]
    assert isinstance(workflows, list)
    
    initial_count = len(workflows)
    
    # 2. Create a new workflow
    new_workflow_payload = {
        "name": "Test Workflow",
        "category": "test_cat",
        "department": "Test Dept",
        "steps": [
            {
                "step_key": "step_1",
                "name": "Test Step 1",
                "step_type": "Action",
                "target": "Test Target 1",
                "order_index": 1
            }
        ]
    }
    
    response = client.post("/api/v1/workflows", json=new_workflow_payload)
    assert response.status_code == 200
    created_workflow = response.json()["data"]
    assert created_workflow["id"] is not None
    workflow_id = created_workflow["id"]
    
    # 3. List again
    response = client.get("/api/v1/workflows")
    assert len(response.json()["data"]) == initial_count + 1
    
    # 4. Delete
    response = client.delete(f"/api/v1/workflows/{workflow_id}")
    assert response.status_code == 200
    
    # 5. List again
    response = client.get("/api/v1/workflows")
    assert len(response.json()["data"]) == initial_count

def test_journey_generation_with_custom_workflow():
    new_workflow_payload = {
        "name": "Generation Workflow",
        "category": "test_generation",
        "department": "Test Dept",
        "steps": [
            {
                "step_key": "gen_step_1",
                "name": "Gen Step 1",
                "step_type": "Action",
                "target": "Target",
                "order_index": 1
            }
        ]
    }
    
    response = client.post("/api/v1/workflows", json=new_workflow_payload)
    assert response.status_code == 200
    workflow_id = response.json()["data"]["id"]
    
    journey_payload = {
        "goal_category": "test_generation",
        "life_event": "test_event",
        "title": "Test Journey",
        "context_data": {}
    }
    
    response = client.post("/api/v1/journeys/generate", json=journey_payload)
    assert response.status_code == 200
    journey_id = response.json()["data"]["journey_id"]
    
    response = client.get(f"/api/v1/journeys/{journey_id}")
    assert response.status_code == 200
    journey_data = response.json()["data"]
    
    assert len(journey_data["steps"]) == 1
    assert journey_data["steps"][0]["step_key"] == "gen_step_1"
    
    client.delete(f"/api/v1/workflows/{workflow_id}")
