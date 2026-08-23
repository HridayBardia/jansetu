import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.db_models import SchemaMappingDB, ServiceRegistryDB

class DataMappingEngine:
    @staticmethod
    def map_external_to_canonical(db: Session, connector_id: str, external_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Maps data from an external connector's schema into JanSetu's Canonical Data Model
        using mapping definitions from SchemaMappingDB.
        """
        mappings = db.query(SchemaMappingDB).filter(
            SchemaMappingDB.connector_id == connector_id,
            SchemaMappingDB.status == "VALIDATED"
        ).all()
        
        canonical_data = {}
        
        for mapping in mappings:
            source_field = mapping.source_field
            canonical_field = mapping.canonical_field
            transformation = mapping.transformation
            
            # Simple field extraction (can be extended for nested json)
            if source_field in external_data:
                raw_value = external_data[source_field]
                
                # Apply transformation if specified
                processed_value = DataMappingEngine._apply_transformation(raw_value, transformation)
                
                # Nested assignment
                keys = canonical_field.split('.')
                current_level = canonical_data
                for key in keys[:-1]:
                    if key not in current_level:
                        current_level[key] = {}
                    current_level = current_level[key]
                current_level[keys[-1]] = processed_value
                
        return canonical_data

    @staticmethod
    def _apply_transformation(value: Any, transformation: str) -> Any:
        if not transformation:
            return value
            
        try:
            if transformation == "DD/MM/YYYY -> YYYY-MM-DD":
                parts = value.split('/')
                if len(parts) == 3:
                    return f"{parts[2]}-{parts[1]}-{parts[0]}"
            elif transformation == "TO_UPPERCASE":
                return str(value).upper()
            elif transformation == "BOOLEAN_YES_NO":
                return True if str(value).lower() in ["yes", "y", "true", "1"] else False
        except Exception:
            pass # Fallback to raw value on transformation failure
            
        return value
