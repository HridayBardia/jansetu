from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# Standard API Envelope
class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: Optional[str] = None

class APIResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None
    request_id: Optional[str] = None

# Authentication Schemas (Username + PIN)
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=4, max_length=30, description="Citizen login username")
    pin: str = Field(..., min_length=6, max_length=6, description="6-digit numeric PIN")

class UserSchema(BaseModel):
    id: str
    username: str
    full_name: str
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    role: str = "citizen"
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSchema

class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    occupation: Optional[str] = None
    annual_income: Optional[float] = None
    education: Optional[str] = None


# Context Questions
class ContextQuestion(BaseModel):
    key: str
    question: str
    options: List[str]
    default_value: Optional[str] = None

# Goal Analysis
class GoalAnalysisRequest(BaseModel):
    message: str

class GoalAnalysisResponse(BaseModel):
    goal: str # business, education, employment, taxation, documents, general
    life_event: str
    location_state: Optional[str] = None
    location_district: Optional[str] = None
    location_city: Optional[str] = None
    needs_location_clarification: bool = False
    confidence: str = "high"
    requires_context: bool = True
    context_questions: List[ContextQuestion] = []
    supported: bool = True
    message: Optional[str] = None

# Step & Journey Schemas
class JourneyStepSchema(BaseModel):
    id: str
    step_key: str
    title: str
    description: str
    category: str = "general"
    state: str = "LOCKED" # LOCKED, AVAILABLE, IN_PROGRESS, COMPLETED, SKIPPED
    priority: str = "medium"
    estimated_effort: str = "15 min"
    official_portal_url: Optional[str] = None
    user_notes: Optional[str] = None
    prerequisites: List[str] = []

class StepDependencySchema(BaseModel):
    step_key: str
    prerequisite_step_key: str
    reason: Optional[str] = None

class NextBestAction(BaseModel):
    step_key: str
    title: str
    priority: str = "high"
    reason: str
    estimated_effort: str = "10 min"

class JourneyCreateRequest(BaseModel):
    goal_category: str
    life_event: str
    title: str
    context_data: Dict[str, Any] = Field(default_factory=dict)
    location_state: Optional[str] = None
    location_district: Optional[str] = None
    location_city: Optional[str] = None

class JourneyResponse(BaseModel):
    id: str
    user_id: str
    title: str
    goal_category: str
    life_event: str
    state: str
    location_state: Optional[str] = None
    location_district: Optional[str] = None
    location_city: Optional[str] = None
    progress_percentage: int
    context_data: Dict[str, Any] = Field(default_factory=dict)
    steps: List[JourneyStepSchema] = []
    next_best_action: Optional[NextBestAction] = None
    created_at: datetime
    updated_at: datetime

# Citizen Profile Schema
class CitizenProfileSchema(BaseModel):
    id: str
    user_id: str
    full_name: str
    age: Optional[int] = None
    annual_income: Optional[float] = None
    income_category: Optional[str] = None
    location_state: Optional[str] = None
    location_district: Optional[str] = None
    location_city: Optional[str] = None
    category: str = "General"
    is_demo: bool = False
    demo_citizen_key: Optional[str] = None

# Document Vault
class DocumentSchema(BaseModel):
    id: str
    document_type: str
    file_name: str
    file_size: int
    mime_type: str
    status: str # MISSING, AVAILABLE, EXPIRED, REVIEW_REQUIRED
    verification_status: str = "USER_PROVIDED" # USER_PROVIDED, DEMO_SYNTHETIC, OCR_EXTRACTED, FORMAT_VALIDATED, CONSISTENCY_CHECKED, SOURCE_VERIFIED, ISSUER_VERIFIED
    is_synthetic: bool = False
    synthetic_notice: Optional[str] = "DEMO / SYNTHETIC DOCUMENT — NOT A GOVERNMENT RECORD"
    is_digilocker: bool = False
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    field_confidence: Dict[str, float] = Field(default_factory=dict)
    overall_confidence: float = 0.95
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    expiry_status: str = "NO_EXPIRY" # VALID, EXPIRING_SOON, EXPIRED, NO_EXPIRY, UNKNOWN
    language_code: str = "en"
    page_count: int = 1
    upload_date: datetime

class ConsistencyCheckResultSchema(BaseModel):
    user_id: str
    identity_status: str = "CONSISTENT" # CONSISTENT, MINOR_VARIATION, CONFLICT, INSUFFICIENT_DATA
    dob_status: str = "CONSISTENT"
    address_status: str = "CONSISTENT"
    overall_status: str = "CONSISTENT"
    discrepancies: List[Dict[str, Any]] = Field(default_factory=list)
    last_evaluated_at: datetime


# Eligibility
class EligibilityRuleSchema(BaseModel):
    field: str
    operator: str # =, !=, >, >=, <, <=, IN, NOT_IN
    value: Any
    explanation: str

