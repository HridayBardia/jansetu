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

# Middleware: Route /api/backend to /api/v1 internally to support Zeabur/Vercel proxying
@app.middleware("http")
async def rewrite_api_backend_path(request: Request, call_next):
    if request.url.path.startswith("/api/backend"):
        scope = request.scope.copy()
        scope["path"] = request.url.path.replace("/api/backend", "/api/v1", 1)
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
def health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected",
        "otp_provider": settings.OTP_PROVIDER,
        "dev_otp_mode": settings.DEV_OTP_MODE,
        "ai_provider": settings.AI_PROVIDER,
        "websocket_active_rooms": len(ws_manager.active_connections)
    }

@app.get("/api/health/auth")
@app.get("/api/v1/health/auth")
def health_auth(request: Request):
    # Retrieve configuration parameters
    widget_id = settings.MSG91_WIDGET_ID
    widget_configured = bool(widget_id)
    token_configured = bool(settings.MSG91_TOKEN_AUTH)
    auth_key_configured = bool(settings.MSG91_AUTH_KEY)
    
    # We serve the client-side provider widget dynamically
    msg91_script = True
    send_otp_available = True
    verify_otp_available = True

    return {
        "widgetConfigured": widget_configured,
        "tokenConfigured": token_configured,
        "authKeyConfigured": auth_key_configured,
        "msg91Script": msg91_script,
        "sendOtpAvailable": send_otp_available,
        "verifyOtpAvailable": verify_otp_available
    }


@app.get("/ready")
def readiness(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "otp_provider": settings.OTP_PROVIDER,
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
