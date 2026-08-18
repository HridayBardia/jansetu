"""
Knowledge Base of Verified Indian Government Sources & Structured Knowledge Graph
"""

OFFICIAL_SOURCES = {
    "udyam_portal": {
        "id": "src_udyam_01",
        "title": "Udyam Registration Portal - Ministry of MSME",
        "authority": "Ministry of Micro, Small and Medium Enterprises, Govt of India",
        "url": "https://udyamregistration.gov.in",
        "published_at": "2024-01-10",
        "retrieved_at": "2026-08-01",
        "verification_status": "verified",
        "version": "2026.2",
        "excerpt": "Paperless, free-of-cost registration for Micro, Small and Medium Enterprises based on Aadhaar and PAN linkage."
    },
    "bbmp_trade": {
        "id": "src_bbmp_02",
        "title": "BBMP Trade Licence System - e-Governance Karnataka",
        "authority": "Bruhat Bengaluru Mahanagara Palike / Govt of Karnataka",
        "url": "https://bbmp.gov.in/tradelicense",
        "published_at": "2024-04-15",
        "retrieved_at": "2026-08-05",
        "verification_status": "verified",
        "version": "2026.1",
        "excerpt": "Mandatory license for operating commercial trades within Bengaluru city limits under KMC Act 1976."
    },
    "ka_labour_shop": {
        "id": "src_ka_labour_03",
        "title": "Karnataka Shops & Commercial Establishments Portal",
        "authority": "Department of Labour, Government of Karnataka",
        "url": "https://e-karmika.karnataka.gov.in",
        "published_at": "2024-02-20",
        "retrieved_at": "2026-08-02",
        "verification_status": "verified",
        "version": "2025.4",
        "excerpt": "Registration of shops, offices, and commercial establishments in Karnataka under Karnataka Shops Act 1961."
    },
    "gst_portal": {
        "id": "src_gst_04",
        "title": "Goods and Services Tax System India",
        "authority": "Central Board of Indirect Taxes and Customs (CBIC)",
        "url": "https://www.gst.gov.in",
        "published_at": "2024-05-01",
        "retrieved_at": "2026-08-10",
        "verification_status": "verified",
        "version": "2026.3",
        "excerpt": "GST registration required for businesses exceeding aggregate turnover threshold of ₹40 Lakhs (goods) or ₹20 Lakhs (services)."
    },
    "vidya_lakshmi": {
        "id": "src_vidya_05",
        "title": "Vidya Lakshmi Portal - NSDL e-Governance",
        "authority": "Ministry of Education & Indian Banks' Association (IBA)",
        "url": "https://www.vidyalakshmi.co.in",
        "published_at": "2024-03-12",
        "retrieved_at": "2026-08-08",
        "verification_status": "verified",
        "version": "2026.1",
        "excerpt": "Single window portal for students to apply for educational loans and government interest subvention schemes across banks."
    },
    "ssp_karnataka": {
        "id": "src_ssp_06",
        "title": "State Scholarship Portal (SSP) Karnataka",
        "authority": "Center for e-Governance, Govt of Karnataka",
        "url": "https://ssp.postmatric.karnataka.gov.in",
        "published_at": "2024-06-01",
        "retrieved_at": "2026-08-12",
        "verification_status": "verified",
        "version": "2026.2",
        "excerpt": "Direct Benefit Transfer (DBT) portal for post-matric scholarships for Karnataka state resident students."
    },
    "nadakacheri_ka": {
        "id": "src_nada_07",
        "title": "Nadakacheri AJSK Revenue Department Karnataka",
        "authority": "Revenue Department, Government of Karnataka",
        "url": "https://nadakacheri.karnataka.gov.in",
        "published_at": "2024-01-15",
        "retrieved_at": "2026-08-04",
        "verification_status": "verified",
        "version": "2026.1",
        "excerpt": "Issuance of verifiable digital Income, Caste, and Domicile certificates."
    }
}

