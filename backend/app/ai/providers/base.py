from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from app.models.schemas import GoalAnalysisResponse, ContextQuestion, RAGQueryResponse, Citation

class BaseAIProvider(ABC):
    @abstractmethod
    def analyze_goal(self, message: str) -> GoalAnalysisResponse:
        pass

    @abstractmethod
    def answer_query(
        self,
        query: str,
        context_docs: List[Dict[str, Any]],
        journey_context: Optional[Dict[str, Any]] = None
    ) -> RAGQueryResponse:
        pass
