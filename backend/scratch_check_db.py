import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models.db_models import JourneyDB

def check_journeys():
    db = SessionLocal()
    try:
        total = db.query(JourneyDB).count()
        print(f"Total Journeys: {total}")
        journeys = db.query(JourneyDB).all()
        for j in journeys:
            print(f"\nJourney ID: {j.id} | Title: {j.title}")
            print(f"Goal Category: {j.goal_category} | Domicile: {j.domicile_state}")
            print(f"Result JSON present: {j.result_json is not None}")
            if j.result_json:
                print("Result keys:", list(j.result_json.keys()))
                if "documents" in j.result_json:
                    print("  Documents keys:", list(j.result_json["documents"].keys()))
                    print("  Have docs count:", len(j.result_json["documents"].get("have", [])))
                    print("  Need docs count:", len(j.result_json["documents"].get("need", [])))
                if "schemes" in j.result_json:
                    print("  Schemes keys:", list(j.result_json["schemes"].keys()))
                    print("  Central schemes count:", len(j.result_json["schemes"].get("central", [])))
                    print("  State schemes count:", len(j.result_json["schemes"].get("state", [])))
    finally:
        db.close()

if __name__ == "__main__":
    check_journeys()
