import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, BackgroundTasks, UploadFile, File, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (

    normalize_mobile_number, validate_mobile_number, generate_secure_otp,
    hash_otp, verify_otp_hash, create_access_token, decode_access_token
)
from app.services.otp_provider import get_otp_provider

from app.models.schemas import (
    APIResponse, ErrorDetail, OTPRequest, OTPVerifyRequest, AuthTokenResponse, UserProfileUpdateRequest, UserSchema,
    GoalAnalysisRequest, GoalAnalysisResponse,
    JourneyCreateRequest, JourneyResponse, JourneyStepSchema, StepDependencySchema, NextBestAction,
    RAGQueryRequest, RAGQueryResponse,
    DocumentSchema, EligibilityResult, SourceSchema, AlertSchema, ConsentSchema, AdminDiagnostics,
    SchemeSchema, LocationContext, LanguageInfo
)

from app.models.db_models import (
    UserDB, OTPVerificationDB, JourneyDB, JourneyStepDB, StepDependencyDB,
    GovernmentSourceDB, UserDocumentDB, UserConsentDB, SystemAlertDB, SchemeDB,
    CitizenProfileDB, DocumentConsistencyDB
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



from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, BackgroundTasks, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.websocket import ws_manager

def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", str(uuid.uuid4()))

def success_response(data: Any, request: Request):
    return APIResponse(success=True, data=data, request_id=get_request_id(request))

def error_response(code: str, message: str, status_code: int, request: Request):
    return APIResponse(
        success=False,
        error=ErrorDetail(code=code, message=message, request_id=get_request_id(request)),
        request_id=get_request_id(request)
    )

# --- AUTHENTICATION DEPENDENCY ---
def get_current_user(request: Request, db: Session = Depends(get_db)) -> UserDB:
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    if not token:
        token = request.cookies.get("citizen_session")
        
    if not token:
        demo_param = request.query_params.get("user_id")
        if demo_param:
            user = db.query(UserDB).filter(UserDB.id == demo_param).first()
            if user:
                return user
        raise HTTPException(status_code=401, detail="Authentication required. Please log in with your mobile number.")
        
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")
        
    user = db.query(UserDB).filter(UserDB.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="Citizen record not found.")
    return user

@api_v1_router.get("/health/otp")
def get_otp_health(request: Request):
    provider_name = (settings.OTP_PROVIDER or "dev").lower()
    
    is_configured = False
    service_configured = False
    
    if provider_name == "twilio":
        is_configured = bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN)
        service_configured = bool(settings.TWILIO_VERIFY_SERVICE_SID or settings.TWILIO_SERVICE_SID)
    elif provider_name == "msg91":
        is_configured = bool(settings.MSG91_AUTH_KEY)
        service_configured = bool(settings.MSG91_TEMPLATE_ID)
    else:
        is_configured = settings.DEV_OTP_MODE or settings.DEV_AUTH_MODE
        service_configured = settings.DEV_OTP_MODE or settings.DEV_AUTH_MODE

    return success_response({
        "provider": provider_name,
        "configured": is_configured,
        "service_configured": service_configured,
        "dev_otp_mode": settings.DEV_OTP_MODE or settings.DEV_AUTH_MODE,
        "environment": "development" if (settings.DEV_OTP_MODE or settings.DEV_AUTH_MODE) else "production"
    }, request)

@api_v1_router.get("/health/whatsapp")
def get_whatsapp_health(request: Request):
    provider_name = (settings.OTP_PROVIDER or "dev").lower()
    verify_configured = bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and (settings.TWILIO_VERIFY_SERVICE_SID or settings.TWILIO_SERVICE_SID))
    whatsapp_sender_configured = bool(settings.TWILIO_WHATSAPP_SENDER)

    return success_response({
        "provider": provider_name,
        "channel": settings.OTP_CHANNEL or "whatsapp",
        "verify_configured": verify_configured,
        "whatsapp_sender_configured": whatsapp_sender_configured,
        "environment": "development" if (settings.DEV_OTP_MODE or settings.DEV_AUTH_MODE) else "production"
    }, request)


