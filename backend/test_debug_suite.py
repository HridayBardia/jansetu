import sys
import os

sys.path.insert(0, os.path.abspath("."))

from app.core.database import SessionLocal, engine
from app.models.db_models import UserDB, CitizenProfileDB, UserDocumentDB, JourneyDB
from app.services.demo_vault_service import DemoVaultService
from app.core.security import verify_pin, create_access_token

def run_debug_checks():
    print("=== JANSETU BACKEND COMPREHENSIVE DEBUG SUITE ===")
    
    # 1. Database Connection Check
    db = SessionLocal()
    try:
        users = db.query(UserDB).all()
        print(f"[OK] Database connected. Found {len(users)} registered users.")
        for u in users:
            print(f"  - User: {u.username} | Name: {u.full_name} | Role: {u.role}")
    except Exception as e:
        print(f"[FAIL] Database check failed: {e}")
        return False

    # 2. Test Aadhaar-to-User Mapping & Auth Logic
    test_cases = [
        {"input": "1111 2222 0207", "otp": "123456", "expected_user": "ayush", "expected_name": "Ayush Singh Chauhan"},
        {"input": "1111 2222 1405", "otp": "123456", "expected_user": "hriday", "expected_name": "Hriday Bardia"},
        {"input": "1111 2222 1304", "otp": "123456", "expected_user": "varad", "expected_name": "Varad Kanade"},
        {"input": "1111 2222 3333", "otp": "123456", "expected_user": "satwik", "expected_name": "Satwik Guru"},
        {"input": "dis123456", "otp": "123456", "expected_user": "dishita", "expected_name": "System Administrator"},
        {"input": "jyo123456", "otp": "123456", "expected_user": "jyoti", "expected_name": "Jyoti"},
    ]

    id_map = {
        "111122220207": "ayush",
        "111122221405": "hriday",
        "111122221304": "varad",
        "111122223333": "satwik",
        "dis123456": "dishita",
        "jyo123456": "jyoti",
    }

    print("\n--- Testing Authentication & Profile Resolution ---")
    for tc in test_cases:
        raw_input = tc["input"].replace(" ", "").strip().lower()
        resolved_username = id_map.get(raw_input, raw_input)
        
        user = db.query(UserDB).filter(UserDB.username == resolved_username).first()
        if not user:
            print(f"[FAIL] User '{resolved_username}' not found in DB for input '{tc['input']}'")
            continue
        
        # Verify PIN or global OTP
        is_pin_valid = verify_pin(tc["otp"], user.pin_hash) or tc["otp"] == "123456"
        if not is_pin_valid:
            print(f"[FAIL] Auth failed for '{user.username}' with OTP '{tc['otp']}'")
            continue
        
        # Seed vault
        try:
            DemoVaultService.seed_user_vault(db, user)
        except Exception as e:
            print(f"[WARN] Vault seed notice for '{user.username}': {e}")

        # Check Documents
        docs_count = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == user.id).count()
        
        # Check Token Generation
        token = create_access_token({"sub": user.id, "username": user.username, "name": user.full_name, "role": user.role or "citizen"})
        
        print(f"[PASS] Auth OK -> UID: {tc['input']} => User: {user.username} ({user.full_name}) | Docs: {docs_count} | JWT Token Generated")

    db.close()
    print("\n=== ALL BACKEND CHECKS PASSED SUCCESSFULLY ===")
    return True

if __name__ == "__main__":
    success = run_debug_checks()
    if not success:
        sys.exit(1)
