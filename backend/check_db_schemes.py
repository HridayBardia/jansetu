import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models.db_models import SchemeDB

def run_diagnostics():
    db = SessionLocal()
    try:
        total = db.query(SchemeDB).count()
        active = db.query(SchemeDB).filter(SchemeDB.status == "ACTIVE").count()
        central = db.query(SchemeDB).filter(SchemeDB.level == "CENTRAL").count()
        state = db.query(SchemeDB).filter(SchemeDB.level == "STATE").count()
        
        print(f"Total schemes in DB: {total}")
        print(f"Active schemes in DB: {active}")
        print(f"Central schemes in DB: {central}")
        print(f"State schemes in DB: {state}")
        
        # Check by state
        states = db.query(SchemeDB.state_name, SchemeDB.state_code).distinct().all()
        print("\nDistinct States and Codes:")
        for s_name, s_code in states:
            count = db.query(SchemeDB).filter(SchemeDB.state_code == s_code).count()
            print(f"  - State: {s_name} (Code: {s_code}) | Count: {count}")
            
        # Check by category
        categories = db.query(SchemeDB.category).distinct().all()
        print("\nDistinct Categories:")
        for (cat,) in categories:
            count = db.query(SchemeDB).filter(SchemeDB.category == cat).count()
            print(f"  - Category: {cat} | Count: {count}")
            
        # Let's inspect Assam-related or Gujarat-related schemes
        print("\nAssam schemes:")
        as_schemes = db.query(SchemeDB).filter(SchemeDB.state_code == "AS").all()
        for s in as_schemes:
            print(f"  - [{s.id}] {s.name} | Level: {s.level} | Category: {s.category}")
            
        print("\nGujarat schemes:")
        gj_schemes = db.query(SchemeDB).filter(SchemeDB.state_code == "GJ").all()
        for s in gj_schemes:
            print(f"  - [{s.id}] {s.name} | Level: {s.level} | Category: {s.category}")
            
        print("\nSample central schemes for business:")
        bus_central = db.query(SchemeDB).filter(SchemeDB.level == "CENTRAL", SchemeDB.category == "business").all()
        for s in bus_central:
            print(f"  - [{s.id}] {s.name} | Status: {s.status}")
            
    finally:
        db.close()

if __name__ == "__main__":
    run_diagnostics()
