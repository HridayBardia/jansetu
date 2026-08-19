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
    username = Column(String, unique=True, index=True, nullable=False)  # lowercase login handle
    pin_hash = Column(String, nullable=False)                           # bcrypt hash of 6-digit PIN
    full_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=True)                       # informational only
    email = Column(String, nullable=True)
    role = Column(String, default="citizen")
    # Brute-force protection
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
    goal_category = Column(String, nullable=False) # business, education, etc.
    life_event = Column(String, nullable=False)
    state = Column(String, default="IN_PROGRESS") # DRAFT, IN_PROGRESS, COMPLETED, ARCHIVED
    status = Column(String, default="ANALYZING") # ANALYZING, COMPLETE, PARTIAL
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
    state = Column(String, default="LOCKED") # LOCKED, AVAILABLE, IN_PROGRESS, COMPLETED, SKIPPED
    priority = Column(String, default="medium") # low, medium, high
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
    source_type = Column(String, default="official_portal") # gazette, portal, notification
    url = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    full_content = Column(Text, nullable=True)
    last_verified_at = Column(DateTime, default=datetime.utcnow)
    freshness_status = Column(String, default="VERIFIED") # VERIFIED, STALE, UNKNOWN
    confidence = Column(String, default="OFFICIAL_VERIFIED") # OFFICIAL_VERIFIED, OFFICIAL_BUT_STALE, CROSS_VERIFIED, UNVERIFIED
    http_status = Column(Integer, default=200)
    content_hash = Column(String, nullable=True)
    last_successful_fetch = Column(DateTime, default=datetime.utcnow)
    last_failed_fetch = Column(DateTime, nullable=True)
    last_change_detected = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="ACTIVE", index=True) # ACTIVE, SOURCE_UNAVAILABLE

class SchemeDB(Base):
    __tablename__ = "schemes"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    official_name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    level = Column(String, nullable=False, index=True) # CENTRAL, STATE, UT, DISTRICT, LOCAL
    state_code = Column(String, nullable=False, index=True) # KA, RJ, DL, CENTRAL, etc.
    state_name = Column(String, nullable=False, index=True) # Karnataka, Rajasthan, Delhi, Central, etc.
    district_codes = Column(JSON, default=list)
    department = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True) # business, education, agriculture, healthcare, housing, employment, pension, documents, general
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
    status = Column(String, default="ACTIVE", index=True) # ACTIVE, UPCOMING, EXPIRED, SUSPENDED, UNKNOWN
    languages = Column(JSON, default=list)
    source_type = Column(String, default="OFFICIAL_GOV")
    source_confidence = Column(String, default="OFFICIAL_VERIFIED")

class SchemeChangeHistoryDB(Base):
    __tablename__ = "scheme_change_history"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    scheme_id = Column(String, ForeignKey("schemes.id"), nullable=False, index=True)
    change_type = Column(String, nullable=False) # CREATED, UPDATED, EXPIRED, SUSPENDED
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
    income_category = Column(String, nullable=True) # EWS, LIG, MIG, HIG
    location_state = Column(String, nullable=True)
    location_district = Column(String, nullable=True)
    location_city = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    occupation = Column(String, nullable=True) # Student, Business Owner, Farmer, Professional
    education = Column(String, nullable=True)
    category = Column(String, default="General") # General, OBC, SC, ST, EWS
    is_demo = Column(Boolean, default=False)
    demo_citizen_key = Column(String, nullable=True) # hriday, varad, narayan, aarav, priya, arjun
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserDocumentDB(Base):
    __tablename__ = "user_documents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    journey_id = Column(String, nullable=True)
    document_type = Column(String, nullable=False) # AADHAAR, PAN, PASSPORT, INCOME_CERTIFICATE, DRIVING_LICENCE, etc.
    document_name = Column(String, nullable=False, default="Citizen Document")
    document_number_masked = Column(String, nullable=True) # XXXX XXXX 4821
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=True)
    file_size = Column(Integer, default=0)
    mime_type = Column(String, default="application/pdf")
    status = Column(String, default="AVAILABLE") # MISSING, AVAILABLE, EXPIRED, REVIEW_REQUIRED
    is_verified = Column(Boolean, default=True)
    verification_source = Column(String, default="Govt Issuer")
    verification_status = Column(String, default="DEMO_SYNTHETIC") # USER_PROVIDED, DEMO_SYNTHETIC, ISSUER_VERIFIED
    is_synthetic = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=True)
    synthetic_notice = Column(String, default="DEMO DOCUMENT — NOT A GOVERNMENT-ISSUED DOCUMENT — FOR DEMONSTRATION ONLY")
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
    identity_status = Column(String, default="CONSISTENT") # CONSISTENT, MINOR_VARIATION, CONFLICT, INSUFFICIENT_DATA
    dob_status = Column(String, default="CONSISTENT")
    address_status = Column(String, default="CONSISTENT")
    overall_status = Column(String, default="CONSISTENT")
    discrepancies = Column(JSON, default=list) # List of discrepancy explanations
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
    journey_category = Column(String, default="business") # business, education, general
    created_at = Column(DateTime, default=datetime.utcnow)

