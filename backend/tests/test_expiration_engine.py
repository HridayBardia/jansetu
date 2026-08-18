import sys
import os
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import SessionLocal
from app.models.db_models import SchemeDB
from app.services.ingestion_engine import IngestionEngine

client = TestClient(app)

def test_expired_schemes_exclusion():
    db = SessionLocal()
    IngestionEngine.seed_database(db)
    IngestionEngine.check_expired_schemes(db)

    # Verify database status of expired test scheme
    exp_scheme = db.query(SchemeDB).filter(SchemeDB.id == "sch_covid_relief_2024").first()
    assert exp_scheme is not None
    assert exp_scheme.status == "EXPIRED"

    # Verify query level filtering strictly excludes EXPIRED schemes
    active_query = IngestionEngine.filter_active_schemes(db.query(SchemeDB))
    active_ids = [s.id for s in active_query.all()]
    assert "sch_covid_relief_2024" not in active_ids
    assert "sch_suspended_legacy_transport" not in active_ids

    # API Endpoint check
    res = client.get("/api/v1/schemes")
    assert res.status_code == 200
    schemes_data = res.json()["data"]["schemes"]
    api_ids = [s["id"] for s in schemes_data]
    assert "sch_covid_relief_2024" not in api_ids
    assert "sch_suspended_legacy_transport" not in api_ids
    db.close()
