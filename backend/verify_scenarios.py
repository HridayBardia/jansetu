import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models.db_models import UserDB
from app.api.v1.router import _do_analyze_journey

def test_scenarios():
    db = SessionLocal()
    # Fetch mock user
    user = db.query(UserDB).first()
    if not user:
        print("Error: No user found in database.")
        db.close()
        return

    scenarios = [
        {
            "name": "Scenario A: Study Abroad",
            "query": "I wanna go to Australia for masters",
            "domicile": "Rajasthan"
        },
        {
            "name": "Scenario B: Start Business in Assam",
            "query": "I want to start a business in Assam",
            "domicile": "Gujarat"
        },
        {
            "name": "Scenario C: Kisan Financial Support",
            "query": "I am a kisan looking for financial support",
            "domicile": "Maharashtra"
        },
        {
            "name": "Scenario D: Renew Driving Licence",
            "query": "I want to renew my driving licence",
            "domicile": "Karnataka"
        }
    ]

    for sc in scenarios:
        print("="*60)
        print(f"RUNNING: {sc['name']}")
        print(f"Query: '{sc['query']}' | Domicile: {sc['domicile']}")
        print("="*60)
        
        # Clean session
        db.rollback()
        
        # Run analyze
        from app.models.db_models import JourneyDB
        journey = JourneyDB(
            user_id=user.id,
            title="Temp Test Journey",
            goal_category="general",
            life_event="general",
            query=sc["query"],
            domicile_state=sc["domicile"],
            intent="GENERAL",
            status="ANALYZING",
            state="IN_PROGRESS"
        )
        db.add(journey)
        db.commit()
        db.refresh(journey)
        
        result = _do_analyze_journey(sc["query"], sc["domicile"], user, db, journey)
        
        print(f"Detected Intent: {result['goal']['category']}")
        print(f"Domicile State: {result['domicile']['state']}")
        print(f"Target Location: {result.get('targetLocation')}")
        print(f"Documents We Have ({len(result['documents']['have'])}): {[d['type'] for d in result['documents']['have']]}")
        print(f"Documents We Need ({len(result['documents']['need'])}): {[d['type'] for d in result['documents']['need']]}")
        print(f"Central Schemes ({len(result['schemes']['central'])}): {[s['name'] for s in result['schemes']['central']]}")
        print(f"Domicile Schemes ({len(result['schemes']['state'])}): {[s['name'] for s in result['schemes']['state']]}")
        print(f"Target Schemes ({len(result['schemes']['targetLocation'])}): {[s['name'] for s in result['schemes']['targetLocation']]}")
        print("\n")
        
    db.close()

if __name__ == "__main__":
    test_scenarios()
