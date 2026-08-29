import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.ai.providers.mock import MockAIProvider
from app.ai.providers.gemini import GeminiAIProvider
from app.ai.providers.openai import OpenAIProvider
from app.models.schemas import GoalAnalysisResponse, RAGQueryResponse

logger = logging.getLogger("citizen_journey")

class AIOrchestrator:
    def __init__(self):
        provider_type = settings.AI_PROVIDER.lower()
        if provider_type == "gemini":
            self.provider = GeminiAIProvider()
        elif provider_type == "openai":
            self.provider = OpenAIProvider()
        else:
            self.provider = MockAIProvider()
            
        logger.info(f"AIOrchestrator initialized with provider: {provider_type}")

    def analyze_goal(self, message: str) -> GoalAnalysisResponse:
        try:
            return self.provider.analyze_goal(message)
        except Exception as e:
            logger.error(f"Error analyzing goal: {str(e)}")
            return MockAIProvider().analyze_goal(message)

    def answer_query(
        self,
        query: str,
        context_docs: List[Dict[str, Any]],
        journey_context: Optional[Dict[str, Any]] = None
    ) -> RAGQueryResponse:
        try:
            response = self.provider.answer_query(query, context_docs, journey_context)
        except Exception as e:
            logger.error(f"Error answering query: {str(e)}")
            response = MockAIProvider().answer_query(query, context_docs, journey_context)
            
        response.answer = self._append_official_links(query, response.answer)
        return response

    def _append_official_links(self, query: str, answer: str) -> str:
        links = {
            "passport": ("[Passport Seva]", "https://www.passportindia.gov.in/"),
            "scholarship": ("[National Scholarship Portal]", "https://scholarships.gov.in/"),
            "pan ": ("[NSDL PAN Portal]", "https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html"),
            "pan card": ("[NSDL PAN Portal]", "https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html"),
            "aadhaar": ("[UIDAI]", "https://uidai.gov.in/"),
            "aadhar": ("[UIDAI]", "https://uidai.gov.in/"),
            "driving license": ("[Parivahan Sewa]", "https://parivahan.gov.in/"),
            "voter id": ("[Voters Portal]", "https://voters.eci.gov.in/"),
            "gst": ("[GST Portal]", "https://www.gst.gov.in/"),
            "income tax": ("[Income Tax e-Filing]", "https://www.incometax.gov.in/"),
            "itr": ("[Income Tax e-Filing]", "https://www.incometax.gov.in/"),
            "udyam": ("[Udyam Registration]", "https://udyamregistration.gov.in/"),
            "msme": ("[Udyam Registration]", "https://udyamregistration.gov.in/"),
            "epfo": ("[EPFO]", "https://www.epfindia.gov.in/"),
            "pf ": ("[EPFO]", "https://www.epfindia.gov.in/"),
            "digilocker": ("[DigiLocker]", "https://www.digilocker.gov.in/"),
            "kisan": ("[PM Kisan Portal]", "https://pmkisan.gov.in/"),
            "agriculture": ("[PM Kisan Portal]", "https://pmkisan.gov.in/"),
            "ayushman": ("[PMJAY]", "https://pmjay.gov.in/"),
            "health": ("[PMJAY]", "https://pmjay.gov.in/"),
            "legal": ("[e-Courts Services]", "https://services.ecourts.gov.in/"),
        }
        
        found_links = set()
        lower_q = query.lower()
        lower_a = answer.lower()
        
        for kw, (title, url) in links.items():
            if kw in lower_q or kw in lower_a:
                found_links.add(f"- {title}({url})")
                
        if found_links:
            links_text = "\n\n**Official Government Portals:**\n" + "\n".join(sorted(found_links))
            if "Official Government Portals" not in answer:
                answer += links_text
                
        return answer

ai_orchestrator = AIOrchestrator()
