# 🇮🇳 AI Citizen Journey Engine

### Production-Ready Mobile OTP Authentication + Citizen Document Vault + AI Journey Retrieval

**AI Citizen Journey Engine** is a full-stack, enterprise-grade citizen assistance platform designed to unify government schemes, personalized service journeys, and secure document vault management across all 28 Indian States and 8 Union Territories.

---

## 🌟 Key Architecture & Features

### 🔐 1. Production-Ready Mobile OTP Authentication
- **Arbitrary 10-Digit Mobile Support**: Works with any valid Indian mobile number (`+91XXXXXXXXXX`). No restricted mock user list!
- **Cryptographic Security**:
  - Secure 6-digit OTP generation (`secrets.SystemRandom`).
  - Salted HMAC-SHA256 OTP hashing before storage.
  - Zero-dependency HS256 JWT session tokens.
- **Rate Limiting & Anti-Abuse**:
  - 60-second OTP resend cooldown.
  - 5-minute OTP expiration.
  - Maximum 3 incorrect verification attempts per OTP.
- **Provider Abstraction**:
  - `DevelopmentOTPProvider`: Logs OTP code to backend stdout and embeds in response for instant developer testing.
  - `MSG91Provider`: Integrated SMS Gateway for Indian cellular networks.
  - `TwilioProvider`: Global SMS fallback provider.

### 📁 2. User-Isolated Citizen Document Vault
- **Strict User Privacy & Ownership**: `GET /api/v1/documents` and `/api/v1/documents/{id}/view` strictly enforce `document.user_id == current_user.id` (returns HTTP 403 Forbidden on mismatch).
- **Synthetic Government Data & Watermarking**: All demo documents feature prominent watermark overlays:
  `DEMO DOCUMENT — NOT A GOVERNMENT-ISSUED DOCUMENT — FOR DEMONSTRATION ONLY`.
- **In-App PDF Viewer**: Built-in viewer with zoom in/out, download capabilities, masked document numbers, and verified status badges.

### 🧠 3. AI Journey & Dynamic Document Requirement Retrieval
- **Intent Classification Engine**: Detects goal type (Business Setup, Scholarship, Farming, Loan) and location (City, District, State).
- **Personalized Requirement Matching**: Dynamic comparison between scheme requirement lists and the authenticated citizen's actual document vault ("X documents available, Y documents required").
- **Next Best Action Generator**: Identifies missing documents and recommends high-priority steps.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### 🛠️ 1. Backend Setup

```bash
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Copy environment variables configuration
cp .env.example .env

# Initialize database schema and seed demonstration data
python seed.py

# Run backend development server (FastAPI + Uvicorn)
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

---

### 🎨 2. Frontend Setup

```bash
cd frontend

# Install frontend dependencies
npm install

# Copy environment variables configuration
cp .env.example .env.local

# Start Next.js development server
npm run dev
```
Frontend web application will be live at: `http://localhost:3000`.

---

## 🧪 Running Automated Tests

The backend includes a comprehensive pytest suite covering authentication, rate limiting, and user document isolation:

```bash
cd backend
.\venv\Scripts\python.exe -m pytest tests/test_auth.py tests/test_user_isolation.py -v
```

---

## 🔒 Security & Privacy Practices

1. **PII Masking**: Aadhaar numbers (`XXXX XXXX 8865`) and PAN numbers (`XXXXX 1234 X`) are masked across API responses.
2. **Zero Hardcoded Secrets**: Secrets are loaded exclusively from `.env` or system environment variables.
3. **Session Cookie + Bearer Support**: Session cookie `citizen_session` set with `HttpOnly` and `SameSite=Lax`.

---

## 🌐 Deployment Guidelines

### Backend (Render / Railway / EC2 / Docker)
Set environment variables:
- `DEV_OTP_MODE=false`
- `OTP_PROVIDER=msg91` (or `twilio`)
- `MSG91_AUTH_KEY=your_key`
- `SECRET_KEY=your_production_jwt_secret`
- `CORS_ORIGINS=https://your-frontend-domain.vercel.app`

### Frontend (Vercel / Netlify)
Set environment variable:
- `NEXT_PUBLIC_API_BASE_URL=https://your-backend-api-domain.com/api/v1`

---

## 📄 License
Demonstration and Production Architecture Engine • Prepared for Government AI Citizen Journey Integration.