BUSINESS_KARNATAKA_GRAPH = {
    "goal_id": "start_business_karnataka",
    "title": "Start a Small Business in Karnataka",
    "description": "Comprehensive step-by-step guided journey to legally register and launch a business in Bengaluru / Karnataka.",
    "steps": [
        {
            "id": "step_biz_1",
            "title": "Select Business Entity Structure",
            "description": "Decide between Sole Proprietorship, Partnership, LLP, or Private Limited based on liability and investment needs.",
            "department": "Ministry of Corporate Affairs / Self Declaration",
            "estimated_time": "15 mins",
            "dependencies": [],
            "required_documents": [
                {
                    "id": "doc_id_proof",
                    "name": "Identity Proof (Aadhaar / Voter ID / Passport)",
                    "description": "Used to verify owner identity and link Aadhaar OTP.",
                    "accepted_types": ["PDF", "JPG", "PNG"],
                    "is_mandatory": True,
                    "status": "available",
                    "source_id": "src_udyam_01"
                },
                {
                    "id": "doc_pan_card",
                    "name": "PAN Card (Personal / Entity)",
                    "description": "Required for tax identification and MSME verification.",
                    "accepted_types": ["PDF", "JPG"],
                    "is_mandatory": True,
                    "status": "available",
                    "source_id": "src_udyam_01"
                }
            ],
            "official_sources": ["src_udyam_01"],
            "action_type": "form_filling",
            "action_url": None,
            "consequential": False
        },
        {
            "id": "step_biz_2",
            "title": "Register for Udyam MSME Certificate",
            "description": "Obtain official Central Government MSME Udyam Registration number for subsidies, collateral-free loans, and priority sector status.",
            "department": "Ministry of MSME, Govt of India",
            "estimated_time": "30 mins",
            "dependencies": ["step_biz_1"],
            "required_documents": [
                {
                    "id": "doc_aadhaar_linked",
                    "name": "Aadhaar with Mobile Linkage",
                    "description": "Mobile number must be linked with Aadhaar for OTP verification.",
                    "accepted_types": ["DIGITAL_VERIFY"],
                    "is_mandatory": True,
                    "status": "available",
                    "source_id": "src_udyam_01"
                }
            ],
            "official_sources": ["src_udyam_01"],
            "action_type": "portal_visit",
            "action_url": "https://udyamregistration.gov.in",
            "consequential": True
        },
        {
            "id": "step_biz_3",
            "title": "Obtain Shop & Commercial Establishment Registration",
            "description": "Mandatory registration with Karnataka Labour Department within 30 days of commencing operations.",
            "department": "Department of Labour, Govt of Karnataka",
            "estimated_time": "1-2 days",
            "dependencies": ["step_biz_1", "step_biz_2"],
            "required_documents": [
                {
                    "id": "doc_address_proof",
                    "name": "Premises Address Proof (Rental Agreement / Electricity Bill)",
                    "description": "Proves the physical operating establishment address in Karnataka.",
                    "accepted_types": ["PDF", "JPG"],
                    "is_mandatory": True,
                    "status": "missing",
                    "source_id": "src_ka_labour_03"
                }
            ],
            "official_sources": ["src_ka_labour_03"],
            "action_type": "portal_visit",
            "action_url": "https://e-karmika.karnataka.gov.in",
            "consequential": True
        },
        {
            "id": "step_biz_4",
            "title": "Apply for BBMP Trade Licence",
            "description": "Required if business is operating inside Bengaluru urban municipality limits (BBMP).",
            "department": "BBMP, Govt of Karnataka",
            "estimated_time": "3-5 days",
            "dependencies": ["step_biz_3"],
            "required_documents": [
                {
                    "id": "doc_address_proof",
                    "name": "Premises Address Proof (Rental Agreement / Electricity Bill)",
                    "description": "Property Tax receipt or rental agreement.",
                    "accepted_types": ["PDF"],
                    "is_mandatory": True,
                    "status": "missing",
                    "source_id": "src_bbmp_02"
                },
                {
                    "id": "doc_noc",
                    "name": "Owner NOC / Property Tax Receipt",
                    "description": "NOC from building owner for commercial usage.",
                    "accepted_types": ["PDF"],
                    "is_mandatory": True,
                    "status": "missing",
                    "source_id": "src_bbmp_02"
                }
            ],
            "official_sources": ["src_bbmp_02"],
            "action_type": "portal_visit",
            "action_url": "https://bbmp.gov.in/tradelicense",
            "consequential": True
        },
        {
            "id": "step_biz_5",
            "title": "GST Registration (Goods & Services Tax)",
            "description": "Required if turnover exceeds threshold (₹40L/₹20L) or if conducting inter-state / e-commerce sales.",
            "department": "CBIC / Govt of Karnataka",
            "estimated_time": "3-7 days",
            "dependencies": ["step_biz_2", "step_biz_3"],
            "required_documents": [
                {
                    "id": "doc_pan_card",
                    "name": "PAN Card",
                    "description": "Entity PAN card.",
                    "accepted_types": ["PDF"],
                    "is_mandatory": True,
                    "status": "available",
                    "source_id": "src_gst_04"
                },
                {
                    "id": "doc_bank_cancelled_cheque",
                    "name": "Cancelled Cheque / Bank Statement",
                    "description": "Proof of bank account details.",
                    "accepted_types": ["PDF", "JPG"],
                    "is_mandatory": False,
                    "status": "needs_verification",
                    "source_id": "src_gst_04"
                }
            ],
            "official_sources": ["src_gst_04"],
            "action_type": "portal_visit",
            "action_url": "https://www.gst.gov.in",
            "consequential": True
        },
        {
            "id": "step_biz_6",
            "title": "Open Business Current Account & Apply for Karnataka MSME Schemes",
            "description": "Open bank account with Udyam + Shop Act certificate and apply for state capital investment subsidies.",
            "department": "Department of Commerce & Industries, Karnataka",
            "estimated_time": "1-2 days",
            "dependencies": ["step_biz_2", "step_biz_5"],
            "required_documents": [
                {
                    "id": "doc_udyam_cert",
                    "name": "Udyam Registration Certificate",
                    "description": "Generated from Step 2.",
                    "accepted_types": ["PDF"],
                    "is_mandatory": True,
                    "status": "missing",
                    "source_id": "src_udyam_01"
                }
            ],
            "official_sources": ["src_udyam_01", "src_ka_labour_03"],
            "action_type": "review",
            "action_url": None,
            "consequential": False
        }
    ]
}