# --- AUTH ENDPOINTS ---
@api_v1_router.post("/auth/request-otp")
async def request_otp(req: OTPRequest, request: Request, db: Session = Depends(get_db)):
    if not req.mobile_number or not req.full_name:
        raise HTTPException(status_code=400, detail="Full name and mobile number are required")
        
    normalized_mobile = normalize_mobile_number(req.mobile_number)
    if not validate_mobile_number(normalized_mobile):
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit Indian mobile number")

    now = datetime.utcnow()
    existing_otps = db.query(OTPVerificationDB).filter(
        OTPVerificationDB.mobile_number == normalized_mobile,
        OTPVerificationDB.verified_at == None,
        OTPVerificationDB.expires_at > now
    ).all()
    
    if existing_otps:
        latest = existing_otps[0]
        if latest.resend_cooldown_until and latest.resend_cooldown_until > now:
            wait_seconds = int((latest.resend_cooldown_until - now).total_seconds())
            raise HTTPException(status_code=429, detail=f"Please wait {wait_seconds} seconds before requesting another code.")

    expires_at = now + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    cooldown_until = now + timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)

    verification = OTPVerificationDB(
        mobile_number=normalized_mobile,
        otp_hash="MANAGED_SERVICE",
        expires_at=expires_at,
        attempt_count=0,
        max_attempts=settings.OTP_MAX_ATTEMPTS,
        resend_cooldown_until=cooldown_until
    )
    db.add(verification)
    db.commit()

    provider = get_otp_provider()
    provider_res = await provider.send_otp(normalized_mobile)

    if not provider_res.get("success"):
        raise HTTPException(
            status_code=400,
            detail=provider_res.get("error", "We couldn't send the verification code. Please check your mobile number and try again.")
        )

    payload = {
        "mobile_number": normalized_mobile,
        "expires_in_seconds": settings.OTP_EXPIRY_MINUTES * 60,
        "cooldown_seconds": settings.OTP_RESEND_COOLDOWN_SECONDS,
        "message": f"Verification code sent to {normalized_mobile}"
    }
    if settings.DEV_OTP_MODE or provider_res.get("dev_otp"):
        payload["dev_otp"] = provider_res.get("dev_otp")

    return success_response(payload, request)

