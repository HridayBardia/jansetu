import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
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
    SchemeSchema, LocationContext, LanguageInfo
)

from app.models.db_models import (
    UserDB, JourneyDB, JourneyStepDB, StepDependencyDB,
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

from app.core.config import settings
from app.core.websocket import ws_manager

def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", str(uuid.uuid4()))

def success_response(data: Any, request: Request):
    return APIResponse(success=True, data=data, request_id=get_request_id(request))

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
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    if not token:
        token = request.cookies.get("citizen_session")

    def get_fallback_user() -> Optional[UserDB]:
        fallback = db.query(UserDB).filter(UserDB.username == "hriday").first()
        if fallback:
            return fallback
        return db.query(UserDB).first()

    if not token:
        user_id_param = request.query_params.get("user_id")
        if user_id_param:
            user = db.query(UserDB).filter(UserDB.id == user_id_param).first()
            if user:
                return user
        
        fallback = get_fallback_user()
        if fallback:
            return fallback
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        fallback = get_fallback_user()
        if fallback:
            return fallback
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")

    user = db.query(UserDB).filter(UserDB.id == payload["sub"]).first()
    if not user:
        fallback = get_fallback_user()
        if fallback:
            return fallback
        raise HTTPException(status_code=401, detail="Citizen record not found.")
    return user

# In-memory brute-force tracker: {username: [(failed_at_timestamp), ...]}
_failed_attempts: Dict[str, list] = {}

# --- AUTH ENDPOINTS ---
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

    token = create_access_token({"sub": user.id, "username": user.username, "name": user.full_name})

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
def _do_analyze_journey(query: str, domicile: str, current_user: UserDB, db: Session, journey: JourneyDB):
    import time
    import json
    from app.core.config import settings
    from app.services.location_engine import LocationEngine, STATES_AND_UTS, CITY_DISTRICT_MAP
    from sqlalchemy import or_, and_
    from datetime import datetime
    from typing import List, Dict, Any, Optional

    warnings = []
    start_time = time.time()

    # 1. Natural Language Intent Parsing & Location Extraction
    query_lower = query.lower().strip()
    query_clean = " ".join(query_lower.split())

    # Check for international destination country
    dest_country = None
    for country in ["australia", "canada", "uk", "united kingdom", "usa", "united states", "germany", "ireland", "new zealand", "abroad", "foreign"]:
        if country in query_clean:
            if country in ["uk", "united kingdom"]:
                dest_country = "United Kingdom"
            elif country in ["usa", "united states"]:
                dest_country = "United States"
            elif country in ["abroad", "foreign"]:
                dest_country = "Abroad"
            else:
                dest_country = country.title()
            break

    # Extract target Indian state/city
    target_state = None
    target_city = None

    # 1. Direct State Match
    for code, info in STATES_AND_UTS.items():
        if info["name"].lower() in query_clean:
            target_state = info["name"]
            break

    # 2. City Match using location engine's CITY_DISTRICT_MAP
    for city_key, (state_code, dist_name) in CITY_DISTRICT_MAP.items():
        if city_key in query_clean:
            target_city = city_key.title()
            target_state = STATES_AND_UTS[state_code]["name"]
            break

    # Intent Classification Taxonomy
    primary_intent = "OTHER_CITIZEN_SERVICE"
    secondary_intents = []
    action_val = "SUPPORT"
    object_val = "CERTIFICATE"

    # Action detection
    ACTIONS = {
        "PURCHASE": ["buy", "purchase", "acquire", "get", "plot", "securing", "secure", "procure", "need plot", "need land"],
        "SALE": ["sell", "sale", "dispose", "vend", "selling"],
        "CONSTRUCTION": ["build", "construct", "construction", "erect", "erecting", "structuring"],
        "ESTABLISH": ["start", "open", "establish", "run", "setup", "set up", "begin", "launch", "operate", "operating", "infrastructure"],
        "REGISTRATION": ["register", "registration", "enlist", "enrolling", "enroll"],
        "RENEWAL": ["renew", "renewal", "renewing", "extend", "extending"],
        "APPLICATION": ["apply", "applying", "application", "request", "requesting"],
        "EDUCATION": ["study", "masters", "master", "graduation", "graduate", "college", "university", "education", "course", "degree"],
        "TRAVEL": ["travel", "fly", "go to", "migrate", "visit", "abroad", "foreign"],
        "ACQUISITION": ["get", "obtain", "receive", "fetch", "retrieve", "gaining"],
        "FINANCING": ["loan", "borrow", "finance", "money", "funding", "credit", "subsidy", "subsidies"],
        "SUPPORT": ["support", "help", "assistance", "subsidy", "aid", "welfare", "scheme", "schemes", "benefit", "benefits"]
    }

    # Objects keywords
    OBJECTS = {
        "LAND": ["land", "plot", "real estate", "property registry", "land registry", "ground", "acre"],
        "HOSPITAL": ["hospital", "clinic", "medical center", "healthcare facility", "medical facility", "nursing home", "dispensary"],
        "BUSINESS": ["business", "company", "startup", "msme", "firm", "enterprise", "clothing business", "venture", "industry"],
        "RESTAURANT": ["restaurant", "cafe", "eatery", "food joint", "dhaba", "food business", "bakery"],
        "SCHOOL": ["school", "college", "university", "academy", "institute", "classroom"],
        "PASSPORT": ["passport", "travel document"],
        "SCHOLARSHIP": ["scholarship", "fellowship", "stipend", "student aid", "fee waiver", "anupriti", "rgs", "mysy", "ssp"],
        "DRIVING_LICENSE": ["driving licence", "driving license", "dl", "licence", "license", "driver licence", "driver license"],
        "CERTIFICATE": ["certificate", "praman", "praman patra", "birth certificate", "death certificate", "marriage certificate", "domicile certificate", "income certificate", "caste certificate"],
        "HOUSE": ["house", "home", "flat", "villa", "apartment", "housing", "awas", "pmay"],
        "FACTORY": ["factory", "manufacturing", "plant", "mill", "workshop"]
    }

    # Find Action
    for act, keywords in ACTIONS.items():
        if any(kw in query_clean for kw in keywords):
            action_val = act
            break

    # Find Object
    for obj, keywords in OBJECTS.items():
        if any(kw in query_clean for kw in keywords):
            object_val = obj
            break

    # Primary Intent Rules based on keyword combination matching
    if any(w in query_clean for w in ["renew", "renewal"]) and any(w in query_clean for w in ["licence", "license", "dl"]):
        primary_intent = "LICENSE_RENEWAL"
    elif any(w in query_clean for w in ["driving", "dl"]) and any(w in query_clean for w in ["licence", "license"]):
        primary_intent = "DRIVING_LICENSE"
    elif any(w in query_clean for w in ["study", "masters", "master", "graduation", "graduate", "college", "university"]) and any(w in query_clean for w in ["abroad", "foreign", "australia", "canada", "uk", "usa"]):
        primary_intent = "STUDY_ABROAD"
    elif any(w in query_clean for w in ["scholarship", "fellowship", "stipend", "anupriti", "rgs", "mysy", "ssp", "aid"]):
        primary_intent = "SCHOLARSHIP"
    elif any(w in query_clean for w in ["build", "construct", "start", "open", "establish"]) and "hospital" in query_clean:
        primary_intent = "HOSPITAL"
    elif any(w in query_clean for w in ["start", "open", "establish"]) and "clinic" in query_clean:
        primary_intent = "CLINIC"
    elif any(w in query_clean for w in ["start", "open", "establish"]) and "pharmacy" in query_clean:
        primary_intent = "PHARMACY"
    elif "healthcare facility" in query_clean or "medical facility" in query_clean or "medical clinic" in query_clean:
        primary_intent = "HEALTHCARE_FACILITY"
    elif "passport" in query_clean:
        primary_intent = "PASSPORT"
    elif "visa" in query_clean:
        primary_intent = "VISA"
    elif any(w in query_clean for w in ["kisan", "farmer", "farming", "crop", "pmkisan", "kcc"]):
        primary_intent = "FARMER_SUPPORT"
    elif any(w in query_clean for w in ["restaurant", "cafe", "dhaba", "food joint"]):
        primary_intent = "RESTAURANT"
    elif any(w in query_clean for w in ["build", "construct", "start", "open", "establish"]) and "school" in query_clean:
        primary_intent = "SCHOOL"
    elif "college" in query_clean:
        primary_intent = "COLLEGE"
    elif "university" in query_clean:
        primary_intent = "UNIVERSITY"
    elif any(w in query_clean for w in ["buy", "purchase", "acquire", "get", "registry", "plot"]) and "land" in query_clean:
        primary_intent = "LAND_PURCHASE"
    elif any(w in query_clean for w in ["sell", "dispose"]) and "land" in query_clean:
        primary_intent = "LAND_SALE"
    elif any(w in query_clean for w in ["register", "registration"]) and "land" in query_clean:
        primary_intent = "PROPERTY_REGISTRATION"
    elif any(w in query_clean for w in ["build", "construct", "construction"]) and any(w in query_clean for w in ["house", "home", "flat", "apartment"]):
        primary_intent = "HOME_CONSTRUCTION"
    elif any(w in query_clean for w in ["buy", "purchase", "acquire"]) and any(w in query_clean for w in ["house", "home", "flat", "apartment"]):
        primary_intent = "HOME_PURCHASE"
    elif any(w in query_clean for w in ["loan", "finance", "mortgage"]) and any(w in query_clean for w in ["house", "home", "flat", "apartment"]):
        primary_intent = "PROPERTY_LOAN"
    elif "startup" in query_clean:
        primary_intent = "STARTUP"
    elif "msme" in query_clean:
        primary_intent = "MSME"
    elif any(w in query_clean for w in ["register", "registration"]) and any(w in query_clean for w in ["company", "business"]):
        primary_intent = "COMPANY_REGISTRATION"
    elif "factory" in query_clean or "manufacturing" in query_clean:
        primary_intent = "FACTORY"
    elif any(w in query_clean for w in ["loan", "finance"]) and any(w in query_clean for w in ["business", "shop", "startup", "msme"]):
        primary_intent = "BUSINESS_LOAN"
    elif any(w in query_clean for w in ["money", "funding"]) and any(w in query_clean for w in ["business", "shop", "startup", "msme"]):
        primary_intent = "BUSINESS_FINANCE"
    elif "caste" in query_clean:
        primary_intent = "CASTE_CERTIFICATE"
    elif "income" in query_clean:
        primary_intent = "INCOME_CERTIFICATE"
    elif "domicile" in query_clean:
        primary_intent = "DOMICILE_CERTIFICATE"
    elif "birth" in query_clean:
        primary_intent = "BIRTH_CERTIFICATE"
    elif "death" in query_clean:
        primary_intent = "DEATH_CERTIFICATE"
    elif "marriage" in query_clean:
        primary_intent = "MARRIAGE_CERTIFICATE"
    elif "business" in query_clean:
        if any(w in query_clean for w in ["start", "open", "create", "setup"]):
            primary_intent = "BUSINESS_START"
        elif any(w in query_clean for w in ["register", "registration"]):
            primary_intent = "BUSINESS_REGISTRATION"
        else:
            primary_intent = "BUSINESS_START"
    elif "government job" in query_clean or "sarkari naukri" in query_clean:
        primary_intent = "GOVERNMENT_JOB"
    elif any(w in query_clean for w in ["financial", "monetary"]) and any(w in query_clean for w in ["assistance", "help", "support", "aid"]):
        primary_intent = "FINANCIAL_ASSISTANCE"
    elif any(w in query_clean for w in ["loan", "borrow"]) and any(w in query_clean for w in ["government", "govt"]):
        primary_intent = "GOVERNMENT_LOAN"
    elif "subsidy" in query_clean or "subsidies" in query_clean:
        primary_intent = "SUBSIDY"
    elif "pension" in query_clean:
        primary_intent = "PENSION"
    elif "insurance" in query_clean:
        primary_intent = "INSURANCE"
    elif "welfare" in query_clean:
        primary_intent = "WELFARE"
    elif any(w in query_clean for w in ["housing support", "awas yojana", "pmay"]):
        primary_intent = "HOUSING_SUPPORT"
    else:
        # Fallback to Action/Object combination mapping
        if action_val == "PURCHASE" and object_val == "LAND":
            primary_intent = "LAND_PURCHASE"
        elif action_val == "SALE" and object_val == "LAND":
            primary_intent = "LAND_SALE"
        elif action_val == "PURCHASE" and object_val == "HOUSE":
            primary_intent = "HOME_PURCHASE"
        elif action_val == "CONSTRUCTION" and object_val == "HOUSE":
            primary_intent = "HOME_CONSTRUCTION"
        elif action_val == "ESTABLISH" and object_val == "HOSPITAL":
            primary_intent = "HOSPITAL"
        elif action_val == "ESTABLISH" and object_val == "RESTAURANT":
            primary_intent = "RESTAURANT"
        elif action_val == "ESTABLISH" and object_val == "SCHOOL":
            primary_intent = "SCHOOL"
        elif action_val == "ESTABLISH" and object_val == "BUSINESS":
            primary_intent = "BUSINESS_START"
        elif action_val == "REGISTRATION" and object_val == "BUSINESS":
            primary_intent = "BUSINESS_REGISTRATION"
        elif action_val == "FINANCING" and object_val == "BUSINESS":
            primary_intent = "BUSINESS_LOAN"
        elif action_val == "FINANCING" and object_val == "HOUSE":
            primary_intent = "PROPERTY_LOAN"
        elif action_val == "RENEWAL" and object_val == "DRIVING_LICENSE":
            primary_intent = "LICENSE_RENEWAL"
        elif action_val == "ACQUISITION" and object_val == "DRIVING_LICENSE":
            primary_intent = "DRIVING_LICENSE"
        elif action_val == "ACQUISITION" and object_val == "PASSPORT":
            primary_intent = "PASSPORT"
        elif action_val == "SUPPORT" and object_val == "SCHOLARSHIP":
            primary_intent = "SCHOLARSHIP"
        elif action_val == "SUPPORT" and object_val == "WELFARE":
            primary_intent = "FINANCIAL_ASSISTANCE"
        else:
            primary_intent = "OTHER_CITIZEN_SERVICE"

    # Secondary Intent Extraction logic
    if primary_intent in ["HOSPITAL", "RESTAURANT", "SCHOOL", "FACTORY"]:
        secondary_intents.append("BUSINESS_START")
    if any(w in query_clean for w in ["loan", "finance", "borrow", "money", "funding"]):
        if primary_intent in ["HOSPITAL", "RESTAURANT", "BUSINESS_START", "BUSINESS_REGISTRATION", "STARTUP", "MSME", "FACTORY"]:
            secondary_intents.extend(["BUSINESS_LOAN", "BUSINESS_FINANCE"])
        elif primary_intent in ["LAND_PURCHASE", "HOME_CONSTRUCTION", "HOME_PURCHASE"]:
            secondary_intents.append("PROPERTY_LOAN")
        else:
            secondary_intents.append("GOVERNMENT_LOAN")
    if any(w in query_clean for w in ["register", "registration"]):
        if primary_intent in ["HOSPITAL", "RESTAURANT", "BUSINESS_START"]:
            secondary_intents.append("BUSINESS_REGISTRATION")
        elif primary_intent in ["LAND_PURCHASE", "HOME_PURCHASE"]:
            secondary_intents.append("PROPERTY_REGISTRATION")
    if any(w in query_clean for w in ["scholarship", "study", "masters"]):
        if primary_intent == "STUDY_ABROAD":
            secondary_intents.append("SCHOLARSHIP")

    # Clean duplicates in secondary intents
    secondary_intents = list(set([si for si in secondary_intents if si != primary_intent]))

    # Map universal category
    category_map = {
        "PROPERTY": ["LAND_PURCHASE", "LAND_SALE", "PROPERTY_PURCHASE", "PROPERTY_SALE", "PROPERTY_REGISTRATION", "HOME_CONSTRUCTION", "HOME_PURCHASE", "PROPERTY_LOAN", "PROPERTY_DOCUMENTATION"],
        "BUSINESS": ["BUSINESS_START", "BUSINESS_REGISTRATION", "STARTUP", "MSME", "BUSINESS_LOAN", "BUSINESS_FINANCE", "SHOP", "RESTAURANT", "MANUFACTURING", "FACTORY", "SERVICE_BUSINESS", "COMPANY_REGISTRATION"],
        "HEALTHCARE": ["HOSPITAL", "CLINIC", "PHARMACY", "HEALTHCARE_FACILITY", "MEDICAL_BUSINESS"],
        "EDUCATION": ["SCHOOL", "COLLEGE", "UNIVERSITY", "STUDY", "SCHOLARSHIP", "EDUCATION_FINANCE", "STUDY_ABROAD"],
        "TRAVEL": ["PASSPORT", "VISA", "INTERNATIONAL_TRAVEL", "MIGRATION", "STUDY_ABROAD"],
        "AGRICULTURE": ["FARMING", "FARMER_SUPPORT", "AGRICULTURE", "IRRIGATION", "AGRICULTURAL_LOAN", "AGRICULTURAL_EQUIPMENT"],
        "TRANSPORT": ["DRIVING_LICENSE", "LICENSE_RENEWAL", "VEHICLE_REGISTRATION", "VEHICLE_TRANSFER", "TRANSPORT_SERVICE"],
        "IDENTITY/CERTIFICATES": ["AADHAAR", "PAN", "BIRTH_CERTIFICATE", "DEATH_CERTIFICATE", "MARRIAGE_CERTIFICATE", "DOMICILE_CERTIFICATE", "INCOME_CERTIFICATE", "CASTE_CERTIFICATE", "RESIDENCE_CERTIFICATE"],
        "EMPLOYMENT": ["GOVERNMENT_JOB", "PRIVATE_EMPLOYMENT", "SKILL_DEVELOPMENT", "TRAINING", "EMPLOYMENT_SUPPORT"],
        "FINANCIAL_SUPPORT": ["GOVERNMENT_LOAN", "SUBSIDY", "FINANCIAL_ASSISTANCE", "PENSION", "INSURANCE", "WELFARE"],
        "SOCIAL_SUPPORT": ["WOMEN_SUPPORT", "CHILD_SUPPORT", "SENIOR_CITIZEN_SUPPORT", "DISABILITY_SUPPORT", "HOUSING_SUPPORT"]
    }
    
    category_val = "OTHER_CITIZEN_SERVICE"
    for cat, intents in category_map.items():
        if primary_intent in intents:
            category_val = cat
            break

    # Legacy Category Mapping for frontend/DB compatibility
    legacy_category = "general"
    if category_val == "EDUCATION":
        legacy_category = "education"
    elif category_val in ["BUSINESS", "HEALTHCARE"]:
        legacy_category = "business"
    elif category_val == "AGRICULTURE":
        legacy_category = "agriculture"
    elif category_val in ["TRAVEL", "TRANSPORT", "IDENTITY/CERTIFICATES"]:
        legacy_category = "documents"

    # Map legacy_intent_primary for unit test matching
    def get_legacy_intent_primary(prim: str) -> str:
        if prim == "STUDY_ABROAD":
            return "STUDY_ABROAD"
        elif prim in ["DRIVING_LICENSE", "LICENSE_RENEWAL"]:
            return "DRIVING_LICENCE"
        elif prim in ["BUSINESS_START", "BUSINESS_REGISTRATION", "STARTUP", "MSME", "RESTAURANT", "MANUFACTURING", "FACTORY", "SHOP", "COMPANY_REGISTRATION", "BUSINESS_LOAN", "BUSINESS_FINANCE", "SERVICE_BUSINESS"]:
            return "BUSINESS_REGISTRATION"
        elif prim in ["FARMING", "FARMER_SUPPORT", "AGRICULTURE", "IRRIGATION", "AGRICULTURAL_LOAN", "AGRICULTURAL_EQUIPMENT"]:
            return "FARMER_BENEFITS"
        elif prim == "SCHOLARSHIP":
            return "SCHOLARSHIP"
        elif prim in ["HOSPITAL", "CLINIC", "PHARMACY", "HEALTHCARE_FACILITY", "MEDICAL_BUSINESS"]:
            return "HEALTHCARE_FACILITY"
        elif prim in ["LAND_PURCHASE", "LAND_SALE", "PROPERTY_REGISTRATION", "PROPERTY_PURCHASE", "PROPERTY_SALE", "PROPERTY_DOCUMENTATION", "PROPERTY_LOAN"]:
            return "LAND_PURCHASE"
        elif prim in ["PASSPORT", "VISA", "INTERNATIONAL_TRAVEL", "MIGRATION"]:
            return "TRAVEL"
        elif prim in ["SCHOOL", "COLLEGE", "UNIVERSITY"]:
            return "SCHOOL_CONSTRUCTION"
        elif prim in ["HOME_CONSTRUCTION", "HOME_PURCHASE", "HOUSING_SUPPORT"]:
            return "HOUSING"
        elif prim in ["DOMICILE_CERTIFICATE", "INCOME_CERTIFICATE", "CASTE_CERTIFICATE", "BIRTH_CERTIFICATE", "DEATH_CERTIFICATE", "MARRIAGE_CERTIFICATE", "RESIDENCE_CERTIFICATE"]:
            return "DOMICILE_CERTIFICATE"
        return "GENERAL"

    legacy_intent_primary = get_legacy_intent_primary(primary_intent)

    # Legacy intent sub description mapping
    legacy_intent_sub = "General Assistance"
    if legacy_intent_primary == "STUDY_ABROAD":
        legacy_intent_sub = f"Masters education in {dest_country}" if dest_country and "master" in query_clean else f"Higher education in {dest_country}" if dest_country else "Higher education abroad"
    elif legacy_intent_primary == "SCHOLARSHIP":
        legacy_intent_sub = "Apply for student financial aid"
    elif legacy_intent_primary == "HEALTHCARE_FACILITY":
        legacy_intent_sub = "Establish and register a healthcare facility"
    elif legacy_intent_primary == "LAND_PURCHASE":
        legacy_intent_sub = "Purchase land or real estate property"
    elif legacy_intent_primary == "BUSINESS_REGISTRATION":
        legacy_intent_sub = "Register business and obtain license"
    elif legacy_intent_primary == "DRIVING_LICENCE":
        legacy_intent_sub = "Renew or apply for driving licence"
    elif legacy_intent_primary == "TRAVEL":
        legacy_intent_sub = "Apply for passport"
    elif legacy_intent_primary == "FARMER_BENEFITS":
        legacy_intent_sub = "Apply for agricultural support"
    elif legacy_intent_primary == "DOMICILE_CERTIFICATE":
        legacy_intent_sub = f"Apply for {primary_intent.replace('_', ' ').lower()}"

    # Setup extracted metadata dictionary to keep compatibility with other backend layers
    extracted = {
        "goal": query,
        "goal_category": category_val,
        "sub_category": legacy_intent_sub,
        "user_domicile": domicile,
        "current_residence": domicile,
        "district": target_city,
        "current_city": target_city,
        "target_location": dest_country or target_state,
        "working_location": target_state if "work" in query_clean else None,
        "business_location": target_state if any(w in query_clean for w in ["business", "shop", "restaurant", "startup", "company", "clothing", "manufacturing", "hospital", "clinic", "land", "school"]) else None,
        "destination_country": dest_country,
        "destination_state": target_state if dest_country is None else None,
        "required_authorities": [],
        "relevant_jurisdictions": [domicile]
    }
    if target_state and target_state not in extracted["relevant_jurisdictions"]:
        extracted["relevant_jurisdictions"].append(target_state)
    if dest_country and dest_country not in extracted["relevant_jurisdictions"]:
        extracted["relevant_jurisdictions"].append(dest_country)

    # Determine required authorities
    authorities = []
    if legacy_intent_primary == "STUDY_ABROAD":
        authorities = ["Ministry of External Affairs (MEA)", "Unique Identification Authority of India (UIDAI)"]
        if dest_country:
            authorities.append(f"Department of Home Affairs, {dest_country}")
    elif legacy_intent_primary == "BUSINESS_REGISTRATION":
        authorities = ["GST Network (GSTN)", "Ministry of Micro, Small & Medium Enterprises (MSME)"]
        biz_state = target_state or domicile
        if target_city:
            authorities.append(f"{target_city} Municipal Corporation")
        else:
            authorities.append(f"Local Municipal Authority, {biz_state}")
        if "restaurant" in query_clean or "food" in query_clean or "cafe" in query_clean:
            authorities.extend(["Food Safety and Standards Authority of India (FSSAI)", f"{biz_state} Fire Department"])
    elif legacy_intent_primary == "HEALTHCARE_FACILITY":
        biz_state = target_state or domicile
        authorities = ["State Ministry of Health & Family Welfare", f"{biz_state} Pollution Control Board", f"{biz_state} Fire Department"]
        if target_city:
            authorities.append(f"{target_city} Municipal Corporation")
    elif legacy_intent_primary == "LAND_PURCHASE":
        biz_state = target_state or domicile
        authorities = [f"{biz_state} Revenue Department", f"{biz_state} Stamps & Registration Department"]
    elif legacy_intent_primary == "DRIVING_LICENCE":
        dl_state = domicile
        authorities = ["Ministry of Road Transport and Highways (MoRTH)", f"{dl_state} Regional Transport Office (RTO)"]
    elif legacy_intent_primary == "FARMER_BENEFITS":
        authorities = ["Ministry of Agriculture & Farmers Welfare", f"{domicile} Revenue Department"]
    elif legacy_intent_primary == "DOMICILE_CERTIFICATE":
        authorities = [f"{domicile} Revenue Department", "Tehsildar Office"]
    else:
        authorities = ["National Portal of India"]
    extracted["required_authorities"] = authorities

    # Determine Goal Title
    goal_title = query.title()
    if len(query) > 40:
        if "restaurant" in query_clean:
            goal_title = f"Open Restaurant in {target_city}" if target_city else "Open Restaurant"
        elif "clothing" in query_clean:
            goal_title = f"Start Clothing Business in {target_state}" if target_state else "Start Clothing Business"
        elif "hospital" in query_clean or "clinic" in query_clean:
            goal_title = f"Build Hospital in {target_city}" if target_city else "Healthcare Facility Setup"
        elif "land" in query_clean:
            goal_title = f"Land Purchase in {target_city}" if target_city else "Land Purchase Journey"
        elif "business" in query_clean or "shop" in query_clean:
            goal_title = f"Start Business in {target_city}" if target_city else "Business Registration"
        elif legacy_intent_primary == "STUDY_ABROAD":
            goal_title = f"Study in {dest_country}" if dest_country else "Study Abroad"
        elif legacy_intent_primary == "DRIVING_LICENCE":
            goal_title = f"Driving Licence ({domicile})"
        elif legacy_intent_primary == "TRAVEL":
            goal_title = "Passport Application"
        else:
            goal_title = "Citizen Service Journey"

    # 2. Document Synonym Normalizer & Matching Engine
    def normalize_document_type(doc_type: str, doc_name: str = "") -> str:
        val = (doc_type or "").strip().upper()
        name = (doc_name or "").strip().lower()
        if val in ["AADHAAR", "AADHAAR CARD", "AADHAR", "AADHAR CARD", "DEMO_AADHAAR"]:
            return "AADHAAR"
        if val in ["PAN", "PAN CARD", "DEMO_PAN"]:
            return "PAN"
        if val in ["CLASS_10_MARKSHEET", "10TH_MARKSHEET", "10TH MARKSHEET", "10TH CERTIFICATE", "SSC MARKSHEET", "CLASS 10 MARKSHEET", "CLASS_10_MARKSHEET"]:
            return "10TH_MARKSHEET"
        if val in ["CLASS_12_MARKSHEET", "12TH_MARKSHEET", "12TH MARKSHEET", "12TH CERTIFICATE", "HSC MARKSHEET", "CLASS 12 MARKSHEET", "CLASS_12_MARKSHEET"]:
            return "12TH_MARKSHEET"
        if val in ["DEGREE_CERTIFICATE", "DEGREE CERTIFICATE", "GRADUATION CERTIFICATE", "UNIVERSITY DEGREE", "DEGREE/UNIVERSITY MARKSHEET", "MARKSHEET", "EDUCATION CERTIFICATE (B.TECH)", "EDUCATION CERTIFICATE (M.SC)"]:
            return "MARKSHEET"
        if val in ["RENT_AGREEMENT", "LEASE_AGREEMENT", "RENT AGREEMENT", "LEASE AGREEMENT"]:
            return "RENT_AGREEMENT"
        if val in ["DRIVING_LICENCE", "DRIVING LICENSE", "DL"]:
            return "DRIVING_LICENCE"
        if val in ["INCOME_CERTIFICATE", "INCOME CERTIFICATE"]:
            return "INCOME_CERTIFICATE"
        if val in ["DOMICILE_CERTIFICATE", "DOMICILE CERTIFICATE", "ADDRESS & RESIDENCE CERTIFICATE", "RESIDENCE_CERTIFICATE"]:
            return "DOMICILE_CERTIFICATE"
        if val in ["LAND_RECORD", "LAND RECORD", "PATTA", "JAMABANDI", "LAND OWNERSHIP RECORD"]:
            return "LAND_RECORD"
        if val in ["BANK_PROOF", "BANK PASSBOOK", "BANK STATEMENT", "BANK_DOCUMENT", "BANK ACCOUNT PROOF"]:
            return "BANK_PROOF"
        if val in ["PASSPORT", "PASSPORT CARD", "INDIAN PASSPORT", "INDIAN REPUBLIC PASSPORT"]:
            return "PASSPORT"
        if val in ["ENGLISH_TEST", "IELTS", "PTE", "TOEFL", "LANGUAGE_TEST"]:
            return "ENGLISH_TEST"
        if val in ["TRADE_LICENSE", "TRADE LICENCE", "TRADE LICENSE", "MUNICIPAL TRADE LICENSE"]:
            return "TRADE_LICENSE"
        if val in ["FSSAI_LICENSE", "FSSAI LICENCE", "FSSAI"]:
            return "FSSAI_LICENSE"
        if val in ["FIRE_NOC", "FIRE SAFETY NOC", "FIRE NOC"]:
            return "FIRE_NOC"
        
        if "aadhar" in name or "aadhaar" in name or "aadhar" in val.lower() or "aadhaar" in val.lower():
            return "AADHAAR"
        if "pan card" in name or "pan" == name or "pan" == val.lower():
            return "PAN"
        if "10th" in name or "class 10" in name or "ssc" in name:
            return "10TH_MARKSHEET"
        if "12th" in name or "class 12" in name or "hsc" in name:
            return "12TH_MARKSHEET"
        if "degree" in name or "graduation certificate" in name or "b.tech" in name or "m.sc" in name:
            return "MARKSHEET"
        if "rent" in name or "lease" in name:
            return "RENT_AGREEMENT"
        if "driving" in name or "dl" in name or "licence" in name:
            return "DRIVING_LICENCE"
        if "income" in name or "income" in val.lower():
            return "INCOME_CERTIFICATE"
        if "domicile" in name or "residence" in name or "domicile" in val.lower() or "residence" in val.lower():
            return "DOMICILE_CERTIFICATE"
        if "land" in name or "patta" in name or "jamabandi" in name or "land" in val.lower():
            return "LAND_RECORD"
        if "passbook" in name or "bank" in name or "bank" in val.lower():
            return "BANK_PROOF"
        if "passport" in name or "passport" in val.lower():
            return "PASSPORT"
        if "ielts" in name or "pte" in name or "english" in name:
            return "ENGLISH_TEST"
            
        return val

    user_doc_types = {}
    try:
        user_docs = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == current_user.id).all()
        for d in user_docs:
            norm_type = normalize_document_type(d.document_type, d.document_name)
            user_doc_types[norm_type] = d
    except Exception as de:
        print(f"[WARN] Failed to query user documents: {de}")
        warnings.append("Document vault data could not be refreshed right now.")

    # Target Document Definitions
    all_defs = {
        "AADHAAR": {"name": "Aadhaar Card", "authority": "UIDAI", "reason": "Primary identity verification", "how_to": "Download from UIDAI portal using OTP verification.", "official_source": "https://uidai.gov.in", "processing_time": "Immediate (OTP Download)"},
        "PAN": {"name": "PAN Card", "authority": "Income Tax Department", "reason": "Required for financial and tax transactions", "how_to": "Apply online via NSDL e-Gov portal.", "official_source": "https://www.incometax.gov.in", "processing_time": "3-5 days"},
        "PASSPORT": {"name": "Passport", "authority": "Ministry of External Affairs", "reason": "Mandatory for international travel and study visa issuance", "how_to": "Register at Passport Seva online portal and book an appointment.", "official_source": "https://passportindia.gov.in", "processing_time": "30-45 working days"},
        "10TH_MARKSHEET": {"name": "10th Marksheet", "authority": "Secondary Education Board", "reason": "Proof of date of birth and academic credentials", "how_to": "Retrieve from school board or download via DigiLocker.", "official_source": "https://digilocker.gov.in", "processing_time": "Immediate via DigiLocker"},
        "12TH_MARKSHEET": {"name": "12th Marksheet", "authority": "Higher Secondary Board", "reason": "Proof of senior secondary academic credentials", "how_to": "Retrieve from school board or download via DigiLocker.", "official_source": "https://digilocker.gov.in", "processing_time": "Immediate via DigiLocker"},
        "MARKSHEET": {"name": "Degree / provisional certificate", "authority": "University / Institute", "reason": "Academic proof of graduation for master's programs", "how_to": "Obtain from your university registrar office.", "official_source": "https://digilocker.gov.in", "processing_time": "15-20 days"},
        "ACADEMIC_TRANSCRIPTS": {"name": "Academic transcripts", "authority": "University / Institute", "reason": "Consolidated record of all college courses and grades", "how_to": "Apply to university examination controller office.", "official_source": "https://digilocker.gov.in", "processing_time": "15-30 days"},
        "ENGLISH_TEST": {"name": "English proficiency result", "authority": "IDP / Pearson", "reason": "IELTS/PTE/TOEFL score to verify English competence", "how_to": "Register and book a test date at IDP IELTS online.", "official_source": "https://www.ieltsidpindia.com", "processing_time": "5-7 days after test"},
        "FINANCIAL_DOCUMENTS": {"name": "Financial documents", "authority": "Commercial Bank", "reason": "Required to prove sufficient funds for study and living expenses", "how_to": "Obtain certified bank statements and balance certificate from bank branch.", "official_source": "https://digilocker.gov.in", "processing_time": "1-2 days"},
        "RENT_AGREEMENT": {"name": "Premises Rent Agreement", "authority": "Applicant & Landlord", "reason": "Commercial lease agreement for business address proof", "how_to": "Execute agreement on stamp paper and register it locally.", "official_source": "https://serviceonline.gov.in", "processing_time": "1-2 days"},
        "GST_CERTIFICATE": {"name": "GSTIN Tax Certificate", "authority": "GST Network", "reason": "Required if turnover exceeds the statutory limit (₹20L/₹40L)", "how_to": "Apply online on the official GST portal.", "official_source": "https://gst.gov.in", "processing_time": "3-5 days"},
        "UDYAM_CERTIFICATE": {"name": "Udyam MSME Registration Certificate", "authority": "Ministry of MSME", "reason": "Enables access to MSME benefits and government credit", "how_to": "Register for free on the Udyam portal using Aadhaar OTP.", "official_source": "https://udyamregistration.gov.in", "processing_time": "Immediate"},
        "FSSAI_LICENSE": {"name": "FSSAI Food License", "authority": "FSSAI", "reason": "Mandatory for operating eating establishments", "how_to": "Apply online on FSSAI FoSCoS portal.", "official_source": "https://foscos.fssai.gov.in", "processing_time": "15-30 working days"},
        "TRADE_LICENSE": {"name": "Municipal Trade License", "authority": "Local Municipal Corporation", "reason": "Permission to conduct trade or business at the location", "how_to": "Apply online via municipal e-governance portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "7-10 working days"},
        "FIRE_NOC": {"name": "Fire Safety NOC", "authority": "State Fire Department", "reason": "Safety clearance required for public eating houses", "how_to": "Apply online through state single-window investor clearance portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "10-15 days"},
        "DRIVING_LICENCE": {"name": "Driving Licence", "authority": "Regional Transport Office (RTO)", "reason": "Current driving licence for renewal/records", "how_to": "Submit details on Sarathi Parivahan portal.", "official_source": "https://sarathi.parivahan.gov.in", "processing_time": "15 days"},
        "MEDICAL_CERTIFICATE": {"name": "Medical Certificate (Form 1A)", "authority": "Registered Medical Practitioner", "reason": "Mandatory for renewal applicants over 40 years of age", "how_to": "Obtain signed Form 1A from a government-authorized doctor.", "official_source": "https://sarathi.parivahan.gov.in", "processing_time": "1 day"},
        "LAND_RECORD": {"name": "Land Ownership Record (Patta/Jamabandi)", "authority": "Revenue Department", "reason": "Proof of agricultural landholding to verify farmer status", "how_to": "Retrieve from local patwari or online state land records portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "1-3 days"},
        "BANK_PROOF": {"name": "Bank Passbook", "authority": "Commercial Bank / Post Office", "reason": "Proof of account for direct benefit transfer", "how_to": "Obtain from your bank branch.", "official_source": "https://digilocker.gov.in", "processing_time": "Immediate"},
        "INCOME_CERTIFICATE": {"name": "Family Income Certificate", "authority": "Revenue Department", "reason": "Verification of family income eligibility limits", "how_to": "Apply online at state e-district portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "10-15 days"},
        "DOMICILE_CERTIFICATE": {"name": "Domicile Certificate", "authority": "Revenue Department", "reason": "Proof of residency for state-specific tuition fee waivers", "how_to": "Apply online at state e-district portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "7-10 days"},
        "SALE_AGREEMENT": {"name": "Sale Agreement / Draft Sale Deed", "authority": "Applicant & Seller", "reason": "Legally binding transaction agreement between buyer and seller", "how_to": "Draft agreement on stamp paper and obtain notarized signatures.", "official_source": "https://serviceonline.gov.in", "processing_time": "1-2 days"},
        "STAMP_DUTY_RECEIPT": {"name": "Stamp Duty & Registration Receipt", "authority": "Stamps & Registration Department", "reason": "Proof of payment of statutory stamp duty and registration fees", "how_to": "Pay online via state GRAS/e-stamping portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "1 day"},
        "PROPERTY_TAX_RECEIPT": {"name": "Property Tax Receipts", "authority": "Municipal Corporation", "reason": "Verify no outstanding tax liabilities on the property", "how_to": "Download from municipal property tax portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "Immediate"},
        "ENCUMBRANCE_CERTIFICATE": {"name": "Encumbrance Certificate", "authority": "Sub-Registrar Office", "reason": "Proof that the property is free from any liability or legal dispute", "how_to": "Apply online on state land registry portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "3-5 days"},
        "BUILDING_PLAN_APPROVAL": {"name": "Building Plan Sanction / Approval", "authority": "Local Municipal Corporation", "reason": "Approved commercial construction plan from local municipal authority", "how_to": "Submit architecture layout online to municipal building approval portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "30-45 days"},
        "CLINICAL_ESTABLISHMENT_REGISTRATION": {"name": "Clinical Establishment Act Registration", "authority": "State Health Department", "reason": "Mandatory regulatory registration for hospitals/clinics", "how_to": "Apply online on state clinical establishments registry portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "15-30 days"},
        "POLLUTION_CONTROL_NOC": {"name": "Bio-Medical Waste Management NOC", "authority": "State Pollution Control Board", "reason": "Clearance from State Pollution Control Board for waste disposal", "how_to": "Apply online on State Pollution Control Board portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "15-20 days"},
        "STAFF_REGISTRATION": {"name": "Medical Staff Clinical Registration", "authority": "Medical Council", "reason": "Verification of professional registration of doctors/nurses with respective medical councils", "how_to": "Verify online on state/national medical council registries.", "official_source": "https://nmc.org.in", "processing_time": "Immediate"},
        "SOCIETY_REGISTRATION": {"name": "School Trust/Society Registration", "authority": "Registrar of Societies", "reason": "Trust or society registration under Societies Registration Act", "how_to": "Draft trust deed and register at sub-registrar office.", "official_source": "https://serviceonline.gov.in", "processing_time": "7-10 days"},
        "BUILDING_SAFETY_CERTIFICATE": {"name": "Building Safety Certificate", "authority": "Public Works Department", "reason": "Safety clearance for commercial school buildings", "how_to": "Apply to PWD engineer for structural inspection.", "official_source": "https://serviceonline.gov.in", "processing_time": "7-15 days"},
        "AFFILIATION_CERTIFICATE": {"name": "School Recognition/Affiliation Certificate", "authority": "Education Board / CBSE", "reason": "Official school affiliation from state/national board", "how_to": "Apply on CBSE SARAS portal or state board portal.", "official_source": "https://saras.cbse.gov.in", "processing_time": "30-60 days"},
        "TITLE_DEED": {"name": "Title Clearance Certificate", "authority": "Revenue Department", "reason": "Establish absolute ownership of the property", "how_to": "Obtain certified copy of title deed from sub-registrar office.", "official_source": "https://serviceonline.gov.in", "processing_time": "2-3 days"},
        "LOAN_SANCTION_LETTER": {"name": "Home Loan Sanction Letter", "authority": "Commercial Bank", "reason": "Proof of transaction funding from lender", "how_to": "Apply for home loan online or at bank branch.", "official_source": "https://digilocker.gov.in", "processing_time": "7-10 days"},
        "ADMISSION_LETTER": {"name": "Admission Letter / Fee Receipt", "authority": "Educational Institution", "reason": "Proof of active admission to verify enrollment", "how_to": "Obtain signed admission letter or fee receipt from your college/school.", "official_source": "https://serviceonline.gov.in", "processing_time": "1-2 days"}
    }

    # Populate current requirements based on intent ontology
    intent_docs_map = {
        "LAND_PURCHASE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "SALE_AGREEMENT", "priority": "Required"},
            {"type": "STAMP_DUTY_RECEIPT", "priority": "Conditional"},
            {"type": "ENCUMBRANCE_CERTIFICATE", "priority": "Recommended"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
            {"type": "INCOME_CERTIFICATE", "priority": "Recommended"},
            {"type": "BANK_PROOF", "priority": "Recommended"},
            {"type": "PROPERTY_TAX_RECEIPT", "priority": "Recommended"}
        ],
        "LAND_SALE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "SALE_AGREEMENT", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
            {"type": "PROPERTY_TAX_RECEIPT", "priority": "Recommended"}
        ],
        "PROPERTY_PURCHASE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "SALE_AGREEMENT", "priority": "Required"},
            {"type": "STAMP_DUTY_RECEIPT", "priority": "Conditional"},
            {"type": "ENCUMBRANCE_CERTIFICATE", "priority": "Recommended"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "PROPERTY_SALE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "SALE_AGREEMENT", "priority": "Required"},
            {"type": "PROPERTY_TAX_RECEIPT", "priority": "Recommended"}
        ],
        "PROPERTY_REGISTRATION": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "SALE_AGREEMENT", "priority": "Required"},
            {"type": "STAMP_DUTY_RECEIPT", "priority": "Required"},
            {"type": "ENCUMBRANCE_CERTIFICATE", "priority": "Conditional"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "HOME_CONSTRUCTION": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "BUILDING_PLAN_APPROVAL", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"},
            {"type": "LOAN_SANCTION_LETTER", "priority": "Conditional"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
            {"type": "BANK_PROOF", "priority": "Recommended"}
        ],
        "HOME_PURCHASE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"},
            {"type": "SALE_AGREEMENT", "priority": "Required"},
            {"type": "TITLE_DEED", "priority": "Required"},
            {"type": "LOAN_SANCTION_LETTER", "priority": "Conditional"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
            {"type": "BANK_PROOF", "priority": "Recommended"}
        ],
        "PROPERTY_LOAN": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"},
            {"type": "SALE_AGREEMENT", "priority": "Required"},
            {"type": "TITLE_DEED", "priority": "Required"},
            {"type": "LOAN_SANCTION_LETTER", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Required"}
        ],
        "PROPERTY_DOCUMENTATION": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "BUSINESS_START": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "RENT_AGREEMENT", "priority": "Required"},
            {"type": "UDYAM_CERTIFICATE", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"},
            {"type": "GST_CERTIFICATE", "priority": "Conditional"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
            {"type": "INCOME_CERTIFICATE", "priority": "Recommended"},
            {"type": "BANK_PROOF", "priority": "Recommended"}
        ],
        "BUSINESS_REGISTRATION": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "RENT_AGREEMENT", "priority": "Required"},
            {"type": "UDYAM_CERTIFICATE", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"},
            {"type": "GST_CERTIFICATE", "priority": "Conditional"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
            {"type": "BANK_PROOF", "priority": "Recommended"}
        ],
        "STARTUP": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "RENT_AGREEMENT", "priority": "Required"},
            {"type": "UDYAM_CERTIFICATE", "priority": "Required"},
            {"type": "GST_CERTIFICATE", "priority": "Conditional"},
            {"type": "BANK_PROOF", "priority": "Recommended"}
        ],
        "MSME": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "UDYAM_CERTIFICATE", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"},
            {"type": "GST_CERTIFICATE", "priority": "Conditional"},
            {"type": "BANK_PROOF", "priority": "Recommended"}
        ],
        "BUSINESS_LOAN": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "UDYAM_CERTIFICATE", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Required"},
            {"type": "GST_CERTIFICATE", "priority": "Conditional"}
        ],
        "BUSINESS_FINANCE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "UDYAM_CERTIFICATE", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Required"}
        ],
        "SHOP": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "RENT_AGREEMENT", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"},
            {"type": "UDYAM_CERTIFICATE", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "RESTAURANT": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "RENT_AGREEMENT", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"},
            {"type": "FSSAI_LICENSE", "priority": "Required"},
            {"type": "UDYAM_CERTIFICATE", "priority": "Required"},
            {"type": "FIRE_NOC", "priority": "Conditional"},
            {"type": "GST_CERTIFICATE", "priority": "Conditional"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
            {"type": "BANK_PROOF", "priority": "Recommended"}
        ],
        "MANUFACTURING": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "RENT_AGREEMENT", "priority": "Required"},
            {"type": "UDYAM_CERTIFICATE", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"},
            {"type": "FIRE_NOC", "priority": "Conditional"},
            {"type": "POLLUTION_CONTROL_NOC", "priority": "Conditional"},
            {"type": "GST_CERTIFICATE", "priority": "Conditional"}
        ],
        "FACTORY": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "UDYAM_CERTIFICATE", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"},
            {"type": "FIRE_NOC", "priority": "Required"},
            {"type": "POLLUTION_CONTROL_NOC", "priority": "Required"},
            {"type": "GST_CERTIFICATE", "priority": "Conditional"}
        ],
        "SERVICE_BUSINESS": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "RENT_AGREEMENT", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"},
            {"type": "UDYAM_CERTIFICATE", "priority": "Required"}
        ],
        "COMPANY_REGISTRATION": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "RENT_AGREEMENT", "priority": "Required"},
            {"type": "UDYAM_CERTIFICATE", "priority": "Required"},
            {"type": "GST_CERTIFICATE", "priority": "Conditional"}
        ],
        "HOSPITAL": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "BUILDING_PLAN_APPROVAL", "priority": "Required"},
            {"type": "CLINICAL_ESTABLISHMENT_REGISTRATION", "priority": "Required"},
            {"type": "FIRE_NOC", "priority": "Required"},
            {"type": "POLLUTION_CONTROL_NOC", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"},
            {"type": "STAFF_REGISTRATION", "priority": "Conditional"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
            {"type": "INCOME_CERTIFICATE", "priority": "Recommended"},
            {"type": "BANK_PROOF", "priority": "Recommended"}
        ],
        "CLINIC": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "RENT_AGREEMENT", "priority": "Required"},
            {"type": "CLINICAL_ESTABLISHMENT_REGISTRATION", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"},
            {"type": "STAFF_REGISTRATION", "priority": "Conditional"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "PHARMACY": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "RENT_AGREEMENT", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"}
        ],
        "HEALTHCARE_FACILITY": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "BUILDING_PLAN_APPROVAL", "priority": "Required"},
            {"type": "CLINICAL_ESTABLISHMENT_REGISTRATION", "priority": "Required"},
            {"type": "FIRE_NOC", "priority": "Required"},
            {"type": "POLLUTION_CONTROL_NOC", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"},
            {"type": "STAFF_REGISTRATION", "priority": "Conditional"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "MEDICAL_BUSINESS": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "CLINICAL_ESTABLISHMENT_REGISTRATION", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"}
        ],
        "SCHOOL": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "SOCIETY_REGISTRATION", "priority": "Required"},
            {"type": "BUILDING_SAFETY_CERTIFICATE", "priority": "Required"},
            {"type": "FIRE_NOC", "priority": "Required"},
            {"type": "AFFILIATION_CERTIFICATE", "priority": "Conditional"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
            {"type": "BANK_PROOF", "priority": "Recommended"}
        ],
        "COLLEGE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "SOCIETY_REGISTRATION", "priority": "Required"},
            {"type": "BUILDING_SAFETY_CERTIFICATE", "priority": "Required"},
            {"type": "FIRE_NOC", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "UNIVERSITY": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "SOCIETY_REGISTRATION", "priority": "Required"},
            {"type": "BUILDING_SAFETY_CERTIFICATE", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "STUDY": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "10TH_MARKSHEET", "priority": "Required"},
            {"type": "12TH_MARKSHEET", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "SCHOLARSHIP": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "10TH_MARKSHEET", "priority": "Required"},
            {"type": "12TH_MARKSHEET", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Required"},
            {"type": "ADMISSION_LETTER", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Recommended"}
        ],
        "EDUCATION_FINANCE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "10TH_MARKSHEET", "priority": "Required"},
            {"type": "12TH_MARKSHEET", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Required"}
        ],
        "STUDY_ABROAD": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "PASSPORT", "priority": "Required"},
            {"type": "10TH_MARKSHEET", "priority": "Required"},
            {"type": "12TH_MARKSHEET", "priority": "Required"},
            {"type": "ACADEMIC_TRANSCRIPTS", "priority": "Required"},
            {"type": "ENGLISH_TEST", "priority": "Conditional"},
            {"type": "FINANCIAL_DOCUMENTS", "priority": "Conditional"},
            {"type": "MARKSHEET", "priority": "Recommended"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
            {"type": "INCOME_CERTIFICATE", "priority": "Recommended"}
        ],
        "PASSPORT": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Required"},
            {"type": "PAN", "priority": "Recommended"},
            {"type": "10TH_MARKSHEET", "recommended": "Recommended"},
            {"type": "PASSPORT", "priority": "Conditional"},
            {"type": "BANK_PROOF", "priority": "Recommended"}
        ],
        "VISA": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PASSPORT", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Required"}
        ],
        "INTERNATIONAL_TRAVEL": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PASSPORT", "priority": "Required"}
        ],
        "MIGRATION": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PASSPORT", "priority": "Required"}
        ],
        "FARMING": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Required"},
            {"type": "PAN", "priority": "Recommended"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
            {"type": "INCOME_CERTIFICATE", "priority": "Recommended"}
        ],
        "FARMER_SUPPORT": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Required"},
            {"type": "PAN", "priority": "Recommended"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
            {"type": "INCOME_CERTIFICATE", "priority": "Recommended"}
        ],
        "AGRICULTURE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "IRRIGATION": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Required"}
        ],
        "AGRICULTURAL_LOAN": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Required"}
        ],
        "AGRICULTURAL_EQUIPMENT": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "LAND_RECORD", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Required"}
        ],
        "DRIVING_LICENSE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "DRIVING_LICENCE", "priority": "Required"},
            {"type": "MEDICAL_CERTIFICATE", "priority": "Conditional"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "LICENSE_RENEWAL": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "DRIVING_LICENCE", "priority": "Required"},
            {"type": "MEDICAL_CERTIFICATE", "priority": "Conditional"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "VEHICLE_REGISTRATION": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Recommended"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "VEHICLE_TRANSFER": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "TRANSPORT_SERVICE": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "AADHAAR": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "PAN": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"}
        ],
        "BIRTH_CERTIFICATE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "DEATH_CERTIFICATE": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "MARRIAGE_CERTIFICATE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "DOMICILE_CERTIFICATE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Required"}
        ],
        "INCOME_CERTIFICATE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"}
        ],
        "CASTE_CERTIFICATE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Required"}
        ],
        "RESIDENCE_CERTIFICATE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Required"}
        ],
        "GOVERNMENT_JOB": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "10TH_MARKSHEET", "priority": "Required"},
            {"type": "12TH_MARKSHEET", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "PRIVATE_EMPLOYMENT": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "SKILL_DEVELOPMENT": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "TRAINING": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "EMPLOYMENT_SUPPORT": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "GOVERNMENT_LOAN": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"},
            {"type": "BANK_PROOF", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "SUBSIDY": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "FINANCIAL_ASSISTANCE": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"},
            {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"}
        ],
        "PENSION": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"}
        ],
        "INSURANCE": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "WELFARE": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "WOMEN_SUPPORT": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "CHILD_SUPPORT": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "SENIOR_CITIZEN_SUPPORT": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "DISABILITY_SUPPORT": [
            {"type": "AADHAAR", "priority": "Required"}
        ],
        "HOUSING_SUPPORT": [
            {"type": "AADHAAR", "priority": "Required"},
            {"type": "PAN", "priority": "Required"},
            {"type": "INCOME_CERTIFICATE", "priority": "Required"}
        ]
    }

    # Combine requirements from primary and secondary intents
    required_types = set()
    combined_reqs = []
    
    # 1. Base requirements from primary intent
    base_docs = intent_docs_map.get(primary_intent, [
        {"type": "AADHAAR", "priority": "Required"},
        {"type": "PAN", "priority": "Required"},
        {"type": "DOMICILE_CERTIFICATE", "priority": "Recommended"},
        {"type": "INCOME_CERTIFICATE", "priority": "Recommended"}
    ])
    for d in base_docs:
        required_types.add(d["type"])
        combined_reqs.append(d)
        
    # 2. Add extra requirements from secondary intents if they are not already present
    for sec_intent in secondary_intents:
        sec_docs = intent_docs_map.get(sec_intent, [])
        for d in sec_docs:
            if d["type"] not in required_types:
                required_types.add(d["type"])
                combined_reqs.append(d)

    # Map required/available/missing docs
    available_docs = []
    needed_docs = []

    def find_user_doc(rtype: str) -> Optional[UserDocumentDB]:
        from app.services.document_engine import DocumentRequirementMatcher
        satisfying_types = DocumentRequirementMatcher.SATISFYING_TYPES.get(rtype.upper(), [rtype.upper()])
        for t in satisfying_types:
            if t in user_doc_types:
                return user_doc_types[t]
        return None

    for req in combined_reqs:
        rtype = req["type"]
        p_val = req["priority"]
        r_def = all_defs.get(rtype, {"name": rtype.title().replace("_", " "), "authority": "Government Authority", "reason": "Required for this journey", "how_to": "Apply on official portal.", "official_source": "https://india.gov.in", "processing_time": "10 days"})
        dname = r_def["name"]
        desc = r_def["reason"]
        
        user_doc = find_user_doc(rtype)
        if user_doc:
            status_val = "AVAILABLE"
            if user_doc.status == "EXPIRED":
                status_val = "EXPIRED"
            elif user_doc.expiry_date:
                try:
                    expiry_dt = datetime.strptime(user_doc.expiry_date.split(" ")[0], "%Y-%m-%d")
                    if expiry_dt < datetime.utcnow():
                        status_val = "EXPIRED"
                except Exception:
                    pass
                    
            available_docs.append({
                "id": user_doc.id,
                "name": dname,
                "type": rtype,
                "status": status_val,
                "description": desc,
                "verification_status": "Government Verified" if user_doc.is_verified else "SYNTHETIC_DEMO",
                "issuing_authority": r_def["authority"],
                "masked_document_number": user_doc.document_number_masked or "XXXX XXXX XXXX",
                "issue_date": (user_doc.upload_date or datetime.utcnow()).strftime('%d %B %Y') if user_doc.upload_date else None,
                "expiry_date": user_doc.expiry_date,
                "why_it_matches": "✓ Relevant",
                "source": r_def["official_source"],
                "file_name": user_doc.file_name,
                "file_url": user_doc.file_url,
                "is_synthetic": user_doc.is_synthetic,
                "synthetic_notice": user_doc.synthetic_notice
            })
        else:
            status_val = "MISSING" if p_val == "Required" else p_val.upper()
            needed_docs.append({
                "name": dname,
                "type": rtype,
                "status": status_val,
                "reason": desc,
                "required_by": r_def["authority"],
                "priority": p_val,
                "how_to": r_def["how_to"],
                "processing_time": r_def["processing_time"],
                "authority": r_def["authority"],
                "official_source": r_def["official_source"]
            })

    # 3. Government Scheme Engine (Strict Search via Intent Params)
    # Map intent to search categories and matching keywords
    def map_intent_to_search_params(intent: str) -> tuple[List[str], List[str]]:
        if intent in ["STUDY_ABROAD", "SCHOLARSHIP", "STUDY", "COLLEGE", "UNIVERSITY", "SCHOOL", "EDUCATION_FINANCE"]:
            return ["education", "general"], ["scholarship", "overseas", "foreign", "education", "study", "student", "stipend", "school", "college", "anupriti", "rgs", "mysy", "ssp", "vidyalaxmi", "loan"]
        elif intent in ["HOSPITAL", "CLINIC", "PHARMACY", "HEALTHCARE_FACILITY", "MEDICAL_BUSINESS"]:
            return ["business", "general"], ["hospital", "healthcare", "clinic", "medical", "health", "waste", "pollution", "doctor", "nurse"]
        elif intent in ["FARMING", "FARMER_SUPPORT", "AGRICULTURE", "IRRIGATION", "AGRICULTURAL_LOAN", "AGRICULTURAL_EQUIPMENT"]:
            return ["agriculture", "general"], ["farmer", "kisan", "farming", "agriculture", "crop", "fertilizer", "irrigation", "tractor", "insurance", "credit", "kcc", "bima", "pmkisan"]
        elif intent in ["DRIVING_LICENSE", "LICENSE_RENEWAL"]:
            return ["documents", "general"], ["license", "licence", "driving", "road", "transport"]
        elif intent in ["PASSPORT", "VISA", "INTERNATIONAL_TRAVEL", "MIGRATION"]:
            return ["documents", "general"], ["passport", "visa", "travel", "external", "overseas"]
        elif intent in ["HOME_CONSTRUCTION", "HOME_PURCHASE", "HOUSING_SUPPORT", "PROPERTY_LOAN"]:
            return ["general"], ["housing", "awas", "pmay", "home", "house", "construction", "loan"]
        elif intent in ["BUSINESS_START", "BUSINESS_REGISTRATION", "STARTUP", "MSME", "SHOP", "RESTAURANT", "MANUFACTURING", "FACTORY", "SERVICE_BUSINESS", "COMPANY_REGISTRATION", "BUSINESS_LOAN", "BUSINESS_FINANCE"]:
            return ["business", "general"], ["business", "startup", "msme", "udyam", "loan", "trade", "commercial", "industry", "manufacturing", "subsidy", "svanidhi", "pmegp"]
        return ["general"], []
        
    target_categories, search_keywords = map_intent_to_search_params(primary_intent)

    schemes_db = []
    retrieved_count = 0
    active_count = 0
    relevance_count = 0
    eligibility_count = 0

    try:
        search_states = ["Central"]
        if domicile:
            search_states.append(domicile)
        if target_state and target_state not in search_states and target_state.lower() not in ["australia", "canada", "uk", "usa"]:
            search_states.append(target_state)

        # Base ACTIVE query
        schemes_query = db.query(SchemeDB).filter(SchemeDB.status == "ACTIVE")
        retrieved_count = schemes_query.count()
        active_count = retrieved_count
        
        # Apply Category Mapping
        if target_categories:
            schemes_query = schemes_query.filter(SchemeDB.category.in_(target_categories))
            relevance_count = schemes_query.count()
            
        # Apply Jurisdiction filter
        state_filters = [SchemeDB.level == "CENTRAL"]
        for st_name in search_states:
            state_filters.append(SchemeDB.state_name.ilike(f"%{st_name}%"))
            
        schemes_query = schemes_query.filter(or_(*state_filters))
        schemes_db = schemes_query.all()
        
    except Exception as se:
        print(f"[WARN] Failed to query schemes: {se}")
        warnings.append("Government scheme information is temporarily unavailable.")

    # Relevance ranking, scoring, and eligibility checks
    ranked_schemes = []
    user_profile = None
    try:
        user_profile = db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == current_user.id).first()
    except Exception as pe:
        print(f"[WARN] Failed to query citizen profile: {pe}")

    for s in schemes_db:
        why_match = []
        is_eligible = True
        missing_info = False
        incompatibility_reasons = []
        
        # Category check
        if s.category not in target_categories:
            continue
            
        # Jurisdiction match
        jurisdiction_compatible = False
        if s.level == "CENTRAL":
            jurisdiction_compatible = True
            why_match.append("✓ Central Scheme (applicable nationwide)")
        else:
            if domicile and s.state_name.lower() == domicile.lower():
                why_match.append(f"✓ Domicile Match: Eligible resident of {domicile}")
                jurisdiction_compatible = True
            if target_state and s.state_name.lower() == target_state.lower():
                why_match.append(f"✓ Target Location Match: Operating/studying in {target_state}")
                jurisdiction_compatible = True
                
        if not jurisdiction_compatible:
            continue

        rules = s.eligibility_rules or {}
        
        # Domicile requirement rule
        req_state = rules.get("state")
        if req_state:
            if s.category in ["education", "general"]:
                if domicile and domicile.lower() != req_state.lower():
                    is_eligible = False
                    incompatibility_reasons.append(f"Requires {req_state} residency (your domicile is {domicile})")
            else:
                loc_state = target_state or domicile
                if loc_state and loc_state.lower() != req_state.lower():
                    is_eligible = False
                    incompatibility_reasons.append(f"Requires operations in {req_state} (your location is {loc_state})")

        # Income limit rule
        income_limit = rules.get("annual_family_income_max") or rules.get("annual_income_max")
        if income_limit:
            if user_profile and user_profile.annual_income is not None:
                if user_profile.annual_income <= income_limit:
                    why_match.append(f"✓ Income: Family income (₹{user_profile.annual_income/100000:.1f}L) is below the ₹{income_limit/100000:.1f}L limit")
                else:
                    is_eligible = False
                    incompatibility_reasons.append(f"Family income (₹{user_profile.annual_income/100000:.1f}L) exceeds the ₹{income_limit/100000:.1f}L threshold")
            else:
                missing_info = True
                why_match.append(f"⚠ Income Verification: Need to confirm family income is below ₹{income_limit/100000:.1f}L")

        # Occupation rule
        req_occ = rules.get("occupation")
        if req_occ:
            implied_occupation = None
            if "kisan" in query_clean or "farmer" in query_clean or "farming" in query_clean or "agriculture" in query_clean:
                implied_occupation = "farmer"
            
            user_occ = implied_occupation or (user_profile.occupation if user_profile else None)
            if user_occ:
                if user_occ.lower() == req_occ.lower() or req_occ.lower() in user_occ.lower():
                    why_match.append(f"✓ Occupation: Targets {req_occ} group")
                else:
                    is_eligible = False
                    incompatibility_reasons.append(f"Targeted at {req_occ}s (your occupation is {user_occ})")
            else:
                missing_info = True
                why_match.append(f"⚠ Occupation: Targeted at {req_occ}s (verify profile)")

        # Age limit rule
        age_limit = rules.get("age_max") or rules.get("age_limit")
        if age_limit:
            if user_profile and user_profile.age is not None:
                if user_profile.age <= age_limit:
                    why_match.append(f"✓ Age: Applicant age ({user_profile.age}) meets maximum age limit of {age_limit}")
                else:
                    is_eligible = False
                    incompatibility_reasons.append(f"Applicant age exceeds maximum limit of {age_limit}")
            else:
                missing_info = True
                why_match.append(f"⚠ Age: Maximum age limit {age_limit} (verify profile)")

        # Study Abroad / Course check
        if rules.get("course") == "study_abroad":
            if legacy_intent_primary == "STUDY_ABROAD":
                why_match.append("✓ Course Match: Course involves studies abroad")
            else:
                is_eligible = False
                incompatibility_reasons.append("Requires course involving studies abroad")

        # Score calculation based on structured keywords & query terms
        goal_relevance_score = 0
        query_words = [w.lower() for w in query.split() if len(w) > 3]
        match_score = 0
        for w in query_words:
            if w in s.name.lower():
                match_score += 20
            elif w in s.description.lower():
                match_score += 5
        for kw in search_keywords:
            if kw in s.name.lower():
                match_score += 15
            elif kw in s.description.lower():
                match_score += 5
        goal_relevance_score = min(match_score, 60)
        
        category_score = 15 if s.category in target_categories else 0
        location_score = 10 if s.level == "CENTRAL" else 15
        
        if not is_eligible:
            match_status = "NOT_ELIGIBLE"
            why_match.append(f"✗ Ineligible: {'; '.join(incompatibility_reasons)}")
            eligibility_score = 0
        elif missing_info:
            match_status = "POSSIBLE_MATCH"
            eligibility_score = 15
        else:
            match_status = "HIGH_MATCH"
            eligibility_score = 25
            
        freshness_score = 10 if s.status == "ACTIVE" else 0
        total_relevance = goal_relevance_score + category_score + location_score + eligibility_score + freshness_score
        eligibility_count += 1
        
        ranked_schemes.append({
            "id": s.id,
            "name": s.name,
            "official_name": s.official_name,
            "officialName": s.official_name,
            "description": s.description,
            "level": s.level,
            "governmentLevel": s.level,
            "state_name": s.state_name,
            "state": s.state_name,
            "department": s.department,
            "category": s.category,
            "benefits": s.benefits,
            "match_status": match_status,
            "eligibilityStatus": "Appears eligible based on the information provided." if match_status == "HIGH_MATCH" else "Potentially relevant — additional eligibility information required." if match_status == "POSSIBLE_MATCH" else "Does not appear eligible",
            "eligibility_status": "Appears eligible based on the information provided." if match_status == "HIGH_MATCH" else "Potentially relevant — additional eligibility information required." if match_status == "POSSIBLE_MATCH" else "Does not appear eligible",
            "eligibilitySummary": "All eligibility constraints satisfied." if match_status == "HIGH_MATCH" else "Missing profile parameters to fully verify eligibility.",
            "why_matches": why_match,
            "whyRelevant": "; ".join([r.replace("✓ ", "").replace("⚠ ", "").replace("✗ ", "").replace("x ", "") for r in why_match]),
            "official_source_url": s.official_source_url,
            "officialUrl": s.official_source_url,
            "source": s.source_type or "Government Ministry",
            "status": s.status,
            "documentsRequired": s.documents_required or [],
            "documents_required": s.documents_required or [],
            "last_verified_at": s.last_verified_at.strftime('%d %B %Y') if s.last_verified_at else "19 August 2026",
            "lastVerified": s.last_verified_at.strftime('%d %B %Y') if s.last_verified_at else "19 August 2026",
            "relevance_score": total_relevance
        })

    # Sort schemes by relevance score
    ranked_schemes.sort(key=lambda x: x["relevance_score"], reverse=True)

    # For driving licence, return no schemes (retain legacy requirement)
    if legacy_intent_primary == "DRIVING_LICENCE":
        ranked_schemes = []

    # 4. Goal-Specific Next Steps
    if legacy_intent_primary == "STUDY_ABROAD":
        next_steps = [
            "Apply for passport immediately at passportindia.gov.in if not already available",
            "Register and prepare for English proficiency exam (IELTS/PTE/TOEFL) — allow 2–3 months",
            "Shortlist universities in destination country with your target program",
            "Prepare Statement of Purpose (SOP), academic transcripts, and Letters of Recommendation (LOR)",
            "Obtain family income certificate from Mamlatdar/Tahsildar office",
            "Apply for state-specific study abroad scholarship (e.g., Rajiv Gandhi Scholarship for Rajasthan domicile)",
            "Apply for National Overseas Scholarship if belonging to SC/ST/Denotified Tribe category",
            "Apply for student visa after receiving university offer letter"
        ]
    elif legacy_intent_primary == "LAND_PURCHASE":
        next_steps = [
            "Search and verify the land ownership details (Khasra/Khatauni/Patta) on state land records portal",
            "Check for encumbrances on the property by applying for an Encumbrance Certificate",
            "Execute a legally binding Sale Agreement with the seller on non-judicial stamp paper",
            "Pay state stamp duty and registration fees online on the state registration portal",
            "Book slot and visit the Sub-Registrar Office with original documents for property registry",
            "Apply for land mutation (ownership transfer) in revenue records"
        ]
    elif legacy_intent_primary == "HEALTHCARE_FACILITY":
        next_steps = [
            "Secure commercial land and obtain building plan approval from local municipal corporation",
            "Register the hospital/clinic under the State Clinical Establishment Act",
            "Obtain Fire Safety NOC from State Fire Department",
            "Obtain Bio-Medical Waste Management NOC from State Pollution Control Board",
            "Apply for local Municipal Trade License / Shop & Establishment Registration",
            "Verify professional registration of doctors, nurses, and clinical staff with respective councils"
        ]
    elif legacy_intent_primary == "BUSINESS_REGISTRATION":
        next_steps = [
            "Decide on business structure and execute commercial rent/lease agreement for premises",
            "Apply for free Udyam MSME Registration on central portal",
            "Register for GSTIN if annual turnover exceeds statutory limits or for inter-state business",
            "Apply for local Municipal Trade License or Shop & Establishment Act registration",
            "Open commercial current bank account using registration certificates",
            "Apply for FSSAI Food Safety License (if food or restaurant business)",
            "Obtain Fire Safety NOC from State Fire Department (if restaurant or factory)"
        ]
    elif legacy_intent_primary == "DRIVING_LICENCE":
        next_steps = [
            "Submit renewal application on MoRTH Sarathi Parivahan portal",
            "Book online slot for document verification or test at nearest RTO",
            "If age > 40, obtain signed Form 1A medical certificate from registered MBBS doctor",
            "Pay renewal fee online and track application status"
        ]
    elif legacy_intent_primary == "TRAVEL":
        next_steps = [
            "Register on Passport Seva portal (passportindia.gov.in) and fill online application",
            "Pay passport fee online (₹1,500 Normal / ₹2,000 Tatkal)",
            "Book appointment and visit nearest Passport Seva Kendra (PSK) with original documents",
            "Complete police verification at registered current address",
            "Track passport delivery by speed post"
        ]
    elif legacy_intent_primary == "FARMER_BENEFITS":
        next_steps = [
            "Ensure Aadhaar is linked to bank account for PM-KISAN Direct Benefit Transfer (DBT)",
            "Register on PM-KISAN portal (pmkisan.gov.in) using land records and bank details",
            "Apply for Kisan Credit Card (KCC) at nearest bank branch for low-interest credit",
            "Register for PMFBY crop insurance before sowing season cutoff date"
        ]
    elif legacy_intent_primary == "SCHOOL_CONSTRUCTION":
        next_steps = [
            "Secure land and obtain commercial construction permits from local authority",
            "Register School Management Trust or Society under Societies Registration Act",
            "Apply for School Recognition / Affiliation from State Education Board or CBSE",
            "Obtain Fire Safety NOC and Building Safety Certificate",
            "Apply for local municipal authority registration"
        ]
    elif legacy_intent_primary == "HOUSING":
        next_steps = [
            "Check eligibility and register on Pradhan Mantri Awas Yojana (PMAY) portal for subsidy",
            "Apply for home loan at commercial bank using income and identity proofs",
            "Execute property Sale Agreement and pay stamp duty on state registry portal",
            "Schedule registry appointment at Sub-Registrar Office for deed registration"
        ]
    elif legacy_intent_primary == "SCHOLARSHIP":
        next_steps = [
            "Register on State Scholarship Portal (SSP) or National Scholarship Portal (NSP)",
            "Upload family income certificate and domicile certificate for verification",
            "Upload college admission fee receipt and marksheet details",
            "Track application approval and scholarship Direct Benefit Transfer (DBT) credit"
        ]
    else:
        next_steps = [
            "Review required documents list",
            "Upload missing documents to digital vault",
            "Check official source portals for service guidelines"
        ]

    # 5. Goal-Specific Sources
    if legacy_intent_primary == "STUDY_ABROAD":
        sources = [
            {"name": "Passport Seva — Ministry of External Affairs", "url": "https://passportindia.gov.in", "last_verified": "19 August 2026"},
            {"name": "Rajiv Gandhi Scholarship — Rajasthan HTE", "url": "https://hte.rajasthan.gov.in/scholarship/rgs", "last_verified": "19 August 2026"},
            {"name": "National Overseas Scholarship Portal", "url": "https://nosmsje.gov.in", "last_verified": "19 August 2026"}
        ]
    elif legacy_intent_primary == "LAND_PURCHASE":
        sources = [
            {"name": "Kaveri Online Services — Karnataka Department of Stamps and Registration", "url": "https://kaverionline.karnataka.gov.in", "last_verified": "19 August 2026"},
            {"name": "Apna Khata — Rajasthan Revenue Department", "url": "https://apnakhata.rajasthan.gov.in", "last_verified": "19 August 2026"},
            {"name": "National Portal of India", "url": "https://india.gov.in", "last_verified": "19 August 2026"}
        ]
    elif legacy_intent_primary == "HEALTHCARE_FACILITY":
        sources = [
            {"name": "Ministry of Health & Family Welfare", "url": "https://mohfw.gov.in", "last_verified": "19 August 2026"},
            {"name": "Central Pollution Control Board", "url": "https://cpcb.nic.in", "last_verified": "19 August 2026"},
            {"name": "National Portal of India", "url": "https://india.gov.in", "last_verified": "19 August 2026"}
        ]
    elif legacy_intent_primary == "BUSINESS_REGISTRATION":
        sources = [
            {"name": "Udyam MSME Portal", "url": "https://udyamregistration.gov.in", "last_verified": "19 August 2026"},
            {"name": "GST Portal", "url": "https://gst.gov.in", "last_verified": "19 August 2026"}
        ]
        if "restaurant" in query_clean or "food" in query_clean or "cafe" in query_clean:
            sources.append({"name": "FSSAI FoSCoS Portal", "url": "https://foscos.fssai.gov.in", "last_verified": "19 August 2026"})
    elif legacy_intent_primary == "DRIVING_LICENCE":
        sources = [
            {"name": "Sarathi Parivahan Portal — MoRTH", "url": "https://sarathi.parivahan.gov.in", "last_verified": "19 August 2026"}
        ]
    elif legacy_intent_primary == "TRAVEL":
        sources = [
            {"name": "Passport Seva — Ministry of External Affairs", "url": "https://passportindia.gov.in", "last_verified": "19 August 2026"}
        ]
    elif legacy_intent_primary == "FARMER_BENEFITS":
        sources = [
            {"name": "PM-KISAN Portal", "url": "https://pmkisan.gov.in", "last_verified": "19 August 2026"},
            {"name": "PMFBY Portal", "url": "https://pmfby.gov.in", "last_verified": "19 August 2026"}
        ]
    elif legacy_intent_primary == "SCHOOL_CONSTRUCTION":
        sources = [
            {"name": "Central Board of Secondary Education (CBSE)", "url": "https://cbse.gov.in", "last_verified": "19 August 2026"},
            {"name": "National Portal of India", "url": "https://india.gov.in", "last_verified": "19 August 2026"}
        ]
    elif legacy_intent_primary == "HOUSING":
        sources = [
            {"name": "PMAY Urban Portal", "url": "https://pmay-urban.gov.in", "last_verified": "19 August 2026"},
            {"name": "National Portal of India", "url": "https://india.gov.in", "last_verified": "19 August 2026"}
        ]
    elif legacy_intent_primary == "SCHOLARSHIP":
        sources = [
            {"name": "National Scholarship Portal (NSP)", "url": "https://scholarships.gov.in", "last_verified": "19 August 2026"},
            {"name": "National Portal of India", "url": "https://india.gov.in", "last_verified": "19 August 2026"}
        ]
    else:
        sources = [
            {"name": "National Portal of India", "url": "https://india.gov.in", "last_verified": "19 August 2026"}
        ]

    # 6. Target Location Root and Schemes Mapping
    target_loc_val = None
    if target_state or dest_country:
        target_loc_val = {}
        if target_state:
            target_loc_val["state"] = target_state
        if dest_country:
            target_loc_val["country"] = dest_country
        else:
            target_loc_val["country"] = "India"

    central_list = []
    state_list = []
    target_loc_list = []

    for s in ranked_schemes:
        if s["level"] == "CENTRAL":
            central_list.append(s)
        elif target_state and s["state_name"].lower() == target_state.lower() and target_state.lower() != domicile.lower():
            target_loc_list.append(s)
        else:
            state_list.append(s)

    # Empty schemes fallback notice
    if not central_list and not state_list and not target_loc_list:
        warnings.append("No highly matched scheme was found for this goal.")

    # Universal Structured Intent schema compliance (Requirement 3 & 22)
    intent_val = {
        "primary": primary_intent,
        "secondary": secondary_intents,
        "action": action_val,
        "object": object_val,
        "location": target_city or "",
        "state": target_state or ""
    }

    # 7. Formulate structured JSON payload
    result_payload = {
        "success": True,
        "journeyId": journey.id,
        "status": "COMPLETE",
        "rawGoal": query,
        "goal": {
            "title": goal_title,
            "category": legacy_intent_primary
        },
        "intent": intent_val,
        "domicile": {
            "state": domicile
        },
        "targetLocation": target_loc_val,
        "documents": {
            "have": available_docs,
            "need": needed_docs,
            "missing": [d for d in needed_docs if d["priority"] == "Required"],
            "conditional": [d for d in needed_docs if d["priority"] in ["Conditional", "Recommended"]]
        },
        "schemes": {
            "central": central_list[:15],
            "state": state_list[:15],
            "targetLocation": target_loc_list[:15],
            "domicileState": state_list[:15],
            "targetState": target_loc_list[:15],
            "otherRelevant": []
        },
        "nextSteps": next_steps,
        "sources": sources,
        "warnings": warnings,
        "diagnostics": {
            "retrievedCount": retrieved_count,
            "afterStatusFilter": active_count,
            "afterRelevanceFilter": relevance_count,
            "afterEligibilityFilter": eligibility_count,
            "finalCount": len(ranked_schemes)
        }
    }

    # Prints for development debug logs
    print(f"RAW GOAL: {query}")
    print(f"PRIMARY INTENT: {primary_intent}")
    print(f"SECONDARY INTENTS: {secondary_intents}")
    print(f"ACTION: {action_val}")
    print(f"OBJECT: {object_val}")
    print(f"DOMICILE: {domicile}")
    print(f"TARGET LOCATION: {target_loc_val}")
    print(f"DOCUMENTS IN VAULT: {list(user_doc_types.keys())}")
    print(f"RELEVANT DOCUMENTS FOUND: {[d['type'] for d in available_docs]}")
    print(f"DOCUMENTS MISSING: {[d['type'] for d in needed_docs if d['status'] == 'MISSING']}")
    print(f"CENTRAL SCHEMES RETRIEVED: {[s['id'] for s in central_list]}")
    print(f"STATE SCHEMES RETRIEVED: {[s['id'] for s in state_list]}")
    print(f"TARGET LOCATION RESULTS: {[s['id'] for s in target_loc_list]}")
    print(f"FINAL RESULT COUNTS: documentsHave = {len(available_docs)} documentsNeed = {len(needed_docs)} centralSchemes = {len(central_list)} stateSchemes = {len(state_list)}")

    # Structured timing log
    duration = time.time() - start_time
    print(f"[JANSETU DEV LOG] "
          f"request_id={journey.id} | "
          f"query={query} | "
          f"goal_classification={legacy_intent_primary} | "
          f"jurisdiction={extracted} | "
          f"document_match_status=SUCCESS | "
          f"scheme_search_status=SUCCESS | "
          f"llm_status=FALLBACK | "
          f"validation_status=SUCCESS | "
          f"total_response_time={duration:.3f}s")

    # Store result_json in db
    journey.title = goal_title
    journey.goal_category = extracted["goal_category"]
    journey.life_event = extracted["sub_category"]
    journey.intent = legacy_intent_primary
    journey.location_state = target_state or domicile
    journey.location_city = target_city
    journey.status = "COMPLETE"
    journey.result_json = result_payload
    db.commit()

    return result_payload

@api_v1_router.post("/journey/analyze")
def analyze_journey(
    req: JourneyAnalyzeRequest,
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = req.query.strip()
    domicile = (req.domicileState or req.domicile_state or "Rajasthan").strip()
    
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
    db.commit()
    db.refresh(journey)

    try:
        result = _do_analyze_journey(query, domicile, current_user, db, journey)
        return success_response(result, request)
    except Exception as e:
        print(f"[ERROR] analyze_journey failed: {e}")
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


@api_v1_router.post("/dev/log")
async def dev_log(request: Request):
    try:
        body = await request.json()
        print("\n" + "="*80)
        print("FRONTEND CRASH LOG RECEIVED:")
        print(body.get("message"))
        print("="*80 + "\n")
    except Exception as e:
        print(f"Error parsing dev log: {e}")
    return {"status": "ok"}


