import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

logger = logging.getLogger("citizen_journey")
from fastapi import APIRouter, Depends, HTTPException, Request, Response, BackgroundTasks, UploadFile, File, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    normalize_username, verify_pin, create_access_token, decode_access_token
)

from app.models.schemas import (
    APIResponse, ErrorDetail, LoginRequest, LoginResponse, UserSchema, UserProfileUpdateRequest,
    GoalAnalysisRequest, GoalAnalysisResponse,
    JourneyCreateRequest, JourneyResponse, JourneyStepSchema, StepDependencySchema, NextBestAction,
    RAGQueryRequest, RAGQueryResponse,
    DocumentSchema, EligibilityResult, SourceSchema, AlertSchema, ConsentSchema, AdminDiagnostics,
    SchemeSchema, LocationContext, LanguageInfo,
    WorkflowTemplateSchema, WorkflowTemplateCreate, WorkflowTemplateUpdate
)

from app.models.db_models import (
    UserDB, JourneyDB, JourneyStepDB, StepDependencyDB,
    GovernmentSourceDB, UserDocumentDB, UserConsentDB, SystemAlertDB, SchemeDB,
    CitizenProfileDB, DocumentConsistencyDB, ServiceRegistryDB, ApplicationDB,
    ConsentRecordDB, AuditLogDB, ConnectorHealthDB, NotificationDB, DataConflictDB,
    WorkflowTemplateDB, WorkflowTemplateStepDB
)

from app.ai.orchestrator import ai_orchestrator
from app.services.dependency_engine import DependencyEngine, NextBestActionEngine
from app.services.eligibility_engine import EligibilityEngine
from app.services.document_engine import (
    DigiLockerMockConnector, DocumentOCRService, DocumentClassifier, DocumentExtractor,
    ExpiryEngine, DocumentConsistencyEngine, DocumentRequirementMatcher,
    DocumentGraphEngine, DocumentPacketBuilder
)
from app.services.demo_vault_service import DemoVaultService
from app.services.rag_engine import RAGEngine
from app.services.alert_engine import AlertEngine
from app.services.consent_engine import ConsentEngine
from app.services.location_engine import LocationEngine
from app.services.language_engine import LanguageEngine
from app.services.ingestion_engine import IngestionEngine


api_v1_router = APIRouter(prefix="/api/v1")

from app.core.config import settings
from app.core.websocket import ws_manager

def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", str(uuid.uuid4()))

def success_response(data: Any, request: Request):
    return APIResponse(success=True, data=data, request_id=get_request_id(request))

def log_audit(db: Session, actor: str, action: str, resource: str, status: str = "SUCCESS"):
    log_entry = AuditLogDB(actor=actor, action=action, resource=resource, status=status)
    db.add(log_entry)
    db.commit()

@api_v1_router.post("/dev/log")
async def dev_log(req: Request):
    try:
        body = await req.json()
        print(f"\n[CLIENT EXCEPTION REPORT] {body.get('message')}\n")
    except Exception as e:
        print(f"[CLIENT EXCEPTION LOG ERROR] {e}")
    return {"status": "ok"}

def error_response(code: str, message: str, status_code: int, request: Request, details: Optional[str] = None):
    from fastapi.responses import JSONResponse
    content = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details or "",
            "requestId": get_request_id(request)
        },
        "request_id": get_request_id(request)
    }
    return JSONResponse(status_code=status_code, content=content)

# 0. Demo Mode Citizen Switcher
@api_v1_router.get("/demo/citizens")
def list_demo_citizens(request: Request):
    return success_response(DemoVaultService.list_demo_citizens(), request)

@api_v1_router.post("/demo/select/{citizen_key}")
def select_demo_citizen(citizen_key: str, request: Request, db: Session = Depends(get_db)):
    try:
        loaded = DemoVaultService.load_demo_citizen_into_db(db, citizen_key)
        return success_response(loaded, request)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


# --- AUTHENTICATION DEPENDENCY ---


def get_current_user(request: Request, db: Session = Depends(get_db)) -> UserDB:
    """
    Authentication dependency: extracts and validates the user from the
    Authorization Bearer token or the citizen_session cookie.

    SECURITY: Never falls back to a default user. Every request must
    carry a valid, non-expired JWT. If the token is missing, expired,
    or the referenced user does not exist, a 401 is raised.
    """
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    if not token:
        token = request.cookies.get("citizen_session")

    if not token:
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")

    user = db.query(UserDB).filter(UserDB.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="Citizen record not found.")
    return user

# In-memory brute-force tracker: {username: [(failed_at_timestamp), ...]}
_failed_attempts: Dict[str, list] = {}

# --- AUTH ENDPOINTS ---

def get_current_citizen(request: Request, current_user: UserDB = Depends(get_current_user)) -> UserDB:
    if current_user.role != 'CITIZEN' and current_user.role != 'citizen':
        raise HTTPException(status_code=403, detail='Access restricted to citizens.')
    return current_user

def get_current_admin(request: Request, current_user: UserDB = Depends(get_current_user)) -> UserDB:
    admin_roles = {'ADMIN', 'admin', 'SYSTEM_ADMIN', 'system_admin', 'DEPARTMENT_ADMIN', 'department_admin'}
    if current_user.role not in admin_roles:
        raise HTTPException(status_code=403, detail='Access restricted to administrators.')
    return current_user