@api_v1_router.post("/auth/verify-otp")
async def verify_otp(req: OTPVerifyRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    normalized_mobile = normalize_mobile_number(req.mobile_number)
    now = datetime.utcnow()

    provider = get_otp_provider()
    verify_res = await provider.verify_otp(normalized_mobile, req.otp)

    if not verify_res.get("success"):
        raise HTTPException(status_code=400, detail=verify_res.get("error", "Invalid or expired verification code."))

    # Verification successful - create or fetch user


    user = db.query(UserDB).filter(UserDB.mobile_number == normalized_mobile).first()
    is_new_user = False
    if not user:
        is_new_user = True
        user = UserDB(
            full_name=req.full_name.strip() or "Citizen",
            mobile_number=normalized_mobile,
            mobile_verified=True,
            last_login_at=now
        )
        db.add(user)
        db.commit()

        profile = CitizenProfileDB(
            user_id=user.id,
            full_name=user.full_name,
            location_state="Gujarat",
            location_city="Vadodara"
        )
        db.add(profile)
        db.commit()

        DemoVaultService.seed_user_vault(db, user)
    else:
        user.last_login_at = now
        if req.full_name and req.full_name.strip() and user.full_name != req.full_name.strip():
            user.full_name = req.full_name.strip()
        db.commit()
        DemoVaultService.seed_user_vault(db, user)

    token = create_access_token({"sub": user.id, "mobile": user.mobile_number, "name": user.full_name})

    response.set_cookie(
        key="citizen_session",
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax"
    )

    profile_db = db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == user.id).first()
    profile_data = {
        "id": profile_db.id if profile_db else "",
        "full_name": user.full_name,
        "location_state": profile_db.location_state if profile_db else "Gujarat",
        "location_city": profile_db.location_city if profile_db else "Vadodara",
        "occupation": profile_db.occupation if profile_db else None
    } if profile_db else {}

    return success_response({
        "access_token": token,
        "token_type": "bearer",
        "is_new_user": is_new_user,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "mobile_number": user.mobile_number,
            "mobile_verified": True,
            "created_at": user.created_at
        },
        "profile": profile_data
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
            "full_name": current_user.full_name,
            "mobile_number": current_user.mobile_number,
            "mobile_verified": current_user.mobile_verified,
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
def list_journeys(
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id
    journeys_db = db.query(JourneyDB).filter(JourneyDB.user_id == user_id).all()

    results = []
    for j in journeys_db:
        # Load steps and dependencies to resolve states
        steps_db = db.query(JourneyStepDB).filter(JourneyStepDB.journey_id == j.id).order_by(JourneyStepDB.order_index).all()
        deps_db = db.query(StepDependencyDB).filter(StepDependencyDB.journey_id == j.id).all()
        
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
        
        # Serialize resolved_steps
        serialized_steps = []
        for s in resolved_steps:
            serialized_steps.append({
                "id": s.id,
                "step_key": s.step_key,
                "title": s.title,
                "description": s.description,
                "category": s.category,
                "state": s.state,
                "priority": s.priority,
                "estimated_effort": s.estimated_effort,
                "official_portal_url": s.official_portal_url,
                "user_notes": s.user_notes,
                "prerequisites": s.prerequisites
            })

        results.append({
            "id": j.id,
            "title": j.title,
            "goal_category": j.goal_category,
            "life_event": j.life_event,
            "state": j.state,
            "location_state": j.location_state,
            "location_city": j.location_city,
            "progress_percentage": j.progress_percentage,
            "steps": serialized_steps,
            "updated_at": j.updated_at
        })
    return success_response(results, request)

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

    response_payload = JourneyResponse(
        id=journey_db.id,
        user_id=journey_db.user_id,
        title=journey_db.title,
        goal_category=journey_db.goal_category,
        life_event=journey_db.life_event,
        state=journey_db.state,
        location_state=journey_db.location_state,
        location_city=journey_db.location_city,
        progress_percentage=progress_pct,
        context_data=journey_db.context_data or {},
        steps=resolved_steps,
        next_best_action=next_action,
        created_at=journey_db.created_at,
        updated_at=journey_db.updated_at
    )

    return success_response(response_payload.model_dump(), request)

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
def get_document_consistency(request: Request, user_id: str = "demo_user_1", db: Session = Depends(get_db)):
    docs = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == user_id).all()
    serialized_docs = [{"document_type": d.document_type, "extracted_fields": d.extracted_fields or {}} for d in docs]
    eval_res = DocumentConsistencyEngine.evaluate_inventory(serialized_docs)
    
    return success_response({
        "user_id": user_id,
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
    user_id: str = "demo_user_1",
    request: Request = None,
    db: Session = Depends(get_db)
):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    c_name = user.full_name if user else "Citizen"
    
    docs = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == user_id).all()
    serialized_docs = [{"document_type": d.document_type, "expiry_status": d.expiry_status, "verification_status": d.verification_status} for d in docs]
    inventory_match = DocumentRequirementMatcher.match_inventory(goal_category, serialized_docs)

    packet = DocumentPacketBuilder.build_preparation_packet(
        citizen_name=c_name,
        goal_title="Start Business in Vadodara",
        location="Vadodara, Gujarat",
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
def get_consents(request: Request, user_id: str = "demo_user_1", db: Session = Depends(get_db)):
    consents = ConsentEngine.get_user_consents(db, user_id)
    logs = ConsentEngine.get_data_access_logs(user_id)
    return success_response({"consents": [c.model_dump() for c in consents], "access_logs": logs}, request)

@api_v1_router.post("/privacy/consents/toggle")
def toggle_consent(purpose: str, granted: bool, request: Request, user_id: str = "demo_user_1", db: Session = Depends(get_db)):
    updated = ConsentEngine.toggle_consent(db, user_id, purpose, granted)
    return success_response(updated.model_dump(), request)

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
def get_admin_diagnostics(request: Request, db: Session = Depends(get_db)):
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

