import hmac
import hashlib
import secrets
import json
import base64
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.core.config import settings

def normalize_mobile_number(mobile: str) -> str:
    """
    Normalizes Indian mobile numbers into standard +91XXXXXXXXXX format.
    Accepts: '7016918865', '+91 7016918865', '917016918865', '07016918865'
    """
    digits = re.sub(r"\D", "", str(mobile))
    if len(digits) == 10:
        return f"+91{digits}"
    elif len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    elif len(digits) == 11 and digits.startswith("0"):
        return f"+91{digits[1:]}"
    elif len(digits) > 10 and digits.startswith("91"):
        return f"+{digits}"
    return f"+91{digits[-10:]}" if len(digits) >= 10 else f"+91{digits}"

def validate_mobile_number(mobile: str) -> bool:
    """Checks if the normalized mobile number is a valid 10-digit Indian mobile number."""
    normalized = normalize_mobile_number(mobile)
    # Must be +91 followed by 10 digits starting with 6, 7, 8, 9
    return bool(re.match(r"^\+91[6789]\d{9}$", normalized))

def generate_secure_otp() -> str:
    """Generates a cryptographically secure 6-digit random numeric OTP."""
    return "".join(secrets.choice("0123456789") for _ in range(6))

def hash_otp(mobile: str, otp: str) -> str:
    """
    Computes a cryptographic HMAC-SHA256 hash of the OTP bound to the user's mobile number.
    Plaintext OTPs are NEVER saved in database.
    """
    normalized = normalize_mobile_number(mobile)
    message = f"{normalized}:{otp}".encode("utf-8")
    secret = settings.SECRET_KEY.encode("utf-8")
    return hmac.new(secret, message, hashlib.sha256).hexdigest()

def verify_otp_hash(mobile: str, otp: str, expected_hash: str) -> bool:
    """Verifies that an entered OTP matches the stored hash in constant time."""
    computed_hash = hash_otp(mobile, otp)
    return hmac.compare_digest(computed_hash, expected_hash)

# Lightweight, zero-dependency JWT (HS256) implementation
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

