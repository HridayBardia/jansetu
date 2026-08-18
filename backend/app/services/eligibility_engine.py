from typing import Dict, Any, List
from app.models.schemas import EligibilityRuleSchema, EligibilityResult

class EligibilityEngine:
    @staticmethod
    def evaluate_rule(rule: EligibilityRuleSchema, context: Dict[str, Any]) -> bool:
        field_val = context.get(rule.field)
        if field_val is None:
            return False

        op = rule.operator.upper()
        target_val = rule.value

        if op in ["=", "=="]:
            return str(field_val).lower() == str(target_val).lower()
        elif op in ["!=", "NE"]:
            return str(field_val).lower() != str(target_val).lower()
        elif op in [">", "GT"]:
            return float(field_val) > float(target_val)
        elif op in [">=", "GTE"]:
            return float(field_val) >= float(target_val)
        elif op in ["<", "LT"]:
            return float(field_val) < float(target_val)
        elif op in ["<=", "LTE"]:
            return float(field_val) <= float(target_val)
        elif op == "IN":
            if isinstance(target_val, list):
                return field_val in target_val
            return str(field_val) in str(target_val)
        elif op == "NOT_IN":
            if isinstance(target_val, list):
                return field_val not in target_val
            return str(field_val) not in str(target_val)
        return False

    @classmethod
    def evaluate_eligibility(
        cls,
        rules: List[EligibilityRuleSchema],
        context: Dict[str, Any]
    ) -> EligibilityResult:
        if not rules:
            return EligibilityResult(
                status="LIKELY_ELIGIBLE",
                rules_checked=0,
                passed_rules=[],
                failed_rules=[],
                missing_fields=[],
                explanation="No specific restrictions found. Citizen is likely eligible based on default criteria."
            )

        passed = []
        failed = []
        missing = []

        for rule in rules:
            if rule.field not in context:
                missing.append(rule.field)
                continue

            if cls.evaluate_rule(rule, context):
                passed.append(f"{rule.field}: {rule.explanation}")
            else:
                failed.append(f"{rule.field}: Failed criteria ({rule.explanation})")

        if missing:
            status = "INSUFFICIENT_INFO"
            explanation = f"Need additional information for fields: {', '.join(missing)} to determine eligibility."
        elif failed:
            status = "NOT_ELIGIBLE"
            explanation = f"Citizen does not satisfy {len(failed)} eligibility requirement(s)."
        elif len(passed) == len(rules):
            status = "VERIFIED_ELIGIBLE"
            explanation = "Citizen satisfies all required eligibility rules based on verified inputs."
        else:
            status = "LIKELY_ELIGIBLE"
            explanation = "Citizen meets standard eligibility parameters."

        return EligibilityResult(
            status=status,
            rules_checked=len(rules),
            passed_rules=passed,
            failed_rules=failed,
            missing_fields=missing,
            explanation=explanation
        )
