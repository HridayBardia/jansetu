import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    pin_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    role = Column(String, default="citizen")
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, default=datetime.utcnow)

class JourneyDB(Base):
    __tablename__ = "journeys"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    goal_category = Column(String, nullable=False)
    life_event = Column(String, nullable=False)
    state = Column(String, default="IN_PROGRESS")
    status = Column(String, default="ANALYZING")
    location_state = Column(String, nullable=True, default=None)
    location_district = Column(String, nullable=True, default=None)
    location_city = Column(String, nullable=True, default=None)
    context_data = Column(JSON, default=dict)
    progress_percentage = Column(Integer, default=0)
    query = Column(Text, nullable=True)
    domicile_state = Column(String, nullable=True)
    intent = Column(String, nullable=True)
    result_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    steps = relationship("JourneyStepDB", back_populates="journey", cascade="all, delete-orphan")

class JourneyStepDB(Base):
    __tablename__ = "journey_steps"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    journey_id = Column(String, ForeignKey("journeys.id"), nullable=False, index=True)
    step_key = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, default="general")
    state = Column(String, default="LOCKED") # LOCKED, AVAILABLE, IN_PROGRESS, COMPLETED, SKIPPED, FAILED_RETRYING
    priority = Column(String, default="medium")
    estimated_effort = Column(String, default="15 min")
    official_portal_url = Column(String, nullable=True)
    user_notes = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    journey = relationship("JourneyDB", back_populates="steps")

class StepDependencyDB(Base):
    __tablename__ = "step_dependencies"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    journey_id = Column(String, ForeignKey("journeys.id"), nullable=False, index=True)
    step_key = Column(String, nullable=False)
    prerequisite_step_key = Column(String, nullable=False)
    reason = Column(String, nullable=True)

class GovernmentSourceDB(Base):
    __tablename__ = "government_sources"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    state = Column(String, default="Central", index=True)
    source_type = Column(String, default="official_portal")
    url = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    full_content = Column(Text, nullable=True)
    last_verified_at = Column(DateTime, default=datetime.utcnow)
    freshness_status = Column(String, default="VERIFIED")
    confidence = Column(String, default="OFFICIAL_VERIFIED")
    http_status = Column(Integer, default=200)
    content_hash = Column(String, nullable=True)
    last_successful_fetch = Column(DateTime, default=datetime.utcnow)
    last_failed_fetch = Column(DateTime, nullable=True)
    last_change_detected = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="ACTIVE", index=True)

class SchemeDB(Base):
    __tablename__ = "schemes"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    official_name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    level = Column(String, nullable=False, index=True)
    state_code = Column(String, nullable=False, index=True)
    state_name = Column(String, nullable=False, index=True)
    district_codes = Column(JSON, default=list)
    department = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    benefits = Column(JSON, default=dict)
    eligibility_rules = Column(JSON, default=dict)
    documents_required = Column(JSON, default=list)
    application_process = Column(Text, nullable=False)
    application_url = Column(String, nullable=True)
    official_source_url = Column(String, nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow, index=True)
    end_date = Column(DateTime, nullable=True, index=True)
    last_verified_at = Column(DateTime, default=datetime.utcnow)
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    status = Column(String, default="ACTIVE", index=True)
    languages = Column(JSON, default=list)
    source_type = Column(String, default="OFFICIAL_GOV")
    source_confidence = Column(String, default="OFFICIAL_VERIFIED")

class SchemeChangeHistoryDB(Base):
    __tablename__ = "scheme_change_history"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    scheme_id = Column(String, ForeignKey("schemes.id"), nullable=False, index=True)
    change_type = Column(String, nullable=False)
    previous_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class CitizenProfileDB(Base):
    __tablename__ = "citizen_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    annual_income = Column(Float, nullable=True)
    income_category = Column(String, nullable=True)
    location_state = Column(String, nullable=True)
    location_district = Column(String, nullable=True)
    location_city = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    education = Column(String, nullable=True)
    category = Column(String, default="General")
    is_demo = Column(Boolean, default=False)
    demo_citizen_key = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # NEW INTEROPERABILITY FIELDS
    canonical_data = Column(JSON, default=dict)
    data_provenance = Column(JSON, default=dict)

