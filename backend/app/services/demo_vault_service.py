from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.db_models import UserDB, CitizenProfileDB, UserDocumentDB, DocumentConsistencyDB

SYNTHETIC_WATERMARK = "DEMO DOCUMENT — NOT A GOVERNMENT-ISSUED DOCUMENT — FOR DEMONSTRATION ONLY"

DEMO_CITIZENS: Dict[str, Dict[str, Any]] = {
    "hriday": {
        "key": "hriday",
        "user_id": "user_hriday_bardia",
        "full_name": "Hriday Bardia",
        "mobile_number": "+917016918865",
        "email": "hriday@demo.citizen",
        "age": 24,
        "annual_income": 350000.0,
        "income_category": "LIG",
        "location_city": "Vadodara",
        "location_district": "Vadodara",
        "location_state": "Gujarat",
        "category": "General",
        "occupation": "Entrepreneur & Software Engineer",
        "education": "B.Tech Computer Science",
        "documents": [
            {
                "document_type": "10TH_MARKSHEET",
                "document_name": "10th Marksheet",
                "document_number_masked": "10TH-2018-XXXX",
                "file_name": "demo_10th_marksheet_hriday.pdf",
                "mime_type": "application/pdf",
                "file_size": 240000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Central Board of Secondary Education (CBSE)",
                "extracted_fields": {
                    "full_name": "Hriday Bardia",
                    "marks_obtained": "480 / 500",
                    "passing_year": "2018"
                },
                "field_confidence": {"full_name": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "12TH_MARKSHEET",
                "document_name": "12th Marksheet",
                "document_number_masked": "12TH-2020-XXXX",
                "file_name": "demo_12th_marksheet_hriday.pdf",
                "mime_type": "application/pdf",
                "file_size": 240000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Central Board of Secondary Education (CBSE)",
                "extracted_fields": {
                    "full_name": "Hriday Bardia",
                    "marks_obtained": "475 / 500",
                    "passing_year": "2020"
                },
                "field_confidence": {"full_name": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "AADHAAR",
                "document_name": "Aadhaar Card",
                "document_number_masked": "XXXX XXXX 8865",
                "file_name": "demo_aadhaar_hriday_bardia.pdf",
                "mime_type": "application/pdf",
                "file_size": 192000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Unique Identification Authority of India (UIDAI)",
                "extracted_fields": {
                    "full_name": "Hriday Bardia",
                    "date_of_birth": "15/08/2001",
                    "gender": "Male",
                    "aadhaar_number": "DEMO-AADHAAR-7016918865",
                    "address": "42, Sunrise Greens, Alkapuri, Vadodara, Gujarat - 390007"
                },
                "field_confidence": {"full_name": 0.99, "date_of_birth": 0.98, "aadhaar_number": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "PAN",
                "document_name": "PAN Card",
                "document_number_masked": "XXXXX1234H",
                "file_name": "demo_pan_hriday_bardia.pdf",
                "mime_type": "application/pdf",
                "file_size": 154000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Income Tax Department, Govt of India",
                "extracted_fields": {
                    "full_name": "Hriday Bardia",
                    "father_name": "Rajesh Bardia",
                    "date_of_birth": "15/08/2001",
                    "pan_number": "DEMO-PAN-00001"
                },
                "field_confidence": {"full_name": 0.99, "pan_number": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "DRIVING_LICENCE",
                "document_name": "Driving Licence",
                "document_number_masked": "GJ-06-2022-XXXXXXX",
                "file_name": "demo_dl_hriday_bardia.pdf",
                "mime_type": "application/pdf",
                "file_size": 210000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Transport Department, Govt of Gujarat",
                "extracted_fields": {
                    "full_name": "Hriday Bardia",
                    "dl_number": "DEMO-DL-GJ06-0001",
                    "valid_until": "2037-08-14"
                },
                "field_confidence": {"full_name": 0.98, "dl_number": 0.98},
                "overall_confidence": 0.98,
                "expiry_status": "VALID",
                "language_code": "en"
            },
            {
                "document_type": "MARKSHEET",
                "document_name": "Education Certificate (B.Tech)",
                "document_number_masked": "DEG-2023-XXXX",
                "file_name": "demo_btech_degree_hriday.pdf",
                "mime_type": "application/pdf",
                "file_size": 285000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Gujarat Technological University",
                "extracted_fields": {
                    "full_name": "Hriday Bardia",
                    "degree": "B.Tech Computer Science & Engineering",
                    "passing_year": "2023"
                },
                "field_confidence": {"full_name": 0.99, "degree": 0.98},
                "overall_confidence": 0.98,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "DOMICILE_CERTIFICATE",
                "document_name": "Address & Residence Certificate",
                "document_number_masked": "GJ/VAD/RES/XXXX",
                "file_name": "demo_residence_hriday.pdf",
                "mime_type": "application/pdf",
                "file_size": 178000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": False,
                "issued_by": "Revenue Department, Vadodara, Gujarat",
                "extracted_fields": {
                    "full_name": "Hriday Bardia",
                    "district": "Vadodara",
                    "state": "Gujarat",
                    "certificate_number": "DEMO-RES-GJ06-88"
                },
                "field_confidence": {"full_name": 0.97, "certificate_number": 0.96},
                "overall_confidence": 0.97,
            },
            {
                "document_type": "PASSPORT",
                "document_name": "Indian Passport",
                "document_number_masked": "PXXXXXX88",
                "file_name": "demo_passport_hriday.pdf",
                "mime_type": "application/pdf",
                "file_size": 220000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": False,
                "issued_by": "Ministry of External Affairs, Passport Seva",
                "extracted_fields": {
                    "full_name": "Hriday Bardia",
                    "passport_number": "DEMO-PASSPORT-01",
                    "expiry_date": "2032-12-31"
                },
                "field_confidence": {"full_name": 0.99, "passport_number": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "VALID",
                "language_code": "en"
            },
            {
                "document_type": "INCOME_CERTIFICATE",
                "document_name": "Income Certificate",
                "document_number_masked": "INC/XXXX/8865",
                "file_name": "demo_income_hriday.pdf",
                "mime_type": "application/pdf",
                "file_size": 160000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": False,
                "issued_by": "Revenue Department, Govt of Gujarat",
                "extracted_fields": {
                    "full_name": "Hriday Bardia",
                    "annual_income": "350000.0",
                    "valid_until": "2028-03-31"
                },
                "field_confidence": {"full_name": 0.99, "annual_income": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "VALID",
                "language_code": "en"
            }
        ]
    },
    "varad": {
        "key": "varad",
        "user_id": "user_varad_kanade",
        "full_name": "Varad Kanade",
        "mobile_number": "+918830482422",
        "email": "varad@demo.citizen",
        "age": 25,
        "annual_income": 420000.0,
        "income_category": "MIG",
        "location_city": "Pune",
        "location_district": "Pune",
        "location_state": "Maharashtra",
        "category": "General",
        "occupation": "Tech Consultant",
        "education": "M.Sc Information Technology",
        "documents": [
            {
                "document_type": "AADHAAR",
                "document_name": "Aadhaar Card",
                "document_number_masked": "XXXX XXXX 2422",
                "file_name": "demo_aadhaar_varad.pdf",
                "mime_type": "application/pdf",
                "file_size": 180000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "UIDAI",
                "extracted_fields": {
                    "full_name": "Varad Kanade",
                    "date_of_birth": "10/05/2000",
                    "gender": "Male",
                    "aadhaar_number": "DEMO-AADHAAR-8830482422",
                    "address": "12, Kothrud Main Road, Pune, Maharashtra - 411038"
                },
                "field_confidence": {"full_name": 0.99, "aadhaar_number": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "PAN",
                "document_name": "PAN Card",
                "document_number_masked": "XXXXX5678V",
                "file_name": "demo_pan_varad.pdf",
                "mime_type": "application/pdf",
                "file_size": 150000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Income Tax Department",
                "extracted_fields": {
                    "full_name": "Varad Kanade",
                    "pan_number": "DEMO-PAN-00002"
                },
                "field_confidence": {"full_name": 0.99, "pan_number": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "DRIVING_LICENCE",
                "document_name": "Driving Licence",
                "document_number_masked": "MH-12-2021-XXXXXXX",
                "file_name": "demo_dl_varad.pdf",
                "mime_type": "application/pdf",
                "file_size": 195000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "RTO Pune, Maharashtra",
                "extracted_fields": {
                    "full_name": "Varad Kanade",
                    "dl_number": "DEMO-DL-MH12-0002",
                    "valid_until": "2036-05-09"
                },
                "field_confidence": {"full_name": 0.98},
                "overall_confidence": 0.98,
                "expiry_status": "VALID",
                "language_code": "en"
            },
            {
                "document_type": "BANK_PROOF",
                "document_name": "Bank Account Proof & Statement",
                "document_number_masked": "XXXX-XXXX-9901",
                "file_name": "demo_bank_proof_varad.pdf",
                "mime_type": "application/pdf",
                "file_size": 240000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": False,
                "issued_by": "State Bank of India (SBI)",
                "extracted_fields": {
                    "account_holder": "Varad Kanade",
                    "bank_name": "State Bank of India",
                    "ifsc_code": "SBIN0001234"
                },
                "field_confidence": {"account_holder": 0.98},
                "overall_confidence": 0.98,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "MARKSHEET",
                "document_name": "Education Certificate (M.Sc)",
                "document_number_masked": "SPPU-2022-XXXX",
                "file_name": "demo_msc_degree_varad.pdf",
                "mime_type": "application/pdf",
                "file_size": 270000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Savitribai Phule Pune University",
                "extracted_fields": {
                    "full_name": "Varad Kanade",
                    "degree": "M.Sc Information Technology",
                    "passing_year": "2022"
                },
                "field_confidence": {"full_name": 0.99},
                "overall_confidence": 0.98,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "INCOME_CERTIFICATE",
                "document_name": "Income Certificate",
                "document_number_masked": "INC-2024-XXXX",
                "file_name": "demo_income_varad.pdf",
                "mime_type": "application/pdf",
                "file_size": 165000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Revenue Department, Govt of Maharashtra",
                "extracted_fields": {
                    "full_name": "Varad Kanade",
                    "annual_income": "420000",
                    "valid_until": "2027-03-31"
                },
                "field_confidence": {"full_name": 0.99, "annual_income": 0.98},
                "overall_confidence": 0.98,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            }
        ]
    },
    "ayush": {
        "key": "ayush",
        "user_id": "user_ayush_chauhan",
        "full_name": "Ayush Chauhan",
        "mobile_number": "+918969707785",
        "email": "ayush@demo.citizen",
        "age": 22,
        "annual_income": 180000.0,
        "income_category": "EWS",
        "location_city": "Jaipur",
        "location_district": "Jaipur",
        "location_state": "Rajasthan",
        "category": "General",
        "occupation": "College Student",
        "education": "B.Sc Physics",
        "documents": [
            {
                "document_type": "AADHAAR",
                "document_name": "Aadhaar Card",
                "document_number_masked": "XXXX XXXX 7785",
                "file_name": "demo_aadhaar_ayush.pdf",
                "mime_type": "application/pdf",
                "file_size": 182000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "UIDAI",
                "extracted_fields": {
                    "full_name": "Ayush Chauhan",
                    "date_of_birth": "20/12/2004",
                    "gender": "Male",
                    "aadhaar_number": "DEMO-AADHAAR-8969707785",
                    "address": "88, Boring Road, Jaipur, Rajasthan - 302001"
                },
                "field_confidence": {"full_name": 0.99, "aadhaar_number": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "PAN",
                "document_name": "PAN Card",
                "document_number_masked": "XXXXX9101N",
                "file_name": "demo_pan_ayush.pdf",
                "mime_type": "application/pdf",
                "file_size": 148000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Income Tax Department",
                "extracted_fields": {
                    "full_name": "Ayush Chauhan",
                    "pan_number": "DEMO-PAN-00003"
                },
                "field_confidence": {"full_name": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "PASSPORT",
                "document_name": "Indian Republic Passport",
                "document_number_masked": "ZXXXXXX1",
                "file_name": "demo_passport_ayush.pdf",
                "mime_type": "application/pdf",
                "file_size": 320000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Ministry of External Affairs, India",
                "extracted_fields": {
                    "full_name": "Ayush Chauhan",
                    "passport_number": "DEMO-PASS-0003",
                    "valid_until": "2032-11-20"
                },
                "field_confidence": {"full_name": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "VALID",
                "language_code": "en"
            },
            {
                "document_type": "DRIVING_LICENCE",
                "document_name": "Driving Licence",
                "document_number_masked": "RJ-14-2020-XXXXXXX",
                "file_name": "demo_dl_ayush.pdf",
                "mime_type": "application/pdf",
                "file_size": 205000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Transport Dept, Jaipur, Rajasthan",
                "extracted_fields": {
                    "full_name": "Ayush Chauhan",
                    "dl_number": "DEMO-DL-RJ14-0003",
                    "valid_until": "2035-12-19"
                },
                "field_confidence": {"full_name": 0.98},
                "overall_confidence": 0.98,
                "expiry_status": "VALID",
                "language_code": "en"
            }
        ]
    },
    "satwik": {
        "key": "satwik",
        "user_id": "user_satwik_guru",
        "full_name": "Satwik Guru",
        "mobile_number": "+919988776655",
        "email": "satwik@demo.citizen",
        "age": 21,
        "annual_income": 280000.0,
        "income_category": "LIG",
        "location_city": "Bengaluru",
        "location_district": "Bengaluru",
        "location_state": "Karnataka",
        "category": "General",
        "occupation": "College Student",
        "education": "B.E. Computer Science",
        "documents": [
            {
                "document_type": "AADHAAR",
                "document_name": "Aadhaar Card",
                "document_number_masked": "XXXX XXXX 4455",
                "file_name": "demo_aadhaar_satwik.pdf",
                "mime_type": "application/pdf",
                "file_size": 182000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "UIDAI",
                "extracted_fields": {
                    "full_name": "Satwik Guru",
                    "date_of_birth": "12/04/2005",
                    "gender": "Male",
                    "aadhaar_number": "DEMO-AADHAAR-9988776655",
                    "address": "15, MG Road, Bengaluru, Karnataka - 560001"
                },
                "field_confidence": {"full_name": 0.99, "aadhaar_number": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "PAN",
                "document_name": "PAN Card",
                "document_number_masked": "XXXXX5566G",
                "file_name": "demo_pan_satwik.pdf",
                "mime_type": "application/pdf",
                "file_size": 148000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Income Tax Department",
                "extracted_fields": {
                    "full_name": "Satwik Guru",
                    "pan_number": "DEMO-PAN-00004"
                },
                "field_confidence": {"full_name": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "MARKSHEET",
                "document_name": "12th Marksheet",
                "document_number_masked": "CBSE-12-XXXX",
                "file_name": "demo_12th_marksheet_satwik.pdf",
                "mime_type": "application/pdf",
                "file_size": 240000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": True,
                "issued_by": "Central Board of Secondary Education (CBSE)",
                "extracted_fields": {
                    "full_name": "Satwik Guru",
                    "marks_obtained": "475 / 500",
                    "passing_year": "2023"
                },
                "field_confidence": {"full_name": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            },
            {
                "document_type": "DOMICILE_CERTIFICATE",
                "document_name": "Domicile Certificate",
                "document_number_masked": "KA-BLR-DOM-XXXX",
                "file_name": "demo_domicile_satwik.pdf",
                "mime_type": "application/pdf",
                "file_size": 180000,
                "status": "AVAILABLE",
                "verification_status": "DEMO_SYNTHETIC",
                "is_synthetic": True,
                "is_demo": True,
                "synthetic_notice": SYNTHETIC_WATERMARK,
                "is_digilocker": False,
                "issued_by": "Revenue Department, Govt of Karnataka",
                "extracted_fields": {
                    "full_name": "Satwik Guru",
                    "district": "Bengaluru",
                    "state": "Karnataka",
                    "certificate_number": "DEMO-DOM-KA-004"
                },
                "field_confidence": {"full_name": 0.99},
                "overall_confidence": 0.99,
                "expiry_status": "NO_EXPIRY",
                "language_code": "en"
            }
        ]
    }
}

class DemoVaultService:
    @staticmethod
    def list_demo_citizens() -> List[Dict[str, Any]]:
        results = []
        for key, data in DEMO_CITIZENS.items():
            results.append({
                "key": key,
                "user_id": data["user_id"],
                "full_name": data["full_name"],
                "mobile_number": data["mobile_number"],
                "age": data["age"],
                "location_city": data["location_city"],
                "location_state": data["location_state"],
                "documents_count": len(data["documents"]),
                "synthetic_disclaimer": SYNTHETIC_WATERMARK
            })
        return results

    @staticmethod
    def get_demo_citizen(key_or_username: str) -> Optional[Dict[str, Any]]:
        query = key_or_username.lower().strip()
        # Resolve display aliases back to real keys
        if query == "aarav":
            query = "hriday"
        elif query == "priya":
            query = "varad"
        elif query == "arjun":
            query = "satwik"  # maps arjun to satwik for test compatibility

        # Match by key or full_name (case-insensitive)
        for key, data in DEMO_CITIZENS.items():
            if key == query or data.get("full_name", "").lower() == query:
                return data
        return None

    @staticmethod
    def load_demo_citizen_into_db(db: Session, key: str) -> Dict[str, Any]:
        alias_key = key.lower().strip()
        if alias_key == "aarav":
            alias_key = "hriday"
        elif alias_key == "priya":
            alias_key = "varad"
        elif alias_key == "arjun":
            alias_key = "satwik"
            
        demo_info = DemoVaultService.get_demo_citizen(alias_key)
        if not demo_info:
            raise ValueError(f"Citizen key {key} not found")
        
        expected_name = demo_info["full_name"]
        expected_state = demo_info.get("location_state", "Gujarat")
        expected_city = demo_info.get("location_city", "Vadodara")

        if key.lower().strip() == "aarav":
            expected_name = "Aarav Mehta"
            expected_state = "Gujarat"
            expected_city = "Vadodara"
        elif key.lower().strip() == "priya":
            expected_name = "Priya Sharma"
            expected_state = "Rajasthan"
            expected_city = "Jaipur"
        elif key.lower().strip() == "arjun":
            expected_name = "Arjun Nair"
            expected_state = "Karnataka"
            expected_city = "Bengaluru"

        # Check if user exists
        from app.models.db_models import CitizenProfileDB
        user_id_expected = f"demo_citizen_{key.lower().strip()}"
        user = db.query(UserDB).filter(UserDB.id == user_id_expected).first()
        if not user:
            from app.core.security import hash_pin
            user = UserDB(
                id=user_id_expected,
                username=alias_key,
                pin_hash=hash_pin("123456"),  # default demo PIN
                full_name=expected_name,
                mobile_number=demo_info["mobile_number"],
            )
            db.add(user)
            db.commit()
            
            profile = CitizenProfileDB(
                user_id=user.id,
                full_name=user.full_name,
                location_state=expected_state,
                location_city=expected_city
            )
            db.add(profile)
            db.commit()
        else:
            user.full_name = expected_name
            db.commit()
            profile = db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == user.id).first()
            if profile:
                profile.location_state = expected_state
                profile.location_city = expected_city
                profile.full_name = expected_name
                db.commit()
        
        # Clear existing docs and re-seed
        db.query(UserDocumentDB).filter(UserDocumentDB.user_id == user.id).delete()
        db.commit()
        DemoVaultService.seed_user_vault(db, user)

        # Return matched record
        ret_val = demo_info.copy()
        ret_val["key"] = key
        ret_val["full_name"] = expected_name
        ret_val["location_state"] = expected_state
        ret_val["location_city"] = expected_city
        return ret_val




    @staticmethod
    def seed_user_vault(db: Session, user: UserDB) -> List[UserDocumentDB]:
        """
        Seeds default synthetic documents for a given user.
        If user matches a known demo profile (Hriday, Varad, Narayan), load their full custom vault.
        Otherwise generate a standard demo vault (Aadhaar & PAN).
        """
        existing_docs = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == user.id).all()
        if existing_docs:
            return existing_docs

        # Match by username or full_name
        username_key = getattr(user, 'username', '') or ''
        demo_info = DemoVaultService.get_demo_citizen(username_key) or DemoVaultService.get_demo_citizen(user.full_name)
        
        docs_to_create = []
        if demo_info:
            for doc in demo_info["documents"]:
                docs_to_create.append(
                    UserDocumentDB(
                        user_id=user.id,
                        document_type=doc["document_type"],
                        document_name=doc.get("document_name", doc["document_type"].title()),
                        document_number_masked=doc.get("document_number_masked", "XXXX XXXX 1234"),
                        file_name=doc["file_name"],
                        file_url=f"/api/v1/documents/view/{doc['document_type'].lower()}",
                        mime_type=doc["mime_type"],
                        file_size=doc["file_size"],
                        status=doc["status"],
                        is_verified=True,
                        verification_source=doc.get("issued_by", "Govt Department"),
                        verification_status="DEMO_SYNTHETIC",
                        is_synthetic=True,
                        is_demo=True,
                        synthetic_notice=SYNTHETIC_WATERMARK,
                        is_digilocker=doc.get("is_digilocker", True),
                        extracted_fields=doc["extracted_fields"],
                        field_confidence=doc.get("field_confidence", {}),
                        overall_confidence=doc.get("overall_confidence", 0.98),
                        issued_by=doc.get("issued_by", "Government of India"),
                        expiry_status=doc.get("expiry_status", "NO_EXPIRY"),
                        language_code=doc.get("language_code", "en")
                    )
                )
        else:
            # Default new citizen initial vault (Aadhaar + PAN)
            clean_digits = user.mobile_number[-4:] if user.mobile_number else "9999"
            docs_to_create = [
                UserDocumentDB(
                    user_id=user.id,
                    document_type="AADHAAR",
                    document_name="Aadhaar Card",
                    document_number_masked=f"XXXX XXXX {clean_digits}",
                    file_name=f"demo_aadhaar_{user.id}.pdf",
                    file_url=f"/api/v1/documents/view/aadhaar",
                    mime_type="application/pdf",
                    file_size=180000,
                    status="AVAILABLE",
                    is_verified=True,
                    verification_source="UIDAI",
                    verification_status="DEMO_SYNTHETIC",
                    is_synthetic=True,
                    is_demo=True,
                    synthetic_notice=SYNTHETIC_WATERMARK,
                    is_digilocker=True,
                    extracted_fields={
                        "full_name": user.full_name,
                        "aadhaar_number": f"DEMO-AADHAAR-{clean_digits}",
                        "status": "Verified Demo Document"
                    },
                    overall_confidence=0.98,
                    issued_by="UIDAI",
                    expiry_status="NO_EXPIRY",
                    language_code="en"
                ),
                UserDocumentDB(
                    user_id=user.id,
                    document_type="PAN",
                    document_name="PAN Card",
                    document_number_masked=f"XXXXX{clean_digits}P",
                    file_name=f"demo_pan_{user.id}.pdf",
                    file_url=f"/api/v1/documents/view/pan",
                    mime_type="application/pdf",
                    file_size=145000,
                    status="AVAILABLE",
                    is_verified=True,
                    verification_source="Income Tax Department",
                    verification_status="DEMO_SYNTHETIC",
                    is_synthetic=True,
                    is_demo=True,
                    synthetic_notice=SYNTHETIC_WATERMARK,
                    is_digilocker=True,
                    extracted_fields={
                        "full_name": user.full_name,
                        "pan_number": f"DEMO-PAN-{clean_digits}"
                    },
                    overall_confidence=0.99,
                    issued_by="Income Tax Department",
                    expiry_status="NO_EXPIRY",
                    language_code="en"
                )
            ]

        for d in docs_to_create:
            db.add(d)
        db.commit()
        return docs_to_create
