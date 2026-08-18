import os
from typing import List, Dict, Any, Optional
from app.ai.providers.base import BaseAIProvider
from app.ai.providers.mock import MockAIProvider
from app.models.schemas import GoalAnalysisResponse, RAGQueryResponse

class OpenAIProvider(BaseAIProvider):
    def __init__(self):
        self.fallback = MockAIProvider()
        self.api_key = os.getenv("OPENAI_API_KEY", "")

    def analyze_goal(self, message: str) -> GoalAnalysisResponse:
        return self.fallback.analyze_goal(message)

    def answer_query(
        self,
        query: str,
        context_docs: List[Dict[str, Any]],
        journey_context: Optional[Dict[str, Any]] = None
    ) -> RAGQueryResponse:
        return self.fallback.answer_query(query, context_docs, journey_context)
