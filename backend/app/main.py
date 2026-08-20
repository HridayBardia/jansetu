import os
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.core.websocket import ws_manager
from app.api.v1.router import api_v1_router

# Ensure DB tables are created on startup
Base.metadata.create_all(bind=engine)

# Seed synthetic citizens (hriday, varad, narayan) with hashed PINs
def seed_synthetic_users():
    """
    Creates the three pre-defined demo citizen accounts if they do not already exist.
    Each account gets a fixed PIN (configured via env vars or defaults).
    """
    from app.core.database import SessionLocal
    from app.models.db_models import UserDB, CitizenProfileDB
    from app.core.security import hash_pin
    from app.services.demo_vault_service import DEMO_CITIZENS

    # Per-user PIN config: env var CITIZEN_PIN_<USERNAME> or fallback to CITIZEN_DEFAULT_PIN
    default_pin = os.getenv("CITIZEN_DEFAULT_PIN", "123456")

    db = SessionLocal()
    try:
        for key, data in DEMO_CITIZENS.items():
            existing = db.query(UserDB).filter(UserDB.username == key).first()
            pin_env_var = f"CITIZEN_PIN_{key.upper()}"
            pin = os.getenv(pin_env_var, default_pin)

            if existing:
                existing.pin_hash = hash_pin(pin)
                continue  # Already seeded, but PIN updated

            user = UserDB(
                id=data["user_id"],
                username=key,
                pin_hash=hash_pin(pin),
                full_name=data["full_name"],
                mobile_number=data.get("mobile_number"),
                email=data.get("email"),
            )
            db.add(user)
            db.flush()

            profile = CitizenProfileDB(
                user_id=user.id,
                full_name=data["full_name"],
                age=data.get("age"),
                annual_income=data.get("annual_income"),
                income_category=data.get("income_category"),
                location_city=data.get("location_city"),
                location_district=data.get("location_district"),
                location_state=data.get("location_state"),
                category=data.get("category", "General"),
                occupation=data.get("occupation"),
                education=data.get("education"),
                is_demo=True,
                demo_citizen_key=key,
            )
            db.add(profile)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[WARN] Could not seed synthetic users: {e}")
    finally:
        db.close()

seed_synthetic_users()

try:
    from seed import seed_baseline_if_empty
    seed_baseline_if_empty()
except Exception as seed_err:
    print(f"[WARN] Startup baseline seed call failed: {seed_err}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent orchestration & guided workflow layer for Indian digital government services.",
    version=settings.VERSION
)

# Enable CORS for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware: Request ID tracing
@app.middleware("http")
async def add_request_id_header(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = req_id
    response: Response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response

# Middleware: Route /api/backend and /api/journey internally
@app.middleware("http")
async def rewrite_api_backend_path(request: Request, call_next):
    if request.url.path.startswith("/api/backend"):
        scope = request.scope.copy()
        scope["path"] = request.url.path.replace("/api/backend", "/api/v1", 1)
        request = Request(scope, receive=request._receive)
    elif request.url.path.startswith("/api/journey"):
        scope = request.scope.copy()
        scope["path"] = request.url.path.replace("/api/journey", "/api/v1/journey", 1)
        request = Request(scope, receive=request._receive)
    return await call_next(request)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
@app.get("/api/v1/health")
def health(db: Session = Depends(get_db)):
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected",
        "auth": "username_pin",
        "ai_provider": settings.AI_PROVIDER,
        "websocket_active_rooms": len(ws_manager.active_connections)
    }


@app.get("/ready")
def readiness(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "ai_provider": settings.AI_PROVIDER
        }
    except Exception as e:
        return {
            "status": "not_ready",
            "error": str(e)
        }



# Mount versioned API router
app.include_router(api_v1_router)

# Real-time WebSocket Endpoints
@app.websocket("/ws/journeys/{journey_id}")
async def websocket_journey_endpoint(websocket: WebSocket, journey_id: str):
    await ws_manager.connect(websocket, journey_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, journey_id)

@app.websocket("/ws/conversations/{conversation_id}")
async def websocket_conversation_endpoint(websocket: WebSocket, conversation_id: str):
    await ws_manager.connect(websocket, conversation_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, conversation_id)
