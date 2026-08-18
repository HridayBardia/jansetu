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
            return self.provider.answer_query(query, context_docs, journey_context)
        except Exception as e:
            logger.error(f"Error answering query: {str(e)}")
            return MockAIProvider().answer_query(query, context_docs, journey_context)

ai_orchestrator = AIOrchestrator()