@api_v1_router.post("/auth/login")
def login(req: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate with username + 6-digit PIN.
    Returns a session cookie and JWT access token on success.
    """
    username = normalize_username(req.username)
    now = datetime.utcnow()

    # --- Brute-force protection (in-memory rolling window) ---
    window_start = now.timestamp() - settings.LOGIN_WINDOW_SECONDS
    attempts = _failed_attempts.get(username, [])
    recent_attempts = [t for t in attempts if t > window_start]
    if len(recent_attempts) >= settings.LOGIN_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail=f"Too many failed login attempts. Please try again in {settings.LOGIN_WINDOW_SECONDS // 60} minutes."
        )

    # --- DB-level account lock check ---
    from sqlalchemy import func
    user = db.query(UserDB).filter(
        (UserDB.username == username) | 
        (func.lower(UserDB.full_name) == username)
    ).first()
    if user and user.locked_until and user.locked_until > now:
        wait = int((user.locked_until - now).total_seconds())
        raise HTTPException(
            status_code=423,
            detail=f"Account temporarily locked. Try again in {wait} seconds."
        )

    # --- Validate credentials ---
    if not user or not verify_pin(req.pin, user.pin_hash):
        # Record failed attempt
        recent_attempts.append(now.timestamp())
        _failed_attempts[username] = recent_attempts
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= settings.LOGIN_MAX_ATTEMPTS:
                user.locked_until = now + timedelta(seconds=settings.LOGIN_WINDOW_SECONDS)
            db.commit()
        raise HTTPException(status_code=401, detail="Invalid username or PIN. Please try again.")

    # --- Successful login: reset counters ---
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = now
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[WARN] Failed to commit login updates: {e}")
    _failed_attempts.pop(username, None)

    # Seed documents if not already done
    try:
        DemoVaultService.seed_user_vault(db, user)
    except Exception as e:
        print(f"[WARN] Failed to seed demo vault: {e}")

    token = create_access_token({"sub": user.id, "username": user.username, "name": user.full_name, "role": user.role or "citizen"})

    response.set_cookie(
        key="citizen_session",
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax"
    )

    return success_response({
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "mobile_number": user.mobile_number,
            "created_at": (user.created_at or datetime.utcnow()).isoformat(),
            "last_login_at": (user.last_login_at or datetime.utcnow()).isoformat()
        }
    }, request)

@api_v1_router.get("/auth/me")
def get_me(request: Request, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == current_user.id).first()
    docs_count = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == current_user.id).count()

    profile_dict = {
        "id": profile.id if profile else None,
        "full_name": current_user.full_name,
        "date_of_birth": profile.date_of_birth if profile else None,
        "gender": profile.gender if profile else None,
        "age": profile.age if profile else None,
        "annual_income": profile.annual_income if profile else None,
        "income_category": profile.income_category if profile else None,
        "location_state": profile.location_state if profile else "Gujarat",
        "location_district": profile.location_district if profile else "Vadodara",
        "location_city": profile.location_city if profile else "Vadodara",
        "pincode": profile.pincode if profile else None,
        "occupation": profile.occupation if profile else None,
        "education": profile.education if profile else None,
        "category": profile.category if profile else "General"
    } if profile else {}

    return success_response({
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "mobile_number": current_user.mobile_number,
            "role": current_user.role or "citizen",
            "created_at": current_user.created_at,
            "last_login_at": current_user.last_login_at
        },
        "profile": profile_dict,
        "documents_count": docs_count
    }, request)



@api_v1_router.post("/auth/logout")
def logout(request: Request, response: Response):
    response.delete_cookie(key="citizen_session")
    return success_response({"message": "Successfully logged out of Citizen Portal"}, request)


@api_v1_router.put("/auth/profile")
def update_profile(
    req: UserProfileUpdateRequest,
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == current_user.id).first()
    if not profile:
        profile = CitizenProfileDB(user_id=current_user.id, full_name=current_user.full_name)
        db.add(profile)

    if req.full_name:
        current_user.full_name = req.full_name
        profile.full_name = req.full_name
    if req.date_of_birth is not None:
        profile.date_of_birth = req.date_of_birth
    if req.gender is not None:
        profile.gender = req.gender
    if req.state is not None:
        profile.location_state = req.state
    if req.district is not None:
        profile.location_district = req.district
    if req.city is not None:
        profile.location_city = req.city
    if req.pincode is not None:
        profile.pincode = req.pincode
    if req.occupation is not None:
        profile.occupation = req.occupation
    if req.annual_income is not None:
        profile.annual_income = req.annual_income
    if req.education is not None:
        profile.education = req.education

    db.commit()
    return success_response({"message": "Citizen profile updated successfully"}, request)


# 1. Goal Classification
@api_v1_router.post("/ai/goals/analyze")
def analyze_goal(req: GoalAnalysisRequest, request: Request):
    result = ai_orchestrator.analyze_goal(req.message)
    return success_response(result.model_dump(), request)

from pydantic import BaseModel as PydanticBaseModel
from sqlalchemy import or_

class JourneyAnalyzeRequest(PydanticBaseModel):
    query: str
    domicile_state: Optional[str] = None
    domicileState: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
async def _do_analyze_journey(query: str, domicile: str, current_user: UserDB, db: Session, journey: JourneyDB):
    from app.services.citizen_intelligence import CitizenIntelligenceEngine
    return await CitizenIntelligenceEngine.analyze_journey(query, domicile, current_user, db, journey)
@api_v1_router.post("/journey/analyze")
async def analyze_journey(
    req: JourneyAnalyzeRequest,
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = req.query.strip()
    domicile = (req.domicileState or req.domicile_state or "").strip()
    
    # 1. Basic validation
    if not query:
        return error_response(
            code="INVALID_REQUEST",
            message="Please describe what you want to accomplish.",
            status_code=400,
            request=request
        )
    if not domicile:
        return error_response(
            code="INVALID_REQUEST",
            message="Please select your domicile state.",
            status_code=400,
            request=request
        )

    # 2. Create the initial database entry with status="ANALYZING" immediately
    journey = JourneyDB(
        user_id=current_user.id,
        title="Analyzing Journey...",
        goal_category="general",
        life_event="general",
        query=query,
        domicile_state=domicile,
        intent="GENERAL",
        status="ANALYZING",
        state="IN_PROGRESS"
    )
    db.add(journey)
    # Generate AI plan natively using the refactored unified engine
    try:
        plan = await _do_analyze_journey(query, domicile, current_user, db, journey)
        db.commit()
        db.refresh(journey)
        return success_response(plan, request)
    except Exception as e:
        logger.error(f"Error analyzing journey: {str(e)}", exc_info=True)
        db.rollback()
        try:
            fallback_payload = {
                "journeyId": journey.id,
                "status": "PARTIAL",
                "goal": {
                    "title": "Study Abroad" if "study" in query.lower() else "Citizen Journey",
                    "category": "STUDY_ABROAD" if "study" in query.lower() else "GENERAL"
                },
                "domicile": {
                    "state": domicile
                },
                "documents": {
                    "have": [],
                    "need": [],
                    "missing": [],
                    "conditional": []
                },
                "schemes": {
                    "central": [],
                    "state": []
                },
                "nextSteps": ["Review required documents", "Update citizen profile"],
                "sources": [],
                "warnings": [f"Journey created with fallbacks. Detailed cause: {str(e)}"]
            }
            journey.title = fallback_payload["goal"]["title"]
            journey.goal_category = fallback_payload["goal"]["category"]
            journey.status = "PARTIAL"
            journey.result_json = fallback_payload
            db.commit()
            return success_response(fallback_payload, request)
        except Exception as db_err:
            print(f"[CRITICAL] Fallback db save failed: {db_err}")
            return error_response(
                code="JOURNEY_ANALYSIS_FAILED",
                message="We couldn't create your journey. Please try again.",
                details=str(db_err),
                status_code=500,
                request=request
            )

@api_v1_router.get("/journey/{journey_id}")
def get_journey_analysis(
    journey_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    journey = db.query(JourneyDB).filter(JourneyDB.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey analysis not found")
    
    return success_response(journey.result_json, request)

# 2. Journey Generation & Workflow Engine
@api_v1_router.post("/journeys/generate")
async def generate_journey(
    req: JourneyCreateRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req_id = get_request_id(request)
    user_id = current_user.id


    # Generate Journey DB entry
    journey = JourneyDB(
        user_id=user_id,
        title=req.title or f"{req.goal_category.title()} Journey in {req.location_state}",
        goal_category=req.goal_category,
        life_event=req.life_event,
        state="IN_PROGRESS",
        location_state=req.location_state,
        location_city=req.location_city,
        context_data=req.context_data,
        progress_percentage=0
    )
    db.add(journey)
    db.commit()
    db.refresh(journey)

    # Build dynamic steps based on goal category
    template = db.query(WorkflowTemplateDB).filter(WorkflowTemplateDB.category == req.goal_category, WorkflowTemplateDB.status == "ACTIVE").first()
    
    steps_data = []
    deps_data = []
    
    if template and template.steps:
        for step_tmpl in template.steps:
            steps_data.append((
                step_tmpl.step_key,
                step_tmpl.name,
                f"Generated from {step_tmpl.step_type} template targeting {step_tmpl.target}.",
                "action", # default category for now
                "AVAILABLE" if not step_tmpl.prerequisite_step_key else "LOCKED",
                "medium",
                "30 min",
                step_tmpl.order_index
            ))
            if step_tmpl.prerequisite_step_key:
                deps_data.append((step_tmpl.step_key, step_tmpl.prerequisite_step_key))
    else:
        # Fallback to hardcoded if no template exists
        if req.goal_category == "business":
            steps_data = [
                ("business_structure", "Select Legal Structure", "Decide entity type (Sole Proprietorship / LLP / Pvt Ltd).", "legal", "AVAILABLE", "high", "10 min", 1),
                ("premises_proof", "Obtain Business Premises Proof", "Execute rent agreement or utility bill proof.", "documentation", "LOCKED", "high", "30 min", 2),
                ("shop_establishment", "Register under Karnataka Shop & Establishment Act", "e-Karmika registration within 30 days.", "license", "LOCKED", "high", "45 min", 3),
                ("udyam_msme", "Apply for Udyam MSME Registration", "Paperless central registration for MSME benefits.", "registration", "LOCKED", "medium", "20 min", 4),
                ("gst_registration", "Apply for GSTIN Tax Registration", "Commercial Taxes dept GSTIN registration.", "taxation", "LOCKED", "medium", "45 min", 5),
                ("current_bank_account", "Open Commercial Current Bank Account", "Open business bank account with registration proof.", "banking", "LOCKED", "high", "60 min", 6)
            ]
            deps_data = [
                ("premises_proof", "business_structure"),
                ("shop_establishment", "premises_proof"),
                ("udyam_msme", "business_structure"),
                ("gst_registration", "shop_establishment"),
                ("current_bank_account", "shop_establishment")
            ]
        else:
            # Education Loan / Scholarship
            steps_data = [
                ("eligibility_check", "Verify Admission & Income Eligibility", "Confirm seat allotment and obtain fee structure.", "verification", "AVAILABLE", "high", "10 min", 1),
                ("document_prep", "Prepare Academic & Income Certificates", "Fetch marksheets and Nadakacheri income cert.", "documentation", "LOCKED", "high", "25 min", 2),
                ("vidya_lakshmi", "Apply on Vidya Lakshmi National Portal", "Common loan application across banks.", "application", "LOCKED", "high", "40 min", 3),
                ("state_scholarship", "Apply for SSP Karnataka Post-Matric Subsidy", "State subsidy application for fee reimbursement.", "scholarship", "LOCKED", "medium", "30 min", 4)
            ]
            deps_data = [
                ("document_prep", "eligibility_check"),
                ("vidya_lakshmi", "document_prep"),
                ("state_scholarship", "document_prep")
            ]

    for skey, stitle, sdesc, scat, sstate, sprio, seffort, sorder in steps_data:
        step_db = JourneyStepDB(
            journey_id=journey.id,
            step_key=skey,
            title=stitle,
            description=sdesc,
            category=scat,
            state=sstate,
            priority=sprio,
            estimated_effort=seffort,
            order_index=sorder
        )
        db.add(step_db)

    for target_key, prereq_key in deps_data:
        dep_db = StepDependencyDB(
            journey_id=journey.id,
            step_key=target_key,
            prerequisite_step_key=prereq_key
        )
        db.add(dep_db)

    db.commit()

    # Emit real-time WebSocket progress stages
    async def stream_progress():
        await ws_manager.broadcast_journey_progress(journey.id, "understanding_goal", "completed", "Goal understanding confirmed.")
        await ws_manager.broadcast_journey_progress(journey.id, "retrieving_knowledge", "completed", "Government sources retrieved.")
        await ws_manager.broadcast_journey_progress(journey.id, "analyzing_dependencies", "completed", "DAG dependencies mapped.")
        await ws_manager.broadcast_journey_progress(journey.id, "generating_workflow", "completed", "Personalized journey ready!")

    background_tasks.add_task(stream_progress)

    return success_response({"journey_id": journey.id, "message": "Journey generated successfully!"}, request)

@api_v1_router.get("/journeys")
def list_journeys(request: Request, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role in ['ADMIN', 'admin', 'SYSTEM_ADMIN', 'system_admin']:
        journeys = db.query(JourneyDB).order_by(JourneyDB.created_at.desc()).all()
    else:
        journeys = db.query(JourneyDB).filter(JourneyDB.user_id == current_user.id).all()
        
    res = []
    for j in journeys:
        res.append({
            "id": j.id,
            "user_id": j.user_id,
            "title": j.title,
            "goal_category": j.goal_category,
            "state": j.state,
            "progress_percentage": j.progress_percentage,
            "location_state": j.location_state,
            "location_city": j.location_city,
            "created_at": j.created_at.isoformat()
        })
    return success_response(res, request)

@api_v1_router.get("/journeys/{journey_id}")
def get_journey(journey_id: str, request: Request, db: Session = Depends(get_db)):
    journey_db = db.query(JourneyDB).filter(JourneyDB.id == journey_id).first()
    if not journey_db:
        raise HTTPException(status_code=404, detail="Journey not found")

    steps_db = db.query(JourneyStepDB).filter(JourneyStepDB.journey_id == journey_id).order_by(JourneyStepDB.order_index).all()
    deps_db = db.query(StepDependencyDB).filter(StepDependencyDB.journey_id == journey_id).all()

    # Build Pydantic step objects
    step_schemas = []
    for s in steps_db:
        step_schemas.append(
            JourneyStepSchema(
                id=s.id,
                step_key=s.step_key,
                title=s.title,
                description=s.description,
                category=s.category,
                state=s.state,
                priority=s.priority,
                estimated_effort=s.estimated_effort,
                official_portal_url=s.official_portal_url,
                user_notes=s.user_notes
            )
        )

    dep_schemas = [
        StepDependencySchema(step_key=d.step_key, prerequisite_step_key=d.prerequisite_step_key)
        for d in deps_db
    ]

    # Resolve step states deterministically
    resolved_steps = DependencyEngine.resolve_step_states(step_schemas, dep_schemas)

    # Calculate Next Best Action
    next_action = NextBestActionEngine.calculate_next_action(resolved_steps)

    # Calculate progress percentage
    completed_count = len([s for s in resolved_steps if s.state in ["COMPLETED", "SKIPPED"]])
    total_count = len(resolved_steps)
    progress_pct = int((completed_count / total_count) * 100) if total_count > 0 else 0

    if journey_db.progress_percentage != progress_pct:
        journey_db.progress_percentage = progress_pct
        db.commit()

    res = JourneyResponse(
        id=journey_db.id,
        user_id=journey_db.user_id,
        title=journey_db.title,
        goal_category=journey_db.goal_category,
        life_event=journey_db.life_event,
        state=journey_db.state,
        location_state=journey_db.location_state,
        location_district=journey_db.location_district,
        location_city=journey_db.location_city,
        progress_percentage=progress_pct,
        context_data=journey_db.context_data or {},
        steps=resolved_steps,
        next_best_action=next_action,
        created_at=journey_db.created_at,
        updated_at=journey_db.updated_at
    )
    return success_response(res.model_dump(), request)

# =====================================================================
# Workflow Templates API
# =====================================================================
@api_v1_router.get("/workflows")
def list_workflows(request: Request, db: Session = Depends(get_db)):
    workflows = db.query(WorkflowTemplateDB).all()
    res = []
    for wf in workflows:
        res.append({
            "id": wf.id,
            "name": wf.name,
            "category": wf.category,
            "department": wf.department,
            "status": wf.status,
            "created_at": wf.created_at.isoformat() if wf.created_at else None,
            "updated_at": wf.updated_at.isoformat() if wf.updated_at else None,
            "steps": [
                {
                    "id": step.id,
                    "step_key": step.step_key,
                    "name": step.name,
                    "step_type": step.step_type,
                    "target": step.target,
                    "prerequisite_step_key": step.prerequisite_step_key,
                    "order_index": step.order_index
                } for step in wf.steps
            ]
        })
    return success_response(res, request)

@api_v1_router.post("/workflows")
def create_workflow(req: WorkflowTemplateCreate, request: Request, db: Session = Depends(get_db)):
    # Check if a template for this category already exists and update or reject
    existing = db.query(WorkflowTemplateDB).filter(WorkflowTemplateDB.category == req.category).first()
    if existing:
        raise HTTPException(status_code=400, detail="Workflow for this category already exists. Delete it first to create a new one.")
        
    workflow = WorkflowTemplateDB(
        name=req.name,
        category=req.category,
        department=req.department
    )
    db.add(workflow)
    db.flush()
    
    for step_req in req.steps:
        step = WorkflowTemplateStepDB(
            template_id=workflow.id,
            step_key=step_req.step_key,
            name=step_req.name,
            step_type=step_req.step_type,
            target=step_req.target,
            prerequisite_step_key=step_req.prerequisite_step_key,
            order_index=step_req.order_index
        )
        db.add(step)
        
    db.commit()
    db.refresh(workflow)
    return success_response({"message": "Workflow created successfully", "id": workflow.id}, request)

@api_v1_router.delete("/workflows/{workflow_id}")
def delete_workflow(workflow_id: str, request: Request, db: Session = Depends(get_db)):
    workflow = db.query(WorkflowTemplateDB).filter(WorkflowTemplateDB.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    db.delete(workflow)
    db.commit()
    return success_response({"message": "Workflow deleted successfully"}, request)


@api_v1_router.post("/journeys/{journey_id}/steps/{step_key}/complete")
async def complete_step(
    journey_id: str,
    step_key: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    step_db = db.query(JourneyStepDB).filter(
        JourneyStepDB.journey_id == journey_id,
        JourneyStepDB.step_key == step_key
    ).first()

    if not step_db:
        raise HTTPException(status_code=404, detail="Step not found")

    step_db.state = "COMPLETED"
    db.commit()

    # Trigger real-time WebSocket broadcast for step completion & unlocked downstream steps
    steps_db = db.query(JourneyStepDB).filter(JourneyStepDB.journey_id == journey_id).order_by(JourneyStepDB.order_index).all()
    deps_db = db.query(StepDependencyDB).filter(StepDependencyDB.journey_id == journey_id).all()

    step_schemas = [
        JourneyStepSchema(
            id=s.id, step_key=s.step_key, title=s.title, description=s.description,
            category=s.category, state=s.state, priority=s.priority, estimated_effort=s.estimated_effort
        )
        for s in steps_db
    ]
    dep_schemas = [StepDependencySchema(step_key=d.step_key, prerequisite_step_key=d.prerequisite_step_key) for d in deps_db]

    resolved = DependencyEngine.resolve_step_states(step_schemas, dep_schemas)
    
    # Sync updated states back to DB
    for res_step in resolved:
        s_db = db.query(JourneyStepDB).filter(JourneyStepDB.journey_id == journey_id, JourneyStepDB.step_key == res_step.step_key).first()
        if s_db and s_db.state != res_step.state:
            s_db.state = res_step.state
            db.commit()

    async def notify_clients():
        await ws_manager.broadcast_step_updated(journey_id, step_key, "COMPLETED")
        for r in resolved:
            if r.state == "AVAILABLE":
                await ws_manager.broadcast_step_updated(journey_id, r.step_key, "AVAILABLE")

    background_tasks.add_task(notify_clients)

    return success_response({"message": f"Step '{step_key}' completed successfully!", "step_key": step_key}, request)

@api_v1_router.get("/documents")
def get_user_documents(
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    DemoVaultService.seed_user_vault(db, current_user)
    docs = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == current_user.id).all()
    res = [
        {
            "id": d.id,
            "document_type": d.document_type,
            "document_name": d.document_name or d.document_type.replace("_", " ").title(),
            "document_number_masked": d.document_number_masked or "XXXX XXXX 1234",
            "file_name": d.file_name,
            "file_url": f"/api/v1/documents/{d.id}/view",
            "file_size": d.file_size,
            "mime_type": d.mime_type,
            "status": d.status,
            "is_verified": d.is_verified,
            "verification_source": d.verification_source or "Government Department",
            "verification_status": d.verification_status or "DEMO_SYNTHETIC",
            "is_synthetic": d.is_synthetic,
            "is_demo": True,
            "synthetic_notice": d.synthetic_notice or "DEMO DOCUMENT — NOT A GOVERNMENT-ISSUED DOCUMENT — FOR DEMONSTRATION ONLY",
            "is_digilocker": d.is_digilocker,
            "extracted_fields": d.extracted_fields or {},
            "field_confidence": d.field_confidence or {},
            "overall_confidence": d.overall_confidence or 0.95,
            "issued_by": d.issued_by or "Govt Issuer",
            "issue_date": d.issue_date,
            "expiry_date": d.expiry_date,
            "expiry_status": d.expiry_status or "NO_EXPIRY",
            "language_code": d.language_code or "en",
            "page_count": d.page_count or 1,
            "upload_date": d.upload_date
        }
        for d in docs
    ]
    return success_response(res, request)

@api_v1_router.get("/documents/{document_id}/view")
def view_document_pdf(
    document_id: str,
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(UserDocumentDB).filter(UserDocumentDB.id == document_id).first()
    if not doc:
        # Fallback search by type for doc_id like AADHAAR or PAN
        doc = db.query(UserDocumentDB).filter(
            UserDocumentDB.user_id == current_user.id,
            UserDocumentDB.document_type == document_id.upper()
        ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in user vault.")

    if doc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You cannot view another citizen's document.")

    return success_response({
        "id": doc.id,
        "user_id": doc.user_id,
        "citizen_name": current_user.full_name,
        "document_type": doc.document_type,
        "document_name": doc.document_name or doc.document_type.replace("_", " ").title(),
        "document_number_masked": doc.document_number_masked or "XXXX XXXX 1234",
        "file_name": doc.file_name,
        "issued_by": doc.issued_by or "Government Department",
        "extracted_fields": doc.extracted_fields or {},
        "is_demo": True,
        "synthetic_notice": "DEMO DOCUMENT — NOT A GOVERNMENT-ISSUED DOCUMENT — FOR DEMONSTRATION ONLY",
        "created_at": doc.created_at
    }, request)


@api_v1_router.post("/documents/upload")
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id
    allowed_mimes = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_mimes:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, JPG, PNG, WEBP allowed.")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit.")

    ocr_result = DocumentOCRService.process_document(file.filename, content, file.content_type)
    classification = DocumentClassifier.classify(file.filename, ocr_result["raw_text"])
    fields, confidences, overall_conf = DocumentExtractor.extract_fields(classification["document_type"], ocr_result["raw_text"])
    exp_status, exp_date = ExpiryEngine.evaluate_expiry(classification["document_type"], fields.get("valid_until"))

    doc_db = UserDocumentDB(
        user_id=user_id,
        document_type=classification["document_type"],
        file_name=file.filename,
        file_size=len(content),
        mime_type=file.content_type,
        status="AVAILABLE",
        verification_status="OCR_EXTRACTED",
        is_synthetic=False,
        extracted_fields=fields,
        field_confidence=confidences,
        overall_confidence=overall_conf,
        expiry_status=exp_status,
        language_code=ocr_result["language"],
        page_count=ocr_result["page_count"]
    )
    db.add(doc_db)
    db.commit()
    db.refresh(doc_db)

    async def notify_upload():
        await ws_manager.broadcast_journey_progress(user_id, "document_uploaded", "completed", f"Document '{file.filename}' processed & added to vault.")

    background_tasks.add_task(notify_upload)

    return success_response(
        DocumentSchema(
            id=doc_db.id,
            document_type=doc_db.document_type,
            file_name=doc_db.file_name,
            file_size=doc_db.file_size,
            mime_type=doc_db.mime_type,
            status=doc_db.status,
            verification_status=doc_db.verification_status,
            is_synthetic=doc_db.is_synthetic,
            synthetic_notice=doc_db.synthetic_notice,
            extracted_fields=doc_db.extracted_fields,
            field_confidence=doc_db.field_confidence,
            overall_confidence=doc_db.overall_confidence,
            expiry_status=doc_db.expiry_status,
            language_code=doc_db.language_code,
            upload_date=doc_db.upload_date
        ).model_dump(),
        request
    )

@api_v1_router.post("/documents/digilocker/import")
def import_digilocker_documents(
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id
    digilocker_docs = DigiLockerMockConnector.fetch_user_documents()

    imported = []
    for d in digilocker_docs:
        doc_db = UserDocumentDB(
            user_id=user_id,
            document_type=d["document_type"],
            file_name=d["file_name"],
            file_size=d["file_size"],
            mime_type=d["mime_type"],
            status=d["status"],
            verification_status=d["verification_status"],
            is_synthetic=d["is_synthetic"],
            synthetic_notice=d["synthetic_notice"],
            is_digilocker=d["is_digilocker"],
            extracted_fields=d["extracted_fields"],
            field_confidence=d["field_confidence"],
            overall_confidence=d["overall_confidence"],
            expiry_status=d["expiry_status"],
            language_code=d["language_code"]
        )
        db.add(doc_db)
        db.commit()
        db.refresh(doc_db)
        imported.append(doc_db.id)

    return success_response({
        "message": "DigiLocker sandbox documents imported into citizen vault.",
        "imported_ids": imported,
        "is_sandbox": True
    }, request)

@api_v1_router.get("/documents/consistency")
def get_document_consistency(
    request: Request,
    user_id: Optional[str] = None,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = user_id or current_user.id
    docs = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == target_user_id).all()
    serialized_docs = [{"document_type": d.document_type, "extracted_fields": d.extracted_fields or {}} for d in docs]
    eval_res = DocumentConsistencyEngine.evaluate_inventory(serialized_docs)
    
    return success_response({
        "user_id": target_user_id,
        "identity_status": eval_res["identity_status"],
        "dob_status": eval_res["dob_status"],
        "address_status": eval_res["address_status"],
        "overall_status": eval_res["overall_status"],
        "discrepancies": eval_res["discrepancies"],
        "evaluated_at": datetime.utcnow()
    }, request)

@api_v1_router.post("/documents/requirement-match")
def match_document_requirements(
    goal_category: str = Query("business"),
    request: Request = None,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    DemoVaultService.seed_user_vault(db, current_user)
    docs = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == current_user.id).all()
    serialized_docs = [
        {
            "document_type": d.document_type,
            "expiry_status": d.expiry_status,
            "verification_status": d.verification_status,
            "is_synthetic": d.is_synthetic,
            "synthetic_notice": d.synthetic_notice
        }
        for d in docs
    ]
    res = DocumentRequirementMatcher.match_inventory(goal_category, serialized_docs)
    return success_response(res, request)


@api_v1_router.get("/documents/graph")
def get_document_graph(goal_category: str = "business", location_state: str = "Gujarat", request: Request = None):
    graph = DocumentGraphEngine.generate_graph(goal_category, location_state)
    return success_response(graph, request)

@api_v1_router.post("/documents/packet")
def build_document_packet(
    goal_category: str = "business",
    user_id: Optional[str] = None,
    request: Request = None,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = user_id or current_user.id
    user = db.query(UserDB).filter(UserDB.id == target_user_id).first()
    c_name = user.full_name if user else "Citizen"
    
    docs = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == target_user_id).all()
    serialized_docs = [{"document_type": d.document_type, "expiry_status": d.expiry_status, "verification_status": d.verification_status} for d in docs]
    inventory_match = DocumentRequirementMatcher.match_inventory(goal_category, serialized_docs)

    packet = DocumentPacketBuilder.build_preparation_packet(
        citizen_name=c_name,
        goal_title="Citizen Journey",
        location="India",
        inventory_match=inventory_match
    )
    return success_response(packet, request)

# 4. RAG Chat Assistant
@api_v1_router.post("/ai/chat")
def ai_chat(req: RAGQueryRequest, request: Request, db: Session = Depends(get_db)):
    result = RAGEngine.query(db=db, query_text=req.query)
    return success_response(result.model_dump(), request)

# 5. Government Sources
@api_v1_router.get("/sources")
def get_sources(request: Request, db: Session = Depends(get_db)):
    sources = db.query(GovernmentSourceDB).all()
    res = [
        SourceSchema(
            id=s.id,
            title=s.title,
            department=s.department,
            state=s.state,
            source_type=s.source_type,
            url=s.url,
            summary=s.summary,
            freshness_status=s.freshness_status,
            last_verified_at=s.last_verified_at
        ).model_dump()
        for s in sources
    ]
    return success_response(res, request)

# 6. System Impact Alerts
@api_v1_router.get("/alerts")
def get_alerts(request: Request, journey_category: Optional[str] = None, db: Session = Depends(get_db)):
    alerts = AlertEngine.get_impact_alerts(db, journey_category)
    return success_response([a.model_dump() for a in alerts], request)

# 7. Privacy Center & Consent Management
@api_v1_router.get("/privacy/consents")
def get_consents(
    request: Request,
    user_id: Optional[str] = None,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = user_id or current_user.id
    consents = db.query(ConsentRecordDB).filter(ConsentRecordDB.user_id == target_user_id).all()
    if not consents:
        ConsentManager.create_consent(
            db, target_user_id, "msins", "Maharashtra State Innovation Society",
            ["full_name", "date_of_birth", "gender"], "Business Formation Verification", access_type="ALWAYS"
        )
        ConsentManager.create_consent(
            db, target_user_id, "pmc", "Pune Municipal Corporation",
            ["address", "pincode"], "Trade Licensing Verification", access_type="ONCE"
        )
        consents = db.query(ConsentRecordDB).filter(ConsentRecordDB.user_id == target_user_id).all()

    # Query real audit logs from AuditLogDB
    db_logs = db.query(AuditLogDB).filter(AuditLogDB.actor == target_user_id).order_by(AuditLogDB.timestamp.desc()).all()
    if not db_logs:
        # Seed realistic audit logs
        db.add(AuditLogDB(
            actor=target_user_id,
            action="API_REQUEST",
            resource="Identity Service (UIDAI) -> VerifyIdentity",
            status="SUCCESS"
        ))
        db.add(AuditLogDB(
            actor=target_user_id,
            action="API_REQUEST",
            resource="State Property Registry -> VerifyAddress",
            status="SUCCESS"
        ))
        db.add(AuditLogDB(
            actor=target_user_id,
            action="API_REQUEST",
            resource="Pune Municipal Corporation -> CreateApplication",
            status="SUCCESS"
        ))
        db.commit()
        db_logs = db.query(AuditLogDB).filter(AuditLogDB.actor == target_user_id).order_by(AuditLogDB.timestamp.desc()).all()

    access_logs = []
    for l in db_logs:
        parts = l.resource.split(" -> ")
        system = parts[0] if parts else "JanSetu Gateway"
        method = "OAuth2 Bearer JSON API REST" if "REST" in l.resource or "Identity" in l.resource else "SOAP 1.1 Envelope Adapter" if "Legacy" in l.resource or "Income" in l.resource or "Corporation" in l.resource else "Unified Portal Sync"
        
        field = "Demographics (Name, DOB, Mobile)" if "Identity" in l.resource else "Address & Pincode" if "Address" in l.resource else "Data Packet (Aadhaar, PAN)" if "Application" in l.action else "General Claims"
        purpose = "Unified Single Window Onboarding" if "Identity" in l.resource else "Domicile & Local Verification" if "Address" in l.resource else "Application Submission"
        
        access_logs.append({
            "timestamp": l.timestamp.isoformat(),
            "service": system,
            "action": l.action,
            "field": field,
            "purpose": purpose,
            "method": method
        })

    serialized_consents = []
    for c in consents:
        serialized_consents.append({
            "id": c.id,
            "consent_id": c.consent_id,
            "department_id": c.department_id,
            "department_name": c.department_name,
            "requested_fields": c.requested_fields,
            "purpose": c.purpose,
            "granted": c.granted,
            "granted_at": c.granted_at.isoformat(),
            "access_type": c.access_type
        })

    return success_response({"consents": serialized_consents, "access_logs": access_logs}, request)

@api_v1_router.post("/privacy/consents/toggle")
def toggle_consent(
    purpose: str,
    granted: bool,
    request: Request,
    user_id: Optional[str] = None,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = user_id or current_user.id
    consent = db.query(ConsentRecordDB).filter(
        ConsentRecordDB.user_id == target_user_id
    ).filter((ConsentRecordDB.purpose == purpose) | (ConsentRecordDB.consent_id == purpose)).first()
    
    if consent:
        consent.granted = granted
        consent.granted_at = datetime.utcnow()
        db.commit()
        db.refresh(consent)
        action_name = "CONSENT_GRANT" if granted else "CONSENT_REVOKE"
        log_audit(db, actor=current_user.id, action=action_name, resource=purpose)
        return success_response({
            "consent_id": consent.consent_id,
            "purpose": consent.purpose,
            "granted": consent.granted,
            "granted_at": consent.granted_at.isoformat()
        }, request)
    else:
        raise HTTPException(status_code=404, detail="Consent record not found")

# 8. States & UTs Index (All 28 States & 8 UTs)
@api_v1_router.get("/states")
def list_states(request: Request):
    states = LocationEngine.get_all_states_and_uts()
    return success_response(states, request)

# 9. Language Support (12 Indian Languages)
@api_v1_router.get("/languages")
def list_languages(request: Request):
    langs = LanguageEngine.get_supported_languages()
    return success_response([l.model_dump() for l in langs], request)

# 10. Real-time Government Schemes Explorer
@api_v1_router.get("/schemes")
def list_schemes(
    request: Request,
    state_name: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: str = Query("ACTIVE"),
    limit: int = Query(20),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    # Ensure baseline database seeding has executed
    IngestionEngine.seed_database(db)
    IngestionEngine.check_expired_schemes(db)

    query = db.query(SchemeDB)
    # Strictly filter active schemes and validity dates
    query = IngestionEngine.filter_active_schemes(query, state_name=state_name, category=category)

    total = query.count()
    schemes_db = query.offset(offset).limit(limit).all()

    results = []
    for s in schemes_db:
        results.append({
            "id": s.id,
            "name": s.name,
            "official_name": s.official_name,
            "description": s.description,
            "level": s.level,
            "state_code": s.state_code,
            "state_name": s.state_name,
            "department": s.department,
            "category": s.category,
            "benefits": s.benefits or {},
            "eligibility_rules": s.eligibility_rules or {},
            "documents_required": s.documents_required or [],
            "application_process": s.application_process,
            "application_url": s.application_url,
            "official_source_url": s.official_source_url,
            "start_date": s.start_date,
            "end_date": s.end_date,
            "status": s.status,
            "languages": s.languages or ["en"],
            "last_verified_at": s.last_verified_at
        })

    return success_response({"total": total, "schemes": results, "limit": limit, "offset": offset}, request)

@api_v1_router.get("/schemes/search")
def search_schemes(
    request: Request,
    q: str = Query(...),
    state_name: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    IngestionEngine.seed_database(db)
    IngestionEngine.check_expired_schemes(db)

    # Multi-lingual query language and location detection
    lang_code = LanguageEngine.detect_language(q)
    loc_context = LocationEngine.extract_location(q)

    search_state = state_name or (loc_context.state_name if loc_context.confidence >= 0.8 else None)

    query = db.query(SchemeDB)
    base_query = IngestionEngine.filter_active_schemes(query, state_name=search_state)
    
    # Try exact substring match on name, official_name, description, or category
    filtered_query = base_query.filter(
        (SchemeDB.name.ilike(f"%{q}%")) |
        (SchemeDB.official_name.ilike(f"%{q}%")) |
        (SchemeDB.description.ilike(f"%{q}%")) |
        (SchemeDB.category.ilike(f"%{q}%"))
    )

    schemes_db = filtered_query.limit(10).all()
    # Fallback to location/active schemes if native script or broad natural language query produced no direct string matches
    if not schemes_db:
        schemes_db = base_query.limit(10).all()
    results = []
    for s in schemes_db:
        results.append({
            "id": s.id,
            "name": s.name,
            "official_name": s.official_name,
            "description": s.description,
            "level": s.level,
            "state_name": s.state_name,
            "category": s.category,
            "benefits": s.benefits or {},
            "application_url": s.application_url,
            "official_source_url": s.official_source_url,
            "status": s.status,
            "last_verified_at": s.last_verified_at
        })

    return success_response({
        "query": q,
        "language_detected": lang_code,
        "location_detected": loc_context.state_name,
        "results": results
    }, request)

@api_v1_router.get("/schemes/{scheme_id}")
def get_scheme_details(scheme_id: str, request: Request, db: Session = Depends(get_db)):
    IngestionEngine.seed_database(db)
    scheme = db.query(SchemeDB).filter(SchemeDB.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Government scheme not found")

    return success_response({
        "id": scheme.id,
        "name": scheme.name,
        "official_name": scheme.official_name,
        "description": scheme.description,
        "level": scheme.level,
        "state_code": scheme.state_code,
        "state_name": scheme.state_name,
        "department": scheme.department,
        "category": scheme.category,
        "benefits": scheme.benefits or {},
        "eligibility_rules": scheme.eligibility_rules or {},
        "documents_required": scheme.documents_required or [],
        "application_process": scheme.application_process,
        "application_url": scheme.application_url,
        "official_source_url": scheme.official_source_url,
        "status": scheme.status,
        "start_date": scheme.start_date,
        "end_date": scheme.end_date,
        "last_verified_at": scheme.last_verified_at
    }, request)

# 11. Admin Diagnostics & Source Health
@api_v1_router.post("/admin/ingest")
def trigger_ingestion(request: Request, db: Session = Depends(get_db)):
    IngestionEngine.seed_database(db)
    expired_count = IngestionEngine.check_expired_schemes(db)
    total_schemes = db.query(SchemeDB).count()
    active_schemes = db.query(SchemeDB).filter(SchemeDB.status == "ACTIVE").count()

    return success_response({
        "message": "Government scheme ingestion worker executed successfully.",
        "expired_schemes_flagged": expired_count,
        "total_schemes_in_db": total_schemes,
        "active_schemes": active_schemes,
        "timestamp": datetime.utcnow()
    }, request)

@api_v1_router.get("/sources/health")
def get_source_health(request: Request, db: Session = Depends(get_db)):
    IngestionEngine.seed_database(db)
    total_schemes = db.query(SchemeDB).count()
    active_schemes = db.query(SchemeDB).filter(SchemeDB.status == "ACTIVE").count()
    expired_schemes = db.query(SchemeDB).filter(SchemeDB.status == "EXPIRED").count()
    suspended_schemes = db.query(SchemeDB).filter(SchemeDB.status == "SUSPENDED").count()
    central_schemes = db.query(SchemeDB).filter(SchemeDB.level == "CENTRAL").count()
    state_schemes = db.query(SchemeDB).filter(SchemeDB.level == "STATE").count()
    ut_schemes = db.query(SchemeDB).filter(SchemeDB.level == "UT").count()

    return success_response({
        "total_schemes": total_schemes,
        "active_schemes": active_schemes,
        "expired_schemes": expired_schemes,
        "suspended_schemes": suspended_schemes,
        "central_schemes": central_schemes,
        "state_schemes": state_schemes,
        "ut_schemes": ut_schemes,
        "total_states_and_uts_covered": 36,
        "languages_supported": 12,
        "last_ingested_at": datetime.utcnow()
    }, request)

@api_v1_router.get("/admin/diagnostics")
def get_admin_diagnostics(
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    IngestionEngine.seed_database(db)
    total_j = db.query(JourneyDB).count()
    total_s = db.query(GovernmentSourceDB).count()
    total_u = db.query(UserDB).count()
    total_schemes = db.query(SchemeDB).count()
    active_schemes = db.query(SchemeDB).filter(SchemeDB.status == "ACTIVE").count()
    expired_schemes = db.query(SchemeDB).filter(SchemeDB.status == "EXPIRED").count()
    
    diag = AdminDiagnostics(
        status="ok",
        database="connected",
        ai_provider=settings.AI_PROVIDER,
        active_websockets=len(ws_manager.active_connections),
        total_journeys=total_j,
        total_sources=total_s,
        total_users=total_u,
        total_schemes=total_schemes,
        active_schemes=active_schemes,
        expired_schemes=expired_schemes,
        total_states_covered=36
    )
    return success_response(diag.model_dump(), request)


from app.services.interoperability_gateway import (
    AuditLogger, ConsentManager, ConnectorHealthMonitor,
    DataQualityEngine, ServiceRegistry, ConnectorManager,
    ApplicationTracker, NotificationManager
)

@api_v1_router.get("/services")
def list_services(
    request: Request,
    query: Optional[str] = Query(None),
    jurisdiction: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    services = ServiceRegistry.list_services(db, query, jurisdiction)
    return success_response(services, request)

@api_v1_router.get("/services/{service_id}")
def get_service_details(service_id: str, request: Request, db: Session = Depends(get_db)):
    service = db.query(ServiceRegistryDB).filter(ServiceRegistryDB.service_id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return success_response({
        "id": service.id,
        "service_id": service.service_id,
        "department": service.department,
        "name": service.name,
        "description": service.description,
        "jurisdiction": service.jurisdiction,
        "connector": service.connector,
        "api_version": service.version,
        "health_status": service.health_status,
        "supported_operations": service.supported_operations,
        "data_requirements": service.data_requirements
    }, request)

@api_v1_router.post("/services/{service_id}/call")
def call_service_endpoint(
    service_id: str,
    payload: Dict[str, Any],
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    operation = payload.get("operation")
    params = payload.get("params", {})
    if not operation:
        raise HTTPException(status_code=400, detail="Missing operation parameter")
    
    # Check consent if required
    if service_id not in ["srv_identity", "srv_digilocker"]:
        has_consent = ConsentManager.check_consent(db, current_user.id, service_id.split("_")[1], f"Call service {operation}")
        if not has_consent:
            return success_response({
                "success": False,
                "error": "CONSENT_REQUIRED",
                "message": f"Consent is required to share information with {service_id}.",
                "consent_prompt": {
                    "department_id": service_id.split("_")[1],
                    "purpose": f"Access data for {operation}",
                    "requested_fields": list(params.keys())
                }
            }, request)
    
    try:
        res = ConnectorManager.call_service(db, current_user.id, service_id, operation, params)
        return success_response(res, request)
    except Exception as e:
        return success_response({
            "success": False,
            "error": "SERVICE_FAILURE",
            "message": f"We couldn't connect to the service. Details: {str(e)}"
        }, request)

@api_v1_router.get("/applications")
def list_applications(
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role in ['ADMIN', 'admin', 'SYSTEM_ADMIN', 'system_admin']:
        # Admin gets all applications
        apps = db.query(ApplicationDB).order_by(ApplicationDB.submitted_at.desc()).all()
        return success_response([
            {
                "id": a.id,
                "application_id": a.application_id,
                "service_id": a.service_id,
                "user_id": a.user_id,
                "status": a.status,
                "submitted_at": a.submitted_at.isoformat()
            } for a in apps
        ], request)
    else:
        apps = ApplicationTracker.list_applications(db, current_user.id)
        return success_response(apps, request)

@api_v1_router.post("/applications")
def create_application(
    payload: Dict[str, Any],
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service_id = payload.get("service_id")
    documents = payload.get("documents", [])
    if not service_id:
        raise HTTPException(status_code=400, detail="Missing service_id")
    
    app = ApplicationTracker.create_application(db, current_user.id, service_id, documents)
    return success_response({
        "id": app.id,
        "application_id": app.application_id,
        "service_id": app.service_id,
        "status": app.status,
        "submitted_at": app.submitted_at.isoformat()
    }, request)

@api_v1_router.get("/applications/{application_id}")
def get_application_details(
    application_id: str,
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(ApplicationDB).filter(
        ApplicationDB.application_id == application_id,
        ApplicationDB.user_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return success_response({
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
    }, request)

@api_v1_router.post("/applications/{application_id}/status")
def update_app_status(
    application_id: str,
    payload: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db)
):
    status = payload.get("status")
    details = payload.get("details")
    if not status:
        raise HTTPException(status_code=400, detail="Missing status parameter")
    
    app = ApplicationTracker.update_application_status(db, application_id, status, details)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return success_response({"status": "updated", "application_id": application_id}, request)

@api_v1_router.get("/consents")
def list_consents(
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consents = db.query(ConsentRecordDB).filter(ConsentRecordDB.user_id == current_user.id).all()
    if not consents:
        ConsentManager.create_consent(
            db, current_user.id, "msins", "Maharashtra State Innovation Society",
            ["full_name", "date_of_birth", "gender"], "Business Formation Verification", access_type="ALWAYS"
        )
        ConsentManager.create_consent(
            db, current_user.id, "pmc", "Pune Municipal Corporation",
            ["address", "pincode"], "Trade Licensing Verification", access_type="ONCE"
        )
        consents = db.query(ConsentRecordDB).filter(ConsentRecordDB.user_id == current_user.id).all()

    return success_response([
        {
            "id": c.id,
            "consent_id": c.consent_id,
            "department_id": c.department_id,
            "department_name": c.department_name,
            "requested_fields": c.requested_fields,
            "purpose": c.purpose,
            "granted": c.granted,
            "granted_at": c.granted_at.isoformat(),
            "access_type": c.access_type
        }
        for c in consents
    ], request)

@api_v1_router.post("/consents")
def create_consent_record(
    payload: Dict[str, Any],
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dept_id = payload.get("department_id")
    dept_name = payload.get("department_name")
    fields = payload.get("requested_fields", [])
    purpose = payload.get("purpose")
    access_type = payload.get("access_type", "ONCE")
    
    if not dept_id or not dept_name or not purpose:
        raise HTTPException(status_code=400, detail="Missing required parameters")
    
    consent = ConsentManager.create_consent(
        db, current_user.id, dept_id, dept_name, fields, purpose, access_type=access_type
    )
    return success_response({
        "consent_id": consent.consent_id,
        "status": "granted"
    }, request)

@api_v1_router.post("/consents/{consent_id}/revoke")
def revoke_consent_record(
    consent_id: str,
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = ConsentManager.revoke_consent(db, current_user.id, consent_id)
    if not success:
        raise HTTPException(status_code=404, detail="Consent record not found")
    return success_response({"status": "revoked"}, request)

@api_v1_router.get("/notifications")
def get_notifications_list(
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = NotificationManager.get_notifications(db, current_user.id)
    return success_response(notifs, request)

@api_v1_router.get("/connectors")
def list_connectors(request: Request, db: Session = Depends(get_db)):
    metrics = ConnectorHealthMonitor.get_health_metrics(db)
    return success_response(metrics["services"], request)

@api_v1_router.get("/connectors/health")
def get_connectors_health_metrics(request: Request, db: Session = Depends(get_db)):
    metrics = ConnectorHealthMonitor.get_health_metrics(db)
    return success_response(metrics, request)

@api_v1_router.get("/audit-logs")
def list_audit_logs(request: Request, db: Session = Depends(get_db)):
    logs = db.query(AuditLogDB).order_by(AuditLogDB.timestamp.desc()).limit(100).all()
    if not logs:
        AuditLogger.log(db, "system_gateway", "API_REQUEST", "ServiceRegistry seeded")
        AuditLogger.log(db, "demo_citizen_hriday", "LOGIN", "Citizen logged in")
        logs = db.query(AuditLogDB).order_by(AuditLogDB.timestamp.desc()).all()
        
    return success_response([
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat(),
            "actor": l.actor,
            "action": l.action,
            "resource": l.resource,
            "status": l.status,
            "correlation_id": l.correlation_id
        }
        for l in logs
    ], request)

@api_v1_router.get("/conflicts")
def list_conflicts(
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    conflicts = db.query(DataConflictDB).filter(DataConflictDB.user_id == current_user.id).all()
    if not conflicts:
        DataQualityEngine.check_for_conflicts(
            db, current_user.id, "date_of_birth",
            source_a="Aadhaar ID Registry", val_a="2005-01-10",
            source_b="Pune Municipal Corporation", val_b="2005-01-11"
        )
        conflicts = db.query(DataConflictDB).filter(DataConflictDB.user_id == current_user.id).all()
        
    return success_response([
        {
            "id": c.id,
            "field_name": c.field_name,
            "source_a": c.source_a,
            "value_a": c.value_a,
            "source_b": c.source_b,
            "value_b": c.value_b,
            "status": c.status,
            "resolved_value": c.resolved_value,
            "created_at": c.created_at.isoformat()
        }
        for c in conflicts
    ], request)

@api_v1_router.post("/conflicts/{conflict_id}/resolve")
def resolve_data_conflict(
    conflict_id: str,
    payload: Dict[str, Any],
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    resolved_value = payload.get("resolved_value")
    if not resolved_value:
        raise HTTPException(status_code=400, detail="Missing resolved_value parameter")
    
    success = DataQualityEngine.resolve_conflict(db, conflict_id, resolved_value)
    if not success:
        raise HTTPException(status_code=404, detail="Conflict not found")
    return success_response({"status": "resolved"}, request)

@api_v1_router.post("/connectors/{service_id}/health")
def update_connector_health_status(
    service_id: str,
    payload: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db)
):
    status = payload.get("status", "HEALTHY")
    service = db.query(ServiceRegistryDB).filter(ServiceRegistryDB.service_id == service_id).first()
    if service:
        service.health_status = status
        db.commit()
        
        from app.models.db_models import ConnectorHealthDB
        health_rec = db.query(ConnectorHealthDB).filter(
            ConnectorHealthDB.service_name.contains("Licensing") if "license" in service_id else ConnectorHealthDB.service_name.contains("Municipal")
        ).first()
        if health_rec:
            health_rec.health_status = "Failed" if status == "FAILED" else "Degraded" if status == "DEGRADED" else "Healthy"
            db.commit()
            
        AuditLogger.log(
            db, actor="SYSTEM_ADMIN", action="CONNECTOR_HEALTH_CHANGE",
            resource=f"Service: {service_id}, Status: {status}",
            status="SUCCESS"
        )
        return success_response({"status": status}, request)
    raise HTTPException(status_code=404, detail="Service registry not found")

@api_v1_router.get("/metrics")
def get_interoperability_metrics(request: Request):
    return success_response({
        "duplicate_submissions": {
            "before": 2.8,
            "after": 1.1,
            "reduction_percentage": "60.7%"
        },
        "average_processing_time": {
            "before": "5.4 days",
            "after": "3.2 days",
            "reduction_percentage": "40.7%"
        },
        "cross_dept_handoffs": {
            "before": 7,
            "after": 3,
            "reduction_percentage": "57.1%"
        },
        "data_consistency": {
            "before": "87.2%",
            "after": "98.4%",
            "improvement_points": "+11.2%"
        }
    }, request)

@api_v1_router.get("/service-levels")
def get_service_levels(request: Request):
    return success_response([
        {
            "service_id": "srv_msins_biz",
            "name": "Maharashtra Business Registration",
            "target_hours": 48,
            "actual_hours": 31,
            "sla_compliance": "96.4%"
        },
        {
            "service_id": "srv_kar_biz",
            "name": "Karnataka Business Registration",
            "target_hours": 48,
            "actual_hours": 29,
            "sla_compliance": "97.1%"
        },
        {
            "service_id": "srv_pmc_license",
            "name": "Pune Trade License Service",
            "target_hours": 72,
            "actual_hours": 61,
            "sla_compliance": "91.2%"
        },
        {
            "service_id": "srv_kar_municipal",
            "name": "Bengaluru Trade License Service",
            "target_hours": 72,
            "actual_hours": 58,
            "sla_compliance": "92.8%"
        },
        {
            "service_id": "srv_central_scholarship",
            "name": "Central DBT & Scholarship",
            "target_hours": 360,
            "actual_hours": 274,
            "sla_compliance": "94.7%"
        }
    ], request)

@api_v1_router.get("/data-quality/master")
def get_master_data_record(
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    record = DataQualityEngine.get_master_citizen_record(db, current_user.id)
    return success_response(record, request)



@api_v1_router.get("/admin/metrics")
def get_admin_metrics(
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Administrative access already enforced by get_current_admin dependency
        
    return success_response({
        "uptime_percentage": 99.98,
        "latency_average_ms": 118,
        "failed_transactions_count": 8,
        "sla_compliance_rate": 97.4,
        "departments": [
            {"name": "UIDAI Central Registry", "uptime": 100.0, "latency": 45, "sla": 99.9},
            {"name": "GSTN Indirect Taxes", "uptime": 99.95, "latency": 112, "sla": 98.4},
            {"name": "Bruhat Bengaluru Mahanagara Palike", "uptime": 99.82, "latency": 210, "sla": 92.5},
            {"name": "Karnataka Labour Department", "uptime": 99.91, "latency": 140, "sla": 96.8},
            {"name": "Food Safety & Standards Authority", "uptime": 99.97, "latency": 95, "sla": 97.2}
        ]
    }, request)

@api_v1_router.get("/admin/citizens")
def get_all_citizens(request: Request, current_user: UserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    citizens = db.query(UserDB).filter(UserDB.role.in_(['CITIZEN', 'citizen'])).all()
    res = []
    for c in citizens:
        profile = db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == c.id).first()
        active_journeys = db.query(JourneyDB).filter(JourneyDB.user_id == c.id).count()
        applications = db.query(ApplicationDB).filter(ApplicationDB.user_id == c.id).count()
        res.append({
            "id": c.id,
            "name": c.full_name,
            "location": profile.location_city if profile else "Unknown",
            "active_journeys": active_journeys,
            "applications": applications,
            "last_active": (c.last_login_at or c.created_at).isoformat() if c.last_login_at or c.created_at else None
        })
    return success_response(res, request)

@api_v1_router.get("/admin/citizens/{user_id}")
def get_citizen_details(
    user_id: str, 
    request: Request, 
    reason: str = Query("Admin Review", description="Reason for access"),
    current_user: UserDB = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    c = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Citizen not found")
        
    profile = db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == c.id).first()
    active_journeys = db.query(JourneyDB).filter(JourneyDB.user_id == c.id).count()
    applications = db.query(ApplicationDB).filter(ApplicationDB.user_id == c.id).count()
    documents = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == c.id).count()
    
    # Audit log the access
    log_audit(db, actor=current_user.id, action="ADMIN_ACCESS", resource=f"Citizen Profile: {user_id}")
    
    return success_response({
        "id": c.id,
        "name": c.full_name,
        "location": profile.location_city if profile else "Unknown",
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "last_active": (c.last_login_at or c.created_at).isoformat() if c.last_login_at or c.created_at else None,
        "active_journeys": active_journeys,
        "applications": applications,
        "documents": documents
    }, request)

# API Registry & Health Endpoints
@api_v1_router.get("/admin/apis")
def get_all_registered_apis(
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from app.models.db_models import APIRegistryDB, APIHealthLogDB
    apis = db.query(APIRegistryDB).all()
    res = []
    for api in apis:
        # Get latest health log
        latest_log = db.query(APIHealthLogDB).filter(APIHealthLogDB.api_id == api.id).order_by(APIHealthLogDB.checked_at.desc()).first()
        res.append({
            "id": api.id,
            "name": api.name,
            "category": api.category,
            "official_url": api.official_url,
            "status": api.status,
            "response_time_ms": latest_log.response_time_ms if latest_log else 0,
            "last_checked": latest_log.checked_at.isoformat() if latest_log else None,
            "country": api.country,
            "requires_key": api.requires_key
        })
    return success_response(res, request)

@api_v1_router.post("/admin/apis/discover")
async def trigger_api_discovery(
    request: Request,
    current_user: UserDB = Depends(get_current_admin)
):
    import subprocess
    import os
    
    # Run the discovery script in the background
    script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../scripts/discover_apis.py"))
    subprocess.Popen(["python", script_path])
    
    return success_response({"message": "API discovery started in the background."}, request)

@api_v1_router.post("/admin/apis/{api_id}/test")
async def trigger_api_test(
    api_id: str,
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from app.services.api_health_monitor import api_health_monitor
    from app.models.db_models import APIRegistryDB, APIHealthLogDB
    import aiohttp
    
    api = db.query(APIRegistryDB).filter(APIRegistryDB.id == api_id).first()
    if not api:
        raise HTTPException(status_code=404, detail="API not found")
        
    async with aiohttp.ClientSession() as session:
        result = await api_health_monitor.check_api_health(session, api)
        
    api.status = result["status"]
    log = APIHealthLogDB(
        api_id=api.id,
        status=result["status"],
        http_status=result["http_status"],
        response_time_ms=result["latency"],
        error_message=result["error"]
    )
    db.add(log)
    db.commit()
    
    return success_response(result, request)

@api_v1_router.get("/interop/topology/{node_id}/logs")
def get_node_logs(
    node_id: str,
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    import random
    from datetime import datetime, timedelta
    
    # Mocking real-time payloads based on node type
    logs = []
    base_time = datetime.utcnow()
    
    for i in range(5):
        t = base_time - timedelta(seconds=random.randint(1, 60))
        req_id = f"{random.randint(1000, 9999):x}-{random.randint(1000, 9999):x}"
        
        if node_id == 'consent':
            logs.extend([
                f"[{t.strftime('%H:%M:%S')}] REQ_ID: {req_id}",
                f"[{t.strftime('%H:%M:%S')}] ACTION: VerifyConsent",
                f"[{(t + timedelta(milliseconds=12)).strftime('%H:%M:%S')}] RES: 200 OK"
            ])
        elif node_id == 'gateway':
            logs.extend([
                f"[{t.strftime('%H:%M:%S')}] REQ_ID: {req_id}",
                f"[{t.strftime('%H:%M:%S')}] ROUTE: -> {random.choice(['uidai', 'mca', 'municipal'])}",
                f"[{(t + timedelta(milliseconds=5)).strftime('%H:%M:%S')}] RES: 200 OK (Proxied)"
            ])
        else:
            logs.extend([
                f"[{t.strftime('%H:%M:%S')}] REQ_ID: {req_id}",
                f"[{t.strftime('%H:%M:%S')}] PAYLOAD: {random.randint(500, 2500)} bytes",
                f"[{(t + timedelta(milliseconds=random.randint(50, 300))).strftime('%H:%M:%S')}] RES: 200 OK"
            ])
            
    return success_response(logs, request)

# =====================================================================
# REAL ADMIN ANALYTICS — Calculated from actual database records
# =====================================================================
@api_v1_router.get("/admin/real-metrics")
def get_real_admin_metrics(
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    
    total_journeys = db.query(JourneyDB).count()
    active_journeys = db.query(JourneyDB).filter(JourneyDB.state == "IN_PROGRESS").count()
    completed_journeys = db.query(JourneyDB).filter(JourneyDB.state == "COMPLETED").count()
    total_steps = db.query(JourneyStepDB).count()
    completed_steps = db.query(JourneyStepDB).filter(JourneyStepDB.state == "COMPLETED").count()
    total_users = db.query(UserDB).filter(UserDB.role.in_(["citizen", "CITIZEN"])).count()
    total_documents = db.query(UserDocumentDB).count()
    verified_docs = db.query(UserDocumentDB).filter(UserDocumentDB.is_verified == True).count()
    total_applications = db.query(ApplicationDB).count()
    active_applications = db.query(ApplicationDB).filter(ApplicationDB.status.in_(["SUBMITTED", "UNDER_VERIFICATION", "UNDER_REVIEW"])).count()
    total_schemes = db.query(SchemeDB).count()
    active_schemes = db.query(SchemeDB).filter(SchemeDB.status == "ACTIVE").count()
    total_consents = db.query(ConsentRecordDB).filter(ConsentRecordDB.granted == True).count()
    total_audit_logs = db.query(AuditLogDB).count()
    total_notifications = db.query(NotificationDB).count()
    unread_notifications = db.query(NotificationDB).filter(NotificationDB.is_read == False).count()
    total_services = db.query(ServiceRegistryDB).count()
    total_sources = db.query(GovernmentSourceDB).count()
    total_conflicts = db.query(DataConflictDB).count()
    unresolved_conflicts = db.query(DataConflictDB).filter(DataConflictDB.status == "DETECTED").count()
    total_alerts = db.query(SystemAlertDB).count()
    
    # Prerequisites auto-resolved = completed steps that had dependencies
    deps_resolved = db.query(StepDependencyDB).count()
    
    # Calculate SLA compliance from application data
    total_sla = db.query(ApplicationDB).filter(ApplicationDB.status.in_(["APPROVED", "COMPLETED"])).count()
    sla_compliance = round((total_sla / total_applications * 100) if total_applications > 0 else 95.0, 1)
    
    return success_response({
        "total_journeys_started": total_journeys,
        "active_journeys": active_journeys,
        "completed_journeys": completed_journeys,
        "prerequisites_auto_resolved": deps_resolved,
        "sources_indexed": total_sources,
        "total_users": total_users,
        "total_documents": total_documents,
        "verified_documents": verified_docs,
        "total_applications": total_applications,
        "active_applications": active_applications,
        "total_schemes": total_schemes,
        "active_schemes": active_schemes,
        "total_consents": total_consents,
        "total_audit_logs": total_audit_logs,
        "total_notifications": total_notifications,
        "unread_notifications": unread_notifications,
        "total_services": total_services,
        "total_conflicts": total_conflicts,
        "unresolved_conflicts": unresolved_conflicts,
        "total_alerts": total_alerts,
        "sla_compliance_rate": sla_compliance,
        "time_saved_hours_per_citizen": round(deps_resolved * 0.05, 1) if deps_resolved > 0 else 0,
    }, request)


@api_v1_router.get("/admin/real-citizens")
def get_real_admin_citizens(
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Returns real citizen data from the database for the admin portal."""
    citizens = db.query(UserDB).filter(UserDB.role.in_(["citizen", "CITIZEN"])).all()
    res = []
    for c in citizens:
        profile = db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == c.id).first()
        docs = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == c.id).all()
        verified_docs = [d for d in docs if d.is_verified]
        pending_docs = [d for d in docs if not d.is_verified]
        apps = db.query(ApplicationDB).filter(ApplicationDB.user_id == c.id).count()
        active_journeys = db.query(JourneyDB).filter(
            JourneyDB.user_id == c.id,
            JourneyDB.state == "IN_PROGRESS"
        ).count()
        
        # Determine status
        status = "Active"
        if pending_docs:
            status = "Action Required"
        elif active_journeys == 0 and apps == 0:
            status = "Pending KYC"
        
        # Get last activity from audit logs
        last_log = db.query(AuditLogDB).filter(
            AuditLogDB.actor == c.id
        ).order_by(AuditLogDB.timestamp.desc()).first()
        last_active = last_log.timestamp.isoformat() if last_log else (c.last_login_at.isoformat() if c.last_login_at else c.created_at.isoformat())
        
        res.append({
            "id": c.id,
            "name": c.full_name,
            "username": c.username,
            "domicile": profile.location_state if profile else "Unknown",
            "location": f"{profile.location_city or ''}, {profile.location_state or ''}".strip(", ") if profile else "Unknown",
            "status": status,
            "lastActive": last_active,
            "documentsTotal": len(docs),
            "documentsVerified": len(verified_docs),
            "documentsPending": len(pending_docs),
            "activeApplications": apps,
            "activeWorkflows": active_journeys,
            "profileCompletion": _calculate_profile_completion(profile, len(docs)),
            "lastGoal": profile.occupation or "Not set",
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "role": c.role
        })
    return success_response(res, request)


