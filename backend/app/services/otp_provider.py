import logging
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger("otp_provider")

# In-memory store for development testing only
_dev_otp_store: Dict[str, str] = {}

class BaseOTPProvider(ABC):
    @abstractmethod
    async def send_otp(self, mobile_number: str) -> Dict[str, Any]:
        """Send OTP to user's mobile number via managed service."""
        pass

    @abstractmethod
    async def verify_otp(self, mobile_number: str, otp: str) -> Dict[str, Any]:
        """Verify OTP via managed service."""
        pass

class DevelopmentOTPProvider(BaseOTPProvider):
    """
    Local development & demonstration provider.
    Logs OTP securely for local testing.
    Never exposes OTP in production responses.
    """
    async def send_otp(self, mobile_number: str) -> Dict[str, Any]:
        import secrets
        otp_code = f"{secrets.randbelow(1000000):06d}"
        _dev_otp_store[mobile_number] = otp_code
        
        logger.info(f"========== DEV OTP SENT ==========")
        logger.info(f"Sender (Business): {settings.WHATSAPP_BUSINESS_PHONE_NUMBER}")
        logger.info(f"Recipient (User): {mobile_number}")
        logger.info(f"OTP Code: {otp_code}")
        logger.info(f"===================================")
        
        res = {
            "success": True,
            "provider": "development",
            "message": f"Verification code sent to {mobile_number}",
        }
        if settings.DEV_OTP_MODE or settings.DEV_AUTH_MODE:
            res["dev_otp"] = otp_code
        return res

    async def verify_otp(self, mobile_number: str, otp: str) -> Dict[str, Any]:
        stored_otp = _dev_otp_store.get(mobile_number)
        if stored_otp and stored_otp == otp.strip():
            return {"success": True, "provider": "development"}
        return {"success": False, "provider": "development", "error": "Invalid or expired verification code."}


class MSG91Provider(BaseOTPProvider):
    """
    Production MSG91 Managed OTP Provider for Indian mobile numbers.
    Docs: https://docs.msg91.com/p/tf/api/send-otp
    """
    async def send_otp(self, mobile_number: str) -> Dict[str, Any]:
        if not settings.MSG91_AUTH_KEY or not settings.MSG91_TEMPLATE_ID:
            if not settings.DEV_OTP_MODE:
                logger.error("OTP_PROVIDER_ERROR Provider: MSG91 Status: 401 Cause: Missing MSG91_AUTH_KEY or MSG91_TEMPLATE_ID")
                return {
                    "success": False,
                    "provider": "msg91",
                    "error": "We couldn't send the verification code. Please check your mobile number and try again."
                }
            logger.warning("MSG91 credentials missing. Falling back to development provider.")
            return await DevelopmentOTPProvider().send_otp(mobile_number)

        clean_mobile = mobile_number.replace("+", "")
        url = f"https://api.msg91.com/api/v5/otp?template_id={settings.MSG91_TEMPLATE_ID}&mobile={clean_mobile}&authkey={settings.MSG91_AUTH_KEY}"
        if settings.MSG91_SENDER_ID:
            url += f"&sender={settings.MSG91_SENDER_ID}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url)
                data = response.json()
                masked_mobile = mobile_number[:3] + "******" + mobile_number[-4:]
                if response.status_code == 200 and data.get("type") == "success":
                    logger.info(f"OTP REQUEST Provider: MSG91 Mobile: {masked_mobile} Status: accepted")
                    return {
                        "success": True,
                        "provider": "msg91",
                        "message": f"Verification code sent to {mobile_number}"
                    }
                else:
                    logger.error(f"OTP_PROVIDER_ERROR Provider: MSG91 Status: {response.status_code} Cause: {data.get('message') or data}")
                    return {
                        "success": False,
                        "provider": "msg91",
                        "error": "We couldn't send the verification code. Please check your mobile number and try again."
                    }
        except Exception as e:
            logger.error(f"OTP_PROVIDER_ERROR Provider: MSG91 Exception: {e}")
            return {
                "success": False,
                "provider": "msg91",
                "error": "We couldn't send the verification code. Please try again."
            }

    async def verify_otp(self, mobile_number: str, otp: str) -> Dict[str, Any]:
        if not settings.MSG91_AUTH_KEY:
            if settings.DEV_OTP_MODE:
                return await DevelopmentOTPProvider().verify_otp(mobile_number, otp)
            return {"success": False, "provider": "msg91", "error": "MSG91 credentials missing."}

        clean_mobile = mobile_number.replace("+", "")
        url = f"https://api.msg91.com/api/v5/otp/verify?otp={otp}&mobile={clean_mobile}&authkey={settings.MSG91_AUTH_KEY}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                data = response.json()
                if response.status_code == 200 and data.get("type") == "success":
                    return {"success": True, "provider": "msg91"}
                else:
                    logger.error(f"MSG91 OTP Verify Failed: {data}")
                    return {"success": False, "provider": "msg91", "error": data.get("message", "Invalid OTP code")}
        except Exception as e:
            logger.error(f"MSG91 OTP Verify Exception: {e}")
            return {"success": False, "provider": "msg91", "error": "Verification service timeout"}

