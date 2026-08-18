from typing import List, Dict, Any, Optional
from app.ai.providers.base import BaseAIProvider
from app.services.goal_engine import GoalEngine
from app.models.schemas import GoalAnalysisRequest, GoalAnalysisResponse, ContextQuestion, RAGQueryResponse, Citation

class MockAIProvider(BaseAIProvider):
    def analyze_goal(self, message: str) -> GoalAnalysisResponse:
        return GoalEngine.analyze_goal(GoalAnalysisRequest(message=message))

    def answer_query(
        self,
        query: str,
        context_docs: List[Dict[str, Any]],
        journey_context: Optional[Dict[str, Any]] = None
    ) -> RAGQueryResponse:
        citations = []
        for doc in context_docs[:3]:
            citations.append(
                Citation(
                    source_id=doc.get("id", "src_1"),
                    title=doc.get("title", "Official Karnataka Portal"),
                    department=doc.get("department", "Government of Karnataka"),
                    url=doc.get("url", "https://karnataka.gov.in"),
                    last_verified="2026-01-15",
                    confidence="high"
                )
            )
            
        if not citations:
            citations.append(
                Citation(
                    source_id="src_karnataka_gov",
                    title="e-Swathu & e-Karmika Karnataka Official Portal",
                    department="Department of Labour & Commercial Taxes, Karnataka",
                    url="https://emunsipal.kar.nic.in",
                    last_verified="2026-02-01",
                    confidence="high"
                )
            )

        lower_q = query.lower()
        if "document" in lower_q or "require" in lower_q:
            answer = (
                "Based on official Karnataka state guidelines, you will require: "
                "1) PAN Card & Aadhaar Card of the applicant/proprietor, "
                "2) Rental Agreement or Property Tax Receipt for business location proof, "
                "3) Passport size photograph and Bank account cancelled cheque. "
                "All documents can be uploaded directly or verified via DigiLocker."
            )
        elif "tax" in lower_q or "gst" in lower_q:
            answer = (
                "GST registration is mandatory in Karnataka if your annual turnover exceeds ₹20 Lakhs for services or "
                "₹40 Lakhs for goods. Voluntary registration is recommended if you sell goods interstate or via e-commerce portals."
            )
        else:
            answer = (
                f"Regarding your query ('{query}'): Based on verified government sources for Karnataka, "
                "you can execute this step online through the single-window portal (e-Karmika / Sakala). "
                "Ensure all mandatory identity proof and address documents are ready before submission."
            )

        return RAGQueryResponse(
            answer=answer,
            citations=citations,
            confidence="high"
        )