class UserDocumentDB(Base):
    __tablename__ = "user_documents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    journey_id = Column(String, nullable=True)
    document_type = Column(String, nullable=False)
    document_name = Column(String, nullable=False, default="Citizen Document")
    document_number_masked = Column(String, nullable=True)
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=True)
    file_size = Column(Integer, default=0)
    mime_type = Column(String, default="application/pdf")
    status = Column(String, default="AVAILABLE")
    is_verified = Column(Boolean, default=True)
    verification_source = Column(String, default="Govt Issuer")
    verification_status = Column(String, default="DEMO_SYNTHETIC")
    is_synthetic = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=True)
    synthetic_notice = Column(String, default="DEMO DOCUMENT")
    is_digilocker = Column(Boolean, default=False)
    extracted_fields = Column(JSON, default=dict)
    field_confidence = Column(JSON, default=dict)
    overall_confidence = Column(Float, default=0.95)
    issued_by = Column(String, nullable=True)
    issue_date = Column(String, nullable=True)
    expiry_date = Column(String, nullable=True)
    expiry_status = Column(String, default="NO_EXPIRY")
    language_code = Column(String, default="en")
    page_count = Column(Integer, default=1)
    upload_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DocumentConsistencyDB(Base):
    __tablename__ = "document_consistencies"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    identity_status = Column(String, default="CONSISTENT")
    dob_status = Column(String, default="CONSISTENT")
    address_status = Column(String, default="CONSISTENT")
    overall_status = Column(String, default="CONSISTENT")
    discrepancies = Column(JSON, default=list)
    last_evaluated_at = Column(DateTime, default=datetime.utcnow)

class UserConsentDB(Base):
    __tablename__ = "user_consents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    purpose = Column(String, nullable=False)
    granted = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, default="127.0.0.1")

class SystemAlertDB(Base):
    __tablename__ = "system_alerts"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    category = Column(String, default="regulatory_update")
    priority = Column(String, default="high")
    effective_date = Column(String, default="Immediate")
    impact_summary = Column(Text, nullable=False)
    action_required = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    journey_category = Column(String, default="business")
    created_at = Column(DateTime, default=datetime.utcnow)

class ServiceRegistryDB(Base):
    __tablename__ = "service_registry"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    service_id = Column(String, unique=True, index=True, nullable=False)
    department = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    jurisdiction = Column(String, default="MAHARASHTRA")
    country = Column(String, default="India")
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    sla_hours = Column(Integer, default=48)
    data_schema = Column(String, default="Common Data Model")
    category = Column(String, default="general")
    connector = Column(String, default="modern_rest_connector")
    
    # NEW INTEROPERABILITY FIELDS
    system_type = Column(String, default="Modern") # Modern, Legacy
    protocol = Column(String, default="REST") # REST, SOAP, SFTP, CSV, Webhook
    authentication = Column(String, default="OAuth2")
    endpoint = Column(String, nullable=True)
    version = Column(String, default="v1")
    sync_mode = Column(String, default="REAL-TIME") # REAL-TIME, BATCH, POLLING
    mapping_version = Column(String, default="v1.0")
    last_sync = Column(DateTime, default=datetime.utcnow)
    
    health_status = Column(String, default="HEALTHY")
    supported_operations = Column(JSON, default=list)
    data_requirements = Column(JSON, default=dict)
    last_health_check = Column(DateTime, default=datetime.utcnow)

class ApplicationDB(Base):
    __tablename__ = "applications"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    application_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    service_id = Column(String, nullable=False, index=True)
    department_id = Column(String, nullable=False)
    department_name = Column(String, nullable=False)
    service_name = Column(String, nullable=False)
    status = Column(String, default="SUBMITTED")
    
    # NEW ORCHESTRATION FIELDS
    universal_status = Column(String, default="SUBMITTED") # SUBMITTED, PROCESSING, VERIFICATION, DECISION, COMPLETED, ACTION_REQUIRED, FAILED
    sla_target_hours = Column(Integer, default=72)
    elapsed_time = Column(String, nullable=True)
    remaining_time = Column(String, nullable=True)
    idempotency_key = Column(String, nullable=True, unique=True)
    retries = Column(Integer, default=0)
    next_retry = Column(DateTime, nullable=True)
    
    submitted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    documents = Column(JSON, default=list)
    timeline = Column(JSON, default=list)
    required_actions = Column(JSON, default=list)

class ConsentRecordDB(Base):
    __tablename__ = "consent_records"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    consent_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    department_id = Column(String, nullable=False)
    department_name = Column(String, nullable=False)
    purpose = Column(String, nullable=False) # MUST ENFORCE PURPOSE LIMITATION
    requested_fields = Column(JSON, default=list) # ENFORCES DATA MINIMIZATION
    duration_days = Column(Integer, default=30)
    consent_status = Column(String, default="PENDING") # PENDING, GRANTED, DENIED, REVOKED
    application_id = Column(String, nullable=True)
    granted = Column(Boolean, default=False)
    granted_at = Column(DateTime, nullable=True)
    access_type = Column(String, default="ONCE")
    ip_address = Column(String, default="127.0.0.1")

class AuditLogDB(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    actor = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False, index=True)
    resource = Column(String, nullable=False)
    purpose = Column(String, nullable=True)
    result_details = Column(JSON, default=dict)
    status = Column(String, default="SUCCESS")
    correlation_id = Column(String, nullable=True, index=True)

class ConnectorHealthDB(Base):
    __tablename__ = "connector_health"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    service_name = Column(String, unique=True, index=True, nullable=False)
    connector_type = Column(String, default="REST")
    health_status = Column(String, default="Healthy")
    request_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    last_success = Column(DateTime, default=datetime.utcnow)
    last_failure = Column(DateTime, nullable=True)

