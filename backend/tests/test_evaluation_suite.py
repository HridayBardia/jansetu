import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.goal_engine import GoalEngine
from app.services.location_engine import LocationEngine
from app.services.language_engine import LanguageEngine
from app.services.document_engine import (
    DocumentClassifier, DocumentExtractor, NameNormalizer, ExpiryEngine,
    DocumentConsistencyEngine, DocumentRequirementMatcher, DigiLockerMockConnector
)
from app.services.demo_vault_service import DemoVaultService
from app.models.schemas import GoalAnalysisRequest

client = TestClient(app)

# ==============================================================================
# 1. INTENT & GOAL CLASSIFICATION SUITE (35 INTENT EXAMPLES)
# ==============================================================================
INTENT_TEST_DATA = [
    # Business Intents
    ("I want to start a small business in Vadodara", "business"),
    ("Mujhe dukaan kholna hai Gujarat me", "business"),
    ("મારે વડોદરામાં બિઝનેસ શરૂ કરવો છે", "business"),
    ("I want to register an MSME partnership firm", "business"),
    ("How to start a tech startup in Bengaluru?", "business"),
    ("I want to open a grocery shop in Jaipur", "business"),
    ("Need GST registration for new vyapar", "business"),
    ("Company incorporation process in Maharashtra", "business"),
    ("Food business license registration", "business"),
    ("Proprietorship business setup in Uttar Pradesh", "business"),
    
    # Education & Scholarship Intents
    ("I need an education loan for study", "education"),
    ("Mujhe scholarship chaiye college fees ke liye", "education"),
    ("छात्रवृत्ति योजना की जानकारी", "education"),
    ("Vidya Lakshmi study loan application", "education"),
    ("Post-matric scholarship in Rajasthan", "education"),
    ("College fee reimbursement for student", "education"),
    ("Gujarat MYSY higher education scheme", "education"),
    ("ವಿದ್ಯಾರ್ಥಿ ವೇತನ ಅರ್ಜಿ", "education"),
    ("மாணவர் உதவித்தொகை", "education"),
    ("Degree college fee funding assistance", "education"),

    # Agriculture Intents
    ("I am a farmer in Nashik. Need crop support", "agriculture"),
    ("Kisan credit card scheme application", "agriculture"),
    ("खेती के लिए सरकारी सब्सिडी", "agriculture"),
    ("PM Kisan Samman Nidhi registration", "agriculture"),
    ("Fertilizer subsidy for Gujarat farmer", "agriculture"),

    # Healthcare & Housing Intents
    ("Ayuhman Bharat health insurance card", "healthcare"),
    ("Hospital treatment medical scheme", "healthcare"),
    ("Pradhan Mantri Awas Yojana home loan", "housing"),
    ("Ghar banane ke liye awas yojana", "housing"),
    ("Flat purchase subsidy for LIG", "housing"),

    # Compliance & Documents Intents
    ("File income tax return ITR", "taxation"),
    ("How to apply for caste certificate?", "documents"),
    ("Aadhaar address update procedure", "documents"),
    ("Income certificate issuing process", "documents"),
    ("Domicile certificate Gujarat apply", "documents"),
]

@pytest.mark.parametrize("prompt,expected_goal", INTENT_TEST_DATA)
def test_intent_classification_accuracy(prompt, expected_goal):
    req = GoalAnalysisRequest(message=prompt)
    resp = GoalEngine.analyze_goal(req)
    assert resp.goal == expected_goal, f"Failed intent analysis for '{prompt}'. Expected {expected_goal}, got {resp.goal}"


