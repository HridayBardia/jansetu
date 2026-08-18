from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.ai.orchestrator import ai_orchestrator
from app.models.schemas import RAGQueryResponse, Citation
from app.models.db_models import GovernmentSourceDB, SchemeDB
from app.services.ingestion_engine import IngestionEngine
from app.services.location_engine import LocationEngine
from app.services.language_engine import LanguageEngine

class RAGEngine:
    @classmethod
    def query(
        cls,
        db: Session,
        query_text: str,
        journey_category: Optional[str] = None
    ) -> RAGQueryResponse:
        # Detect language and location
        target_lang = LanguageEngine.detect_language(query_text)
        location_ctx = LocationEngine.extract_location(query_text)

        # 1. Retrieve ACTIVE schemes (strictly excluding EXPIRED and SUSPENDED schemes at DB level)
        scheme_query = db.query(SchemeDB)
        active_schemes = IngestionEngine.filter_active_schemes(
            scheme_query,
            state_name=location_ctx.state_name,
            category=journey_category
        ).limit(10).all()

        # 2. Retrieve Government Sources
        source_query = db.query(GovernmentSourceDB).filter(GovernmentSourceDB.status == "ACTIVE")
        sources = source_query.all()

        context_docs = []
        for sch in active_schemes:
            context_docs.append({
                "id": sch.id,
                "title": f"{sch.name} ({sch.state_name})",
                "department": sch.department,
                "url": sch.official_source_url,
                "summary": f"{sch.description} Benefits: {sch.benefits}. Application: {sch.application_process}"
            })

        for src in sources:
            context_docs.append({
                "id": src.id,
                "title": src.title,
                "department": src.department,
                "url": src.url,
                "summary": src.summary
            })

        if not context_docs:
            context_docs = [
                {
                    "id": "src_default_portal",
                    "title": "National Portal of India & State Services",
                    "department": "Government of India",
                    "url": "https://www.india.gov.in",
                    "summary": "Official single-window portal for central and state government schemes across India."
                }
            ]

        # Route query through AI Orchestrator
        ai_resp = ai_orchestrator.answer_query(
            query=query_text,
            context_docs=context_docs,
            journey_context={"category": journey_category, "state": location_ctx.state_name}
        )

        # Apply multi-lingual translation pipeline with preserved official scheme terms
        translated_answer = LanguageEngine.translate_response(ai_resp.answer, target_lang)

        return RAGQueryResponse(
            answer=translated_answer,
            citations=ai_resp.citations,
            confidence=ai_resp.confidence
        )

