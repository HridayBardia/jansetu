from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.db_models import SystemAlertDB, JourneyDB
from app.models.schemas import AlertSchema

class AlertEngine:
    @staticmethod
    def get_impact_alerts(db: Session, journey_category: Optional[str] = None) -> List[AlertSchema]:
        """
        Retrieves regulatory updates and impact alerts matching active citizen journeys.
        """
        query = db.query(SystemAlertDB)
        if journey_category and journey_category != "all":
            query = query.filter(
                (SystemAlertDB.journey_category == journey_category) | (SystemAlertDB.journey_category == "general")
            )
        alerts = query.order_by(SystemAlertDB.created_at.desc()).all()

        results = []
        for a in alerts:
            results.append(
                AlertSchema(
                    id=a.id,
                    title=a.title,
                    category=a.category,
                    priority=a.priority,
                    effective_date=a.effective_date,
                    impact_summary=a.impact_summary,
                    action_required=a.action_required,
                    source_url=a.source_url,
                    journey_category=a.journey_category,
                    created_at=a.created_at
                )
            )
        return results
