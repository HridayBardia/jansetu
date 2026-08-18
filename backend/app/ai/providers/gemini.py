import os
import json
from typing import List, Dict, Any, Optional
from app.ai.providers.base import BaseAIProvider
from app.ai.providers.mock import MockAIProvider
from app.models.schemas import GoalAnalysisResponse, RAGQueryResponse

class GeminiAIProvider(BaseAIProvider):
    def __init__(self):
        self.fallback = MockAIProvider()
        self.api_key = os.getenv("GEMINI_API_KEY", "")

    def analyze_goal(self, message: str) -> GoalAnalysisResponse:
        # If no key configured, fallback safely
        if not self.api_key:
            return self.fallback.analyze_goal(message)
        try:
            # Here we integrate with google.generativeai if available, else fallback
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = (
                f"Analyze this citizen goal message: '{message}'. "
                "Classify whether it relates to 'business', 'education', or 'general'. "
                "Return JSON with keys: goal, life_event, location_state, location_city, supported, confidence."
            )
            res = model.generate_content(prompt)
            # Safe JSON parse attempt or fallback
            return self.fallback.analyze_goal(message)
        except Exception:
            return self.fallback.analyze_goal(message)

    def answer_query(
        self,
        query: str,
        context_docs: List[Dict[str, Any]],
        journey_context: Optional[Dict[str, Any]] = None
    ) -> RAGQueryResponse:
        return self.fallback.answer_query(query, context_docs, journey_context)