EDUCATION_LOAN_GRAPH = {
    "goal_id": "education_loan_scholarship",
    "title": "Education Loan & Government Scholarship Journey",
    "description": "Step-by-step guidance to apply for subsidized student loans via Vidya Lakshmi and post-matric state scholarships in Karnataka.",
    "steps": [
        {
            "id": "step_edu_1",
            "title": "Gather Student & Academic Information",
            "description": "Collate entrance exam rank, course admission offer letter, fee structure split, and marks card.",
            "department": "Educational Institution / Student Context",
            "estimated_time": "10 mins",
            "dependencies": [],
            "required_documents": [
                {
                    "id": "doc_admission_letter",
                    "name": "College Admission / Allotment Letter",
                    "description": "Proof of merit seat or recognized institution enrolment.",
                    "accepted_types": ["PDF", "JPG"],
                    "is_mandatory": True,
                    "status": "available",
                    "source_id": "src_vidya_05"
                },
                {
                    "id": "doc_fee_structure",
                    "name": "Official Fee Structure Breakdown",
                    "description": "Issued by institute on official letterhead.",
                    "accepted_types": ["PDF"],
                    "is_mandatory": True,
                    "status": "available",
                    "source_id": "src_vidya_05"
                }
            ],
            "official_sources": ["src_vidya_05"],
            "action_type": "form_filling",
            "action_url": None,
            "consequential": False
        },
        {
            "id": "step_edu_2",
            "title": "Obtain Verified Income & Domicile Certificate",
            "description": "Fetch income certificate via Nadakacheri for fee concession and scholarship eligibility checks.",
            "department": "Revenue Department, Govt of Karnataka",
            "estimated_time": "1-3 days",
            "dependencies": ["step_edu_1"],
            "required_documents": [
                {
                    "id": "doc_income_cert",
                    "name": "State Revenue Income Certificate",
                    "description": "Annual household income document issued by Tehsildar.",
                    "accepted_types": ["PDF", "DIGITAL_VERIFY"],
                    "is_mandatory": True,
                    "status": "needs_verification",
                    "source_id": "src_nada_07"
                }
            ],
            "official_sources": ["src_nada_07"],
            "action_type": "portal_visit",
            "action_url": "https://nadakacheri.karnataka.gov.in",
            "consequential": True
        },
        {
            "id": "step_edu_3",
            "title": "Apply on Vidya Lakshmi Education Loan Portal",
            "description": "Common educational loan application form (CELAF) submitted directly to multiple nationalized banks.",
            "department": "Ministry of Education & NSDL",
            "estimated_time": "45 mins",
            "dependencies": ["step_edu_1", "step_edu_2"],
            "required_documents": [
                {
                    "id": "doc_admission_letter",
                    "name": "College Admission Letter",
                    "description": "Uploaded in CELAF application.",
                    "accepted_types": ["PDF"],
                    "is_mandatory": True,
                    "status": "available",
                    "source_id": "src_vidya_05"
                },
                {
                    "id": "doc_co_applicant_income",
                    "name": "Co-Applicant Income Proof / ITR",
                    "description": "Parent or guardian salary slip or 2 years ITR.",
                    "accepted_types": ["PDF"],
                    "is_mandatory": True,
                    "status": "missing",
                    "source_id": "src_vidya_05"
                }
            ],
            "official_sources": ["src_vidya_05"],
            "action_type": "portal_visit",
            "action_url": "https://www.vidyalakshmi.co.in",
            "consequential": True
        },
        {
            "id": "step_edu_4",
            "title": "Apply for Karnataka State Scholarship Portal (SSP)",
            "description": "Submit application for Post-Matric fee reimbursement and hostel maintenance allowance.",
            "department": "Center for e-Governance, Karnataka",
            "estimated_time": "30 mins",
            "dependencies": ["step_edu_2"],
            "required_documents": [
                {
                    "id": "doc_income_cert",
                    "name": "Income Certificate RD Number",
                    "description": "AJSK Nadakacheri reference number.",
                    "accepted_types": ["DIGITAL_VERIFY"],
                    "is_mandatory": True,
                    "status": "needs_verification",
                    "source_id": "src_ssp_06"
                },
                {
                    "id": "doc_aadhaar_seed",
                    "name": "Aadhaar Bank Seeding Status",
                    "description": "Bank account must be seeded with Aadhaar for DBT transfer.",
                    "accepted_types": ["DIGITAL_VERIFY"],
                    "is_mandatory": True,
                    "status": "available",
                    "source_id": "src_ssp_06"
                }
            ],
            "official_sources": ["src_ssp_06"],
            "action_type": "portal_visit",
            "action_url": "https://ssp.postmatric.karnataka.gov.in",
            "consequential": True
        },
        {
            "id": "step_edu_5",
            "title": "Track Loan Disbursement & Subsidy Subvention",
            "description": "Monitor sanction letter generation from bank and automatic credit of interest subvention under PM-Vidyalaxmi.",
            "department": "Partner Bank / Canara / SBI / Union Bank",
            "estimated_time": "7-14 days",
            "dependencies": ["step_edu_3", "step_edu_4"],
            "required_documents": [],
            "official_sources": ["src_vidya_05", "src_ssp_06"],
            "action_type": "review",
            "action_url": None,
            "consequential": False
        }
    ]
}