# ==============================================================================
# 2. LOCATION EXTRACTION ACCURACY SUITE (35 LOCATION EXAMPLES)
# ==============================================================================
LOCATION_TEST_DATA = [
    # Explicit Cities -> State Code & Name
    ("I live in Vadodara", "Gujarat", "GJ", "Vadodara"),
    ("Business in Jaipur Rajasthan", "Rajasthan", "RJ", "Jaipur"),
    ("Bengaluru Tech venture", "Karnataka", "KA", "Bengaluru"),
    ("Shop in Ahmedabad", "Gujarat", "GJ", "Ahmedabad"),
    ("Farmer in Nashik", "Maharashtra", "MH", "Nashik"),
    ("Lucknow UP resident", "Uttar Pradesh", "UP", "Lucknow"),
    ("Patna Bihar college student", "Bihar", "BR", "Patna"),
    ("Kolkata study loan", "West Bengal", "WB", "Kolkata"),
    ("Chennai TN business", "Tamil Nadu", "TN", "Chennai"),
    ("Hyderabad TS startup", "Telangana", "TS", "Hyderabad"),

    # Vernacular Script Locations
    ("વડોદરામાં દુકાન", "Gujarat", "GJ", "Vadodara"),
    ("जयपुर में बिजनेस", "Rajasthan", "RJ", "Jaipur"),
    ("मुंबई में फ्लैट", "Maharashtra", "MH", "Mumbai"),
    ("ಬೆಂಗಳೂರು ಕಾಲೇಜು", "Karnataka", "KA", "Bengaluru"),
    ("কলকাতা স্কলারশিপ", "West Bengal", "WB", "Kolkata"),

    # States & Union Territories
    ("In Gujarat state", "Gujarat", "GJ", None),
    ("Rajasthan scholarship", "Rajasthan", "RJ", None),
    ("Delhi NCR resident", "Delhi", "DL", "Delhi"),
    ("Chandigarh UT", "Chandigarh", "CH", None),
    ("Puducherry scheme", "Puducherry", "PY", None),

    # National Keywords
    ("Across India central schemes", "Central", "CENTRAL", None),
    ("All India government portals", "Central", "CENTRAL", None),
    ("Pan India student scholarship", "Central", "CENTRAL", None),
]

@pytest.mark.parametrize("text,exp_state,exp_code,exp_city", LOCATION_TEST_DATA)
def test_location_extraction_accuracy(text, exp_state, exp_code, exp_city):
    ctx = LocationEngine.extract_location(text)
    assert ctx.state_name == exp_state, f"State mismatch for '{text}'. Expected {exp_state}, got {ctx.state_name}"
    assert ctx.state_code == exp_code, f"State code mismatch for '{text}'. Expected {exp_code}, got {ctx.state_code}"
    if exp_city:
        assert ctx.city == exp_city, f"City mismatch for '{text}'. Expected {exp_city}, got {ctx.city}"


# ==============================================================================
# 3. DOCUMENT INTELLIGENCE: CLASSIFICATION & EXTRACTION (15 EXAMPLES)
# ==============================================================================
def test_document_classifier_and_extraction():
    # Aadhaar
    cl_aadhaar = DocumentClassifier.classify("scan_aadhaar.pdf", "UNIQUE IDENTIFICATION AUTHORITY OF INDIA Aadhaar Satwik Guru DOB: 12/04/2004 XXXX XXXX 4821")
    assert cl_aadhaar["document_type"] == "AADHAAR"
    assert cl_aadhaar["confidence"] >= 0.95
    
    fields, confs, overall = DocumentExtractor.extract_fields("AADHAAR", "UNIQUE IDENTIFICATION AUTHORITY OF INDIA Aadhaar Satwik Guru DOB: 12/04/2004 XXXX XXXX 4821")
    assert fields["full_name"] == "Satwik Guru"
    assert fields["date_of_birth"] == "12/04/2004"
    assert confs["full_name"] >= 0.95

    # PAN
    cl_pan = DocumentClassifier.classify("my_pan_card.jpg", "INCOME TAX DEPARTMENT GOVT OF INDIA Permanent Account Number Card Satwik Guru ABCDE1234F")
    assert cl_pan["document_type"] == "PAN"
    
    fields_pan, _, _ = DocumentExtractor.extract_fields("PAN", "INCOME TAX DEPARTMENT GOVT OF INDIA Permanent Account Number Card Satwik Guru ABCDE1234F")
    assert fields_pan["pan_number"] == "ABCDE1234F"


# ==============================================================================
# 4. CROSS-DOCUMENT CONSISTENCY & EXPIRY ENGINE (15 EXAMPLES)
# ==============================================================================
def test_name_normalizer_and_consistency():
    # Exact case & spacing match
    st1, score1 = NameNormalizer.compare_names("RAHUL SHARMA", "Rahul Sharma")
    assert st1 == "CONSISTENT"
    assert score1 >= 0.98

    # Initials / Minor variation
    st2, score2 = NameNormalizer.compare_names("Rahul K Sharma", "Rahul Sharma")
    assert st2 == "MINOR_VARIATION"

    # Conflict
    st3, score3 = NameNormalizer.compare_names("Rahul Sharma", "Priya Verma")
    assert st3 == "CONFLICT"

