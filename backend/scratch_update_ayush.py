# -*- coding: utf-8 -*-
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.db_models import (
    UserDB, CitizenProfileDB, UserDocumentDB, JourneyDB,
    ApplicationDB, NotificationDB, AuditLogDB, ConsentRecordDB, DataConflictDB
)
from app.core.security import hash_pin
from app.services.demo_vault_service import DemoVaultService, DEMO_CITIZENS

db = SessionLocal()
try:
    print("--- EXISTING USERS IN DB ---")
    all_users = db.query(UserDB).all()
    for u in all_users:
        print(f"ID={u.id}, Username={u.username}, FullName={u.full_name}, Role={u.role}")

    # Remove any extra duplicate 'ayush' or 'ayuh' users
    existing_ayush = db.query(UserDB).filter(UserDB.username == 'ayush').all()
    existing_ayuh = db.query(UserDB).filter(UserDB.username == 'ayuh').all()

    target_id = "user_ayush_chauhan"
    
    # If there's an ayush user with a different ID, delete it
    for u in existing_ayush:
        if u.id != target_id:
            print(f"Deleting conflicting user: {u.id} (username={u.username})")
            db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == u.id).delete()
            db.query(UserDocumentDB).filter(UserDocumentDB.user_id == u.id).delete()
            db.query(JourneyDB).filter(JourneyDB.user_id == u.id).delete()
            db.query(ApplicationDB).filter(ApplicationDB.user_id == u.id).delete()
            db.query(NotificationDB).filter(NotificationDB.user_id == u.id).delete()
            db.query(AuditLogDB).filter(AuditLogDB.actor == u.id).delete()
            db.delete(u)
            db.commit()

    # Now update or create target user
    target_user = db.query(UserDB).filter(UserDB.id == target_id).first()
    if not target_user:
        # Check if ayuh user exists to rename ID
        ayuh_user = db.query(UserDB).filter(UserDB.username == 'ayuh').first()
        if ayuh_user:
            ayuh_user.username = "ayush"
            ayuh_user.full_name = "Ayush Singh Chauhan"
            ayuh_user.role = "CITIZEN"
            ayuh_user.pin_hash = hash_pin("123456")
            db.commit()
            target_user = ayuh_user
        else:
            target_user = UserDB(
                id=target_id,
                username="ayush",
                pin_hash=hash_pin("123456"),
                full_name="Ayush Singh Chauhan",
                mobile_number="+918969707785",
                email="ayush@demo.citizen",
                role="CITIZEN"
            )
            db.add(target_user)
            db.commit()
    else:
        target_user.username = "ayush"
        target_user.full_name = "Ayush Singh Chauhan"
        target_user.role = "CITIZEN"
        target_user.pin_hash = hash_pin("123456")
        db.commit()

    # Update CitizenProfileDB
    profile = db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == target_user.id).first()
    if not profile:
        profile = db.query(CitizenProfileDB).filter(CitizenProfileDB.demo_citizen_key.in_(['ayuh', 'ayush'])).first()
    
    if profile:
        profile.user_id = target_user.id
        profile.full_name = "Ayush Singh Chauhan"
        profile.demo_citizen_key = "ayush"
        db.commit()
    else:
        ayush_info = DEMO_CITIZENS["ayush"]
        profile = CitizenProfileDB(
            user_id=target_user.id,
            full_name="Ayush Singh Chauhan",
            age=ayush_info.get("age", 22),
            annual_income=ayush_info.get("annual_income", 180000.0),
            income_category=ayush_info.get("income_category", "EWS"),
            location_state=ayush_info.get("location_state", "Rajasthan"),
            location_district=ayush_info.get("location_district", "Jaipur"),
            location_city=ayush_info.get("location_city", "Jaipur"),
            occupation=ayush_info.get("occupation", "College Student"),
            education=ayush_info.get("education", "B.Sc Physics"),
            category=ayush_info.get("category", "General"),
            is_demo=True,
            demo_citizen_key="ayush"
        )
        db.add(profile)
        db.commit()

    # Re-seed vault
    db.query(UserDocumentDB).filter(UserDocumentDB.user_id == target_user.id).delete()
    db.commit()
    DemoVaultService.seed_user_vault(db, target_user)

    print("\n--- FINAL VERIFICATION OF ALL USERS ---")
    users = db.query(UserDB).all()
    for u in users:
        print(f"User: id='{u.id}', username='{u.username}', full_name='{u.full_name}', role='{u.role}'")

    print("\nSUCCESS: Ayush Singh Chauhan is verified as CITIZEN with username 'ayush' and PIN '123456'.")
finally:
    db.close()
