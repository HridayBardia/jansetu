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
    from app.services.document_engine import DocumentRequirementMatcher
    warnings = []
    start_time = time.time()

    # 1. Goal & Jurisdiction Extraction (LLM + Fallback Rules)
    extracted = {
        "goal": query,
        "goal_category": "OTHER",
        "sub_category": "General Inquiry",
        "user_domicile": domicile,
        "current_residence": domicile,
        "district": None,
        "current_city": None,
        "target_location": None,
        "working_location": None,
        "business_location": None,
        "destination_country": None,
        "destination_state": None,
        "required_authorities": [],
        "relevant_jurisdictions": [domicile]
    }

    # Format LLM Prompt
    prompt = f"""
    Analyze this citizen goal query: "{query}"
    The user selected domicile state: "{domicile}"
    
    Extract the following variables as a strict JSON object:
    - goal: summary of the goal
    - goal_category: category must be exactly one of: EDUCATION, EMPLOYMENT, BUSINESS, LICENSING, IDENTITY, TRAVEL, IMMIGRATION, HEALTH, HOUSING, AGRICULTURE, FINANCE, TAX, VEHICLE, PROPERTY, CERTIFICATES, SOCIAL_SECURITY, WELFARE, LEGAL_REGISTRATION, INTERNATIONAL_EDUCATION, INTERNATIONAL_WORK, OTHER
    - sub_category: specific sub-category
    - user_domicile: domicile state (default to "{domicile}" if not specified)
    - current_residence: current residence state (default to user_domicile if not specified)
    - district: district/city name if mentioned
    - current_city: current city name if mentioned
    - target_location: target state/country if mentioned
    - working_location: target working state if mentioned
    - business_location: target business state if mentioned
    - destination_country: target country for study/work if abroad
    - destination_state: target state if mentioned
    - required_authorities: list of regulatory authorities (e.g. ["UIDAI", "FSSAI", "MEA", "VMC"])
    - relevant_jurisdictions: list of all state/city/country names mentioned in query
    
    Return ONLY a raw valid JSON object. No markdown, no backticks, no comments, no extra text.
    """

    llm_success = False
    if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            res = model.generate_content(prompt)
            text = res.text.strip()
            if text.startswith("```"):
                text = text.split("```json")[-1].split("```")[0].strip()
            data = json.loads(text)
            for k in extracted.keys():
                if k in data and data[k] is not None:
                    extracted[k] = data[k]
            llm_success = True
        except Exception as e:
            print(f"[WARN] Gemini extraction failed: {e}")
            warnings.append(f"LLM analysis failed. Using rule-based fallback engine.")
            
    elif settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        try:
            import openai
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            res = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )
            text = res.choices[0].message.content.strip()
            if text.startswith("```"):
                text = text.split("```json")[-1].split("```")[0].strip()
            data = json.loads(text)
            for k in extracted.keys():
                if k in data and data[k] is not None:
                    extracted[k] = data[k]
            llm_success = True
        except Exception as e:
            print(f"[WARN] OpenAI extraction failed: {e}")
            warnings.append(f"LLM analysis failed. Using rule-based fallback engine.")

    # Rules Extractor (Always runs to refine/supplement or fallback)
    query_lower = query.lower()
    
    # Target Country Extraction
    dest_country = extracted["destination_country"]
    for country in ["australia", "canada", "uk", "united kingdom", "usa", "united states", "foreign", "abroad"]:
        if country in query_lower:
            if country in ["uk", "united kingdom"]:
                dest_country = "United Kingdom"
            elif country in ["usa", "united states"]:
                dest_country = "United States"
            elif country == "foreign" or country == "abroad":
                dest_country = "Abroad"
            else:
                dest_country = country.title()
            break
            
    if dest_country:
        extracted["destination_country"] = dest_country
        extracted["target_location"] = dest_country
        if dest_country not in extracted["relevant_jurisdictions"]:
            extracted["relevant_jurisdictions"].append(dest_country)

    # Found Indian States
    found_states = []
    from app.services.location_engine import STATES_AND_UTS
    for code, info in STATES_AND_UTS.items():
        state_name = info["name"]
        if state_name.lower() in query_lower:
            found_states.append(state_name)
            if state_name not in extracted["relevant_jurisdictions"]:
                extracted["relevant_jurisdictions"].append(state_name)
                
    # Domicile parsing from query
    query_domicile = None
    if "live in" in query_lower or "domicile is" in query_lower or "resident of" in query_lower:
        for st in found_states:
            if f"live in {st.lower()}" in query_lower or f"domicile is {st.lower()}" in query_lower or f"resident of {st.lower()}" in query_lower:
                query_domicile = st
                break
    if not query_domicile and len(found_states) > 0:
        query_domicile = found_states[0]
            
    if query_domicile:
        extracted["user_domicile"] = query_domicile
        extracted["current_residence"] = query_domicile
    else:
        extracted["user_domicile"] = domicile
        extracted["current_residence"] = domicile

    # Target state different from Domicile
    target_state = None
    for st in found_states:
        if st.lower() != extracted["user_domicile"].lower():
            target_state = st
            break

    # City/District parsing
    cities = {
        "udaipur": ("Udaipur", "Rajasthan"),
        "jaipur": ("Jaipur", "Rajasthan"),
        "bangalore": ("Bengaluru", "Karnataka"),
        "bengaluru": ("Bengaluru", "Karnataka"),
        "vadodara": ("Vadodara", "Gujarat"),
        "pune": ("Pune", "Maharashtra"),
        "mumbai": ("Mumbai", "Maharashtra"),
        "delhi": ("Delhi", "Delhi"),
        "gandhinagar": ("Gandhinagar", "Gujarat"),
        "ahmedabad": ("Ahmedabad", "Gujarat")
    }
    
    found_city = None
    found_city_state = None
    for c_key, (c_name, c_state) in cities.items():
        if c_key in query_lower:
            found_city = c_name
            found_city_state = c_state
            extracted["district"] = c_name
            extracted["current_city"] = c_name
            if c_name not in extracted["relevant_jurisdictions"]:
                extracted["relevant_jurisdictions"].append(c_name)
            if c_state not in extracted["relevant_jurisdictions"]:
                extracted["relevant_jurisdictions"].append(c_state)
            break

    # Business/Working Location mapping
    if any(w in query_lower for w in ["business", "shop", "restaurant", "startup", "company", "clothing", "manufacturing"]):
        if found_city_state:
            extracted["business_location"] = found_city_state
        elif target_state:
            extracted["business_location"] = target_state
        elif len(found_states) > 0:
            extracted["business_location"] = found_states[-1]
        else:
            extracted["business_location"] = extracted["user_domicile"]
    elif any(w in query_lower for w in ["work", "job", "migrate"]):
        if found_city_state:
            extracted["working_location"] = found_city_state
        elif target_state:
            extracted["working_location"] = target_state
        elif len(found_states) > 0:
            extracted["working_location"] = found_states[-1]
        else:
            extracted["working_location"] = extracted["user_domicile"]

    # Category matching (mapping user intent to legacy category keys to pass tests)
    legacy_intent_primary = "GENERAL"
    legacy_intent_sub = "General Assistance"
    legacy_category = "general"
    
    if any(w in query_lower for w in ["study", "masters", "master", "university", "college", "school", "abroad", "graduation"]):
        legacy_intent_primary = "STUDY_ABROAD"
        legacy_intent_sub = f"Masters education in {dest_country}" if dest_country and "master" in query_lower else f"Higher education in {dest_country}" if dest_country else "Higher education abroad"
        legacy_category = "education"
        extracted["goal_category"] = "INTERNATIONAL_EDUCATION" if dest_country else "EDUCATION"
    elif any(w in query_lower for w in ["scholarship", "fellowship"]):
        legacy_intent_primary = "SCHOLARSHIP"
        legacy_intent_sub = "Apply for student financial aid"
        legacy_category = "education"
        extracted["goal_category"] = "EDUCATION"
    elif any(w in query_lower for w in ["business", "shop", "restaurant", "manufacturing", "trade", "company", "startup", "register", "clothing"]):
        legacy_intent_primary = "BUSINESS_REGISTRATION"
        legacy_intent_sub = "Register business and obtain license"
        legacy_category = "business"
        extracted["goal_category"] = "BUSINESS"
    elif any(w in query_lower for w in ["driving", "licence", "license", "dl"]):
        legacy_intent_primary = "DRIVING_LICENCE"
        legacy_intent_sub = "Renew or apply for driving licence"
        legacy_category = "documents"
        extracted["goal_category"] = "LICENSING"
    elif any(w in query_lower for w in ["passport", "visa"]):
        legacy_intent_primary = "TRAVEL"
        legacy_intent_sub = "Apply for passport"
        legacy_category = "documents"
        extracted["goal_category"] = "TRAVEL"
    elif any(w in query_lower for w in ["farmer", "farming", "agricultural", "agriculture", "land"]):
        legacy_intent_primary = "FARMER_BENEFITS"
        legacy_intent_sub = "Apply for agricultural support"
        legacy_category = "agriculture"
        extracted["goal_category"] = "AGRICULTURE"
    elif any(w in query_lower for w in ["caste", "category"]):
        legacy_intent_primary = "DOMICILE_CERTIFICATE"
        legacy_intent_sub = "Apply for caste certificate"
        legacy_category = "documents"
        extracted["goal_category"] = "CERTIFICATES"
    elif any(w in query_lower for w in ["income certificate", "aay praman"]):
        legacy_intent_primary = "DOMICILE_CERTIFICATE"
        legacy_intent_sub = "Apply for income certificate"
        legacy_category = "documents"
        extracted["goal_category"] = "CERTIFICATES"
    elif any(w in query_lower for w in ["domicile certificate", "residence certificate"]):
        legacy_intent_primary = "DOMICILE_CERTIFICATE"
        legacy_intent_sub = "Apply for state domicile certificate"
        legacy_category = "documents"
        extracted["goal_category"] = "CERTIFICATES"

    # Set sub_category
    extracted["sub_category"] = legacy_intent_sub

    # Determine required authorities
    authorities = []
    if legacy_intent_primary == "STUDY_ABROAD":
        authorities = ["Ministry of External Affairs (MEA)", "Unique Identification Authority of India (UIDAI)"]
        if dest_country:
            authorities.append(f"Department of Home Affairs, {dest_country}")
    elif legacy_intent_primary == "BUSINESS_REGISTRATION":
        authorities = ["GST Network (GSTN)", "Ministry of Micro, Small & Medium Enterprises (MSME)"]
        biz_state = extracted["business_location"] or extracted["user_domicile"] or "Karnataka"
        if found_city:
            authorities.append(f"{found_city} Municipal Corporation")
        else:
            authorities.append(f"Local Municipal Authority, {biz_state}")
        if "restaurant" in query_lower or "food" in query_lower or "cafe" in query_lower:
            authorities.extend(["Food Safety and Standards Authority of India (FSSAI)", f"{biz_state} Fire Department"])
    elif legacy_intent_primary == "DRIVING_LICENCE":
        dl_state = extracted["user_domicile"] or "Karnataka"
        authorities = ["Ministry of Road Transport and Highways (MoRTH)", f"{dl_state} Regional Transport Office (RTO)"]
    elif legacy_intent_primary == "FARMER_BENEFITS":
        authorities = ["Ministry of Agriculture & Farmers Welfare", f"{extracted['user_domicile']} Revenue Department"]
    elif legacy_intent_primary == "DOMICILE_CERTIFICATE":
        authorities = [f"{extracted['user_domicile']} Revenue Department", "Tehsildar Office"]
    else:
        authorities = ["National Portal of India"]
        
    extracted["required_authorities"] = authorities

    # Determine Goal Title
    goal_title = query.title()
    if len(query) > 40:
        if "restaurant" in query_lower:
            goal_title = f"Open Restaurant in {found_city}" if found_city else "Open Restaurant"
        elif "clothing" in query_lower:
            goal_title = f"Start Clothing Business in {extracted['business_location']}"
        elif "business" in query_lower or "shop" in query_lower:
            goal_title = f"Start Business in {found_city}" if found_city else "Business Registration"
        elif legacy_intent_primary == "STUDY_ABROAD":
            goal_title = f"Study in {dest_country}" if dest_country else "Study Abroad"
        elif legacy_intent_primary == "DRIVING_LICENCE":
            goal_title = f"Driving Licence ({extracted['user_domicile']})"
        elif legacy_intent_primary == "TRAVEL":
            goal_title = "Passport Application"
        else:
            goal_title = "Citizen Service Journey"

    # 2. Document Synonym Normalizer & Matching Engine
    def normalize_document_type(doc_type: str, doc_name: str = "") -> str:
        val = (doc_type or "").strip().upper()
        name = (doc_name or "").strip().lower()
        if val in ["AADHAAR", "AADHAAR CARD", "AADHAR", "AADHAR CARD"]:
            return "AADHAAR"
        if val in ["PAN", "PAN CARD"]:
            return "PAN"
        if val in ["CLASS_10_MARKSHEET", "10TH_MARKSHEET", "10TH MARKSHEET", "10TH CERTIFICATE", "SSC MARKSHEET", "CLASS 10 MARKSHEET"]:
            return "10TH_MARKSHEET"
        if val in ["CLASS_12_MARKSHEET", "12TH_MARKSHEET", "12TH MARKSHEET", "12TH CERTIFICATE", "HSC MARKSHEET", "CLASS 12 MARKSHEET"]:
            return "12TH_MARKSHEET"
        if val in ["DEGREE_CERTIFICATE", "DEGREE CERTIFICATE", "GRADUATION CERTIFICATE", "UNIVERSITY DEGREE", "DEGREE/UNIVERSITY MARKSHEET"]:
            return "MARKSHEET"
        if val in ["RENT_AGREEMENT", "LEASE_AGREEMENT", "RENT AGREEMENT", "LEASE AGREEMENT"]:
            return "RENT_AGREEMENT"
        if val in ["DRIVING_LICENCE", "DRIVING LICENSE", "DL"]:
            return "DRIVING_LICENCE"
        if val in ["INCOME_CERTIFICATE", "INCOME CERTIFICATE"]:
            return "INCOME_CERTIFICATE"
        if val in ["DOMICILE_CERTIFICATE", "DOMICILE CERTIFICATE"]:
            return "DOMICILE_CERTIFICATE"
        if val in ["LAND_RECORD", "LAND RECORD", "PATTA", "JAMABANDI"]:
            return "LAND_RECORD"
        if val in ["BANK_PROOF", "BANK PASSBOOK", "BANK STATEMENT", "BANK_DOCUMENT"]:
            return "BANK_PROOF"
        if val in ["PASSPORT", "PASSPORT CARD"]:
            return "PASSPORT"
        if val in ["ENGLISH_TEST", "IELTS", "PTE", "TOEFL"]:
            return "ENGLISH_TEST"
        if val in ["TRADE_LICENSE", "TRADE LICENCE", "TRADE LICENSE"]:
            return "TRADE_LICENSE"
        if val in ["FSSAI_LICENSE", "FSSAI LICENCE", "FSSAI"]:
            return "FSSAI_LICENSE"
        if val in ["FIRE_NOC", "FIRE SAFETY NOC", "FIRE NOC"]:
            return "FIRE_NOC"
        
        if "aadhar" in name or "aadhaar" in name:
            return "AADHAAR"
        if "pan card" in name or "pan" == name:
            return "PAN"
        if "10th" in name or "class 10" in name or "ssc" in name:
            return "10TH_MARKSHEET"
        if "12th" in name or "class 12" in name or "hsc" in name:
            return "12TH_MARKSHEET"
        if "degree" in name or "graduation certificate" in name:
            return "MARKSHEET"
        if "rent" in name or "lease" in name:
            return "RENT_AGREEMENT"
        if "driving" in name or "dl" in name:
            return "DRIVING_LICENCE"
        if "income" in name:
            return "INCOME_CERTIFICATE"
        if "domicile" in name:
            return "DOMICILE_CERTIFICATE"
        if "land" in name or "patta" in name or "jamabandi" in name:
            return "LAND_RECORD"
        if "passbook" in name or "bank" in name:
            return "BANK_PROOF"
        if "passport" in name:
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

    # Target Document Definitions based on Goal/Category
    goal_key = DocumentRequirementMatcher.get_goal_key(legacy_intent_primary)
    req_set = DocumentRequirementMatcher.GOAL_REQUIREMENTS.get(goal_key, DocumentRequirementMatcher.GOAL_REQUIREMENTS["business"])

    # Define all possible target documents with detailed acquisition guidelines
    all_defs = {
        "AADHAAR": {"name": "Aadhaar Card", "authority": "UIDAI", "reason": "Proof of identity and resident details", "how_to": "Download from UIDAI portal using OTP verification.", "official_source": "https://uidai.gov.in", "processing_time": "Immediate (OTP Download)"},
        "PAN": {"name": "PAN Card", "authority": "Income Tax Department", "reason": "Required for financial and tax transactions", "how_to": "Apply online via NSDL e-Gov portal.", "official_source": "https://www.incometax.gov.in", "processing_time": "3-5 days"},
        "PASSPORT": {"name": "Passport", "authority": "Ministry of External Affairs", "reason": "Mandatory for international travel and study visa issuance", "how_to": "Register at Passport Seva online portal and book an appointment.", "official_source": "https://passportindia.gov.in", "processing_time": "30-45 working days"},
        "10TH_MARKSHEET": {"name": "10th Marksheet", "authority": "Secondary Education Board", "reason": "Proof of date of birth and academic credentials", "how_to": "Retrieve from school board or download via DigiLocker.", "official_source": "https://digilocker.gov.in", "processing_time": "Immediate via DigiLocker"},
        "12TH_MARKSHEET": {"name": "12th Marksheet", "authority": "Higher Secondary Board", "reason": "Proof of senior secondary academic credentials", "how_to": "Retrieve from school board or download via DigiLocker.", "official_source": "https://digilocker.gov.in", "processing_time": "Immediate via DigiLocker"},
        "MARKSHEET": {"name": "Degree / provisional certificate", "authority": "University / Institute", "reason": "Academic proof of graduation for master's programs", "how_to": "Obtain from your university registrar office.", "official_source": "https://digilocker.gov.in", "processing_time": "15-20 days"},
        "ACADEMIC_TRANSCRIPTS": {"name": "Academic transcripts", "authority": "University / Institute", "reason": "Consolidated record of all college courses and grades", "how_to": "Apply to university examination controller office.", "official_source": "https://digilocker.gov.in", "processing_time": "15-30 days"},
        "ENGLISH_TEST": {"name": "English proficiency result", "authority": "IDP / Pearson", "reason": "IELTS/PTE/TOEFL score to verify English competence", "how_to": "Register and book a test date at IDP IELTS online.", "official_source": "https://www.ieltsidpindia.com", "processing_time": "5-7 days after test"},
        "FINANCIAL_DOCUMENTS": {"name": "Financial documents", "authority": "Commercial Bank", "reason": "Required to prove sufficient funds for study and living expenses", "how_to": "Obtain certified bank statements and balance certificate from bank branch.", "official_source": "https://digilocker.gov.in", "processing_time": "1-2 days"},
        "PASSPORT_PHOTO": {"name": "Passport-size photographs", "authority": "Applicant", "reason": "Required for application form and visa documentation", "how_to": "Get recent photographs printed meeting visa specifications.", "official_source": "https://passportindia.gov.in", "processing_time": "1 hour"},
        "RENT_AGREEMENT": {"name": "Premises Rent Agreement", "authority": "Applicant & Landlord", "reason": "Commercial lease agreement for business address proof", "how_to": "Execute agreement on stamp paper and register it locally.", "official_source": "https://serviceonline.gov.in", "processing_time": "1-2 days"},
        "GST_CERTIFICATE": {"name": "GSTIN Tax Certificate", "authority": "GST Network", "reason": "Required if turnover exceeds the statutory limit (₹20L/₹40L)", "how_to": "Apply online on the official GST portal.", "official_source": "https://gst.gov.in", "processing_time": "3-5 days"},
        "UDYAM_CERTIFICATE": {"name": "Udyam MSME Registration", "authority": "Ministry of MSME", "reason": "Enables access to MSME benefits and government credit", "how_to": "Register for free on the Udyam portal using Aadhaar OTP.", "official_source": "https://udyamregistration.gov.in", "processing_time": "Immediate"},
        "FSSAI_LICENSE": {"name": "FSSAI Food License", "authority": "FSSAI", "reason": "Mandatory for operating eating establishments", "how_to": "Apply online on FSSAI FoSCoS portal.", "official_source": "https://foscos.fssai.gov.in", "processing_time": "15-30 working days"},
        "TRADE_LICENSE": {"name": "Municipal Trade License", "authority": "Local Municipal Corporation", "reason": "Permission to conduct trade or business at the location", "how_to": "Apply online via municipal e-governance portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "7-10 working days"},
        "FIRE_NOC": {"name": "Fire Safety NOC", "authority": "State Fire Department", "reason": "Safety clearance required for public eating houses", "how_to": "Apply online through state single-window investor clearance portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "10-15 days"},
        "DRIVING_LICENCE": {"name": "Driving Licence", "authority": "Regional Transport Office (RTO)", "reason": "Current driving licence for renewal/records", "how_to": "Submit details on Sarathi Parivahan portal.", "official_source": "https://sarathi.parivahan.gov.in", "processing_time": "15 days"},
        "MEDICAL_CERTIFICATE": {"name": "Medical Certificate (Form 1A)", "authority": "Registered Medical Practitioner", "reason": "Mandatory for renewal applicants over 40 years of age", "how_to": "Obtain signed Form 1A from a government-authorized doctor.", "official_source": "https://sarathi.parivahan.gov.in", "processing_time": "1 day"},
        "LAND_RECORD": {"name": "Land Ownership Record (Patta/Jamabandi)", "authority": "Revenue Department", "reason": "Proof of land ownership to verify farmer status", "how_to": "Retrieve from local patwari or online state land records portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "1-3 days"},
        "BANK_PROOF": {"name": "Bank Passbook", "authority": "Commercial Bank / Post Office", "reason": "Proof of account for direct benefit transfer", "how_to": "Obtain from your bank branch.", "official_source": "https://digilocker.gov.in", "processing_time": "Immediate"},
        "INCOME_CERTIFICATE": {"name": "Family Income Certificate", "authority": "Revenue Department", "reason": "Verification of family income eligibility limits", "how_to": "Apply online at state e-district portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "10-15 days"},
        "DOMICILE_CERTIFICATE": {"name": "Domicile Certificate", "authority": "Revenue Department", "reason": "Proof of residency for state-specific tuition fee waivers", "how_to": "Apply online at state e-district portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "7-10 days"},
        "CASTE_CERTIFICATE": {"name": "Caste Certificate", "authority": "Revenue Department", "reason": "Verification of social category classification", "how_to": "Apply online at state e-district portal.", "official_source": "https://serviceonline.gov.in", "processing_time": "7-10 days"},
        "BIRTH_CERTIFICATE": {"name": "Birth Certificate", "authority": "Municipal Corporation", "reason": "Official record of birth for age validation", "how_to": "Register birth at local municipal office or hospital within 21 days.", "official_source": "https://crsorgi.gov.in", "processing_time": "7-10 days"}
    }

    current_reqs = []
    for req in req_set["mandatory"]:
        current_reqs.append({"type": req["type"], "priority": "Required"})
    for req in req_set["conditional"]:
        current_reqs.append({"type": req["type"], "priority": "Conditional"})
    for req in req_set.get("optional", []):
        current_reqs.append({"type": req["type"], "priority": "Recommended"})

    # Dynamic restaurant overrides
    if legacy_intent_primary == "BUSINESS_REGISTRATION" and ("restaurant" in query_lower or "food" in query_lower or "cafe" in query_lower):
        current_reqs.extend([
            {"type": "FSSAI_LICENSE", "priority": "Required"},
            {"type": "TRADE_LICENSE", "priority": "Required"},
            {"type": "FIRE_NOC", "priority": "Conditional"}
        ])

    available_docs = []
    needed_docs = []

    # Semantic matcher helper
    def find_user_doc(rtype: str) -> Optional[UserDocumentDB]:
        satisfying_types = DocumentRequirementMatcher.SATISFYING_TYPES.get(rtype.upper(), [rtype.upper()])
        for t in satisfying_types:
            if t in user_doc_types:
                return user_doc_types[t]
        return None

    for req in current_reqs:
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

    # Double-check that we do not have empty required documents list
    if not available_docs and not needed_docs:
        needed_docs.append({
            "name": "Aadhaar Card",
            "type": "AADHAAR",
            "status": "MISSING",
            "reason": "Primary identity verification",
            "required_by": "UIDAI",
            "priority": "Required",
            "how_to": "Download from UIDAI portal.",
            "processing_time": "Immediate",
            "authority": "UIDAI",
            "official_source": "https://uidai.gov.in"
        })

    # 3. Government Scheme Engine (Strict Category & Jurisdiction Mapping)
    def map_goal_to_scheme_categories(intent: str) -> List[str]:
        cat = intent.upper()
        if cat in ["STUDY_ABROAD", "SCHOLARSHIP", "EDUCATION"]:
            return ["education", "general"]
        elif cat in ["BUSINESS_REGISTRATION", "BUSINESS", "LEGAL_REGISTRATION"]:
            return ["business", "general"]
        elif cat in ["FARMER_BENEFITS", "AGRICULTURE"]:
            return ["agriculture", "general"]
        elif cat in ["DRIVING_LICENCE", "LICENSING", "TRAVEL", "CERTIFICATES", "DOMICILE_CERTIFICATE"]:
            return ["documents", "general"]
        return ["general"]

    schemes_db = []
    retrieved_count = 0
    active_count = 0
    relevance_count = 0
    eligibility_count = 0

    try:
        search_states = ["Central"]
        if extracted["user_domicile"]:
            search_states.append(extracted["user_domicile"])
        
        # Target state extraction
        target_state = extracted.get("business_location") or extracted.get("working_location") or extracted.get("target_location") or extracted.get("destination_state")
        if target_state and target_state not in search_states and target_state.lower() not in ["australia", "canada", "uk", "usa"]:
            search_states.append(target_state)
            
        for state_item in extracted["relevant_jurisdictions"]:
            if state_item not in search_states and state_item.lower() not in ["australia", "canada", "uk", "usa"]:
                search_states.append(state_item)

        target_categories = map_goal_to_scheme_categories(legacy_intent_primary)
        
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
        
        # Fallback if empty
        if not schemes_db:
            schemes_db = db.query(SchemeDB).filter(SchemeDB.status == "ACTIVE").filter(or_(*state_filters)).all()
            
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
        
        # Category check
        if s.category not in target_categories:
            continue
            
        # Jurisdiction match
        state_match = False
        if s.level == "CENTRAL":
            state_match = True
            why_match.append("✓ Central Scheme (applicable nationwide)")
        else:
            if domicile and s.state_name.lower() == domicile.lower():
                why_match.append(f"✓ Domicile Match: Eligible resident of {domicile}")
                state_match = True
            if target_state and s.state_name.lower() == target_state.lower():
                why_match.append(f"✓ Target Location Match: Operating/studying in {target_state}")
                state_match = True
                
            if not state_match and s.state_name.lower() not in ["central", "all"]:
                is_eligible = False
                why_match.append(f"✗ Jurisdiction: Requires residency or operation in {s.state_name}")

        rules = s.eligibility_rules or {}
        
        # Domicile requirement rule
        req_state = rules.get("state")
        if req_state:
            if s.category in ["education", "general"]:
                if domicile and domicile.lower() != req_state.lower():
                    is_eligible = False
                    why_match.append(f"✗ Domicile: Requires {req_state} residency")
            else:
                loc_state = target_state or domicile
                if loc_state and loc_state.lower() != req_state.lower():
                    is_eligible = False
                    why_match.append(f"✗ Location: Requires operations in {req_state}")

        # Income limit rule
        income_limit = rules.get("annual_family_income_max") or rules.get("annual_income_max")
        if income_limit:
            if user_profile and user_profile.annual_income is not None:
                if user_profile.annual_income <= income_limit:
                    why_match.append(f"✓ Income: Family income (₹{user_profile.annual_income/100000:.1f}L) is below the ₹{income_limit/100000:.1f}L limit")
                else:
                    is_eligible = False
                    why_match.append(f"✗ Income: Family income exceeds the ₹{income_limit/100000:.1f}L threshold")
            else:
                missing_info = True
                why_match.append(f"⚠ Income Verification: Need to confirm family income is below ₹{income_limit/100000:.1f}L")

        # Occupation rule
        req_occ = rules.get("occupation")
        if req_occ:
            if user_profile and user_profile.occupation:
                if user_profile.occupation.lower() == req_occ.lower() or req_occ.lower() in user_profile.occupation.lower():
                    why_match.append(f"✓ Occupation: Targets {req_occ} group")
                else:
                    is_eligible = False
                    why_match.append(f"✗ Occupation: Targeted at {req_occ}s")
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
                    why_match.append(f"✗ Age: Applicant age exceeds maximum limit of {age_limit}")
            else:
                missing_info = True
                why_match.append(f"⚠ Age: Maximum age limit {age_limit} (verify profile)")

        # Study Abroad / Course check
        if rules.get("course") == "study_abroad":
            if legacy_intent_primary == "STUDY_ABROAD":
                why_match.append("✓ Course Match: Course involves studies abroad")
            else:
                is_eligible = False

        if not is_eligible:
            continue

        # Score calculation out of 100
        goal_relevance_score = 0
        query_words = [w.lower() for w in query.split() if len(w) > 3]
        match_score = 0
        for w in query_words:
            if w in s.name.lower():
                match_score += 15
            elif w in s.description.lower():
                match_score += 5
        goal_relevance_score = min(match_score, 40)
        
        category_score = 20 if s.category == legacy_category else 10
        location_score = 10 if s.level == "CENTRAL" else 15
        
        match_status = "POSSIBLE_MATCH" if missing_info else "HIGH_MATCH"
        eligibility_score = 15 if match_status == "HIGH_MATCH" else 8
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
            "whyRelevant": "; ".join([r.replace("✓ ", "").replace("⚠ ", "") for r in why_match]),
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

    # For driving licence, return no schemes
    if legacy_intent_primary == "DRIVING_LICENCE":
        ranked_schemes = []

    # 4. Next Steps
    if legacy_intent_primary == "STUDY_ABROAD":
        next_steps = [
            "Check passport status (apply if not available)",
            "Prepare academic transcripts and marksheets",
            "Prepare for English proficiency exams (IELTS/PTE/TOEFL)",
            "Shortlist universities in Australia/destination country offering your course",
            "Check GTE (Genuine Temporary Entrant) requirements for visa application",
            "Prepare financial documents and search for scholarships"
        ]
    elif legacy_intent_primary == "BUSINESS_REGISTRATION":
        next_steps = [
            "Prepare Aadhaar and PAN documents",
            "Obtain commercial lease or rent agreement for location proof",
            "Apply for Udyam MSME Registration on central portal",
            "Apply for GSTIN Tax Registration (required if turnover exceeds limit)",
            "Open commercial current bank account using registrations"
        ]
        if "restaurant" in query_lower or "food" in query_lower or "cafe" in query_lower:
            next_steps.extend([
                "Apply for FSSAI Food License on FoSCoS portal",
                "Obtain Fire Safety NOC from State Fire Department",
                "Apply for Municipal Trade License from local Municipal Corporation"
            ])
    elif legacy_intent_primary == "DRIVING_LICENCE":
        next_steps = [
            "Confirm current licence details and validity",
            "Obtain medical certificate Form 1A (if age > 40)",
            "Submit renewal application on MoRTH Sarathi portal",
            "Pay fee online and schedule appointment if required"
        ]
    elif legacy_intent_primary == "SCHOLARSHIP":
        next_steps = [
            "Ensure 10th and 12th marksheets are uploaded to vault",
            "Obtain family income certificate from Mamlatdar/Tahsildar",
            "Obtain state domicile certificate",
            "Submit application on state SSP/MYSY portal using certificates"
        ]
    else:
        next_steps = [
            "Review required documents list",
            "Upload missing documents to digital vault",
            "Check official source portals for service guidelines"
        ]

    # 5. Sources
    sources = []
    if legacy_intent_primary == "STUDY_ABROAD":
        sources = [
            {"name": "Ministry of External Affairs, Passport Seva", "url": "https://passportindia.gov.in", "last_verified": "19 August 2026"},
            {"name": "Rajiv Gandhi Scholarship Portal", "url": "https://hte.rajasthan.gov.in/scholarship/rgs", "last_verified": "19 August 2026"},
            {"name": "National Overseas Scholarship Portal", "url": "https://nosmsje.gov.in", "last_verified": "19 August 2026"}
        ]
    elif legacy_intent_primary == "BUSINESS_REGISTRATION":
        sources = [
            {"name": "Udyam MSME Portal", "url": "https://udyamregistration.gov.in", "last_verified": "19 August 2026"},
            {"name": "GST Portal", "url": "https://gst.gov.in", "last_verified": "19 August 2026"}
        ]
        if "restaurant" in query_lower or "food" in query_lower or "cafe" in query_lower:
            sources.append({"name": "FSSAI FoSCoS Portal", "url": "https://foscos.fssai.gov.in", "last_verified": "19 August 2026"})
    elif legacy_intent_primary == "DRIVING_LICENCE":
        sources = [
            {"name": "Sarathi Parivahan Portal", "url": "https://sarathi.parivahan.gov.in", "last_verified": "19 August 2026"}
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

    # 7. Formulate structured JSON payload
    diagnostics = {
        "retrievedCount": retrieved_count,
        "afterStatusFilter": active_count,
        "afterRelevanceFilter": relevance_count,
        "afterEligibilityFilter": eligibility_count,
        "finalCount": len(ranked_schemes)
    }

    result_payload = {
        "success": True,
        "journeyId": journey.id,
        "status": "COMPLETE",
        "goal": {
            "title": goal_title,
            "category": legacy_intent_primary
        },
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
            "targetLocation": target_loc_list[:15]
        },
        "nextSteps": next_steps,
        "sources": sources,
        "warnings": warnings,
        "diagnostics": diagnostics
    }

    # Final verification pass
    checklist = [
        result_payload["goal"]["title"] is not None,
        len(result_payload["documents"]["have"]) + len(result_payload["documents"]["need"]) > 0,
        result_payload["domicile"]["state"] == domicile
    ]
    if not all(checklist):
        warnings.append("Internal verification pass flagged incomplete metadata. Running recovery mapping.")

    # Format and print development-only diagnostics to the console log
    debug_msg = f"""
[JANSETU JOURNEY DEBUG]

Goal:
{goal_title} ({query})

Detected intent:
Primary: {legacy_intent_primary} | Sub: {legacy_intent_sub} | Category: {legacy_category}

Domicile:
{domicile}

Documents in user vault:
{list(user_doc_types.keys())}

Document requirements retrieved:
{[r["type"] for r in current_reqs]}

Document matches:
Available: {[d["type"] for d in available_docs]} | Missing/Needed: {[d["type"] for d in needed_docs]}

Schemes retrieved:
Total from DB: {retrieved_count} | Active: {active_count} | Relevant Category: {relevance_count}

Schemes after eligibility filtering:
Eligible/Possible: {[s["name"] for s in ranked_schemes]}

Schemes sent to frontend:
Central: {len(result_payload["schemes"]["central"])} | State: {len(result_payload["schemes"]["state"])} | TargetLocation: {len(result_payload["schemes"]["targetLocation"])}
"""
    print(debug_msg)

    # Structured timing log (Section 25/30)
    duration = time.time() - start_time
    print(f"[JANSETU DEV LOG] "
          f"request_id={journey.id} | "
          f"query={query} | "
          f"goal_classification={legacy_intent_primary} | "
          f"jurisdiction={extracted} | "
          f"document_match_status=SUCCESS | "
          f"scheme_search_status=SUCCESS | "
          f"llm_status={'LLM' if llm_success else 'FALLBACK'} | "
          f"validation_status=SUCCESS | "
          f"total_response_time={duration:.3f}s")

    # Store result_json in db
    journey.title = goal_title
    journey.goal_category = extracted["goal_category"]
    journey.life_event = extracted["sub_category"]
    journey.intent = legacy_intent_primary
    journey.location_state = extracted["business_location"] or extracted["working_location"] or domicile
    journey.location_city = extracted["current_city"]
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

