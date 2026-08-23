import uuid
from datetime import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.db_models import EntityResolutionDB, CitizenProfileDB, AuditLogDB

class EntityResolutionService:
    @staticmethod
    def calculate_match(record_a: Dict[str, Any], record_b: Dict[str, Any]) -> Tuple[float, list]:
        """
        Calculates a deterministic match score between two records.
        Returns (confidence_score, list_of_evidence)
        """
        score = 0.0
        max_score = 4.0
        evidence = []
        
        # Name Match
        name_a = str(record_a.get("full_name", "")).lower().strip()
        name_b = str(record_b.get("full_name", "")).lower().strip()
        if name_a and name_b:
            if name_a == name_b:
                score += 1.5
                evidence.append({"field": "Name", "status": "Exact Match"})
            elif name_a in name_b or name_b in name_a:
                score += 1.0
                evidence.append({"field": "Name", "status": "Partial Match"})
            else:
                evidence.append({"field": "Name", "status": "Mismatch"})
        
        # DOB Match
        dob_a = str(record_a.get("date_of_birth", "")).strip()
        dob_b = str(record_b.get("date_of_birth", "")).strip()
        if dob_a and dob_b:
            # simple normalization to check equality
            n_dob_a = dob_a.replace("-", "").replace("/", "")
            n_dob_b = dob_b.replace("-", "").replace("/", "")
            if n_dob_a == n_dob_b:
                score += 1.5
                evidence.append({"field": "Date of Birth", "status": "Exact Match"})
            else:
                evidence.append({"field": "Date of Birth", "status": "Mismatch"})
                
        # Mobile Match
        mob_a = str(record_a.get("mobile", "")).strip()
        mob_b = str(record_b.get("mobile", "")).strip()
        if mob_a and mob_b:
            if mob_a == mob_b:
                score += 1.0
                evidence.append({"field": "Mobile", "status": "Exact Match"})
            else:
                evidence.append({"field": "Mobile", "status": "Mismatch"})

        confidence_pct = (score / max_score) * 100 if max_score > 0 else 0
        return round(confidence_pct, 1), evidence

    @staticmethod
    def register_resolution_task(db: Session, citizen_id: str, source_a: str, record_a: Dict[str, Any], source_b: str, record_b: Dict[str, Any]) -> EntityResolutionDB:
        """
        Creates an entity resolution task based on incoming external data vs canonical data.
        """
        confidence, evidence = EntityResolutionService.calculate_match(record_a, record_b)
        
        if confidence >= 95.0:
            category = "HIGH CONFIDENCE"
            status = "CONFIRMED"
        elif confidence >= 80.0:
            category = "REVIEW RECOMMENDED"
            status = "PENDING_REVIEW"
        else:
            category = "UNRESOLVED"
            status = "PENDING_REVIEW"
            
        resolution = EntityResolutionDB(
            citizen_id=citizen_id,
            source_a=source_a,
            record_a=record_a,
            source_b=source_b,
            record_b=record_b,
            match_confidence=confidence,
            confidence_category=category,
            evidence=evidence,
            status=status
        )
        db.add(resolution)
        db.commit()
        db.refresh(resolution)
        
        # If auto-confirmed, merge data into canonical profile
        if status == "CONFIRMED":
            EntityResolutionService.merge_to_canonical(db, citizen_id, record_b, source_b, confidence)
            
        return resolution

    @staticmethod
    def merge_to_canonical(db: Session, citizen_id: str, incoming_record: Dict[str, Any], source: str, confidence: float):
        profile = db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == citizen_id).first()
        if not profile:
            return
            
        canonical = profile.canonical_data if profile.canonical_data else {}
        provenance = profile.data_provenance if profile.data_provenance else {}
        
        for k, v in incoming_record.items():
            if not v:
                continue
            canonical[k] = v
            provenance[k] = {
                "source": source,
                "timestamp": datetime.utcnow().isoformat(),
                "confidence": confidence,
                "version": "v1"
            }
            
        profile.canonical_data = canonical
        profile.data_provenance = provenance
        
        # Also update standard profile fields if missing
        if "full_name" in canonical and not profile.full_name:
            profile.full_name = canonical["full_name"]
        if "date_of_birth" in canonical and not profile.date_of_birth:
            profile.date_of_birth = canonical["date_of_birth"]
            
        db.commit()
        
        log_entry = AuditLogDB(
            actor="EntityResolutionEngine",
            action="DATA_MERGE",
            resource=f"Citizen: {citizen_id}",
            purpose="Canonical Profile Update",
            status="SUCCESS"
        )
        db.add(log_entry)
        db.commit()
