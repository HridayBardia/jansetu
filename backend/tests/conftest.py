import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test_temp_citizen_journey.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()

@pytest.fixture(autouse=True)
def clean_db():
    # Clear custom dependency overrides to prevent leakage
    for k in list(app.dependency_overrides.keys()):
        if k != get_db:
            del app.dependency_overrides[k]

    db = TestingSessionLocal()
    try:
        from app.models.db_models import UserDB, UserDocumentDB, CitizenProfileDB, JourneyDB, JourneyStepDB, StepDependencyDB, SchemeDB, GovernmentSourceDB, UserConsentDB, SystemAlertDB
        db.query(UserDocumentDB).delete()
        db.query(CitizenProfileDB).delete()
        db.query(JourneyStepDB).delete()
        db.query(StepDependencyDB).delete()
        db.query(JourneyDB).delete()
        db.query(UserConsentDB).delete()
        db.query(SystemAlertDB).delete()
        db.query(UserDB).delete()
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

