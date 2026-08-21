import uuid
import random
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.db_models import (
    ServiceRegistryDB, ApplicationDB, ConsentRecordDB, AuditLogDB,
    ConnectorHealthDB, NotificationDB, DataConflictDB, UserDocumentDB, UserDB, CitizenProfileDB
)

class AuditLogger:
    @staticmethod
    def log(db: Session, actor: str, action: str, resource: str, status: str = "SUCCESS", correlation_id: str = None):
        try:
            log_entry = AuditLogDB(
                actor=actor,
                action=action,
                resource=resource,
                status=status,
                correlation_id=correlation_id or str(uuid.uuid4()),
                timestamp=datetime.datetime.utcnow()
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[WARN] Failed to write audit log: {e}")

class ConsentManager:
    @staticmethod
    def check_consent(db: Session, user_id: str, department_id: str, purpose: str) -> bool:
        # Check active consents
        consent = db.query(ConsentRecordDB).filter(
            ConsentRecordDB.user_id == user_id,
            ConsentRecordDB.department_id == department_id,
            ConsentRecordDB.purpose == purpose,
            ConsentRecordDB.granted == True
        ).first()
        
        if consent:
            # If access type is ONCE, we revoke it after check (or simulate check-once)
            if consent.access_type == "ONCE":
                consent.granted = False
                db.commit()
            return True
        return False

    @staticmethod
    def create_consent(
        db: Session, user_id: str, department_id: str, department_name: str,
        requested_fields: List[str], purpose: str, application_id: str = None,
        access_type: str = "ONCE", ip_address: str = "127.0.0.1"
    ) -> ConsentRecordDB:
        # Revoke old active consents for same purpose/department
        db.query(ConsentRecordDB).filter(
            ConsentRecordDB.user_id == user_id,
            ConsentRecordDB.department_id == department_id,
            ConsentRecordDB.purpose == purpose
        ).update({"granted": False})
        
        consent = ConsentRecordDB(
            consent_id=f"cns_{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            department_id=department_id,
            department_name=department_name,
            requested_fields=requested_fields,
            purpose=purpose,
            application_id=application_id,
            granted=True,
            access_type=access_type,
            ip_address=ip_address,
            granted_at=datetime.datetime.utcnow()
        )
        db.add(consent)
        db.commit()
        db.refresh(consent)
        
        AuditLogger.log(
            db, actor=user_id, action="CONSENT_GRANT",
            resource=f"Department: {department_name}, Fields: {requested_fields}",
            status="SUCCESS"
        )
        return consent

    @staticmethod
    def revoke_consent(db: Session, user_id: str, consent_id: str) -> bool:
        consent = db.query(ConsentRecordDB).filter(
            ConsentRecordDB.user_id == user_id,
            ConsentRecordDB.id == consent_id
        ).first()
        if not consent:
            consent = db.query(ConsentRecordDB).filter(
                ConsentRecordDB.user_id == user_id,
                ConsentRecordDB.consent_id == consent_id
            ).first()
            
        if consent:
            consent.granted = False
            consent.access_type = "REVOKED"
            db.commit()
            AuditLogger.log(
                db, actor=user_id, action="CONSENT_REVOKE",
                resource=f"Consent: {consent.consent_id}, Dept: {consent.department_name}",
                status="SUCCESS"
            )
            return True
        return False

class ConnectorHealthMonitor:
    @staticmethod
    def record_request(db: Session, service_name: str, connector_type: str, is_success: bool, latency_ms: int):
        try:
            health = db.query(ConnectorHealthDB).filter(ConnectorHealthDB.service_name == service_name).first()
            if not health:
                health = ConnectorHealthDB(
                    service_name=service_name,
                    connector_type=connector_type,
                    health_status="Healthy",
                    request_count=0,
                    failure_count=0,
                    latency_ms=latency_ms
                )
                db.add(health)
                db.flush()
                
            health.request_count += 1
            if not is_success:
                health.failure_count += 1
                health.last_failure = datetime.datetime.utcnow()
            else:
                health.last_success = datetime.datetime.utcnow()
                
            # Rolling average latency
            health.latency_ms = int((health.latency_ms * 0.9) + (latency_ms * 0.1))
            
            # Determine status
            fail_rate = (health.failure_count / health.request_count) if health.request_count > 0 else 0
            if fail_rate > 0.15:
                health.health_status = "Failed"
            elif fail_rate > 0.05:
                health.health_status = "Degraded"
            else:
                health.health_status = "Healthy"
                
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[WARN] Failed to update connector health: {e}")

    @staticmethod
    def get_health_metrics(db: Session) -> Dict[str, Any]:
        records = db.query(ConnectorHealthDB).all()
        if not records:
            # Seed default health entries
            defaults = [
                ("Identity Verification Service", "REST", "Healthy"),
                ("Address Verification Service", "REST", "Healthy"),
                ("Income Certificate Service", "SOAP", "Healthy"),
                ("Caste/Category Certificate Service", "SOAP", "Healthy"),
                ("Business Registration Service", "REST", "Healthy"),
                ("Licensing Service", "SOAP", "Healthy"),
                ("Government Scheme Service", "REST", "Healthy"),
                ("Application Status Service", "REST", "Healthy"),
                ("Document Verification Service", "REST", "Healthy"),
            ]
            for name, c_type, status in defaults:
                db.add(ConnectorHealthDB(
                    service_name=name,
                    connector_type=c_type,
                    health_status=status,
                    request_count=random.randint(40, 100),
                    failure_count=random.randint(0, 2),
                    latency_ms=random.randint(150, 480)
                ))
            db.commit()
            records = db.query(ConnectorHealthDB).all()

        total_reqs = sum(r.request_count for r in records)
        total_fails = sum(r.failure_count for r in records)
        success_rate = ((total_reqs - total_fails) / total_reqs * 100) if total_reqs > 0 else 98.5
        avg_latency = int(sum(r.latency_ms for r in records) / len(records)) if records else 320
        
        return {
            "connected_services": len(records),
            "active_connectors": len(records) * 2,
            "success_rate": f"{success_rate:.1f}%",
            "failed_rate": f"{(100 - success_rate):.1f}%",
            "avg_latency": f"{avg_latency} ms",
            "pending_events": random.randint(5, 15),
            "services": [
                {
                    "name": r.service_name,
                    "connector_type": r.connector_type,
                    "status": r.health_status,
                    "request_count": r.request_count,
                    "failure_count": r.failure_count,
                    "latency": f"{r.latency_ms}ms"
                }
                for r in records
            ]
        }

class DataQualityEngine:
    @staticmethod
    def check_for_conflicts(db: Session, user_id: str, field_name: str, source_a: str, val_a: str, source_b: str, val_b: str) -> Optional[DataConflictDB]:
        if val_a != val_b:
            # Check if conflict already logged
            existing = db.query(DataConflictDB).filter(
                DataConflictDB.user_id == user_id,
                DataConflictDB.field_name == field_name,
                DataConflictDB.status == "DETECTED"
            ).first()
            if not existing:
                conflict = DataConflictDB(
                    user_id=user_id,
                    field_name=field_name,
                    source_a=source_a,
                    value_a=val_a,
                    source_b=source_b,
                    value_b=val_b,
                    status="DETECTED"
                )
                db.add(conflict)
                db.commit()
                AuditLogger.log(
                    db, actor="SYSTEM_DATA_QUALITY", action="DATA_CONFLICT",
                    resource=f"User: {user_id}, Field: {field_name}, Conflict between {source_a} and {source_b}",
                    status="CONFLICT"
                )
                return conflict
            return existing
        return None

    @staticmethod
    def resolve_conflict(db: Session, conflict_id: str, resolved_value: str) -> bool:
        conflict = db.query(DataConflictDB).filter(DataConflictDB.id == conflict_id).first()
        if conflict:
            conflict.status = "RESOLVED"
            conflict.resolved_value = resolved_value
            db.commit()
            AuditLogger.log(
                db, actor="SYSTEM_ADMIN", action="RESOLVE_CONFLICT",
                resource=f"Conflict ID: {conflict_id}, Resolved Value: {resolved_value}",
                status="SUCCESS"
            )
            return True
        return False

    @staticmethod
    def get_master_citizen_record(db: Session, user_id: str) -> Dict[str, Any]:
        from app.models.db_models import UserDB, DataConflictDB
        import datetime
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        name = user.full_name if user else "Aarav Mehta"
        
        conflict = db.query(DataConflictDB).filter(
            DataConflictDB.user_id == user_id,
            DataConflictDB.field_name == "date_of_birth",
            DataConflictDB.status == "RESOLVED"
        ).first()
        dob = conflict.resolved_value if conflict else "10 Jan 2005"
        
        return {
            "user_id": f"CIT-{user_id[-5:].upper() if user_id else '10482'}",
            "fields": {
                "name": {
                    "value": name,
                    "source": "Identity Service (UIDAI)",
                    "status": "VERIFIED",
                    "timestamp": datetime.datetime.now().strftime("%d %b %Y"),
                    "confidence": "98.8%",
                    "authority_level": "Level 4 (National)"
                },
                "date_of_birth": {
                    "value": dob,
                    "source": "Identity Service (UIDAI)",
                    "status": "VERIFIED",
                    "timestamp": datetime.datetime.now().strftime("%d %b %Y"),
                    "confidence": "99.4%",
                    "authority_level": "Level 4 (National)"
                },
                "address": {
                    "value": "Flat 402, Shivajinagar, Pune, Maharashtra",
                    "source": "Address Verification Service",
                    "status": "VERIFIED",
                    "timestamp": datetime.datetime.now().strftime("%d %b %Y"),
                    "confidence": "95.2%",
                    "authority_level": "Level 2 (State)"
                },
                "contact": {
                    "value": user.mobile_number if user and user.mobile_number else "+91 98765 43210",
                    "source": "Federated Login OTP Gateway",
                    "status": "VERIFIED",
                    "timestamp": datetime.datetime.now().strftime("%d %b %Y"),
                    "confidence": "99.9%",
                    "authority_level": "Level 3 (Federated)"
                }
            }
        }

class DataNormalizer:
    @staticmethod
    def normalize_citizen_data(service_id: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        normalized = raw_data.copy()
        for key in ["name", "full_name", "citizenName", "applicant_name", "CasteCategory", "AnnualIncome"]:
            if key in raw_data:
                if key in ["name", "full_name", "citizenName", "applicant_name"]:
                    normalized["name"] = raw_data[key]
                elif key == "AnnualIncome":
                    normalized["income"] = raw_data[key]
        
        for key in ["dob", "date_of_birth", "birthDate"]:
            if key in raw_data:
                normalized["date_of_birth"] = raw_data[key]
        
        for key in ["address", "registered_address", "addr_line1", "verified_address"]:
            if key in raw_data:
                normalized["address"] = raw_data[key]

        for key in ["pincode", "postal_code", "pin"]:
            if key in raw_data:
                normalized["postal_code"] = raw_data[key]
                
        normalized["_raw_payload"] = raw_data
        return normalized

class SchemaMapper:
    @staticmethod
    def map_to_target(target_schema: str, normalized_data: Dict[str, Any]) -> Dict[str, Any]:
        mapped = {}
        if target_schema == "SOAP_PMC":
            mapped["applicant_name"] = normalized_data.get("name")
            mapped["birth_date"] = normalized_data.get("date_of_birth")
            mapped["registered_address"] = normalized_data.get("address")
        else:
            mapped = normalized_data.copy()
        return mapped

class GovernmentConnector:
    def connect(self) -> bool:
        return True
    
    def authenticate(self, credentials: Dict[str, Any]) -> bool:
        return True

    def getCitizenData(self, db: Session, user_id: str, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError()

    def submitApplication(self, db: Session, user_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError()

    def getApplicationStatus(self, db: Session, app_id: str) -> Dict[str, Any]:
        raise NotImplementedError()

    def validateDocument(self, db: Session, doc_id: str) -> Dict[str, Any]:
        raise NotImplementedError()

    def sendEvent(self, db: Session, event_name: str, payload: Dict[str, Any]) -> bool:
        return True

    def healthCheck(self) -> str:
        return "HEALTHY"

class RestGovernmentConnector(GovernmentConnector):
    def getCitizenData(self, db: Session, user_id: str, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        return ConnectorManager._simulate_rest_call(db, user_id, params.get("service_id", ""), operation, params)

class LegacyGovernmentConnector(GovernmentConnector):
    def getCitizenData(self, db: Session, user_id: str, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        soap_req = MockSOAPAdapter.build_soap_envelope(operation, params)
        raw_res = MockSOAPAdapter.parse_soap_response(soap_req, operation)
        normalized = DataNormalizer.normalize_citizen_data(params.get("service_id", ""), raw_res)
        return normalized

class ServiceRegistry:
    SERVICES = [
        # Central Services
        {
            "service_id": "srv_identity",
            "department": "UIDAI / Ministry of Electronics & IT",
            "name": "Identity Verification Service (Aadhaar API)",
            "description": "Validates Aadhaar number, biometric and OTP-based demographic validation.",
            "jurisdiction": "CENTRAL",
            "country": "India",
            "state": "Central",
            "district": None,
            "sla_hours": 2,
            "data_schema": "Common Data Model",
            "category": "identity",
            "connector": "modern_rest_connector",
            "api_version": "v2.1",
            "supported_operations": ["verify_demographics", "generate_otp", "verify_otp"],
            "data_requirements": {"aadhaar_number": "string", "name": "string"}
        },
        {
            "service_id": "srv_income",
            "department": "Department of Revenue, District Pune Collector Office",
            "name": "Income Certificate Verification Service",
            "description": "Simulates legacy SOAP endpoint query for verifying verified annual income levels of Pune citizens.",
            "jurisdiction": "MAHARASHTRA",
            "country": "India",
            "state": "Maharashtra",
            "district": "Pune",
            "sla_hours": 48,
            "data_schema": "Common Data Model",
            "category": "income",
            "connector": "legacy_soap_connector",
            "api_version": "v1.2-Legacy",
            "supported_operations": ["GetAnnualIncomeByCertificateNumber", "QueryIncomeByPAN"],
            "data_requirements": {"certificate_number": "string", "pan": "string"}
        },
        {
            "service_id": "srv_caste",
            "department": "Social Justice & Special Assistance Department, Govt of Maharashtra",
            "name": "Caste/Category Verification Service",
            "description": "Legacy SOAP-based service for validating community classification status (OBC/SC/ST/EWS).",
            "jurisdiction": "MAHARASHTRA",
            "country": "India",
            "state": "Maharashtra",
            "district": None,
            "sla_hours": 48,
            "data_schema": "Common Data Model",
            "category": "caste",
            "connector": "legacy_soap_connector",
            "api_version": "v1.0-SOAP",
            "supported_operations": ["VerifyCasteStatusByCertificate", "CheckCategoryEligibility"],
            "data_requirements": {"caste_certificate_id": "string", "category_claimed": "string"}
        },
        {
            "service_id": "srv_digilocker",
            "department": "National E-Governance Division (NEGD)",
            "name": "Document Verification Service (DigiLocker API)",
            "description": "REST API interface for querying, fetching and fetching issuer-verified document credentials.",
            "jurisdiction": "CENTRAL",
            "country": "India",
            "state": "Central",
            "district": None,
            "sla_hours": 2,
            "data_schema": "Common Data Model",
            "category": "documents",
            "connector": "modern_rest_connector",
            "api_version": "v2.0",
            "supported_operations": ["fetch_document_list", "verify_document_hash"],
            "data_requirements": {"user_id": "string", "document_type": "string"}
        },
        {
            "service_id": "srv_central_tax",
            "department": "Central Board of Direct Taxes (CBDT)",
            "name": "Central Tax Filing & PAN Service",
            "description": "REST API interface for PAN verification and active tax filing checks.",
            "jurisdiction": "CENTRAL",
            "country": "India",
            "state": "Central",
            "district": None,
            "sla_hours": 24,
            "data_schema": "Common Data Model",
            "category": "taxation",
            "connector": "modern_rest_connector",
            "api_version": "v2.0",
            "supported_operations": ["VerifyPAN", "CheckTaxCompliance"],
            "data_requirements": {"pan": "string", "name": "string"}
        },
        {
            "service_id": "srv_central_scholarship",
            "department": "Ministry of Education, Govt of India",
            "name": "Central Education Scheme & DBT Service",
            "description": "REST API for central student support and direct benefit transfers.",
            "jurisdiction": "CENTRAL",
            "country": "India",
            "state": "Central",
            "district": None,
            "sla_hours": 360,
            "data_schema": "Common Data Model",
            "category": "education",
            "connector": "modern_rest_connector",
            "api_version": "v1.1",
            "supported_operations": ["check_central_eligibility", "submit_dbt_claim"],
            "data_requirements": {"user_id": "string", "income": "float"}
        },
        # Karnataka Services
        {
            "service_id": "srv_kar_biz",
            "department": "Department of Industries & Commerce, Govt of Karnataka",
            "name": "Business Registration Service (Karnataka Single Window)",
            "description": "Coordinates business formation, registrations, and issuance of state certificates for start-ups in Karnataka.",
            "jurisdiction": "KARNATAKA",
            "country": "India",
            "state": "Karnataka",
            "district": None,
            "sla_hours": 48,
            "data_schema": "Common Data Model",
            "category": "business",
            "connector": "modern_rest_connector",
            "api_version": "v3.0",
            "supported_operations": ["register_startup", "issue_state_business_id", "get_registration_status"],
            "data_requirements": {"business_name": "string", "business_type": "string", "address": "string", "pan": "string"}
        },
        {
            "service_id": "srv_kar_municipal",
            "department": "Bengaluru Municipal Authority (BMA)",
            "name": "Licensing Service (Trade License Bengaluru)",
            "description": "Legacy SOAP-based service for Trade and Food licenses in Bengaluru local administration.",
            "jurisdiction": "KARNATAKA",
            "country": "India",
            "state": "Karnataka",
            "district": "Bengaluru",
            "sla_hours": 72,
            "data_schema": "Common Data Model",
            "category": "business",
            "connector": "legacy_soap_connector",
            "api_version": "v2.0-SOAP",
            "supported_operations": ["ApplyForTradeLicense", "GetLicenseFees", "QueryLicenseStatus"],
            "data_requirements": {"business_id": "string", "ward_number": "string", "area_sqft": "integer"}
        },
        # Maharashtra Services
        {
            "service_id": "srv_msins_biz",
            "department": "Maharashtra State Innovation Society (MSINS)",
            "name": "Business Registration Service (Maharashtra Single Window)",
            "description": "Coordinates business formation, registrations, and issuance of state certificates for start-ups in Maharashtra.",
            "jurisdiction": "MAHARASHTRA",
            "country": "India",
            "state": "Maharashtra",
            "district": None,
            "sla_hours": 48,
            "data_schema": "Common Data Model",
            "category": "business",
            "connector": "modern_rest_connector",
            "api_version": "v3.0",
            "supported_operations": ["register_startup", "issue_state_business_id", "get_registration_status"],
            "data_requirements": {"business_name": "string", "business_type": "string", "address": "string", "pan": "string"}
        },
        {
            "service_id": "srv_pmc_license",
            "department": "Pune Municipal Corporation (PMC)",
            "name": "Licensing Service (Trade License Pune)",
            "description": "Evaluates, bills, and issues Local Municipal Trade and Food safety licenses in Pune district.",
            "jurisdiction": "MAHARASHTRA",
            "country": "India",
            "state": "Maharashtra",
            "district": "Pune",
            "sla_hours": 72,
            "data_schema": "Common Data Model",
            "category": "business",
            "connector": "legacy_soap_connector",
            "api_version": "v2.0-SOAP",
            "supported_operations": ["ApplyForTradeLicense", "GetLicenseFees", "QueryLicenseStatus"],
            "data_requirements": {"business_id": "string", "ward_number": "string", "area_sqft": "integer"}
        },
        # Gujarat Services
        {
            "service_id": "srv_guj_biz",
            "department": "Industries Commissionerate, Govt of Gujarat",
            "name": "Business Registration Service (Gujarat Single Window)",
            "description": "Coordinates business formation, registrations, and issuance of state certificates for start-ups in Gujarat.",
            "jurisdiction": "GUJARAT",
            "country": "India",
            "state": "Gujarat",
            "district": None,
            "sla_hours": 48,
            "data_schema": "Common Data Model",
            "category": "business",
            "connector": "modern_rest_connector",
            "api_version": "v3.0",
            "supported_operations": ["register_startup", "issue_state_business_id", "get_registration_status"],
            "data_requirements": {"business_name": "string", "business_type": "string", "address": "string", "pan": "string"}
        },
        {
            "service_id": "srv_guj_municipal",
            "department": "Ahmedabad Municipal Corporation (AMC)",
            "name": "Licensing Service (Trade License Ahmedabad)",
            "description": "Legacy SOAP-based service for Trade and Food licenses in Ahmedabad Municipal district.",
            "jurisdiction": "GUJARAT",
            "country": "India",
            "state": "Gujarat",
            "district": "Ahmedabad",
            "sla_hours": 72,
            "data_schema": "Common Data Model",
            "category": "business",
            "connector": "legacy_soap_connector",
            "api_version": "v2.0-SOAP",
            "supported_operations": ["ApplyForTradeLicense", "GetLicenseFees", "QueryLicenseStatus"],
            "data_requirements": {"business_id": "string", "ward_number": "string", "area_sqft": "integer"}
        },
        # Rajasthan Services
        {
            "service_id": "srv_raj_biz",
            "department": "Single Window Clearance System, Govt of Rajasthan",
            "name": "Business Registration Service (Rajasthan Single Window)",
            "description": "Coordinates business formation, registrations, and issuance of state certificates for start-ups in Rajasthan.",
            "jurisdiction": "RAJASTHAN",
            "country": "India",
            "state": "Rajasthan",
            "district": None,
            "sla_hours": 48,
            "data_schema": "Common Data Model",
            "category": "business",
            "connector": "modern_rest_connector",
            "api_version": "v3.0",
            "supported_operations": ["register_startup", "issue_state_business_id", "get_registration_status"],
            "data_requirements": {"business_name": "string", "business_type": "string", "address": "string", "pan": "string"}
        },
        {
            "service_id": "srv_raj_municipal",
            "department": "Jaipur Municipal Corporation (JMC)",
            "name": "Licensing Service (Trade License Jaipur)",
            "description": "Legacy SOAP-based service for Trade and Food licenses in Jaipur Municipal district.",
            "jurisdiction": "RAJASTHAN",
            "country": "India",
            "state": "Rajasthan",
            "district": "Jaipur",
            "sla_hours": 72,
            "data_schema": "Common Data Model",
            "category": "business",
            "connector": "legacy_soap_connector",
            "api_version": "v2.0-SOAP",
            "supported_operations": ["ApplyForTradeLicense", "GetLicenseFees", "QueryLicenseStatus"],
            "data_requirements": {"business_id": "string", "ward_number": "string", "area_sqft": "integer"}
        }
    ]

    @staticmethod
    def seed_services(db: Session):
        try:
            for s in ServiceRegistry.SERVICES:
                existing = db.query(ServiceRegistryDB).filter(ServiceRegistryDB.service_id == s["service_id"]).first()
                if not existing:
                    db_entry = ServiceRegistryDB(
                        service_id=s["service_id"],
                        department=s["department"],
                        name=s["name"],
                        description=s["description"],
                        jurisdiction=s["jurisdiction"],
                        connector=s["connector"],
                        api_version=s["api_version"],
                        supported_operations=s["supported_operations"],
                        data_requirements=s["data_requirements"],
                        health_status="HEALTHY"
                    )
                    db.add(db_entry)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[WARN] Failed to seed services: {e}")

    @staticmethod
    def list_services(db: Session, query: str = None, jurisdiction: str = None) -> List[Dict[str, Any]]:
        ServiceRegistry.seed_services(db)
        q = db.query(ServiceRegistryDB)
        if jurisdiction:
            q = q.filter(ServiceRegistryDB.jurisdiction == jurisdiction.upper())
        if query:
            q = q.filter(ServiceRegistryDB.name.contains(query) | ServiceRegistryDB.department.contains(query))
        
        return [
            {
                "id": s.id,
                "service_id": s.service_id,
                "department": s.department,
                "name": s.name,
                "description": s.description,
                "jurisdiction": s.jurisdiction,
                "connector": s.connector,
                "api_version": s.api_version,
                "health_status": s.health_status,
                "supported_operations": s.supported_operations,
                "data_requirements": s.data_requirements
            }
            for s in q.all()
        ]

class MockSOAPAdapter:
    """
    Simulates a Legacy SOAP-style XML protocol exchange.
    Directly demonstrates legacy system interoperability wrapper.
    """
    @staticmethod
    def build_soap_envelope(action: str, params: Dict[str, Any]) -> str:
        xml_params = "".join([f"<{k}>{v}</{k}>" for k, v in params.items()])
        return f"""<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <{action} xmlns="http://tempuri.org/">
      {xml_params}
    </{action}>
  </soap:Body>
</soap:Envelope>"""

    @staticmethod
    def parse_soap_response(xml_string: str, tag: str) -> Dict[str, Any]:
        # Return a simulated dict extraction from the tag
        if "GetAnnualIncomeByCertificateNumber" in xml_string:
            return {"AnnualIncome": 250000.0, "Verified": "true", "Source": "District Pune Collector Office"}
        elif "VerifyCasteStatusByCertificate" in xml_string:
            return {"CasteCategory": "OBC", "CertificateStatus": "VALID", "Issuer": "Social Justice Department"}
        elif "ApplyForTradeLicense" in xml_string:
            return {"LicenseNumber": f"LIC-PUNE-{random.randint(10000, 99999)}", "Status": "ISSUED", "ValidUntil": "2027-03-31"}
        return {}

class ConnectorManager:
    @staticmethod
    def call_service(db: Session, user_id: str, service_id: str, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        start_time = datetime.datetime.utcnow()
        service = db.query(ServiceRegistryDB).filter(ServiceRegistryDB.service_id == service_id).first()
        if not service:
            raise ValueError(f"Service {service_id} not registered.")
            
        connector_type = "SOAP" if service.connector == "legacy_soap_connector" else "REST"
        
        if service.health_status == "FAILED":
            latency = random.randint(1000, 2000)
            ConnectorHealthMonitor.record_request(db, service.name, connector_type, is_success=False, latency_ms=latency)
            AuditLogger.log(db, actor=user_id, action="API_REQUEST_FAIL", resource=service.name, status="FAILURE")
            raise ConnectionError(f"Simulated Government Service {service.name} is temporarily offline. Details: SOAP Fault/504 Timeout.")

        latency = random.randint(120, 480)
        AuditLogger.log(db, actor=user_id, action="API_REQUEST", resource=f"{service.name} -> {operation}", status="SUCCESS")

        result = {}
        try:
            params_copy = params.copy()
            params_copy["service_id"] = service_id
            
            if service.connector == "legacy_soap_connector":
                connector = LegacyGovernmentConnector()
                result = connector.getCitizenData(db, user_id, operation, params_copy)
                result["_interop_protocol"] = "SOAP 1.1 Envelope Adapter"
            else:
                connector = RestGovernmentConnector()
                result = connector.getCitizenData(db, user_id, operation, params_copy)
                result["_interop_protocol"] = "OAuth2 Bearer JSON API REST"
                
            ConnectorHealthMonitor.record_request(db, service.name, connector_type, is_success=True, latency_ms=latency)
            return result
        except Exception as e:
            ConnectorHealthMonitor.record_request(db, service.name, connector_type, is_success=False, latency_ms=latency)
            raise e

    @staticmethod
    def _simulate_rest_call(db: Session, user_id: str, service_id: str, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        from app.models.db_models import UserDB
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        full_name = user.full_name if user else "Hriday Bardia"

        if service_id == "srv_identity":
            return {
                "verified": True,
                "document_reference": "AADHAAR-VAULT-XYZ9",
                "identity_claims": {
                    "full_name": full_name,
                    "dob": "2005-01-10",
                    "gender": "Male",
                    "masked_mobile": "******8865"
                }
            }
        elif service_id == "srv_address":
            return {
                "status": "VERIFIED",
                "verified_address": "Flat 402, Shivajinagar, Pune, Maharashtra - 411005",
                "pincode": "411005",
                "source": "State Property Registry Database"
            }
        elif service_id in ["srv_msins_biz", "srv_kar_biz", "srv_guj_biz", "srv_raj_biz"]:
            prefix = "MSINS" if service_id == "srv_msins_biz" else "KAR" if service_id == "srv_kar_biz" else "GUJ" if service_id == "srv_guj_biz" else "RAJ"
            state_label = "Maharashtra" if service_id == "srv_msins_biz" else "Karnataka" if service_id == "srv_kar_biz" else "Gujarat" if service_id == "srv_guj_biz" else "Rajasthan"
            return {
                "business_id": f"{prefix}-REG-{random.randint(100000, 999999)}",
                "registration_status": "APPROVED",
                "approval_date": datetime.datetime.now().strftime("%Y-%m-%d"),
                "authority": f"{state_label} State Business Services Portal"
            }
        elif service_id in ["srv_dbt_schemes", "srv_central_scholarship"]:
            return {
                "eligible": True,
                "matched_benefits": ["Central Sector Scholarship: INR 20,000/year", "Interest Subvention: 5% on Loan"],
                "payout_channel": "DBT-Aadhaar-Link"
            }
        elif service_id == "srv_central_tax":
            return {
                "pan_verified": True,
                "compliance_status": "COMPLIANT",
                "taxpayer_name": full_name
            }
        elif service_id == "srv_digilocker":
            return {
                "connected": True,
                "user_reference": f"DL-{user_id[:6].upper() if user_id else '10482'}",
                "verified_credentials": ["AADHAAR", "PAN", "MARKSHEET"]
            }
        return {"status": "SUCCESS", "message": "Demo REST Call Complete"}

class ApplicationTracker:
    @staticmethod
    def create_application(db: Session, user_id: str, service_id: str, documents: List[str]) -> ApplicationDB:
        service = db.query(ServiceRegistryDB).filter(ServiceRegistryDB.service_id == service_id).first()
        if not service:
            ServiceRegistry.seed_services(db)
            service = db.query(ServiceRegistryDB).filter(ServiceRegistryDB.service_id == service_id).first()

        app_id = f"APP-{random.randint(100000, 999999)}"
        dept_id = service_id.split("_")[1] if "_" in service_id else "dept"
        
        timeline_events = [
            {
                "status": "SUBMITTED",
                "title": "Application Submitted",
                "description": f"Application created securely through JanSetu Interoperability Gateway.",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        ]

        # Capability 3: MASTER-DATA MANAGEMENT
        # Enforce that submitted documents are verified from the central vault (UserDocumentDB)
        from app.models.db_models import UserDocumentDB
        verified_docs = []
        if documents:
            db_docs = db.query(UserDocumentDB).filter(
                UserDocumentDB.user_id == user_id,
                UserDocumentDB.document_type.in_(documents)
            ).all()
            doc_map = {d.document_type: d for d in db_docs}
            for doc_type in documents:
                if doc_type in doc_map:
                    d = doc_map[doc_type]
                    verified_docs.append({
                        "type": doc_type,
                        "verified": d.is_verified,
                        "source": d.verification_source,
                        "reference_id": d.document_number_masked or f"DOC-{d.id[:6]}"
                    })
                else:
                    verified_docs.append({
                        "type": doc_type,
                        "verified": False,
                        "source": "Self-Declared",
                        "reference_id": "PENDING"
                    })
        else:
            verified_docs = documents

        app = ApplicationDB(
            application_id=app_id,
            user_id=user_id,
            service_id=service_id,
            department_id=dept_id,
            department_name=service.department if service else "Government Department",
            service_name=service.name if service else "Government Service",
            status="SUBMITTED",
            documents=verified_docs,
            timeline=timeline_events,
            required_actions=[]
        )
        db.add(app)
        db.commit()
        db.refresh(app)
        
        NotificationManager.notify(
            db, user_id=user_id,
            title=f"Application Created: {app.service_name}",
            message=f"Your unified application ({app.application_id}) was successfully sent to the department.",
            category="APPLICATION_SUBMITTED"
        )
        
        AuditLogger.log(
            db, actor=user_id, action="APPLICATION_CREATE",
            resource=f"App: {app.application_id}, Service: {app.service_name}",
            status="SUCCESS"
        )
        
        return app

    @staticmethod
    def list_applications(db: Session, user_id: str) -> List[Dict[str, Any]]:
        apps = db.query(ApplicationDB).filter(ApplicationDB.user_id == user_id).all()
        if not apps:
            import random
            if user_id == "user_hriday_bardia":
                defaults = [
                    ("srv_kar_municipal", "DOCUMENTS_REQUIRED", "Bruhat Bengaluru Mahanagara Palike", "Trade License – BBMP", [
                        {"status": "SUBMITTED", "title": "Application Created", "description": "Form submitted via single-window.", "timestamp": "2026-08-20T10:00:00Z"},
                        {"status": "DOCUMENTS_REQUIRED", "title": "Action Needed", "description": "Please upload a Fire NOC layout document.", "timestamp": "2026-08-21T09:00:00Z"}
                    ], [{"type": "UPLOAD_DOCUMENT", "document_type": "FIRE_NOC", "label": "Upload Fire NOC Certificate"}]),
                    ("srv_central_tax", "APPROVED", "GSTN Central Board of Indirect Taxes", "GST Registration – Central", [
                        {"status": "SUBMITTED", "title": "Application Submitted", "description": "Sent via GST Common Portal.", "timestamp": "2026-08-18T11:00:00Z"},
                        {"status": "APPROVED", "title": "GSTIN Issued", "description": "GSTIN generated: 29AAAAA0000A1Z5.", "timestamp": "2026-08-19T14:30:00Z"}
                    ], []),
                    ("srv_kar_biz", "UNDER_VERIFICATION", "Karnataka Labour Department", "Shop Establishment – Karnataka Labour Dept", [
                        {"status": "SUBMITTED", "title": "Application Submitted", "description": "Form v2.1 submitted.", "timestamp": "2026-08-19T10:00:00Z"},
                        {"status": "UNDER_VERIFICATION", "title": "Verification Initiated", "description": "Local inspector review scheduled.", "timestamp": "2026-08-20T14:30:00Z"}
                    ], []),
                    ("srv_dbt_schemes", "SUBMITTED", "Food Safety and Standards Authority of India", "Food License – FSSAI", [
                        {"status": "SUBMITTED", "title": "Application Submitted", "description": "Food safety registration fee paid.", "timestamp": "2026-08-21T10:00:00Z"}
                    ], [])
                ]
            elif user_id == "user_varad_kanade":
                defaults = [
                    ("srv_edu_nos", "APPROVED", "Ministry of Social Justice", "National Overseas Scholarship", [
                        {"status": "SUBMITTED", "title": "Application Created", "description": "Submitted application.", "timestamp": "2026-07-20T10:00:00Z"},
                        {"status": "APPROVED", "title": "Scholarship Approved", "description": "Scholarship awarded for overseas study.", "timestamp": "2026-08-10T09:00:00Z"}
                    ], []),
                    ("srv_edu_loan", "UNDER_VERIFICATION", "Ministry of Education", "PM Vidyalaxmi Education Loan", [
                        {"status": "SUBMITTED", "title": "Application Submitted", "description": "Loan request submitted.", "timestamp": "2026-08-19T10:00:00Z"},
                        {"status": "UNDER_VERIFICATION", "title": "Bank Verification", "description": "SBI is verifying the application.", "timestamp": "2026-08-20T14:30:00Z"}
                    ], [])
                ]
            elif user_id == "user_ayuh_citizen":
                defaults = [
                    ("srv_rto_dl", "UNDER_VERIFICATION", "Ministry of Road Transport", "Driving Licence Learner", [
                        {"status": "SUBMITTED", "title": "Application Submitted", "description": "Application submitted.", "timestamp": "2026-08-19T10:00:00Z"},
                        {"status": "UNDER_VERIFICATION", "title": "RTO Verification", "description": "RTO verifying Aadhaar details.", "timestamp": "2026-08-20T14:30:00Z"}
                    ], [])
                ]
            elif user_id == "user_satwik_citizen":
                defaults = [
                    ("srv_agri_pmkisan", "APPROVED", "Ministry of Agriculture", "PM-KISAN Samman Nidhi", [
                        {"status": "SUBMITTED", "title": "Application Submitted", "description": "Application submitted via CSC.", "timestamp": "2026-05-19T10:00:00Z"},
                        {"status": "APPROVED", "title": "DBT Active", "description": "Beneficiary verified and DBT activated.", "timestamp": "2026-06-20T14:30:00Z"}
                    ], []),
                    ("srv_agri_kcc", "DOCUMENTS_REQUIRED", "Ministry of Agriculture", "Kisan Credit Card (KCC)", [
                        {"status": "SUBMITTED", "title": "Application Created", "description": "Application created.", "timestamp": "2026-08-20T10:00:00Z"},
                        {"status": "DOCUMENTS_REQUIRED", "title": "Action Needed", "description": "Please upload recent Khasra/Khatoni.", "timestamp": "2026-08-21T09:00:00Z"}
                    ], [{"type": "UPLOAD_DOCUMENT", "document_type": "LAND_RECORD", "label": "Upload Land Record"}])
                ]
            else:
                defaults = []
            for s_id, status, dept_name, service_name, timeline, actions in defaults:
                app_id = f"APP-{random.randint(100000, 999999)}"
                db.add(ApplicationDB(
                    application_id=app_id,
                    user_id=user_id,
                    service_id=s_id,
                    department_id=s_id.split("_")[1] if "_" in s_id else s_id,
                    department_name=dept_name,
                    service_name=service_name,
                    status=status,
                    documents=["AADHAAR", "PAN"],
                    timeline=timeline,
                    required_actions=actions
                ))
            db.commit()
            apps = db.query(ApplicationDB).filter(ApplicationDB.user_id == user_id).all()

        return [
            {
                "id": app.id,
                "application_id": app.application_id,
                "service_id": app.service_id,
                "department_name": app.department_name,
                "service_name": app.service_name,
                "status": app.status,
                "submitted_at": app.submitted_at.isoformat(),
                "updated_at": app.updated_at.isoformat(),
                "timeline": app.timeline,
                "required_actions": app.required_actions,
                "documents": app.documents
            }
            for app in apps
        ]

    @staticmethod
    def update_application_status(db: Session, application_id: str, status: str, details: str = None) -> Optional[ApplicationDB]:
        app = db.query(ApplicationDB).filter(ApplicationDB.application_id == application_id).first()
        if app:
            app.status = status
            event = {
                "status": status,
                "title": status.replace("_", " ").title(),
                "description": details or f"Application status updated to {status}.",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            # Append to list safely
            timeline = list(app.timeline or [])
            timeline.append(event)
            app.timeline = timeline
            app.updated_at = datetime.datetime.utcnow()
            
            # Clear actions if approved
            if status in ["APPROVED", "REJECTED"]:
                app.required_actions = []
                
            db.commit()
            
            NotificationManager.notify(
                db, user_id=app.user_id,
                title=f"Application Update: {app.service_name}",
                message=details or f"Your application ({app.application_id}) status was updated to {status}.",
                category="APPLICATION_STATUS_CHANGED"
            )
            
            AuditLogger.log(
                db, actor="SYSTEM_WORKFLOW", action="APPLICATION_STATUS_CHANGED",
                resource=f"App: {app.application_id}, New Status: {status}",
                status="SUCCESS"
            )
            return app
        return None

class NotificationManager:
    @staticmethod
    def notify(db: Session, user_id: str, title: str, message: str, category: str = "general") -> NotificationDB:
        notif = NotificationDB(
            user_id=user_id,
            title=title,
            message=message,
            category=category,
            is_read=False,
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)
        db.commit()
        return notif

    @staticmethod
    def get_notifications(db: Session, user_id: str) -> List[Dict[str, Any]]:
        notifs = db.query(NotificationDB).filter(NotificationDB.user_id == user_id).order_by(NotificationDB.created_at.desc()).all()
        if not notifs:
            # Seed default notification entries
            defaults = [
                ("Consent Approved", "Address verified demographics successfully shared with Business Registration Service.", "CONSENT_GRANTED"),
                ("Document Required", "Pune Municipal Licensing requests a layout Fire NOC document upload.", "DOCUMENT_REQUIRED"),
                ("Identity Check Passed", "Aadhaar verified demographics checked via Interoperability Gateway.", "DOCUMENT_VERIFIED"),
            ]
            for title, msg, cat in defaults:
                db.add(NotificationDB(
                    user_id=user_id,
                    title=title,
                    message=msg,
                    category=cat,
                    is_read=False,
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=random.randint(1, 24))
                ))
            db.commit()
            notifs = db.query(NotificationDB).filter(NotificationDB.user_id == user_id).order_by(NotificationDB.created_at.desc()).all()

        return [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "category": n.category,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat()
            }
            for n in notifs
        ]
