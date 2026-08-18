import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.location_engine import LocationEngine, STATES_AND_UTS

client = TestClient(app)

def test_states_endpoint():
    res = client.get("/api/v1/states")
    assert res.status_code == 200
    states_list = res.json()["data"]
    assert len(states_list) == 36

def test_scheme_coverage_for_all_regions():
    for code, info in STATES_AND_UTS.items():
        res = client.get(f"/api/v1/schemes?state_name={info['name']}")
        assert res.status_code == 200
        data = res.json()["data"]
        # Must return active schemes applicable to this state (state or central)
        assert data["total"] > 0
