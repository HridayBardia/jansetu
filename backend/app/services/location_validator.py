import logging
from typing import Any, Union
from app.models.schemas import LocationContext, SchemeSchema
from app.models.db_models import SchemeDB

logger = logging.getLogger("citizen_journey")

class LocationConsistencyValidator:
    """
    Strict location validator enforcing pan-India geographic consistency.
    Prevents cross-state location leakage (e.g., Gujarat citizen receiving Karnataka-only scheme).
    """

    @staticmethod
    def _get_val(obj: Any, key: str, default: Any = None) -> Any:
        if isinstance(obj, dict):
            return obj.get(key, default)
        return getattr(obj, key, default)

    @classmethod
    def is_valid_scheme_for_location(cls, scheme: Any, citizen_loc: Union[LocationContext, dict]) -> bool:
        scheme_level = cls._get_val(scheme, "level", "").upper()
        scheme_state_code = cls._get_val(scheme, "state_code", "")
        scheme_state_name = cls._get_val(scheme, "state_name", "")
        scheme_city = cls._get_val(scheme, "city_code", None) or cls._get_val(scheme, "city", None)

        cit_state_code = cls._get_val(citizen_loc, "state_code", None)
        cit_state_name = cls._get_val(citizen_loc, "state_name", None)
        cit_city = cls._get_val(citizen_loc, "city", None)

        # 1. Central / National schemes are valid everywhere in India
        if scheme_level in ["CENTRAL", "NATIONAL"]:
            return True

        # 2. If citizen location state is explicitly specified
        if cit_state_code and cit_state_code.upper() != "CENTRAL":
            # Match state code
            if scheme_state_code and scheme_state_code.upper() != cit_state_code.upper():
                logger.warning(
                    f"LocationLeakageBlocked: Scheme '{cls._get_val(scheme, 'name')}' (State: {scheme_state_code}) "
                    f"rejected for citizen in {cit_state_code}"
                )
                return False

            # Match state name if state code missing
            if scheme_state_name and cit_state_name:
                if scheme_state_name.lower() != cit_state_name.lower() and scheme_state_name != "Central":
                    return False

            # City level matching if specified on scheme
            if scheme_city and cit_city:
                if scheme_city.lower() != cit_city.lower():
                    return False

            return True

        # 3. If citizen has no explicit state context (Central mode / unspecified)
        # Return only Central/National schemes to prevent arbitrary state bias
        return scheme_level in ["CENTRAL", "NATIONAL"]

