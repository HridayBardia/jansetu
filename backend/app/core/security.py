import hmac
import hashlib
import json
import base64
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.core.config import settings

# ---------------------------------------------------------------------------
# Username helpers
# ---------------------------------------------------------------------------

def normalize_username(username: str) -> str:
    """Normalizes a username to lowercase with leading/trailing whitespace removed."""
    return username.strip().lower()

def validate_username(username: str) -> bool:
    """
    Validates username rules:
    - 4–30 characters
    - Only letters, numbers, underscores allowed
    """
    if not username:
        return False
    return bool(re.match(r'^[a-z0-9_]{4,30}$', username))

# ---------------------------------------------------------------------------
# PIN hashing using bcrypt
# ---------------------------------------------------------------------------

import bcrypt as _bcrypt

def hash_pin(pin: str) -> str:
    """
    Hashes a 6-digit PIN using bcrypt with work factor 12.
    Returns the hash as a utf-8 string suitable for database storage.
    NEVER store the plaintext PIN.
    """
    if not pin:
        raise ValueError("PIN must not be empty")
    pin_bytes = pin.encode("utf-8")
    hashed = _bcrypt.hashpw(pin_bytes, _bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")

def verify_pin(pin: str, hashed_pin: str) -> bool:
    """
    Verifies a plaintext PIN against a bcrypt hash.
    Returns True if the PIN matches, False otherwise.
    """
    try:
        return _bcrypt.checkpw(pin.encode("utf-8"), hashed_pin.encode("utf-8"))
    except Exception:
        return False

# ---------------------------------------------------------------------------
# Lightweight zero-dependency JWT (HS256) implementation
# ---------------------------------------------------------------------------

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def _b64url_decode(data_str: str) -> bytes:
    padding = "=" * ((4 - (len(data_str) % 4)) % 4)
    return base64.urlsafe_b64decode(data_str + padding)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a secure HS256 JWT access token."""
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": int(expire.timestamp()), "iat": int(now.timestamp())})

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(to_encode, separators=(",", ":")).encode("utf-8"))

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates an HS256 JWT access token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

        expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _b64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            return None

        return payload
    except Exception:
        return None
