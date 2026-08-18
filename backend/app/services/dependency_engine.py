from typing import List, Dict, Any, Optional, Set
from app.models.schemas import JourneyStepSchema, StepDependencySchema, NextBestAction

class DependencyEngine:
    @staticmethod
    def detect_cycles(steps: List[JourneyStepSchema], dependencies: List[StepDependencySchema]) -> bool:
        """Cycle detection using DFS on DAG graph"""
        adj = {step.step_key: [] for step in steps}
        for dep in dependencies:
            if dep.step_key in adj:
                adj[dep.step_key].append(dep.prerequisite_step_key)

        visited = {} # 0: unvisited, 1: visiting, 2: visited
        for step in steps:
            visited[step.step_key] = 0

        def dfs(node):
            visited[node] = 1
            for neighbor in adj.get(node, []):
                if visited.get(neighbor) == 1:
                    return True # Cycle detected
                if visited.get(neighbor) == 0:
                    if dfs(neighbor):
                        return True
            visited[node] = 2
            return False

        for step in steps:
            if visited[step.step_key] == 0:
                if dfs(step.step_key):
                    return True
        return False

    @classmethod
    def resolve_step_states(
        cls,
        steps: List[JourneyStepSchema],
        dependencies: List[StepDependencySchema]
    ) -> List[JourneyStepSchema]:
        """
        Determines state of each step based on prerequisites.
        Rules:
        - Completed steps remain COMPLETED.
        - Skipped steps remain SKIPPED.
        - If all prerequisites are COMPLETED or SKIPPED -> state becomes AVAILABLE (or IN_PROGRESS if was already in progress).
        - Otherwise -> state remains LOCKED.
        """
        # Map prerequisites for each step
        prereq_map: Dict[str, List[str]] = {s.step_key: [] for s in steps}
        for dep in dependencies:
            if dep.step_key in prereq_map:
                prereq_map[dep.step_key].append(dep.prerequisite_step_key)

        status_map: Dict[str, str] = {s.step_key: s.state for s in steps}

        updated_steps = []
        for step in steps:
            current_state = step.state
            step_prereqs = prereq_map.get(step.step_key, [])
            step.prerequisites = step_prereqs

            if current_state in ["COMPLETED", "SKIPPED"]:
                updated_steps.append(step)
                continue

            # Check if all prerequisites are fulfilled
            prereqs_fulfilled = True
            for prereq in step_prereqs:
                prereq_state = status_map.get(prereq, "LOCKED")
                if prereq_state not in ["COMPLETED", "SKIPPED"]:
                    prereqs_fulfilled = False
                    break

            if prereqs_fulfilled:
                if current_state == "LOCKED":
                    step.state = "AVAILABLE"
            else:
                step.state = "LOCKED"

            updated_steps.append(step)

        return updated_steps

class NextBestActionEngine:
    @staticmethod
    def calculate_next_action(steps: List[JourneyStepSchema]) -> Optional[NextBestAction]:
        """
        Calculates the single next best action for the citizen.
        Prioritizes IN_PROGRESS steps first, then AVAILABLE steps sorted by priority.
        """
        in_progress = [s for s in steps if s.state == "IN_PROGRESS"]
        if in_progress:
            target = in_progress[0]
            return NextBestAction(
                step_key=target.step_key,
                title=target.title,
                priority="high",
                reason="This step is currently in progress. Complete it to unlock downstream requirements.",
                estimated_effort=target.estimated_effort
            )

        available = [s for s in steps if s.state == "AVAILABLE"]
        if not available:
            return None

        # Priority order: high > medium > low
        priority_weights = {"high": 3, "medium": 2, "low": 1}
        sorted_available = sorted(
            available,
            key=lambda x: priority_weights.get(x.priority.lower(), 1),
            reverse=True
        )

        next_step = sorted_available[0]
        return NextBestAction(
            step_key=next_step.step_key,
            title=next_step.title,
            priority=next_step.priority,
            reason=f"Prerequisites satisfied. Proceeding with {next_step.title} is required next.",
            estimated_effort=next_step.estimated_effort
        )
