import sys
import os
import json
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from fastapi import Depends

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.api.v1.router import get_current_user, get_db
from app.models.db_models import UserDB
from app.services.demo_vault_service import DemoVaultService

client = TestClient(app)

def override_get_current_user(db: Session = Depends(get_db)):
    from app.services.ingestion_engine import IngestionEngine
    from app.models.db_models import SchemeDB
    if db.query(SchemeDB).count() == 0:
        IngestionEngine.seed_database(db)
        
    user = db.query(UserDB).filter(UserDB.username == "hriday").first()
    if not user:
        from app.core.security import hash_pin
        user = UserDB(
            id="demo_citizen_hriday",
            username="hriday",
            pin_hash=hash_pin("123456"),
            full_name="Hriday Bardia",
            mobile_number="+919876543210"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        DemoVaultService.seed_user_vault(db, user)
    return user

app.dependency_overrides[get_current_user] = override_get_current_user

def test_api():
    payload = {
        "query": "I want to start a business in Assam",
        "domicileState": "Gujarat"
    }
    
    print("Sending POST request to /api/v1/journey/analyze ...")
    res = client.post("/api/v1/journey/analyze", json=payload)
    print(f"Status Code: {res.status_code}")
    
    try:
        data = res.json()
        print("\n=== RAW JSON RESPONSE ===")
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Failed to parse JSON: {e}")
        print(res.text)

if __name__ == "__main__":
    test_api()
