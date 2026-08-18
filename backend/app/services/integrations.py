from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class ExternalConnector(ABC):
    """Abstract connector base for official government digital identity & data setu APIs."""
    
    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        pass

class MockDigiLockerConnector(ExternalConnector):
    """
    Sandbox / Demo Connector for DigiLocker API integration.
    Simulates identity document verification without relying on production OAuth.
    """
    
    def get_status(self) -> Dict[str, Any]:
        return {
            "connector": "DigiLocker",
            "mode": "Sandbox/Demo",
            "configured": True,
            "supported_documents": ["AADHAAR", "PAN", "DRIVING_LICENSE", "INCOME_CERTIFICATE", "CASTE_CERTIFICATE"]
        }

    def fetch_user_document(self, user_id: str, doc_type: str) -> Dict[str, Any]:
        """Simulate fetching verified document from DigiLocker Vault."""
        return {
            "success": True,
            "doc_type": doc_type,
            "issuer": "Government of India / Govt of Karnataka",
            "verified": True,
            "uri": f"in.gov.digilocker:{doc_type.lower()}:demo_vault_101",
            "issued_at": "2024-01-15",
            "sandbox_badge": True
        }

class APISetuConnector(ExternalConnector):
    """
    Adapter for API Setu (Open Government Data Exchange).
    """

    def get_status(self) -> Dict[str, Any]:
        return {
            "connector": "APISetu",
            "mode": "Sandbox",
            "configured": False,
            "status_code": "NOT_CONFIGURED",
            "message": "Production credentials require government department onboarding."
        }

    def discover_services(self, department: str) -> List[Dict[str, Any]]:
        return []
