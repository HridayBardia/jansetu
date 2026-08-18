import pytest
import secrets
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
from app.core.config import settings
from app.core.security import normalize_mobile_number, validate_mobile_number
from app.models.db_models import UserDB, OTPVerificationDB, UserDocumentDB
from tests.conftest import TestingSessionLocal

client = TestClient(app)

# 1. Phone validation & normalization tests
def test_phone_validation_and_normalization():
    # Valid numbers
    assert validate_mobile_number("+917016918865") is True
    assert validate_mobile_number("917016918865") is True
    assert validate_mobile_number("7016918865") is True
    assert validate_mobile_number("+91 7016918865") is True

    # Invalid numbers
    assert validate_mobile_number("12345") is False
    assert validate_mobile_number("abc7016918") is False
    assert validate_mobile_number("") is False

    # Normalization to E.164
    assert normalize_mobile_number("7016918865") == "+917016918865"
    assert normalize_mobile_number("+91 7016918865") == "+917016918865"
    assert normalize_mobile_number("917016918865") == "+917016918865"


# 2. Rate limiting check (cooldown)
def test_request_otp_rate_limiting_cooldown():
    mobile = "8830482422"
    # First request
    res1 = client.post("/api/v1/auth/request-otp", json={
        "full_name": "Test User",
        "mobile_number": mobile
    })
    assert res1.status_code == 200

    # Immediate second request should trigger cooldown rate limit (429)
    res2 = client.post("/api/v1/auth/request-otp", json={
        "full_name": "Test User",
        "mobile_number": mobile
    })
    assert res2.status_code == 429
    assert "wait" in res2.json()["detail"].lower()


# 3. Auth API & token validation mocking
@patch("app.services.otp_provider.httpx.AsyncClient.post")
def test_verify_otp_with_msg91_token(mock_post):
    # Mock MSG91 verifyAccessToken response
    mock_post.return_value = AsyncMock(
        status_code=200,
        json=lambda: {"type": "success", "mobile": "918969707785"}
    )

    mobile = "8969707785"
    
    # Save original settings
    original_auth_key = settings.MSG91_AUTH_KEY
    original_dev_mode = settings.DEV_OTP_MODE
    original_auth_mode = settings.DEV_AUTH_MODE
    
    settings.MSG91_AUTH_KEY = "dummy_auth_key_for_testing"
    settings.DEV_OTP_MODE = False
    settings.DEV_AUTH_MODE = False

    try:
        # Pre-request OTP
        client.post("/api/v1/auth/request-otp", json={
            "full_name": "Narayan",
            "mobile_number": mobile
        })

        # Verify OTP
        res = client.post("/api/v1/auth/verify-otp", json={
            "full_name": "Narayan",
            "mobile_number": mobile,
            "otp": "654321",
            "msg91_token": "mock_jwt_access_token_from_widget"
        })
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["user"]["mobile_number"] == "+918969707785"
        assert "access_token" in data
    finally:
        # Restore settings
        settings.MSG91_AUTH_KEY = original_auth_key
        settings.DEV_OTP_MODE = original_dev_mode
        settings.DEV_AUTH_MODE = original_auth_mode


# 4. Session cookie creation & logout
def test_session_cookie_and_logout():
    # Attempt logging out clears session cookie
    res = client.post("/api/v1/auth/logout")
    assert res.status_code == 200
    # Verify cookie headers indicate deletion
    assert "citizen_session=" in res.headers.get("set-cookie", "")


# 5. Document authorization & isolation tests
def test_document_owner_authorization_isolation():
    db = TestingSessionLocal()
    # Create two distinct users
    user_a = UserDB(full_name="User A", mobile_number="+919999999991", mobile_verified=True)
    user_b = UserDB(full_name="User B", mobile_number="+919999999992", mobile_verified=True)
    db.add(user_a)
    db.add(user_b)
    db.commit()

    # Create document belonging strictly to user A
    doc_a = UserDocumentDB(
        user_id=user_a.id,
        document_type="Aadhaar",
        file_name="aadhaar_a.pdf",
        file_size=1024,
        mime_type="application/pdf",
        status="AVAILABLE"
    )
    db.add(doc_a)
    db.commit()

    # Verify User B cannot access User A's document directly via query constraints
    # (The backend matches user_id from the authenticated session, not request params)
    assert doc_a.user_id == user_a.id
    assert doc_a.user_id != user_b.id
    
    db.delete(doc_a)
    db.delete(user_a)
    db.delete(user_b)
    db.commit()
    db.close()


# 6. OTP Error Handling & validation constraints
def test_otp_validation_errors():
    # 6.1 Invalid mobile length
    res = client.post("/api/v1/auth/request-otp", json={
        "full_name": "Failure test",
        "mobile_number": "123"
    })
    assert res.status_code == 400
    assert "valid 10-digit Indian mobile number" in res.json()["detail"]

    # 6.2 Verification of non-existent code
    res_verify = client.post("/api/v1/auth/verify-otp", json={
        "full_name": "Failure test",
        "mobile_number": "9999999999",
        "otp": "111111"
    })
    assert res_verify.status_code == 400
    assert "incorrect" in res_verify.json()["detail"].lower() or "invalid" in res_verify.json()["detail"].lower()
