import pytest
from fastapi.testclient import TestClient
from app.main import app
from tests.conftest import TestingSessionLocal
from app.models.db_models import UserDB, UserDocumentDB
from app.core.security import create_access_token
from app.services.demo_vault_service import DemoVaultService

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_users():
    db = TestingSessionLocal()
    
    # Create User 1: Hriday
    user1 = db.query(UserDB).filter(UserDB.username == "hriday_test").first()
    if not user1:
        user1 = UserDB(
            id="user_hriday_test",
            username="hriday_test",
            pin_hash="fake_hash",
            full_name="Hriday Bardia",
            mobile_number="+917016918865"
        )
        db.add(user1)
        db.commit()
    DemoVaultService.seed_user_vault(db, user1)

    # Create User 2: Varad
    user2 = db.query(UserDB).filter(UserDB.username == "varad_test").first()
    if not user2:
        user2 = UserDB(
            id="user_varad_test",
            username="varad_test",
            pin_hash="fake_hash",
            full_name="Varad",
            mobile_number="+918830482422"
        )
        db.add(user2)
        db.commit()
    DemoVaultService.seed_user_vault(db, user2)

    db.close()

def test_user_can_access_own_documents():
    db = TestingSessionLocal()
    user1 = db.query(UserDB).filter(UserDB.mobile_number == "+917016918865").first()
    db.close()

    token = create_access_token({"sub": user1.id})
    res = client.get("/api/v1/documents", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    docs = res.json()["data"]
    assert len(docs) > 0
    for doc in docs:
        assert "document_type" in doc
        assert "id" in doc


def test_user_cannot_access_other_user_documents():
    db = TestingSessionLocal()
    user1 = db.query(UserDB).filter(UserDB.mobile_number == "+917016918865").first()
    user2 = db.query(UserDB).filter(UserDB.mobile_number == "+918830482422").first()
    
    # Get user 2's document ID
    doc_user2 = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == user2.id).first()
    db.close()

    # User 1 attempts to view User 2's document
    token1 = create_access_token({"sub": user1.id})
    res = client.get(f"/api/v1/documents/{doc_user2.id}/view", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