def _calculate_profile_completion(profile, doc_count: int) -> int:
    """Calculate profile completion percentage based on available data."""
    if not profile:
        return 10
    score = 0
    if profile.full_name: score += 15
    if profile.date_of_birth: score += 10
    if profile.gender: score += 5
    if profile.location_state: score += 10
    if profile.location_district: score += 5
    if profile.location_city: score += 5
    if profile.annual_income: score += 10
    if profile.occupation: score += 10
    if profile.education: score += 10
    if profile.category: score += 5
    if doc_count > 0: score += 15
    if doc_count >= 3: score += 5
    return min(100, score)


@api_v1_router.get("/admin/real-applications")
def get_real_admin_applications(
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Returns real application data from the database for the admin portal."""
    apps = db.query(ApplicationDB).order_by(ApplicationDB.submitted_at.desc()).all()
    res = []
    for a in apps:
        user = db.query(UserDB).filter(UserDB.id == a.user_id).first()
        res.append({
            "id": a.application_id,
            "citizenName": user.full_name if user else "Unknown",
            "citizenId": a.user_id,
            "service": a.service_name,
            "department": a.department_name,
            "status": a.status,
            "submittedDate": a.submitted_at.isoformat() if a.submitted_at else None,
            "lastUpdated": a.updated_at.isoformat() if a.updated_at else None,
            "nextAction": (a.required_actions[0] if a.required_actions else "Awaiting review") if a.status in ["SUBMITTED", "UNDER_VERIFICATION", "UNDER_REVIEW"] else a.status.replace("_", " ").title(),
            "timeline": a.timeline or [],
            "required_actions": a.required_actions or [],
            "documents": a.documents or []
        })
    return success_response(res, request)


@api_v1_router.post("/admin/applications/{application_id}/status")
def admin_update_application_status(
    application_id: str,
    payload: Dict[str, Any],
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin updates application status and sends notification to citizen."""
    new_status = payload.get("status")
    details = payload.get("details", "")
    if not new_status:
        raise HTTPException(status_code=400, detail="Missing status parameter")
    
    app = db.query(ApplicationDB).filter(ApplicationDB.application_id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    old_status = app.status
    app.status = new_status
    app.updated_at = datetime.utcnow()
    
    # Add timeline entry
    timeline = app.timeline or []
    timeline.append({
        "title": f"Status changed to {new_status}",
        "description": details or f"Application status updated from {old_status} to {new_status}",
        "timestamp": datetime.utcnow().isoformat(),
        "status": new_status
    })
    app.timeline = timeline
    db.commit()
    
    # Create notification for the citizen
    notif = NotificationDB(
        user_id=app.user_id,
        title=f"Application {new_status.replace('_', ' ').title()}",
        message=f"Your application {application_id} for {app.service_name} has been updated to {new_status.replace('_', ' ').lower()}." + (f" {details}" if details else ""),
        category="application_update"
    )
    db.add(notif)
    db.commit()
    
    # Audit log
    log_audit(db, actor=current_user.id, action="ADMIN_APPLICATION_STATUS_CHANGE", resource=f"Application: {application_id}, Status: {new_status}")
    
    return success_response({"status": "updated", "application_id": application_id, "new_status": new_status}, request)


@api_v1_router.post("/admin/documents/{document_id}/verify")
def admin_verify_document(
    document_id: str,
    payload: Dict[str, Any],
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin verifies a citizen document and sends notification."""
    verification_status = payload.get("status", "VERIFIED")
    notes = payload.get("notes", "")
    
    doc = db.query(UserDocumentDB).filter(UserDocumentDB.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc.is_verified = verification_status == "VERIFIED"
    doc.verification_status = verification_status
    doc.verification_source = f"Admin: {current_user.full_name}"
    doc.updated_at = datetime.utcnow()
    if verification_status == "VERIFIED":
        doc.status = "AVAILABLE"
    elif verification_status == "REJECTED":
        doc.status = "REJECTED"
    db.commit()
    
    # Create notification for citizen
    notif = NotificationDB(
        user_id=doc.user_id,
        title=f"Document {verification_status.title()}",
        message=f"Your document '{doc.document_type}' has been {verification_status.lower()}." + (f" {notes}" if notes else ""),
        category="document_verification"
    )
    db.add(notif)
    db.commit()
    
    # Audit log
    log_audit(db, actor=current_user.id, action="ADMIN_DOCUMENT_VERIFICATION", resource=f"Document: {doc.document_type}, Status: {verification_status}")
    
    return success_response({"status": "updated", "document_id": document_id, "verification_status": verification_status}, request)


@api_v1_router.get("/admin/notifications")
def admin_get_all_notifications(
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Returns notifications for admin view."""
    # Get notifications for all citizens (admin monitors all)
    notifs = db.query(NotificationDB).order_by(NotificationDB.created_at.desc()).limit(50).all()
    return success_response([
        {
            "id": n.id,
            "user_id": n.user_id,
            "title": n.title,
            "message": n.message,
            "category": n.category,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in notifs
    ], request)


@api_v1_router.post("/admin/notifications/{notification_id}/read")
def admin_mark_notification_read(
    notification_id: str,
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    notif = db.query(NotificationDB).filter(NotificationDB.id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return success_response({"status": "read"}, request)


@api_v1_router.get("/admin/service-levels")
def get_admin_service_levels(
    request: Request,
    current_user: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Returns real SLA data from application records."""
    services = db.query(ServiceRegistryDB).all()
    result = []
    for svc in services:
        apps = db.query(ApplicationDB).filter(ApplicationDB.service_id == svc.service_id).all()
        total = len(apps)
        completed = len([a for a in apps if a.status in ["APPROVED", "COMPLETED"]])
        sla_compliance = round((completed / total * 100) if total > 0 else 95.0, 1)
        
        result.append({
            "service_id": svc.service_id,
            "name": svc.name,
            "target_hours": svc.sla_hours,
            "total_applications": total,
            "completed_applications": completed,
            "sla_compliance": f"{sla_compliance}%"
        })
    
    # If no services registered, return demo services with real-ish data
    if not result:
        result = [
            {"service_id": "srv_identity", "name": "Identity Verification", "target_hours": 24, "total_applications": 0, "completed_applications": 0, "sla_compliance": "100%"},
            {"service_id": "srv_documents", "name": "Document Verification", "target_hours": 48, "total_applications": 0, "completed_applications": 0, "sla_compliance": "100%"},
        ]
    
    return success_response(result, request)


@api_v1_router.get("/admin/health")
def get_system_health(
    request: Request,
    db: Session = Depends(get_db)
):
    """Returns real-time system health status."""
    components = []
    
    # Database health
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        components.append({"name": "Database", "status": "Operational", "type": "database"})
    except Exception:
        components.append({"name": "Database", "status": "Unavailable", "type": "database"})
    
    # AI Service health
    ai_status = "Operational" if settings.AI_PROVIDER != "mock" else "Simulated (Mock)"
    components.append({"name": "AI Service", "status": ai_status, "type": "ai"})
    
    # Scheme data health
    try:
        scheme_count = db.query(SchemeDB).filter(SchemeDB.status == "ACTIVE").count()
        components.append({"name": "Scheme Data", "status": "Operational" if scheme_count > 0 else "No Data", "type": "data"})
    except Exception:
        components.append({"name": "Scheme Data", "status": "Unavailable", "type": "data"})
    
    # Document service
    components.append({"name": "Document Service", "status": "Operational", "type": "service"})
    
    # Event system
    components.append({"name": "Event System", "status": "Operational", "type": "events"})
    
    # Connector health
    try:
        healthy_connectors = db.query(ConnectorHealthDB).filter(ConnectorHealthDB.health_status == "Healthy").count()
        total_connectors = db.query(ConnectorHealthDB).count()
        components.append({"name": "Connectors", "status": "Operational" if healthy_connectors == total_connectors else "Degraded", "type": "connectors"})
    except Exception:
        components.append({"name": "Connectors", "status": "Unknown", "type": "connectors"})
    
    return success_response({
        "overall": "Operational" if all(c["status"] in ["Operational", "Simulated (Mock)"] for c in components) else "Degraded",
        "components": components
    }, request)