class NotificationDB(Base):
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String, default="general")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DataConflictDB(Base):
    __tablename__ = "data_conflicts"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    field_name = Column(String, nullable=False)
    source_a = Column(String, nullable=False)
    value_a = Column(String, nullable=False)
    source_b = Column(String, nullable=False)
    value_b = Column(String, nullable=False)
    confidence = Column(String, default="Medium")
    status = Column(String, default="DETECTED")
    resolved_value = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class WorkflowTemplateDB(Base):
    __tablename__ = "workflow_templates"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, unique=True)
    department = Column(String, nullable=False)
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    steps = relationship("WorkflowTemplateStepDB", back_populates="template", cascade="all, delete-orphan", order_by="WorkflowTemplateStepDB.order_index")

class WorkflowTemplateStepDB(Base):
    __tablename__ = "workflow_template_steps"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    template_id = Column(String, ForeignKey("workflow_templates.id"), nullable=False)
    step_key = Column(String, nullable=False)
    name = Column(String, nullable=False)
    step_type = Column(String, nullable=False)
    target = Column(String, nullable=False)
    prerequisite_step_key = Column(String, nullable=True)
    order_index = Column(Integer, default=0)
    
    template = relationship("WorkflowTemplateDB", back_populates="steps")

# ==============================================================
# NEW INTEROPERABILITY MODELS
# ==============================================================

class SchemaMappingDB(Base):
    __tablename__ = "schema_mappings"
    id = Column(String, primary_key=True, default=generate_uuid)
    connector_id = Column(String, ForeignKey("service_registry.id"), nullable=False, index=True)
    source_field = Column(String, nullable=False)
    canonical_field = Column(String, nullable=False)
    transformation = Column(String, nullable=True) # e.g. "DD/MM/YYYY -> YYYY-MM-DD"
    validation_rule = Column(String, nullable=True)
    version = Column(String, default="v1.0")
    status = Column(String, default="VALIDATED")
    created_at = Column(DateTime, default=datetime.utcnow)

class DataSharingPolicyDB(Base):
    __tablename__ = "data_sharing_policies"
    id = Column(String, primary_key=True, default=generate_uuid)
    connector_id = Column(String, ForeignKey("service_registry.id"), nullable=False, index=True)
    data_controller = Column(String, nullable=False)
    purpose = Column(String, nullable=False)
    permitted_data = Column(JSON, default=list) # specific fields allowed
    permitted_requester = Column(JSON, default=list) # specific roles or depts
    retention_days = Column(Integer, default=30)
    consent_requirement = Column(String, default="EXPLICIT") # EXPLICIT, IMPLICIT, NONE
    access_policy = Column(String, default="STRICT")
    data_classification = Column(String, default="PERSONAL") # PUBLIC, INTERNAL, PERSONAL, SENSITIVE

class EntityResolutionDB(Base):
    __tablename__ = "entity_resolutions"
    id = Column(String, primary_key=True, default=generate_uuid)
    citizen_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    source_a = Column(String, nullable=False)
    record_a = Column(JSON, default=dict)
    source_b = Column(String, nullable=False)
    record_b = Column(JSON, default=dict)
    match_confidence = Column(Float, nullable=False)
    confidence_category = Column(String, nullable=False) # HIGH CONFIDENCE, REVIEW RECOMMENDED, UNRESOLVED
    evidence = Column(JSON, default=list)
    status = Column(String, default="PENDING_REVIEW") # PENDING_REVIEW, CONFIRMED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class ExceptionLogDB(Base):
    __tablename__ = "exception_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    application_id = Column(String, nullable=True, index=True)
    connector_id = Column(String, ForeignKey("service_registry.id"), nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    error_type = Column(String, nullable=False)
    error_message = Column(Text, nullable=False)
    attempts = Column(Integer, default=1)
    status = Column(String, default="WAITING_RETRY") # WAITING_RETRY, RETRYING, ESCALATED, RESOLVED
    next_retry = Column(DateTime, nullable=True)
    action_taken = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DataQualityRuleDB(Base):
    __tablename__ = "data_quality_rules"
    id = Column(String, primary_key=True, default=generate_uuid)
    rule_name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    target_field = Column(String, nullable=False)
    status = Column(String, default="ACTIVE")

class DataQualityMetricsDB(Base):
    __tablename__ = "data_quality_metrics"
    id = Column(String, primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    records_processed = Column(Integer, default=0)
    duplicates = Column(Integer, default=0)
    conflicts = Column(Integer, default=0)
    invalid_records = Column(Integer, default=0)
    missing_fields = Column(Integer, default=0)
    consistency_score = Column(Float, default=100.0)
    resolution_rate = Column(Float, default=0.0)

class ImpactMetricsDB(Base):
    __tablename__ = "impact_metrics"
    id = Column(String, primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    portals_avoided = Column(Integer, default=0)
    documents_avoided = Column(Integer, default=0)
    manual_fields_avoided = Column(Integer, default=0)
    processing_time_saved_hours = Column(Float, default=0.0)
    is_demo_data = Column(Boolean, default=True)

