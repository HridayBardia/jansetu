import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.db_models import AuditLogDB

class AuditLoggerService:
    @staticmethod
    def log(db: Session, actor: str, action: str, resource: str, purpose: str = None, status: str = "SUCCESS", details: dict = None, correlation_id: str = None):
        try:
            log_entry = AuditLogDB(
                actor=actor,
                action=action,
                resource=resource,
                purpose=purpose,
                status=status,
                result_details=details or {},
                correlation_id=correlation_id or str(uuid.uuid4()),
                timestamp=datetime.utcnow()
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[WARN] Failed to write audit log: {e}")
