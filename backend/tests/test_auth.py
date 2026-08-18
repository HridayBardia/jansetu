"""
Tests for Username + PIN authentication.

Replaces the old OTP-based test_auth.py.
"""
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from tests.conftest import TestingSessionLocal
from app.models.db_models import UserDB, CitizenProfileDB, UserDocumentDB
from app.core.security import hash_pin, verify_pin, create_access_token

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helper: create a test user in the test DB
# ---------------------------------------------------------------------------
def _create_test_user(username: str, pin: str, full_name: str = "Test Citizen") -> UserDB:
    db = TestingSessionLocal()
    existing = db.query(UserDB).filter(UserDB.username == username).first()
    if existing:
        db.close()
        return existing
    user = UserDB(
        username=username,
        pin_hash=hash_pin(pin),
        full_name=full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


# ---------------------------------------------------------------------------
# Test: successful login
# ---------------------------------------------------------------------------
def test_login_success():
    _create_test_user("testcitizen01", "123456", "Test Citizen One")
    response = client.post("/api/v1/auth/login", json={
        "username": "testcitizen01",
        "pin": "123456"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["username"] == "testcitizen01"
    assert "access_token" in data["data"]


# ---------------------------------------------------------------------------
# Test: wrong PIN returns 401
# ---------------------------------------------------------------------------
def test_login_wrong_pin():
    _create_test_user("testcitizen02", "654321", "Test Citizen Two")
    response = client.post("/api/v1/auth/login", json={
        "username": "testcitizen02",
        "pin": "000000"
    })
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Test: non-existent user returns 401
# ---------------------------------------------------------------------------
def test_login_unknown_user():
    response = client.post("/api/v1/auth/login", json={
        "username": "doesnotexist",
        "pin": "111111"
    })
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Test: short username rejected by schema (422)
# ---------------------------------------------------------------------------
def test_login_short_username():
    response = client.post("/api/v1/auth/login", json={
        "username": "ab",
        "pin": "123456"
    })
    assert response.status_code == 422  # Pydantic validation


# ---------------------------------------------------------------------------
# Test: wrong PIN length rejected by schema (422)
# ---------------------------------------------------------------------------
def test_login_short_pin():
    response = client.post("/api/v1/auth/login", json={
        "username": "testcitizen03",
        "pin": "12345"   # only 5 digits
    })
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Test: brute-force lockout after N failures
# ---------------------------------------------------------------------------
def test_brute_force_lockout():
    from app.core.config import settings
    _create_test_user("locktest01", "999999", "Lock Test User")

    for _ in range(settings.LOGIN_MAX_ATTEMPTS):
        client.post("/api/v1/auth/login", json={
            "username": "locktest01",
            "pin": "000000"   # wrong
        })

    # Next attempt should be rate-limited (429) or account-locked (423)
    res = client.post("/api/v1/auth/login", json={
        "username": "locktest01",
        "pin": "000000"
    })
    assert res.status_code in (423, 429)


# ---------------------------------------------------------------------------
# Test: /auth/me requires auth
# ---------------------------------------------------------------------------
def test_get_me_unauthenticated():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Test: /auth/me returns user info when authenticated
# ---------------------------------------------------------------------------
def test_get_me_authenticated():
    user = _create_test_user("metest01", "246810", "Me Test User")
    token = create_access_token({"sub": user.id, "username": user.username, "name": user.full_name})
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["user"]["username"] == "metest01"


# ---------------------------------------------------------------------------
# Test: logout clears session cookie
# ---------------------------------------------------------------------------
def test_logout():
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["data"]["message"] == "Successfully logged out of Citizen Portal"


# ---------------------------------------------------------------------------
# Test: bcrypt helpers work correctly
# ---------------------------------------------------------------------------
def test_security_hash_verify():
    h = hash_pin("123456")
    assert h != "123456"
    assert verify_pin("123456", h) is True
    assert verify_pin("654321", h) is False


# ---------------------------------------------------------------------------
# Test: document isolation — user A cannot access user B's document
# ---------------------------------------------------------------------------
def test_document_isolation():
    user_a = _create_test_user("isouser_a", "111111", "Isolation User A")
    user_b = _create_test_user("isouser_b", "222222", "Isolation User B")

    from app.api.v1.router import get_current_user
    from app.core.database import get_db
    from app.main import app as main_app

    # Create a document belonging to user_b
    db = TestingSessionLocal()
    doc = UserDocumentDB(
        user_id=user_b.id,
        document_type="PAN",
        document_name="PAN Card",
        file_name="pan_b.pdf"
    )
    db.add(doc)
    db.commit()
    doc_id = doc.id
    db.close()

    # Login as user_a and try to access user_b's document
    token_a = create_access_token({"sub": user_a.id, "username": user_a.username, "name": user_a.full_name})

    res = client.get(f"/api/v1/documents/{doc_id}/view", headers={"Authorization": f"Bearer {token_a}"})
    # Must be forbidden (403) or not found (404)
    assert res.status_code in (403, 404), f"Expected 403/404 but got {res.status_code}"
