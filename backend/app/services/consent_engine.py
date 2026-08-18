from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.db_models import UserConsentDB
from app.models.schemas import ConsentSchema

class ConsentEngine:
    @staticmethod
    def get_user_consents(db: Session, user_id: str) -> List[ConsentSchema]:
        consents = db.query(UserConsentDB).filter(UserConsentDB.user_id == user_id).all()
        if not consents:
            # Seed default privacy consents
            defaults = [
                ("Identity Document Verification (DigiLocker / Aadhaar Vault)", True),
                ("State Government Single Window Portal Data Sync", True),
                ("Anonymized Regulatory Improvement Analytics", False)
            ]
            for purpose, granted in defaults:
                c = UserConsentDB(user_id=user_id, purpose=purpose, granted=granted)
                db.add(c)
            db.commit()
            consents = db.query(UserConsentDB).filter(UserConsentDB.user_id == user_id).all()

        return [
            ConsentSchema(
                purpose=c.purpose,
                granted=c.granted,
                granted_at=c.granted_at
            )
            for c in consents
        ]

    @staticmethod
    def toggle_consent(db: Session, user_id: str, purpose: str, granted: bool) -> ConsentSchema:
        consent = db.query(UserConsentDB).filter(
            UserConsentDB.user_id == user_id,
            UserConsentDB.purpose == purpose
        ).first()

        if not consent:
            consent = UserConsentDB(user_id=user_id, purpose=purpose, granted=granted)
            db.add(consent)
        else:
            consent.granted = granted
            consent.granted_at = datetime.utcnow()

        db.commit()
        db.refresh(consent)
        return ConsentSchema(
            purpose=consent.purpose,
            granted=consent.granted,
            granted_at=consent.granted_at
        )

    @staticmethod
    def get_data_access_logs(user_id: str) -> List[Dict[str, Any]]:
        return [
            {
                "timestamp": "2026-02-17T10:15:00Z",
                "service": "Dependency Engine",
                "action": "Read User Location & Business Structure",
                "purpose": "Journey Step Prerequisites Resolution"
            },
            {
                "timestamp": "2026-02-17T09:30:00Z",
                "service": "DigiLocker Sandbox Adapter",
                "action": "Verified Aadhaar & PAN Status",
                "purpose": "Identity Document Compliance Check"
            }
        ]