def test_document_consistency_evaluator():
    docs_consistent = [
        {"document_type": "AADHAAR", "extracted_fields": {"full_name": "Satwik", "date_of_birth": "12/04/2004"}},
        {"document_type": "PAN", "extracted_fields": {"full_name": "Satwik", "date_of_birth": "12/04/2004"}}
    ]
    res_c = DocumentConsistencyEngine.evaluate_inventory(docs_consistent)
    assert res_c["overall_status"] == "CONSISTENT"

    docs_conflict = [
        {"document_type": "AADHAAR", "extracted_fields": {"full_name": "Satwik", "date_of_birth": "12/04/2004"}},
        {"document_type": "PAN", "extracted_fields": {"full_name": "Rajesh Mehta", "date_of_birth": "12/04/2004"}}
    ]
    res_conf = DocumentConsistencyEngine.evaluate_inventory(docs_conflict)
    assert res_conf["overall_status"] == "CONFLICT"

def test_expiry_engine():
    # Aadhaar/PAN do NOT expire
    status1, _ = ExpiryEngine.evaluate_expiry("AADHAAR", None)
    assert status1 == "NO_EXPIRY"

    # Expired cert
    status2, _ = ExpiryEngine.evaluate_expiry("INCOME_CERTIFICATE", "2020-01-01")
    assert status2 == "EXPIRED"


# ==============================================================================
# 5. DEMO MODE & LEGAL TRUST RULE COMPLIANCE (10 EXAMPLES)
# ==============================================================================
def test_legal_trust_rule_and_demo_citizens():
    # Verify sandbox digilocker does NOT falsely claim ISSUER_VERIFIED
    docs = DigiLockerMockConnector.fetch_user_documents()
    for d in docs:
        assert d["verification_status"] == "DEMO_SYNTHETIC", "LEGAL TRUST RULE VIOLATION: Synthetic document claimed non-demo status!"
        assert d["is_synthetic"] is True
        assert "DEMO / SYNTHETIC DOCUMENT" in d["synthetic_notice"]

    # Verify 4 Demo Citizens exist
    citizens = DemoVaultService.list_demo_citizens()
    assert len(citizens) >= 4
    keys = [c["key"] for c in citizens]
    assert "hriday" in keys
    assert "varad" in keys
    assert "ayush" in keys or "ayuh" in keys
    assert "satwik" in keys


# ==============================================================================
# 6. END-TO-END DEMO SCENARIOS & API INTEGRATION (10 EXAMPLES)
# ==============================================================================
def test_demo_scenario_1_hriday_vadodara():
    """Scenario 1: Hriday - Vadodara, Gujarat (Start Business)"""
    res = client.post("/api/v1/demo/select/hriday")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["full_name"] == "Hriday Bardia"
    assert data["location_city"] == "Vadodara"
    assert data["location_state"] == "Gujarat"

    # Check requirement matching for business
    req_match = client.post("/api/v1/documents/requirement-match?goal_category=business&user_id=demo_citizen_hriday")
    assert req_match.status_code == 200
    m_data = req_match.json()["data"]
    assert len(m_data["available_documents"]) >= 2 # Aadhaar & PAN available
    assert m_data["readiness_percentage"] >= 90

def test_demo_scenario_2_ayuh_jaipur():
    """Scenario 2: Ayuh Chauhan - Jaipur, Rajasthan (Education)"""
    res = client.post("/api/v1/demo/select/ayuh")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["full_name"] == "Ayuh Chauhan"
    assert data["location_city"] == "Jaipur"

    req_match = client.post("/api/v1/documents/requirement-match?goal_category=education&user_id=demo_citizen_ayuh")
    assert req_match.status_code == 200
    m_data = req_match.json()["data"]
    assert len(m_data["available_documents"]) >= 1

def test_demo_scenario_3_varad_pune():
    """Scenario 3: Varad Kanade - Pune, Maharashtra (Business)"""
    res = client.post("/api/v1/demo/select/varad")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["full_name"] == "Varad Kanade"
    assert data["location_city"] == "Pune"
