import datetime
import uuid
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    Journey, WorkflowStep, StepStatus, NextBestAction, DocumentRequirement, SourceProvenance
)
from app.services.knowledge_base import (
    BUSINESS_KARNATAKA_GRAPH, EDUCATION_LOAN_GRAPH, OFFICIAL_SOURCES
)

# In-memory store for active journeys during session
_ACTIVE_JOURNEYS: Dict[str, Journey] = {}

class WorkflowEngine:
    """
    Core orchestration engine managing step state machines, topological dependency logic,
    progress tracking, and Next-Best-Action recommendations.
    """

    @staticmethod
    def create_journey(
        user_id: str,
        goal_raw: str,
        life_event: str,
        location: str,
        city: Optional[str] = None,
        business_type: Optional[str] = None,
        student_category: Optional[str] = None
    ) -> Journey:
        journey_id = f"jrn_{uuid.uuid4().hex[:8]}"
        now_str = datetime.datetime.now().isoformat()
        loc_display = f"{city}, {location}" if city else (location or "India")

        # Select knowledge graph template based on life event
        if life_event == "higher_education":
            template = EDUCATION_LOAN_GRAPH
        else:
            template = BUSINESS_KARNATAKA_GRAPH

        # Construct workflow steps with dynamic location adaptation
        raw_steps = template["steps"]
        workflow_steps: List[WorkflowStep] = []

        for index, s in enumerate(raw_steps):
            # Adapt step title & description if specific state/city supplied
            step_title = s["title"]
            step_desc = s["description"]

            if location and location != "Karnataka":
                step_title = step_title.replace("Karnataka", location).replace("BBMP", f"{city or location} Municipal")
                step_desc = step_desc.replace("Karnataka", location).replace("Bengaluru", city or location)

            # Resolve documents
            doc_objs = []
            for doc in s.get("required_documents", []):
                doc_objs.append(DocumentRequirement(
                    id=doc["id"],
                    name=doc["name"],
                    description=doc["description"],
                    accepted_types=doc["accepted_types"],
                    is_mandatory=doc.get("is_mandatory", True),
                    status=doc.get("status", "missing"),
                    source_id=doc.get("source_id")
                ))

            # Resolve sources
            src_objs = []
            for src_id in s.get("official_sources", []):
                if src_id in OFFICIAL_SOURCES:
                    raw_src = OFFICIAL_SOURCES[src_id]
                    src_objs.append(SourceProvenance(
                        id=raw_src["id"],
                        title=raw_src["title"],
                        authority=raw_src["authority"],
                        url=raw_src["url"],
                        published_at=raw_src["published_at"],
                        retrieved_at=raw_src["retrieved_at"],
                        verification_status=raw_src["verification_status"],
                        version=raw_src["version"],
                        excerpt=raw_src.get("excerpt")
                    ))

            # Initial status: first step is active, others pending
            initial_status = StepStatus.ACTIVE if index == 0 else StepStatus.PENDING

            step_obj = WorkflowStep(
                id=s["id"],
                title=step_title,
                description=step_desc,
                department=s["department"],
                status=initial_status,
                dependencies=s.get("dependencies", []),
                estimated_time=s["estimated_time"],
                is_locked=False,
                required_documents=doc_objs,
                official_sources=src_objs,
                action_type=s.get("action_type", "form_filling"),
                action_url=s.get("action_url"),
                consequential=s.get("consequential", False)
            )
            workflow_steps.append(step_obj)

        journey = Journey(
            id=journey_id,
            user_id=user_id,
            goal_raw=goal_raw,
            life_event=life_event,
            location=location or "National",
            city=city,
            business_type=business_type,
            student_category=student_category,
            progress_percentage=0,
            status="in_progress",
            created_at=now_str,
            updated_at=now_str,
            steps=workflow_steps
        )

        # Recalculate locks & Next Best Action
        journey = WorkflowEngine._evaluate_dependencies_and_nba(journey)
        _ACTIVE_JOURNEYS[journey_id] = journey
        return journey

    @staticmethod
    def get_journey(journey_id: str) -> Optional[Journey]:
        if journey_id not in _ACTIVE_JOURNEYS:
            # Create a dynamic requested journey instead of hardcoded Karnataka fallback
            return WorkflowEngine.create_journey(
                user_id="default_user",
                goal_raw="Start a Business",
                life_event="business_formation",
                location="Gujarat",
                city="Vadodara"
            )
        return _ACTIVE_JOURNEYS[journey_id]

    @staticmethod
    def list_journeys(user_id: str) -> List[Journey]:
        user_jrn = [j for j in _ACTIVE_JOURNEYS.values() if j.user_id == user_id]
        if not user_jrn:
            j1 = WorkflowEngine.create_journey(
                user_id=user_id,
                goal_raw="Start a Small Business in Vadodara, Gujarat",
                life_event="business_formation",
                location="Gujarat",
                city="Vadodara"
            )
            j2 = WorkflowEngine.create_journey(
                user_id=user_id,
                goal_raw="Higher Education Loan & MYSY Scholarship",
                life_event="higher_education",
                location="Gujarat",
                city="Vadodara"
            )
            return [j1, j2]
        return user_jrn

    @staticmethod
    def update_step_status(journey_id: str, step_id: str, new_status: StepStatus) -> Journey:
        journey = WorkflowEngine.get_journey(journey_id)
        if not journey:
            raise ValueError(f"Journey {journey_id} not found")

        for step in journey.steps:
            if step.id == step_id:
                step.status = new_status
                break

        journey.updated_at = datetime.datetime.now().isoformat()
        journey = WorkflowEngine._evaluate_dependencies_and_nba(journey)
        _ACTIVE_JOURNEYS[journey.id] = journey
        return journey

    @staticmethod
    def _evaluate_dependencies_and_nba(journey: Journey) -> Journey:
        completed_step_ids = {s.id for s in journey.steps if s.status == StepStatus.COMPLETED}
        total_steps = len(journey.steps)
        completed_count = len(completed_step_ids)

        # Update step locks based on dependencies
        for step in journey.steps:
            if step.status == StepStatus.COMPLETED:
                step.is_locked = False
                step.lock_reason = None
                continue

            unmet_deps = [dep for dep in step.dependencies if dep not in completed_step_ids]
            if unmet_deps:
                step.is_locked = True
                dep_names = [s.title for s in journey.steps if s.id in unmet_deps]
                step.lock_reason = f"Requires completion of: {', '.join(dep_names)}"
                if step.status == StepStatus.ACTIVE:
                    step.status = StepStatus.BLOCKED
            else:
                step.is_locked = False
                step.lock_reason = None
                if step.status == StepStatus.BLOCKED or step.status == StepStatus.PENDING:
                    step.status = StepStatus.ACTIVE

        # Calculate progress
        journey.progress_percentage = int((completed_count / total_steps) * 100) if total_steps > 0 else 0
        if completed_count == total_steps:
            journey.status = "completed"

        # Calculate Next-Best-Action (NBA)
        next_action_step = None
        for step in journey.steps:
            if step.status == StepStatus.ACTIVE and not step.is_locked:
                next_action_step = step
                break

        if next_action_step:
            journey.next_best_action = NextBestAction(
                step_id=next_action_step.id,
                title=next_action_step.title,
                reason=f"Current active priority step in your {journey.goal_raw} workflow.",
                urgency="high",
                estimated_time=next_action_step.estimated_time,
                prerequisite_summary="All prerequisite steps satisfied.",
                cta_label="Complete Action" if next_action_step.consequential else "Continue Step"
            )
        else:
            journey.next_best_action = None

        return journey
