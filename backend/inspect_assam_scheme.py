import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models.db_models import SchemeDB

def inspect_assam_scheme():
    db = SessionLocal()
    try:
        s = db.query(SchemeDB).filter(SchemeDB.id == "sch_gen_scholarship_as").first()
        if s:
            print(f"ID: {s.id}")
            print(f"Name: {s.name}")
            print(f"Level: {s.level}")
            print(f"State Code: {s.state_code}")
            print(f"State Name: {s.state_name}")
            print(f"Category: {s.category}")
            print(f"Eligibility Rules: {s.eligibility_rules}")
            print(f"Status: {s.status}")
        else:
            print("Scheme sch_gen_scholarship_as not found!")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_assam_scheme()
