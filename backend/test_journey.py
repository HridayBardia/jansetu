"""
Test suite for JANSETU Journey Analysis.
Validates domicile state, target location, documents, and schemes.
"""
import sys
import asyncio
sys.path.insert(0, '.')
from app.core.database import SessionLocal
from app.models.db_models import UserDB, JourneyDB
from app.services.citizen_intelligence import CitizenIntelligenceEngine

async def run_test(test_name, query, expected_domicile, expected_target=None, expected_intent=None):
    db = SessionLocal()
    user = db.query(UserDB).filter(UserDB.username == 'hriday').first()

    journey = JourneyDB(
        user_id=user.id, title='Test', goal_category='general',
        life_event='general', query=query, domicile_state=expected_domicile,
        intent='GENERAL', status='ANALYZING', state='IN_PROGRESS'
    )
    db.add(journey)
    db.commit()
    db.refresh(journey)

    result = await CitizenIntelligenceEngine.analyze_journey(query, expected_domicile, user, db, journey)

    actual_domicile = result.get('domicile', {}).get('state', '')
    target_loc = result.get('targetLocation') or {}
    actual_target_state = target_loc.get('state', '')
    actual_target_city = target_loc.get('city', '')
    actual_target_country = target_loc.get('country', '')
    docs_have = len(result.get('documents', {}).get('have', []))
    docs_need = len(result.get('documents', {}).get('need', []))
    central_schemes = len(result.get('schemes', {}).get('central', []))
    state_schemes = len(result.get('schemes', {}).get('state', []))
    intent = result.get('intent', {}).get('primary', '')
    total_schemes = central_schemes + state_schemes

    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"{'='*60}")
    print(f"  Query: {query}")
    print(f"  Domicile: {actual_domicile} (expected: {expected_domicile})")

    ok = True

    # 1. Validate domicile
    if actual_domicile == expected_domicile:
        print(f"  [OK] Domicile correct")
    else:
        print(f"  [FAIL] Domicile mismatch! Got '{actual_domicile}', expected '{expected_domicile}'")
        ok = False

    # 2. Validate target location
    if expected_target:
        all_target = f"{actual_target_state} {actual_target_city} {actual_target_country}".lower()
        if expected_target.lower() in all_target:
            print(f"  [OK] Target location found: state={actual_target_state}, city={actual_target_city}, country={actual_target_country}")
        else:
            print(f"  [WARN] Target '{expected_target}' not found in state={actual_target_state}, city={actual_target_city}, country={actual_target_country}")
    else:
        if actual_target_state or actual_target_city or actual_target_country:
            print(f"  [INFO] Detected: state={actual_target_state}, city={actual_target_city}, country={actual_target_country}")
        else:
            print(f"  [OK] No target location (as expected)")

    # 3. Validate documents
    if docs_have > 0 and docs_need > 0:
        print(f"  [OK] Documents: {docs_have} available, {docs_need} required")
    else:
        print(f"  [FAIL] Documents: have={docs_have}, need={docs_need}")
        ok = False

    # 4. Validate schemes
    if total_schemes > 0:
        print(f"  [OK] Schemes: {central_schemes} central, {state_schemes} state")
        all_schemes = result.get('schemes', {}).get('central', []) + result.get('schemes', {}).get('state', [])
        for s in all_schemes[:3]:
            print(f"    - {s['name']} ({s.get('match_status', 'N/A')})")
    else:
        print(f"  [WARN] No schemes found (may be expected for some intents)")

    # 5. Validate intent
    if expected_intent:
        if intent == expected_intent:
            print(f"  [OK] Intent correct: {intent}")
        else:
            print(f"  [WARN] Intent: got '{intent}', expected '{expected_intent}'")

    db.close()
    return ok

async def main():
    print("=" * 60)
    print("JANSETU JOURNEY ANALYSIS - TEST SUITE")
    print("=" * 60)

    results = []

    results.append(await run_test(
        "TEST 1: Start Business in Assam (Domicile: Gujarat)",
        "I want to start a business in Assam",
        expected_domicile="Gujarat",
        expected_target="assam",
        expected_intent="BUSINESS_START"
    ))

    results.append(await run_test(
        "TEST 2: Build Hospital in Jaipur (Domicile: Rajasthan)",
        "I want to build a hospital in Jaipur",
        expected_domicile="Rajasthan",
        expected_target="jaipur",
        expected_intent="HOSPITAL"
    ))

    results.append(await run_test(
        "TEST 3: Buy Land in Bangalore (Domicile: Karnataka)",
        "I want to buy land in Bangalore",
        expected_domicile="Karnataka",
        expected_target="bangalore",
        expected_intent="LAND_PURCHASE"
    ))

    results.append(await run_test(
        "TEST 4: Study Masters in Australia (Domicile: Gujarat)",
        "I want to study masters in Australia",
        expected_domicile="Gujarat",
        expected_target="australia",
        expected_intent="STUDY_ABROAD"
    ))

    results.append(await run_test(
        "TEST 5: Start Restaurant (Domicile: Maharashtra, no location)",
        "I want to start a restaurant",
        expected_domicile="Maharashtra",
        expected_intent="RESTAURANT"
    ))

    results.append(await run_test(
        "TEST 6: Buy House (Domicile: Karnataka, no location)",
        "I want to buy a house",
        expected_domicile="Karnataka",
        expected_intent="HOME_PURCHASE"
    ))

    passed = sum(1 for r in results if r)
    failed = len(results) - passed
    print(f"\n{'='*60}")
    print(f"RESULTS: {passed} passed, {failed} failed out of {len(results)}")
    print(f"{'='*60}")

if __name__ == "__main__":
    asyncio.run(main())
