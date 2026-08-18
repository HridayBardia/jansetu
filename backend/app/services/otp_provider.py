import logging
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger("otp_provider")

class BaseOTPProvider(ABC):
    @abstractmethod
    async def send_otp(self, mobile_number: str, otp: str) -> Dict[str, Any]:
        """Send 6-digit OTP to user's mobile number."""
        pass

class DevelopmentOTPProvider(BaseOTPProvider):
    """
    Local development & demonstration provider.
    Logs OTP securely for local testing without spending SMS credits.
    Never exposes OTP in production responses.
    """
    async def send_otp(self, mobile_number: str, otp: str) -> Dict[str, Any]:
        logger.info(f"========== DEV OTP SENT ==========")
        logger.info(f"Mobile: {mobile_number}")
        logger.info(f"OTP Code: {otp}")
        logger.info(f"===================================")
        
        res = {
            "success": True,
            "provider": "development",
            "message": f"Verification code sent to {mobile_number}",
        }
        if settings.DEV_OTP_MODE:
            res["dev_otp"] = otp
        return res

class MSG91Provider(BaseOTPProvider):
    """
    Production MSG91 SMS Provider for Indian mobile numbers.
    Docs: https://docs.msg91.com/p/tf/api/send-otp
    """
    async def send_otp(self, mobile_number: str, otp: str) -> Dict[str, Any]:
        if not settings.MSG91_AUTH_KEY or not settings.MSG91_TEMPLATE_ID:
            if not settings.DEV_OTP_MODE:
                logger.error("MSG91 credentials missing in production!")
                return {
                    "success": False,
                    "provider": "msg91",
                    "error": "SMS provider credentials missing in production configuration."
                }
            logger.warning("MSG91 credentials missing. Falling back to development provider.")
            return await DevelopmentOTPProvider().send_otp(mobile_number, otp)

        clean_mobile = mobile_number.replace("+", "")
        url = f"https://api.msg91.com/api/v5/otp?template_id={settings.MSG91_TEMPLATE_ID}&mobile={clean_mobile}&authkey={settings.MSG91_AUTH_KEY}&otp={otp}"
        
        headers = {"Content-Type": "application/json"}
        payload = {
            "Param1": otp
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                data = response.json()
                if response.status_code == 200 and data.get("type") == "success":
                    return {
                        "success": True,
                        "provider": "msg91",
                        "message": f"SMS OTP dispatched via MSG91 to {mobile_number}"
                    }
                else:
                    logger.error(f"MSG91 SMS failure: {data}")
                    return {
                        "success": False,
                        "provider": "msg91",
                        "error": data.get("message", "Failed to send SMS via MSG91")
                    }
        except Exception as e:
            logger.error(f"MSG91 Provider Exception: {e}")
            return {
                "success": False,
                "provider": "msg91",
                "error": "SMS Gateway connection timeout"
            }

class TwilioProvider(BaseOTPProvider):
    """
    Production Twilio Verify SMS Provider.
    """
    async def send_otp(self, mobile_number: str, otp: str) -> Dict[str, Any]:
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
            if not settings.DEV_OTP_MODE:
                logger.error("Twilio credentials missing in production!")
                return {
                    "success": False,
                    "provider": "twilio",
                    "error": "Twilio credentials missing in production configuration."
                }
            logger.warning("Twilio credentials missing. Falling back to development provider.")
            return await DevelopmentOTPProvider().send_otp(mobile_number, otp)

        url = f"https://verify.twilio.com/v2/Services/{settings.TWILIO_SERVICE_SID}/Verifications"
        auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        data = {
            "To": mobile_number,
            "Channel": "sms"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, data=data, auth=auth)
                res_json = response.json()
                if response.status_code in (200, 201):
                    return {
                        "success": True,
                        "provider": "twilio",
                        "message": f"SMS OTP dispatched via Twilio to {mobile_number}"
                    }
                else:
                    logger.error(f"Twilio Verify Error: {res_json}")
                    return {
                        "success": False,
                        "provider": "twilio",
                        "error": res_json.get("message", "Twilio verification failed")
                    }
        except Exception as e:
            logger.error(f"Twilio Provider Exception: {e}")
            return {
                "success": False,
                "provider": "twilio",
                "error": "Twilio API connection error"
            }

def get_otp_provider() -> BaseOTPProvider:
    """Factory method to get the active OTP provider based on configuration."""
    provider_name = (settings.OTP_PROVIDER or "dev").lower()
    if not settings.DEV_OTP_MODE and provider_name in ("dev", "development"):
        raise RuntimeError("Development OTP provider is disallowed when DEV_OTP_MODE is False. Please configure a real SMS provider.")
    
    if provider_name == "msg91":
        return MSG91Provider()
    elif provider_name == "twilio":
        return TwilioProvider()
    return DevelopmentOTPProvider()