class EligibilityResult(BaseModel):
    status: str # VERIFIED_ELIGIBLE, LIKELY_ELIGIBLE, NOT_ELIGIBLE, INSUFFICIENT_INFO
    rules_checked: int
    passed_rules: List[str]
    failed_rules: List[str]
    missing_fields: List[str]
    explanation: str

# Sources & Citations
class Citation(BaseModel):
    source_id: str
    title: str
    department: str
    url: str
    last_verified: str
    confidence: str = "high"

class SourceSchema(BaseModel):
    id: str
    title: str
    department: str
    state: str
    source_type: str
    url: str
    summary: str
    freshness_status: str
    last_verified_at: datetime

class RAGQueryRequest(BaseModel):
    query: str
    journey_id: Optional[str] = None
    step_key: Optional[str] = None

class RAGQueryResponse(BaseModel):
    answer: str
    citations: List[Citation] = []
    confidence: str = "high"

# System Alert
class AlertSchema(BaseModel):
    id: str
    title: str
    category: str
    priority: str
    effective_date: str
    impact_summary: str
    action_required: Optional[str] = None
    source_url: Optional[str] = None
    journey_category: str = "business"
    created_at: datetime

# Scheme Schemas
class SchemeSchema(BaseModel):
    id: str
    name: str
    official_name: str
    description: str
    level: str # CENTRAL, STATE, UT, DISTRICT, LOCAL
    state_code: str
    state_name: str
    district_codes: List[str] = []
    department: str
    category: str # business, education, agriculture, healthcare, housing, employment, pension, documents, general
    benefits: Dict[str, Any] = Field(default_factory=dict)
    eligibility_rules: Dict[str, Any] = Field(default_factory=dict)
    documents_required: List[Dict[str, Any]] = Field(default_factory=list)
    application_process: str
    application_url: Optional[str] = None
    official_source_url: str
    start_date: datetime
    end_date: Optional[datetime] = None
    last_verified_at: datetime
    last_updated_at: datetime
    status: str # ACTIVE, UPCOMING, EXPIRED, SUSPENDED, UNKNOWN
    languages: List[str] = Field(default_factory=list)
    source_type: str = "OFFICIAL_GOV"
    source_confidence: str = "OFFICIAL_VERIFIED"

class SchemeFilterQuery(BaseModel):
    state_name: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    language: Optional[str] = None
    query: Optional[str] = None
    status: str = "ACTIVE"
    limit: int = 20
    offset: int = 0

class LocationContext(BaseModel):
    country: str = "India"
    state_name: Optional[str] = None
    state_code: Optional[str] = None
    is_ut: bool = False
    district: Optional[str] = None
    city: Optional[str] = None
    confidence: float = 1.0
    source: str = "explicit_user_text"
    intent: Optional[str] = None
    needs_clarification: bool = False

class LanguageInfo(BaseModel):
    code: str # en, hi, bn, te, mr, ta, gu, ur, kn, ml, or, pa
    name: str # English, Hindi, etc.
    native_name: str # English, हिन्दी, etc.
    is_script_native: bool = True

class IngestionStatusResponse(BaseModel):
    total_schemes: int
    active_schemes: int
    expired_schemes: int
    suspended_schemes: int
    central_schemes: int
    state_schemes: int
    ut_schemes: int
    last_ingested_at: datetime
    sources_health: Dict[str, Any] = Field(default_factory=dict)

# Privacy & Consent
class ConsentSchema(BaseModel):
    purpose: str
    granted: bool
    granted_at: datetime

# Admin Diagnostics
class AdminDiagnostics(BaseModel):
    status: str = "ok"
    database: str = "connected"
    ai_provider: str
    active_websockets: int
    total_journeys: int
    total_sources: int
    total_users: int
    total_schemes: int = 0
    active_schemes: int = 0
    expired_schemes: int = 0
    total_states_covered: int = 36

# Workflow Templates
class WorkflowTemplateStepSchema(BaseModel):
    id: str
    template_id: str
    step_key: str
    name: str
    step_type: str
    target: str
    prerequisite_step_key: Optional[str] = None
    order_index: int

class WorkflowTemplateSchema(BaseModel):
    id: str
    name: str
    category: str
    department: str
    status: str
    created_at: datetime
    updated_at: datetime
    steps: List[WorkflowTemplateStepSchema] = []

class WorkflowTemplateStepCreate(BaseModel):
    step_key: str
    name: str
    step_type: str
    target: str
    prerequisite_step_key: Optional[str] = None
    order_index: int

class WorkflowTemplateCreate(BaseModel):
    name: str
    category: str
    department: str
    steps: List[WorkflowTemplateStepCreate] = []

class WorkflowTemplateUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    steps: Optional[List[WorkflowTemplateStepCreate]] = None
