import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from fastapi import Depends

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.api.v1.router import get_current_user, get_db
from app.models.db_models import UserDB, ServiceRegistryDB, ApplicationDB, ConsentRecordDB, DataConflictDB
from app.services.interoperability_gateway import ServiceRegistry

client = TestClient(app)
active_mock_username = "hriday"

def override_get_current_user(db: Session = Depends(get_db)):
    ServiceRegistry.seed_services(db)
    user = db.query(UserDB).filter(UserDB.username == active_mock_username).first()
    if not user:
        from app.core.security import hash_pin
        user = UserDB(
            id=f"demo_citizen_{active_mock_username}",
            username=active_mock_username,
            pin_hash=hash_pin("123456"),
            full_name=active_mock_username.title(),
            mobile_number="+919876543210"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@pytest.fixture(autouse=True)
def mock_auth():
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]

def test_gateway_service_registry():
    res = client.get("/api/v1/services")
    assert res.status_code == 200
    services = res.json()["data"]
    assert len(services) > 0
    assert any(s["service_id"] == "srv_identity" for s in services)
    assert any(s["service_id"] == "srv_income" for s in services)

def test_modern_rest_connector_execution():
    payload = {
        "operation": "verify_demographics",
        "params": {"aadhaar_number": "123456789012", "name": "Hriday Bardia"}
    }
    res = client.post("/api/v1/services/srv_identity/call", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["verified"] is True
    assert data["_interop_protocol"] == "OAuth2 Bearer JSON API REST"

def test_legacy_soap_connector_execution():
    # SOAP services require consent, so we seed consent first
    client.post("/api/v1/consents", json={
        "department_id": "income",
        "department_name": "Department of Revenue",
        "requested_fields": ["certificate_number"],
        "purpose": "Call service GetAnnualIncomeByCertificateNumber",
        "access_type": "ALWAYS"
    })
    
    payload = {
        "operation": "GetAnnualIncomeByCertificateNumber",
        "params": {"certificate_number": "INC-2026-8877"}
    }
    res = client.post("/api/v1/services/srv_income/call", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["AnnualIncome"] == 250000.0
    assert data["_interop_protocol"] == "SOAP 1.1 Envelope Adapter"

def test_consent_management():
    # 1. Create Consent
    res = client.post("/api/v1/consents", json={
        "department_id": "pmc",
        "department_name": "Pune Municipal Corporation",
        "requested_fields": ["address", "pincode"],
        "purpose": "Trade Licensing Verification",
        "access_type": "ONCE"
    })
    assert res.status_code == 200
    consent_id = res.json()["data"]["consent_id"]
    
    # 2. Check in List
    res_list = client.get("/api/v1/consents")
    assert res_list.status_code == 200
    consents = res_list.json()["data"]
    assert any(c["consent_id"] == consent_id and c["granted"] for c in consents)
    
    # 3. Revoke Consent
    res_revoke = client.post(f"/api/v1/consents/{consent_id}/revoke")
    assert res_revoke.status_code == 200
    
    # 4. Verify Revoked
    res_list_2 = client.get("/api/v1/consents")
    assert not any(c["consent_id"] == consent_id and c["granted"] for c in res_list_2.json()["data"])

def test_unified_application_tracking():
    # 1. Create Application
    res = client.post("/api/v1/applications", json={
        "service_id": "srv_msins_biz",
        "documents": ["AADHAAR", "PAN"]
    })
    assert res.status_code == 200
    app_id = res.json()["data"]["application_id"]
    
    # 2. List Applications
    res_list = client.get("/api/v1/applications")
    assert res_list.status_code == 200
    apps = res_list.json()["data"]
    assert any(a["application_id"] == app_id for a in apps)

def test_data_quality_discrepancy_resolution():
    # 1. Fetch Conflicts
    res_list = client.get("/api/v1/conflicts")
    assert res_list.status_code == 200
    conflicts = res_list.json()["data"]
    assert len(conflicts) > 0
    conflict_id = conflicts[0]["id"]
    
    # 2. Resolve Conflict
    res_res = client.post(f"/api/v1/conflicts/{conflict_id}/resolve", json={"resolved_value": "2005-01-10"})
    assert res_res.status_code == 200
    
    # 3. Verify Resolved
    res_list_2 = client.get("/api/v1/conflicts")
    resolved = [c for c in res_list_2.json()["data"] if c["id"] == conflict_id][0]
    assert resolved["status"] == "RESOLVED"
    assert resolved["resolved_value"] == "2005-01-10"

def test_connector_health_telemetry():
    res = client.get("/api/v1/connectors/health")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["connected_services"] > 0
    assert "success_rate" in data
