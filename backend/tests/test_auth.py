from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from tests.conftest import TestingSessionLocal
from app.models.db_models import UserDB, OTPVerificationDB, CitizenProfileDB, UserDocumentDB
from app.core.security import normalize_mobile_number, hash_otp, create_access_token

client = TestClient(app)




def test_request_otp_success():
    response = client.post("/api/v1/auth/request-otp", json={
        "full_name": "Test Citizen",
        "mobile_number": "9876543210"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["mobile_number"] == "+919876543210"
    assert "dev_otp" in data["data"]

def test_request_otp_invalid_mobile():
    response = client.post("/api/v1/auth/request-otp", json={
        "full_name": "Test Citizen",
        "mobile_number": "12345"
    })
    assert response.status_code == 400
    assert "valid 10-digit Indian mobile number" in response.json()["detail"]

def test_request_otp_cooldown():
    # First request
    client.post("/api/v1/auth/request-otp", json={
        "full_name": "Test Citizen",
        "mobile_number": "9876543211"
    })
    # Second immediate request
    res2 = client.post("/api/v1/auth/request-otp", json={
        "full_name": "Test Citizen",
        "mobile_number": "9876543211"
    })
    assert res2.status_code == 429
    assert "wait" in res2.json()["detail"]

def test_verify_otp_wrong_code():
    client.post("/api/v1/auth/request-otp", json={
        "full_name": "Test Citizen",
        "mobile_number": "9876543212"
    })
    res = client.post("/api/v1/auth/verify-otp", json={
        "full_name": "Test Citizen",
        "mobile_number": "9876543212",
        "otp": "000000"
    })
    assert res.status_code == 400
    assert any(x in res.json()["detail"].lower() for x in ("incorrect", "invalid", "expired"))

def test_verify_otp_success_new_user():
    mobile = "9876543213"
    req_res = client.post("/api/v1/auth/request-otp", json={
        "full_name": "Arbitrary New Citizen",
        "mobile_number": mobile
    })
    otp = req_res.json()["data"]["dev_otp"]

    verify_res = client.post("/api/v1/auth/verify-otp", json={
        "full_name": "Arbitrary New Citizen",
        "mobile_number": mobile,
        "otp": otp
    })
    assert verify_res.status_code == 200
    v_data = verify_res.json()["data"]
    assert v_data["is_new_user"] is True
    assert v_data["user"]["mobile_number"] == "+919876543213"
    assert "access_token" in v_data

def test_expired_otp():
    db = TestingSessionLocal()
    mobile = "+919876543214"

    otp = "123456"
    now = datetime.utcnow()
    expired_time = now - timedelta(minutes=10)
    
    verification = OTPVerificationDB(
        mobile_number=mobile,
        otp_hash=hash_otp(mobile, otp),
        expires_at=expired_time,
        created_at=now - timedelta(minutes=15),
        attempt_count=0
    )
    db.add(verification)
    db.commit()
    db.close()

    res = client.post("/api/v1/auth/verify-otp", json={
        "full_name": "Expired User",
        "mobile_number": mobile,
        "otp": otp
    })
    assert res.status_code == 400
    assert "expired" in res.json()["detail"].lower()

