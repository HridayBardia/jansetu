import sys
sys.path.insert(0, '.')
from app.core.database import SessionLocal
from app.models.db_models import UserDB, JourneyDB

db = SessionLocal()
user = db.query(UserDB).filter(UserDB.username == 'hriday').first()

journey = JourneyDB(
    user_id=user.id, title='Test', goal_category='general',
    life_event='general', query='I want to study masters in Australia',
    domicile_state='Rajasthan', intent='GENERAL', status='ANALYZING', state='IN_PROGRESS'
)
db.add(journey)
db.commit()
db.refresh(journey)

from app.api.v1.router import _do_analyze_journey
result = _do_analyze_journey('I want to study masters in Australia', 'Rajasthan', user, db, journey)
print('SUCCESS')
print('  Journey ID:', result.get('journeyId'))
print('  Goal title:', result.get('goal', {}).get('title'))
print('  Docs have:', len(result.get('documents', {}).get('have', [])))
print('  Docs need:', len(result.get('documents', {}).get('need', [])))
print('  Central schemes:', len(result.get('schemes', {}).get('central', [])))
print('  State schemes:', len(result.get('schemes', {}).get('state', [])))
for s in result.get('schemes', {}).get('central', [])[:3]:
    print(f"    - {s['name']} ({s['match_status']})")
for s in result.get('schemes', {}).get('state', [])[:3]:
    print(f"    - {s['name']} ({s['match_status']})")
db.close()