class TwilioProvider(BaseOTPProvider):
    """
    Production Twilio Verify Managed WhatsApp/SMS Provider.
    Docs: https://www.twilio.com/docs/verify/api
    """
    async def send_otp(self, mobile_number: str) -> Dict[str, Any]:
        service_sid = settings.TWILIO_VERIFY_SERVICE_SID or settings.TWILIO_SERVICE_SID
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not service_sid:
            if not settings.DEV_OTP_MODE and not settings.DEV_AUTH_MODE:
                logger.error("WHATSAPP_PROVIDER_NOT_CONFIGURED Provider: Twilio Status: 401 Cause: Missing Twilio credentials or TWILIO_VERIFY_SERVICE_SID")
                return {
                    "success": False,
                    "provider": "twilio",
                    "channel": "whatsapp",
                    "error": "We couldn't send your WhatsApp verification code. Please check that the number is correct and has WhatsApp enabled."
                }
            logger.warning("Twilio credentials missing. Falling back to development provider.")
            return await DevelopmentOTPProvider().send_otp(mobile_number)

        channel = settings.OTP_CHANNEL or "whatsapp"
        url = f"https://verify.twilio.com/v2/Services/{service_sid}/Verifications"
        auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        data = {
            "To": mobile_number,
            "Channel": channel
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, data=data, auth=auth)
                res_json = response.json()
                masked_mobile = mobile_number[:3] + "******" + mobile_number[-4:]
                
                if response.status_code in (200, 201):
                    logger.info(f"WHATSAPP OTP REQUEST Provider: Twilio Sender: {settings.WHATSAPP_BUSINESS_PHONE_NUMBER} Recipient: {masked_mobile} Status: accepted Verification SID: {res_json.get('sid')}")
                    return {

                        "success": True,
                        "provider": "twilio",
                        "channel": channel,
                        "message": f"Verification code sent to {mobile_number}"
                    }
                else:
                    err_code = res_json.get("code")
                    err_msg = res_json.get("message")
                    if err_code == 68008:
                        logger.error(
                            f"WHATSAPP OTP FAILURE\n"
                            f"Provider: Twilio\n"
                            f"Error: 68008\n"
                            f"Meaning: WhatsApp verification channel is not configured.\n"
                            f"Action: Configure WhatsApp Sender / WABA / authentication template."
                        )
                    else:
                        logger.error(f"WHATSAPP OTP FAILURE Provider: Twilio Code: {err_code} Status: {response.status_code} Cause: {err_msg}")

                    return {
                        "success": False,
                        "provider": "twilio",
                        "channel": channel,
                        "error": "We couldn't send your WhatsApp verification code. Please check that the number is correct and has WhatsApp enabled."
                    }
        except Exception as e:
            logger.error(f"WHATSAPP OTP FAILURE Provider: Twilio Exception: {e}")
            return {
                "success": False,
                "provider": "twilio",
                "channel": channel,
                "error": "We couldn't send your WhatsApp verification code. Please try again."
            }

    async def verify_otp(self, mobile_number: str, otp: str) -> Dict[str, Any]:
        service_sid = settings.TWILIO_VERIFY_SERVICE_SID or settings.TWILIO_SERVICE_SID
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not service_sid:
            if settings.DEV_OTP_MODE or settings.DEV_AUTH_MODE:
                return await DevelopmentOTPProvider().verify_otp(mobile_number, otp)
            return {"success": False, "provider": "twilio", "error": "Twilio credentials missing."}

        url = f"https://verify.twilio.com/v2/Services/{service_sid}/VerificationCheck"
        auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        data = {
            "To": mobile_number,
            "Code": otp
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, data=data, auth=auth)
                res_json = response.json()
                if response.status_code in (200, 201) and res_json.get("status") == "approved":
                    return {"success": True, "provider": "twilio"}
                else:
                    logger.error(f"Twilio Verify Check Failed: {res_json}")
                    return {"success": False, "provider": "twilio", "error": "Invalid or expired verification code."}
        except Exception as e:
            logger.error(f"Twilio Verify Check Exception: {e}")
            return {"success": False, "provider": "twilio", "error": "Verification service error"}


def get_otp_provider() -> BaseOTPProvider:
    """Factory method to get active OTP provider based on configuration."""
    provider_name = (settings.OTP_PROVIDER or "dev").lower()
    if not settings.DEV_OTP_MODE and provider_name in ("dev", "development"):
        raise RuntimeError("Development OTP provider is disallowed when DEV_OTP_MODE is False. Please configure a real SMS provider.")
    
    if provider_name == "msg91":
        return MSG91Provider()
    elif provider_name == "twilio":
        return TwilioProvider()
    return DevelopmentOTPProvider()


