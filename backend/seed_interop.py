import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.db_models import (
    ServiceRegistryDB, SchemaMappingDB, DataSharingPolicyDB,
    EntityResolutionDB, ExceptionLogDB, DataQualityRuleDB, DataQualityMetricsDB,
    ImpactMetricsDB
)

logger = logging.getLogger("seed_interop")

def seed_interop_data(db: Session):
    logger.info("Seeding Interoperability Gateway Connectors...")
    
    # 1. Representative Connectors
    connectors = [
        ServiceRegistryDB(
            id="conn_revenue",
            service_id="svc_revenue_cert",
            department="Revenue Department",
            name="Modern Revenue API",
            description="Real-time issuance of Income and Domicile Certificates.",
            jurisdiction="CENTRAL",
            category="revenue",
            system_type="Modern",
            protocol="REST",
            authentication="OAuth2",
            endpoint="https://api.revenue.gov.in/v2",
            version="v2.1",
            sync_mode="REAL-TIME",
            mapping_version="v2.1",
            health_status="HEALTHY",
            supported_operations=["GET_CERTIFICATE", "VERIFY_STATUS"]
        ),
        ServiceRegistryDB(
            id="conn_education",
            service_id="svc_edu_scholarship",
            department="Department of Higher Education",
            name="Legacy Scholarship System",
            description="Legacy SOAP interface for national scholarships.",
            jurisdiction="CENTRAL",
            category="education",
            system_type="Legacy",
            protocol="SOAP",
            authentication="BasicAuth",
            endpoint="https://scholarships.gov.in/soap/v1",
            version="v1.0",
            sync_mode="POLLING",
            mapping_version="v1.0",
            health_status="DEGRADED",
            supported_operations=["SUBMIT_APPLICATION", "GET_STATUS"]
        ),
        ServiceRegistryDB(
            id="conn_welfare",
            service_id="svc_social_welfare",
            department="Ministry of Social Justice",
            name="Welfare Benefit Webhooks",
            description="Event-driven updates for citizen welfare schemes.",
            jurisdiction="CENTRAL",
            category="welfare",
            system_type="Modern",
            protocol="Webhook",
            authentication="API_KEY",
            endpoint="https://welfare.gov.in/events",
            version="v3.0",
            sync_mode="REAL-TIME",
            mapping_version="v3.0",
            health_status="HEALTHY",
            supported_operations=["RECEIVE_EVENT"]
        ),
        ServiceRegistryDB(
            id="conn_municipality",
            service_id="svc_residence",
            department="Local Municipal Corporation",
            name="Batch Residence Verifier",
            description="Overnight SFTP batch processing for address verification.",
            jurisdiction="LOCAL",
            category="municipality",
            system_type="Legacy",
            protocol="SFTP",
            authentication="SSH_KEY",
            endpoint="sftp://localbody.gov.in:22",
            version="v1.0",
            sync_mode="BATCH",
            mapping_version="v1.0",
            health_status="HEALTHY",
            supported_operations=["UPLOAD_BATCH", "DOWNLOAD_RESULT"]
        )
    ]
    
    for c in connectors:
        db.add(c)
    db.commit()

    logger.info("Seeding Schema Mappings...")
    mappings = [
        SchemaMappingDB(
            connector_id="conn_revenue",
            source_field="full_name",
            canonical_field="full_name",
            transformation=None
        ),
        SchemaMappingDB(
            connector_id="conn_revenue",
            source_field="date_of_birth",
            canonical_field="date_of_birth",
            transformation="YYYY-MM-DD"
        ),
        SchemaMappingDB(
            connector_id="conn_education",
            source_field="CandidateName",
            canonical_field="full_name",
            transformation="TO_UPPERCASE"
        ),
        SchemaMappingDB(
            connector_id="conn_education",
            source_field="DOB",
            canonical_field="date_of_birth",
            transformation="DD/MM/YYYY -> YYYY-MM-DD"
        ),
        SchemaMappingDB(
            connector_id="conn_municipality",
            source_field="citizen_address_line_1",
            canonical_field="address.line1",
            transformation=None
        )
    ]
    for m in mappings:
        db.add(m)
    db.commit()

    logger.info("Seeding Entity Resolution Tasks...")
    resolutions = [
        EntityResolutionDB(
            citizen_id="user_hriday_123", # Needs to match real DB id or just random for demo
            source_a="JanSetu Canonical",
            record_a={"full_name": "Hriday Bardia", "date_of_birth": "2006-01-12", "mobile": "9876543210"},
            source_b="Revenue Department",
            record_b={"full_name": "Hriday Bardia", "date_of_birth": "2006-01-12", "mobile": "9876543210"},
            match_confidence=100.0,
            confidence_category="HIGH CONFIDENCE",
            status="CONFIRMED",
            evidence=[{"field": "Name", "status": "Exact Match"}, {"field": "Date of Birth", "status": "Exact Match"}]
        ),
        EntityResolutionDB(
            citizen_id="user_varad_456",
            source_a="JanSetu Canonical",
            record_a={"full_name": "Varad", "date_of_birth": "1995-05-20"},
            source_b="Education Connector",
            record_b={"full_name": "Varad K", "date_of_birth": "1995-05-20"},
            match_confidence=84.2,
            confidence_category="REVIEW RECOMMENDED",
            status="PENDING_REVIEW",
            evidence=[{"field": "Name", "status": "Partial Match"}, {"field": "Date of Birth", "status": "Exact Match"}]
        ),
        EntityResolutionDB(
            citizen_id="user_ayuh_789",
            source_a="JanSetu Canonical",
            record_a={"full_name": "Ayuh", "date_of_birth": "2000-11-15"},
            source_b="Municipality Batch",
            record_b={"full_name": "Unknown", "date_of_birth": "2001-01-01"},
            match_confidence=42.1,
            confidence_category="UNRESOLVED",
            status="PENDING_REVIEW",
            evidence=[{"field": "Name", "status": "Mismatch"}, {"field": "Date of Birth", "status": "Mismatch"}]
        )
    ]
    for r in resolutions:
        db.add(r)
    db.commit()

    logger.info("Seeding Exceptions and Errors...")
    exceptions = [
        ExceptionLogDB(
            application_id="app_1001",
            connector_id="conn_education",
            error_type="TIMEOUT",
            error_message="Connection to legacy SOAP service timed out after 30s",
            attempts=2,
            status="WAITING_RETRY",
            next_retry=datetime.utcnow() + timedelta(minutes=5)
        ),
        ExceptionLogDB(
            application_id="app_1002",
            connector_id="conn_welfare",
            error_type="SCHEMA_MISMATCH",
            error_message="Missing required field 'annual_income' in mapping v2.1",
            attempts=1,
            status="ESCALATED",
            next_retry=None
        )
    ]
    for e in exceptions:
        db.add(e)
    db.commit()
    
    logger.info("Seeding Data Quality and Impact Metrics...")
    db.add(DataQualityMetricsDB(
        records_processed=14250,
        duplicates=124,
        conflicts=85,
        invalid_records=12,
        missing_fields=430,
        consistency_score=94.2,
        resolution_rate=78.5
    ))
    db.add(ImpactMetricsDB(
        portals_avoided=3,
        documents_avoided=7,
        manual_fields_avoided=18,
        processing_time_saved_hours=42.5
    ))
    db.commit()

if __name__ == "__main__":
    from app.core.database import SessionLocal
    db = SessionLocal()
    seed_interop_data(db)
