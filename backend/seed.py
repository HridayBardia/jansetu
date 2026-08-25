# -*- coding: utf-8 -*-
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import logging
from datetime import datetime
from app.core.database import engine, Base, SessionLocal
from app.models.db_models import (
    UserDB, JourneyDB, JourneyStepDB, StepDependencyDB,
    GovernmentSourceDB, UserDocumentDB, UserConsentDB, SystemAlertDB, SchemeDB,
    WorkflowTemplateDB, WorkflowTemplateStepDB,
    ApplicationDB, NotificationDB, AuditLogDB, ConnectorHealthDB,
    ConsentRecordDB, DataConflictDB, CitizenProfileDB
)
from app.services.dependency_engine import DependencyEngine
from seed_interop import seed_interop_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

def seed_database(drop_tables: bool = False):
    logger.info("Initializing database schema...")
    if drop_tables:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        logger.info("Seeding Initial Demonstration Users (Hriday, Varad, Ayuh, Satwik, Dishita, Jyoti)...")
        from app.services.demo_vault_service import DemoVaultService, DEMO_CITIZENS
        from app.models.db_models import CitizenProfileDB

        from app.core.security import hash_pin

        for key, info in DEMO_CITIZENS.items():
            existing = db.query(UserDB).filter(UserDB.id == info["user_id"]).first()
            if existing:
                existing.pin_hash = hash_pin("123456")
                existing.role = info.get("role", "citizen")
                db.commit()
                # Seed vault if empty
                DemoVaultService.seed_user_vault(db, existing)
                continue

            user = UserDB(
                id=info["user_id"],
                username=key,
                pin_hash=hash_pin("123456"),
                full_name=info["full_name"],
                mobile_number=info.get("mobile_number"),
                email=info.get("email"),
                role=info.get("role", "citizen")
            )
            db.add(user)
            db.commit()

            profile = CitizenProfileDB(
                user_id=user.id,
                full_name=info["full_name"],
                age=info.get("age"),
                annual_income=info.get("annual_income"),
                income_category=info.get("income_category"),
                location_state=info.get("location_state"),
                location_district=info.get("location_district"),
                location_city=info.get("location_city"),
                occupation=info.get("occupation"),
                education=info.get("education"),
                category=info.get("category", "General"),
                is_demo=True,
                demo_citizen_key=key
            )
            db.add(profile)
            db.commit()

            # Seed user vault
            DemoVaultService.seed_user_vault(db, user)


        logger.info("Seeding Government Sources...")
        sources = [
            GovernmentSourceDB(
                id="src_karmika",
                title="Karnataka Shop & Commercial Establishments Act (e-Karmika)",
                department="Department of Labour, Government of Karnataka",
                state="Karnataka",
                source_type="portal",
                url="https://emunsipal.kar.nic.in",
                summary="Mandatory registration portal for all shops, commercial offices, and establishments operating within Karnataka state jurisdiction.",
                freshness_status="VERIFIED"
            ),
            GovernmentSourceDB(
                id="src_udyam",
                title="Udyam MSME Registration Portal",
                department="Ministry of Micro, Small and Medium Enterprises, Govt of India",
                state="India",
                source_type="portal",
                url="https://udyamregistration.gov.in",
                summary="Official paperless portal for MSME classification, priority sector lending, and central subsidy schemes.",
                freshness_status="VERIFIED"
            ),
            GovernmentSourceDB(
                id="src_gst",
                title="Commercial Taxes Department - GST Portal",
                department="Department of Commercial Taxes, Karnataka",
                state="Karnataka",
                source_type="portal",
                url="https://gst.kar.nic.in",
                summary="GSTIN registration, e-way bill generation, and state GST tax filing for businesses with turnover > ₹20 Lakhs.",
                freshness_status="VERIFIED"
            ),
            GovernmentSourceDB(
                id="src_vidya_lakshmi",
                title="Vidya Lakshmi National Education Loan Portal",
                department="Ministry of Education & Indian Banks Association (IBA)",
                state="India",
                source_type="portal",
                url="https://www.vidyalakshmi.co.in",
                summary="Single window platform for students seeking education loans and central interest subsidies.",
                freshness_status="VERIFIED"
            ),
            GovernmentSourceDB(
                id="src_ssp_kar",
                title="State Scholarship Portal (SSP) Karnataka",
                department="Department of Social Welfare, Govt of Karnataka",
                state="Karnataka",
                source_type="portal",
                url="https://ssp.postmatric.karnataka.gov.in",
                summary="Post-matric scholarships, fee reimbursement, and financial aid for students residing in Karnataka.",
                freshness_status="VERIFIED"
            )
        ]
        for src in sources:
            db.add(src)
        db.commit()

        logger.info("Seeding Primary Journey: Start a Small Business in Vadodara, Gujarat...")
        biz_gj_journey = JourneyDB(
            id="journey_biz_vadodara_1",
            user_id="user_hriday_bardia",
            title="Start a Small Business in Vadodara",
            goal_category="business",
            life_event="business_formation",
            state="IN_PROGRESS",
            location_state="Gujarat",
            location_district="Vadodara",
            location_city="Vadodara",
            context_data={
                "business_structure": "Sole Proprietorship",
                "business_type": "Retail & E-commerce",
                "has_premises": "Yes - Rented Commercial Space in Vadodara"
            },
            progress_percentage=75
        )
        db.add(biz_gj_journey)
        db.commit()

        gj_biz_steps = [
            JourneyStepDB(
                id="step_gj_biz_1",
                journey_id="journey_biz_vadodara_1",
                step_key="business_structure",
                title="Select Business Entity & Legal Structure",
                description="Finalize sole proprietorship structure using proprietor Aadhaar & PAN.",
                category="legal",
                state="COMPLETED",
                priority="high",
                estimated_effort="10 min",
                official_portal_url="https://gujarat.gov.in",
                order_index=1
            ),
            JourneyStepDB(
                id="step_gj_biz_2",
                journey_id="journey_biz_vadodara_1",
                step_key="premises_proof",
                title="Obtain Vadodara Commercial Premises Agreement",
                description="Obtain commercial rent agreement or NOC in Vadodara with recent electricity bill.",
                category="documentation",
                state="COMPLETED",
                priority="high",
                estimated_effort="30 min",
                official_portal_url="https://vmc.gov.in",
                order_index=2
            ),
            JourneyStepDB(
                id="step_gj_biz_3",
                journey_id="journey_biz_vadodara_1",
                step_key="shop_establishment",
                title="Register under Gujarat Shop & Establishment Act (Vadodara VMC)",
                description="Submit Shop & Establishment registration on Vadodara Mahanagar Seva Sadan (VMC) portal.",
                category="license",
                state="AVAILABLE",
                priority="high",
                estimated_effort="35 min",
                official_portal_url="https://vmc.gov.in",
                order_index=3
            ),
            JourneyStepDB(
                id="step_gj_biz_4",
                journey_id="journey_biz_vadodara_1",
                step_key="udyam_msme",
                title="Apply for Udyam MSME Registration (Gujarat)",
                description="Instant free central registration linking Aadhaar and PAN for Gujarat MSME Capital Subsidy.",
                category="registration",
                state="AVAILABLE",
                priority="medium",
                estimated_effort="20 min",
                official_portal_url="https://udyamregistration.gov.in",
                order_index=4
            )
        ]
        for step in gj_biz_steps:
            db.add(step)
        db.commit()

        gj_biz_deps = [
            StepDependencyDB(journey_id="journey_biz_vadodara_1", step_key="premises_proof", prerequisite_step_key="business_structure", reason="Entity needed"),
            StepDependencyDB(journey_id="journey_biz_vadodara_1", step_key="shop_establishment", prerequisite_step_key="premises_proof", reason="Address proof needed for VMC"),
            StepDependencyDB(journey_id="journey_biz_vadodara_1", step_key="udyam_msme", prerequisite_step_key="business_structure", reason="Aadhaar required")
        ]
        for dep in gj_biz_deps:
            db.add(dep)
        db.commit()

        logger.info("Seeding Gujarat Education Journey: MYSY Scholarship...")
        edu_gj_journey = JourneyDB(
            id="journey_edu_gujarat_1",
            user_id="user_hriday_bardia",
            title="Gujarat MYSY Higher Education Scholarship",
            goal_category="education",
            life_event="higher_education_funding",
            state="IN_PROGRESS",
            location_state="Gujarat",
            location_district="Vadodara",
            location_city="Vadodara",
            context_data={
                "education_level": "Undergraduate Degree",
                "annual_family_income": "Under ₹6.0 Lakhs",
                "category": "General"
            },
            progress_percentage=40
        )
        db.add(edu_gj_journey)
        db.commit()

        gj_edu_steps = [
            JourneyStepDB(
                id="step_gj_edu_1",
                journey_id="journey_edu_gujarat_1",
                step_key="eligibility_check",
                title="Verify Gujarat College Admission & Income Certificate",
                description="Verify 80+ percentile in 12th Board and family income under ₹6 Lakhs for MYSY.",
                category="verification",
                state="COMPLETED",
                priority="high",
                estimated_effort="10 min",
                official_portal_url="https://mysy.guj.nic.in",
                order_index=1
            ),
            JourneyStepDB(
                id="step_gj_edu_2",
                journey_id="journey_edu_gujarat_1",
                step_key="document_prep",
                title="Prepare Income Certificate & Academic Transcripts",
                description="Obtain official Income Certificate from Mamlatdar/Tahsildar in Vadodara.",
                category="documentation",
                state="AVAILABLE",
                priority="high",
                estimated_effort="20 min",
                official_portal_url="https://digitalgujarat.gov.in",
                order_index=2
            )
        ]
        for step in gj_edu_steps:
            db.add(step)
        db.commit()

        logger.info("Seeding Secondary Journey: Start a Small Business in Karnataka...")
        biz_journey = JourneyDB(
            id="journey_biz_karnataka_1",
            user_id="user_hriday_bardia",
            title="Start a Small Business in Karnataka",
            goal_category="business",
            life_event="business_formation",
            state="IN_PROGRESS",
            location_state="Karnataka",
            location_city="Bengaluru",
            context_data={
                "business_structure": "Sole Proprietorship",
                "business_type": "Retail & E-commerce",
                "has_premises": "Yes - Rented Commercial Space"
            },
            progress_percentage=16
        )
        db.add(biz_journey)
        db.commit()

        biz_steps = [
            JourneyStepDB(
                id="step_biz_1",
                journey_id="journey_biz_karnataka_1",
                step_key="business_structure",
                title="Select Legal Structure (Sole Proprietorship)",
                description="Decide entity type. For sole proprietorships, no separate ROC registration is required—identity proof and PAN of proprietor are sufficient.",
                category="legal",
                state="COMPLETED",
                priority="high",
                estimated_effort="10 min",
                official_portal_url="https://karnataka.gov.in",
                order_index=1
            ),
            JourneyStepDB(
                id="step_biz_2",
                journey_id="journey_biz_karnataka_1",
                step_key="premises_proof",
                title="Obtain Business Premises Proof",
                description="Execute commercial lease/rent agreement or obtain NOC from property owner along with recent utility bill.",
                category="documentation",
                state="AVAILABLE",
                priority="high",
                estimated_effort="30 min",
                official_portal_url="https://kaverionline.karnataka.gov.in",
                order_index=2
            ),
            JourneyStepDB(
                id="step_biz_3",
                journey_id="journey_biz_karnataka_1",
                step_key="shop_establishment",
                title="Register under Karnataka Shop & Establishment Act",
                description="Submit e-Karmika registration on Karnataka portal within 30 days of commencing operations.",
                category="license",
                state="LOCKED",
                priority="high",
                estimated_effort="45 min",
                official_portal_url="https://emunsipal.kar.nic.in",
                order_index=3
            ),
            JourneyStepDB(
                id="step_biz_4",
                journey_id="journey_biz_karnataka_1",
                step_key="udyam_msme",
                title="Apply for Udyam MSME Registration",
                description="Instant free central registration linking Aadhaar and PAN to claim MSME credit guarantees and subsidies.",
                category="registration",
                state="LOCKED",
                priority="medium",
                estimated_effort="20 min",
                official_portal_url="https://udyamregistration.gov.in",
                order_index=4
            ),
            JourneyStepDB(
                id="step_biz_5",
                journey_id="journey_biz_karnataka_1",
                step_key="gst_registration",
                title="Apply for GSTIN Tax Registration",
                description="Register with Karnataka Commercial Taxes department for interstate sales or turnover exceeding ₹20 Lakhs.",
                category="taxation",
                state="LOCKED",
                priority="medium",
                estimated_effort="45 min",
                official_portal_url="https://gst.kar.nic.in",
                order_index=5
            ),
            JourneyStepDB(
                id="step_biz_6",
                journey_id="journey_biz_karnataka_1",
                step_key="current_bank_account",
                title="Open Commercial Current Bank Account",
                description="Visit bank with Shop & Establishment Certificate, Udyam certificate, PAN, and identity proof to activate current account.",
                category="banking",
                state="LOCKED",
                priority="high",
                estimated_effort="60 min",
                official_portal_url="https://rbi.org.in",
                order_index=6
            )
        ]
        for step in biz_steps:
            db.add(step)
        db.commit()

        biz_deps = [
            StepDependencyDB(journey_id="journey_biz_karnataka_1", step_key="premises_proof", prerequisite_step_key="business_structure", reason="Entity type needed for agreement"),
            StepDependencyDB(journey_id="journey_biz_karnataka_1", step_key="shop_establishment", prerequisite_step_key="premises_proof", reason="Premises address proof required"),
            StepDependencyDB(journey_id="journey_biz_karnataka_1", step_key="udyam_msme", prerequisite_step_key="business_structure", reason="Aadhaar/PAN required"),
            StepDependencyDB(journey_id="journey_biz_karnataka_1", step_key="gst_registration", prerequisite_step_key="shop_establishment", reason="Shop license needed for GST premises proof"),
            StepDependencyDB(journey_id="journey_biz_karnataka_1", step_key="current_bank_account", prerequisite_step_key="shop_establishment", reason="Bank requires shop registration proof")
        ]
        for dep in biz_deps:
            db.add(dep)
        db.commit()

        logger.info("Seeding Secondary Journey: Higher Education Loan & Scholarship...")
        edu_journey = JourneyDB(
            id="journey_edu_karnataka_1",
            user_id="user_hriday_bardia",
            title="Higher Education Loan & Government Scholarship",
            goal_category="education",
            life_event="higher_education_funding",
            state="IN_PROGRESS",
            location_state="Karnataka",
            location_city="Bengaluru",
            context_data={
                "education_level": "Undergraduate Degree (B.Tech)",
                "annual_family_income": "Under ₹2.5 Lakhs",
                "category": "General"
            },
            progress_percentage=25
        )
        db.add(edu_journey)
        db.commit()

        edu_steps = [
            JourneyStepDB(
                id="step_edu_1",
                journey_id="journey_edu_karnataka_1",
                step_key="eligibility_check",
                title="Verify College Admission & Income Eligibility",
                description="Confirm seat allotment under recognized university and obtain official fee structure certificate.",
                category="verification",
                state="COMPLETED",
                priority="high",
                estimated_effort="10 min",
                official_portal_url="https://kea.kar.nic.in",
                order_index=1
            ),
            JourneyStepDB(
                id="step_edu_2",
                journey_id="journey_edu_karnataka_1",
                step_key="document_prep",
                title="Prepare Academic Records & Income Certificate",
                description="Fetch 10th/12th marksheet from DigiLocker and income certificate from Nadakacheri portal.",
                category="documentation",
                state="AVAILABLE",
                priority="high",
                estimated_effort="25 min",
                official_portal_url="https://nadakacheri.karnataka.gov.in",
                order_index=2
            ),
            JourneyStepDB(
                id="step_edu_3",
                journey_id="journey_edu_karnataka_1",
                step_key="vidya_lakshmi",
                title="Apply on Vidya Lakshmi National Portal",
                description="Submit common loan application form across multiple nationalized banks with single application.",
                category="application",
                state="LOCKED",
                priority="high",
                estimated_effort="40 min",
                official_portal_url="https://www.vidyalakshmi.co.in",
                order_index=3
            ),
            JourneyStepDB(
                id="step_edu_4",
                journey_id="journey_edu_karnataka_1",
                step_key="state_scholarship",
                title="Apply for Karnataka Post-Matric State Subsidy (SSP)",
                description="Submit SSP Karnataka application for fee reimbursement and hostel maintenance allowance.",
                category="scholarship",
                state="LOCKED",
                priority="medium",
                estimated_effort="30 min",
                official_portal_url="https://ssp.postmatric.karnataka.gov.in",
                order_index=4
            )
        ]
        for step in edu_steps:
            db.add(step)
        db.commit()

        edu_deps = [
            StepDependencyDB(journey_id="journey_edu_karnataka_1", step_key="document_prep", prerequisite_step_key="eligibility_check", reason="College admission proof required"),
            StepDependencyDB(journey_id="journey_edu_karnataka_1", step_key="vidya_lakshmi", prerequisite_step_key="document_prep", reason="All academic and income documents must be ready"),
            StepDependencyDB(journey_id="journey_edu_karnataka_1", step_key="state_scholarship", prerequisite_step_key="document_prep", reason="Income certificate required for fee waiver")
        ]
        for dep in edu_deps:
            db.add(dep)
        db.commit()

        logger.info("Seeding Documents, Consents, and System Alerts...")
        docs = [
            UserDocumentDB(
                user_id="user_hriday_bardia",
                journey_id="journey_biz_karnataka_1",
                document_type="Aadhaar Card",
                file_name="aadhaar_verified_digilocker.pdf",
                file_size=245000,
                mime_type="application/pdf",
                status="VERIFIED",
                is_digilocker=True
            ),
            UserDocumentDB(
                user_id="user_hriday_bardia",
                journey_id="journey_biz_karnataka_1",
                document_type="PAN Card",
                file_name="pan_card_verified.pdf",
                file_size=180000,
                mime_type="application/pdf",
                status="VERIFIED",
                is_digilocker=True
            )
        ]
        for d in docs:
            db.add(d)
        db.commit()

        alerts = [
            SystemAlertDB(
                title="Karnataka e-Karmika Single Window Portal Simplification",
                category="regulatory_update",
                priority="high",
                effective_date="February 2026",
                impact_summary="Renewal of Shop & Establishment licenses in Karnataka is now automated for establishments with under 10 employees.",
                action_required="Check Step 3 in your active business journey.",
                source_url="https://emunsipal.kar.nic.in",
                journey_category="business"
            ),
            SystemAlertDB(
                title="Vidya Lakshmi Portal Interest Subsidy Enhanced",
                category="scholarship_scheme",
                priority="medium",
                effective_date="Immediate",
                impact_summary="Central Sector Interest Subsidy (CSIS) covers 100% interest during moratorium period for students with family income under ₹4.5 Lakhs.",
                action_required="Ensure Income Certificate is uploaded in Education Journey.",
                source_url="https://www.vidyalakshmi.co.in",
                journey_category="education"
            )
        ]
        for a in alerts:
            db.add(a)
        db.commit()

        # =====================================================================
        # SEEDING WORKFLOW TEMPLATES
        # =====================================================================
        logger.info("Seeding Workflow Templates...")
        
        # Business Workflow Template
        biz_template = WorkflowTemplateDB(
            id="wt_business",
            name="Default Business Workflow",
            category="business",
            department="Cross-Departmental"
        )
        db.add(biz_template)
        
        biz_template_steps = [
            WorkflowTemplateStepDB(
                template_id="wt_business",
                step_key="business_structure",
                name="Select Business Entity & Legal Structure",
                step_type="Validation",
                target="Portal Selection",
                order_index=1
            ),
            WorkflowTemplateStepDB(
                template_id="wt_business",
                step_key="premises_proof",
                name="Obtain Business Premises Proof",
                step_type="Validation",
                target="Revenue Dept API",
                prerequisite_step_key="business_structure",
                order_index=2
            ),
            WorkflowTemplateStepDB(
                template_id="wt_business",
                step_key="shop_establishment",
                name="Register under Shop & Establishment Act",
                step_type="Action",
                target="Labour Dept Portal",
                prerequisite_step_key="premises_proof",
                order_index=3
            ),
            WorkflowTemplateStepDB(
                template_id="wt_business",
                step_key="udyam_msme",
                name="Apply for Udyam MSME Registration",
                step_type="Action",
                target="MSME Udyam API",
                prerequisite_step_key="business_structure",
                order_index=4
            )
        ]
        for step in biz_template_steps:
            db.add(step)
            
        # Education Workflow Template
        edu_template = WorkflowTemplateDB(
            id="wt_education",
            name="Default Education Workflow",
            category="education",
            department="Cross-Departmental"
        )
        db.add(edu_template)
        
        edu_template_steps = [
            WorkflowTemplateStepDB(
                template_id="wt_education",
                step_key="eligibility_check",
                name="Verify College Admission & Income Eligibility",
                step_type="Validation",
                target="Education Dept API",
                order_index=1
            ),
            WorkflowTemplateStepDB(
                template_id="wt_education",
                step_key="document_prep",
                name="Prepare Academic Records & Income Certificate",
                step_type="Ingestion",
                target="DigiLocker API",
                prerequisite_step_key="eligibility_check",
                order_index=2
            ),
            WorkflowTemplateStepDB(
                template_id="wt_education",
                step_key="vidya_lakshmi",
                name="Apply on Vidya Lakshmi National Portal",
                step_type="Action",
                target="Vidya Lakshmi API",
                prerequisite_step_key="document_prep",
                order_index=3
            )
        ]
        for step in edu_template_steps:
            db.add(step)
            
        db.commit()

        # =====================================================================
        # SEEDING REAL GOVERNMENT SCHEMES
        # All schemes are real, active government programs with official sources
        # =====================================================================
        logger.info("Seeding Real Government Schemes (Central + State)...")

        now = datetime.utcnow()

        schemes_data = [
            # ----------------------------------------------------------------
            # CENTRAL GOVERNMENT SCHEMES — BUSINESS / MSME
            # ----------------------------------------------------------------
            SchemeDB(
                id="scheme_pmegpe_central",
                name="PMEGPE — Prime Minister's Employment Generation Programme",
                official_name="Prime Minister's Employment Generation Programme",
                description="Central government credit-linked subsidy scheme for setting up new micro-enterprises in the non-farm sector. Provides up to 25% (general) or 35% (special category) margin money subsidy on project cost up to ₹50 lakhs for manufacturing.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Ministry of Micro, Small & Medium Enterprises (MSME)",
                category="business",
                benefits={"subsidy_general": "25% of project cost", "subsidy_special_category": "35% of project cost", "max_project_cost_manufacturing": "₹50 lakhs", "max_project_cost_service": "₹20 lakhs"},
                eligibility_rules={"age_min": 18, "education": "8th standard pass for projects above ₹10 lakh"},
                documents_required=[{"type": "AADHAAR"}, {"type": "PAN"}, {"type": "INCOME_CERTIFICATE"}],
                application_process="Apply online at https://www.kviconline.gov.in/pmegpeportal/ via KVIC or State DIC offices.",
                application_url="https://www.kviconline.gov.in/pmegpeportal/",
                official_source_url="https://msme.gov.in/prime-ministers-employment-generation-programme-pmegpe",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_udyam_central",
                name="Udyam Registration — MSME Recognition",
                official_name="Udyam Registration (MSME Registration)",
                description="Free online paperless registration for Micro, Small and Medium Enterprises. Unlocks benefits including priority sector lending, credit guarantee, government tender preferences, delayed payment protection, and various state/central subsidies.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Ministry of Micro, Small & Medium Enterprises (MSME)",
                category="business",
                benefits={"registration_fee": "Free", "credit_guarantee": "Up to ₹5 crore without collateral via CGTSME", "govt_tender_preference": "Yes", "delayed_payment_protection": "Yes — 45 days maximum credit period"},
                eligibility_rules={},
                documents_required=[{"type": "AADHAAR"}, {"type": "PAN"}],
                application_process="Self-declare registration on Udyam portal using Aadhaar OTP. No documents need to be uploaded.",
                application_url="https://udyamregistration.gov.in",
                official_source_url="https://udyamregistration.gov.in",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_startup_india_central",
                name="Startup India — Tax and Regulatory Benefits",
                official_name="Startup India Scheme",
                description="Government of India initiative to build a strong ecosystem for nurturing innovation. Provides 3-year income tax exemption, self-certification for labour and environment laws, and fast-track patent examination for DPIIT-recognized startups.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Department for Promotion of Industry and Internal Trade (DPIIT)",
                category="business",
                benefits={"income_tax_exemption": "3 years in first 10 years", "patent_fast_track": "Yes", "self_certification": "9 labour and 3 environment laws", "fund_of_funds": "₹10,000 crore corpus"},
                eligibility_rules={"business_age_max_years": 10, "annual_turnover_max_crore": 100},
                documents_required=[{"type": "INCORPORATION_CERTIFICATE"}, {"type": "PAN"}],
                application_process="Apply for DPIIT recognition on the Startup India portal.",
                application_url="https://www.startupindia.gov.in",
                official_source_url="https://www.startupindia.gov.in/content/sih/en/startupgov/about.html",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_pm_svanidhi_central",
                name="PM SVANidhi — Street Vendor Loan Scheme",
                official_name="PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
                description="Micro-credit facility for street vendors to resume livelihoods after COVID-19. Offers collateral-free working capital loans of ₹10,000 (initial), ₹20,000 (second), and ₹50,000 (third) with interest subsidy.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Ministry of Housing and Urban Affairs",
                category="business",
                benefits={"first_loan": "₹10,000", "second_loan": "₹20,000", "third_loan": "₹50,000", "interest_subsidy": "7% p.a. via DBT", "digital_incentives": "Up to ₹1,200 per year for digital transactions"},
                eligibility_rules={"occupation": "Street vendor"},
                documents_required=[{"type": "AADHAAR"}, {"type": "VENDING_CERTIFICATE"}],
                application_process="Apply through urban local body or lending institution. Registered vendors get priority.",
                application_url="https://pmsvanidhi.mohua.gov.in",
                official_source_url="https://pmsvanidhi.mohua.gov.in",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            # ----------------------------------------------------------------
            # CENTRAL GOVERNMENT SCHEMES — EDUCATION / STUDY ABROAD
            # ----------------------------------------------------------------
            SchemeDB(
                id="scheme_national_overseas_central",
                name="National Overseas Scholarship (NOS)",
                official_name="National Overseas Scholarship for SC, ST, Denotified Tribes, etc.",
                description="Government of India scholarship for SC, ST, and Denotified Tribe students to pursue Master's degree, Ph.D, or Post-doctoral research abroad. Covers tuition fee, living expenses, and other allowances.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Ministry of Social Justice & Empowerment",
                category="education",
                benefits={"tuition_fee": "Full tuition fee reimbursement", "living_allowance": "USD 1,190–1,775/month depending on country", "contingency_allowance": "USD 3,600/year", "number_of_scholarships": "115 per year"},
                eligibility_rules={"course": "study_abroad", "annual_family_income_max": 800000, "age_max": 35, "category_required": "SC/ST/Denotified Tribes/Nomadic Tribes"},
                documents_required=[{"type": "AADHAAR"}, {"type": "PASSPORT"}, {"type": "CASTE_CERTIFICATE"}, {"type": "INCOME_CERTIFICATE"}, {"type": "UNIVERSITY_OFFER_LETTER"}],
                application_process="Apply on the NSP portal (scholarships.gov.in) when the annual notification is published.",
                application_url="https://nosmsje.gov.in",
                official_source_url="https://nosmsje.gov.in",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_pm_vidyalaxmi_central",
                name="PM Vidyalaxmi — Education Loan & Interest Subvention",
                official_name="PM Vidyalaxmi — Education Loan Interest Subvention for Domestic Higher Education",
                description="Full interest subvention during moratorium period (course duration + 1 year) for education loans up to ₹10 lakhs for students admitted to top QS/NIRF-ranked institutions. 75% credit guarantee to banks.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Ministry of Education",
                category="education",
                benefits={"full_interest_subvention": "During moratorium period", "loan_limit": "₹10 lakhs", "credit_guarantee": "75% to lending bank", "income_limit_for_full_benefit": "₹8 lakh annual family income"},
                eligibility_rules={"annual_family_income_max": 800000},
                documents_required=[{"type": "AADHAAR"}, {"type": "INCOME_CERTIFICATE"}, {"type": "ADMISSION_LETTER"}],
                application_process="Apply through the PM Vidyalaxmi portal after getting admission to an eligible institution.",
                application_url="https://www.vidyalakshmi.co.in",
                official_source_url="https://www.vidyalakshmi.co.in/Students/",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_iccr_study_abroad_central",
                name="ICCR Scholarship for International Education",
                official_name="Indian Council for Cultural Relations (ICCR) Scholarship",
                description="ICCR offers scholarships to foreign nationals to study in India and also supports Indian students in select international academic exchange programs.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Indian Council for Cultural Relations (ICCR)",
                category="education",
                benefits={"scholarship_type": "Academic exchange and international study programs"},
                eligibility_rules={"course": "study_abroad"},
                documents_required=[{"type": "AADHAAR"}, {"type": "PASSPORT"}, {"type": "12TH_MARKSHEET"}],
                application_process="Apply via ICCR e-scholarships portal.",
                application_url="https://a2ascholarships.iccr.gov.in",
                official_source_url="https://www.iccr.gov.in/scholarships",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_mhrd_scholarship_central",
                name="NSP — National Scholarship Portal Schemes",
                official_name="National Scholarship Portal (NSP) Centralized Scholarships",
                description="Single-window platform for Central Government scholarship schemes including post-matric scholarships for SC/ST/OBC/minority students, Central Sector Scholarship of Excellence (merit-based), and various Ministry scholarships.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Ministry of Education / National Scholarship Portal",
                category="education",
                benefits={"scholarship_amount": "₹10,000–₹20,000 per year depending on scheme and level", "coverage": "Tuition fee, maintenance allowance"},
                eligibility_rules={},
                documents_required=[{"type": "AADHAAR"}, {"type": "BANK_PROOF"}, {"type": "INCOME_CERTIFICATE"}, {"type": "12TH_MARKSHEET"}],
                application_process="Apply on scholarships.gov.in during application window (usually September to November).",
                application_url="https://scholarships.gov.in",
                official_source_url="https://scholarships.gov.in",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            # ----------------------------------------------------------------
            # CENTRAL GOVERNMENT SCHEMES — AGRICULTURE
            # ----------------------------------------------------------------
            SchemeDB(
                id="scheme_pmkisan_central",
                name="PM-KISAN — Direct Income Support for Farmers",
                official_name="Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
                description="Central government scheme providing ₹6,000 per year in three equal instalments of ₹2,000 directly to eligible farmer families' bank accounts as income support.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Ministry of Agriculture & Farmers Welfare",
                category="agriculture",
                benefits={"amount": "₹6,000 per year (₹2,000 per instalment, 3 instalments)", "payment_mode": "Direct Bank Transfer"},
                eligibility_rules={"occupation": "farmer"},
                documents_required=[{"type": "AADHAAR"}, {"type": "LAND_RECORD"}, {"type": "BANK_PROOF"}],
                application_process="Register on PM-KISAN portal (pmkisan.gov.in) or through Common Service Centre (CSC).",
                application_url="https://pmkisan.gov.in",
                official_source_url="https://pmkisan.gov.in",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_pmfby_central",
                name="PMFBY — Pradhan Mantri Fasal Bima Yojana",
                official_name="Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                description="Comprehensive crop insurance scheme providing financial support to farmers suffering crop loss/damage due to unforeseen events like natural calamities, pests, and diseases.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Ministry of Agriculture & Farmers Welfare",
                category="agriculture",
                benefits={"premium_rate": "2% for Kharif, 1.5% for Rabi, 5% for commercial crops (rest paid by govt)", "coverage": "Full insured sum for crop failure"},
                eligibility_rules={"occupation": "farmer"},
                documents_required=[{"type": "AADHAAR"}, {"type": "LAND_RECORD"}, {"type": "BANK_PROOF"}],
                application_process="Apply through bank branches, Common Service Centres, or Krishi Bima app before cut-off dates.",
                application_url="https://pmfby.gov.in",
                official_source_url="https://pmfby.gov.in",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_kcc_central",
                name="KCC — Kisan Credit Card Scheme",
                official_name="Kisan Credit Card (KCC) Scheme",
                description="Provides flexible and simplified credit to farmers for crop cultivation, post-harvest needs, allied activities, and personal consumption. Features interest subvention of 2% (and additional 3% for prompt repayment), making effective rate as low as 4% per annum.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Ministry of Agriculture & Farmers Welfare / NABARD",
                category="agriculture",
                benefits={"interest_rate": "4% effective with prompt repayment (7% - 2% subvention - 3% incentive)", "credit_limit": "Based on land holding and crop value"},
                eligibility_rules={"occupation": "farmer"},
                documents_required=[{"type": "AADHAAR"}, {"type": "LAND_RECORD"}, {"type": "PAN"}],
                application_process="Apply at any bank branch or PM-KISAN portal.",
                application_url="https://pmkisan.gov.in",
                official_source_url="https://www.nabard.org/content.aspx?id=481",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            # ----------------------------------------------------------------
            # CENTRAL — DOCUMENTS / LICENSING
            # ----------------------------------------------------------------
            SchemeDB(
                id="scheme_passport_mea_central",
                name="Passport Seva — Official Passport Issuance",
                official_name="Passport Seva Programme (Ministry of External Affairs)",
                description="Comprehensive e-governance system for passport issuance across India. Online appointment booking, fee payment, document verification at Passport Seva Kendra, and home delivery of passport.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Ministry of External Affairs — Passport Seva",
                category="documents",
                benefits={"processing_time_normal": "30-45 days for fresh passport", "processing_time_tatkal": "1-3 days for Tatkal service", "validity": "10 years for adults"},
                eligibility_rules={},
                documents_required=[{"type": "AADHAAR"}, {"type": "PROOF_OF_DOB"}],
                application_process="Register at passportindia.gov.in, book appointment, visit PSK, collect passport.",
                application_url="https://passportindia.gov.in",
                official_source_url="https://passportindia.gov.in",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_driving_licence_morth",
                name="Driving Licence — Sarathi Parivahan Portal",
                official_name="Driving Licence Service (Ministry of Road Transport & Highways)",
                description="Online portal for applying for learner licence, permanent driving licence, and renewal. Integrated with DigiLocker for document verification. State RTOs process applications.",
                level="CENTRAL",
                state_code="CENTRAL",
                state_name="Central",
                department="Ministry of Road Transport & Highways",
                category="documents",
                benefits={"online_application": "Yes — no need to visit RTO initially", "validity": "20 years or age 50, whichever is earlier"},
                eligibility_rules={"age_min": 18},
                documents_required=[{"type": "AADHAAR"}, {"type": "PROOF_OF_DOB"}],
                application_process="Apply at sarathi.parivahan.gov.in, submit documents, appear for driving test at RTO.",
                application_url="https://sarathi.parivahan.gov.in",
                official_source_url="https://sarathi.parivahan.gov.in",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            # ----------------------------------------------------------------
            # RAJASTHAN STATE SCHEMES
            # ----------------------------------------------------------------
            SchemeDB(
                id="scheme_raj_mlupy_business",
                name="MLUPY — Mukhyamantri Laghu Udyog Protsahan Yojana",
                official_name="Mukhyamantri Laghu Udyog Protsahan Yojana (MLUPY), Rajasthan",
                description="Rajasthan government scheme providing interest subsidy on loans taken from banks by new entrepreneurs for establishment of micro and small enterprises.",
                level="STATE",
                state_code="RJ",
                state_name="Rajasthan",
                department="Rajasthan MSME & Industries Department",
                category="business",
                benefits={"interest_subsidy": "5–8% per annum for first 5 years", "loan_limit": "Up to ₹1 crore for micro enterprises"},
                eligibility_rules={"state": "Rajasthan"},
                documents_required=[{"type": "AADHAAR"}, {"type": "PAN"}, {"type": "DOMICILE_CERTIFICATE"}],
                application_process="Apply through Rajasthan State Industries Development & Investment Corporation (RIICO) or district DIC offices.",
                application_url="https://industries.rajasthan.gov.in",
                official_source_url="https://industries.rajasthan.gov.in/content/industries/en/MSME.html",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_raj_rgs_study_abroad",
                name="Rajiv Gandhi Scholarship for Academic Excellence (Study Abroad)",
                official_name="Rajiv Gandhi Scholarship for Academic Excellence — Study Abroad",
                description="Rajasthan government scholarship enabling students domiciled in Rajasthan to pursue Masters or Ph.D. from top 200 QS World Ranked universities abroad. Covers tuition, living expenses, travel, visa and insurance costs.",
                level="STATE",
                state_code="RJ",
                state_name="Rajasthan",
                department="Higher Education Department, Govt. of Rajasthan",
                category="education",
                benefits={"tuition_fee": "Full tuition fee", "living_allowance": "As per destination country rates", "travel": "Return airfare", "number_of_scholarships": "200 per year"},
                eligibility_rules={"state": "Rajasthan", "course": "study_abroad", "annual_family_income_max": 2500000},
                documents_required=[{"type": "AADHAAR"}, {"type": "PASSPORT"}, {"type": "DOMICILE_CERTIFICATE"}, {"type": "INCOME_CERTIFICATE"}, {"type": "UNIVERSITY_OFFER_LETTER"}],
                application_process="Apply on Higher Education Department Rajasthan portal (hte.rajasthan.gov.in) during annual notification period.",
                application_url="https://hte.rajasthan.gov.in/scholarship/rgs",
                official_source_url="https://hte.rajasthan.gov.in/scholarship/rgs",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_raj_palanhar_education",
                name="Rajasthan Palanhar Yojana — Child Education Allowance",
                official_name="Palanhar Yojana, Rajasthan",
                description="Monthly allowance of ₹1,500 for children up to 18 years of age in special circumstances (orphans, HIV/AIDS affected families, disabled parents). Includes ₹2,000 per year for clothing/stationery.",
                level="STATE",
                state_code="RJ",
                state_name="Rajasthan",
                department="Department of Social Justice & Empowerment, Govt of Rajasthan",
                category="education",
                benefits={"monthly_allowance": "₹1,500 per child (up to 5 years)", "annual_clothing_allowance": "₹2,000 per child"},
                eligibility_rules={"state": "Rajasthan", "age_max": 18},
                documents_required=[{"type": "AADHAAR"}, {"type": "BIRTH_CERTIFICATE"}, {"type": "DOMICILE_CERTIFICATE"}],
                application_process="Apply at Rajasthan SSO portal (sso.rajasthan.gov.in) or district Social Welfare office.",
                application_url="https://sso.rajasthan.gov.in",
                official_source_url="https://sje.rajasthan.gov.in/schemes/Palanhar.html",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_raj_kisan_yojana_agri",
                name="Rajasthan Mukhyamantri Krishak Saathi Yojana",
                official_name="Mukhyamantri Krishak Saathi Yojana, Rajasthan",
                description="Financial assistance to farmers or their families in case of death or permanent disability during agricultural work. Compensation of ₹5,000 to ₹2,00,000 based on nature of disability/death.",
                level="STATE",
                state_code="RJ",
                state_name="Rajasthan",
                department="Agriculture Department, Govt of Rajasthan",
                category="agriculture",
                benefits={"death_compensation": "₹2,00,000", "disability_compensation": "₹5,000 to ₹1,50,000"},
                eligibility_rules={"state": "Rajasthan", "occupation": "farmer"},
                documents_required=[{"type": "AADHAAR"}, {"type": "LAND_RECORD"}],
                application_process="Apply at the district agriculture office within 6 months of incident.",
                application_url="https://agriculture.rajasthan.gov.in",
                official_source_url="https://agriculture.rajasthan.gov.in/Agriculture/Content/5/0/3/3/0/Schemes.aspx",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            # ----------------------------------------------------------------
            # KARNATAKA STATE SCHEMES
            # ----------------------------------------------------------------
            SchemeDB(
                id="scheme_ka_msme_policy_business",
                name="Karnataka MSME & Entrepreneurship Policy 2020 — Investment Incentives",
                official_name="Karnataka MSME and Entrepreneurship Policy 2020 — Capital Investment Subsidy",
                description="Karnataka government incentives for MSMEs including 15–20% capital investment subsidy, employment generation incentive of ₹50,000 per Kannadiga employee, and interest subsidy on term loans.",
                level="STATE",
                state_code="KA",
                state_name="Karnataka",
                department="Department of Industries & Commerce, Govt of Karnataka",
                category="business",
                benefits={"capital_subsidy": "15–20% of fixed capital investment", "employment_incentive": "₹50,000 per Kannadiga employee", "interest_subsidy": "5% per year for 5 years"},
                eligibility_rules={"state": "Karnataka"},
                documents_required=[{"type": "AADHAAR"}, {"type": "PAN"}, {"type": "UDYAM_CERTIFICATE"}],
                application_process="Apply on Invest Karnataka single window portal (investkarnataka.com) or through respective district DIC.",
                application_url="https://investkarnataka.com",
                official_source_url="https://investkarnataka.com/policies",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_ka_post_matric_scholarship",
                name="Karnataka Post-Matric Scholarship (SSP)",
                official_name="Karnataka State Scholarship (Post-Matric) — State Scholarship Portal (SSP)",
                description="Fee reimbursement and maintenance allowance for students of SC, ST, OBC categories and minority communities pursuing post-matric education in Karnataka.",
                level="STATE",
                state_code="KA",
                state_name="Karnataka",
                department="Department of Social Welfare, Govt of Karnataka",
                category="education",
                benefits={"fee_reimbursement": "Full tuition and non-refundable fee", "maintenance_allowance": "₹2,000–₹12,000 per year"},
                eligibility_rules={"state": "Karnataka"},
                documents_required=[{"type": "AADHAAR"}, {"type": "INCOME_CERTIFICATE"}, {"type": "CASTE_CERTIFICATE"}],
                application_process="Apply on SSP Karnataka portal (ssp.postmatric.karnataka.gov.in) during scholarship window.",
                application_url="https://ssp.postmatric.karnataka.gov.in",
                official_source_url="https://ssp.postmatric.karnataka.gov.in",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_ka_fssai_food_business",
                name="FSSAI Food License — Karnataka (FoSCoS Portal)",
                official_name="FSSAI Food Business Operator (FBO) License",
                description="Mandatory food safety license for all food businesses including restaurants, cafes, bakeries, caterers, and food manufacturers. Central License for large operators, State License for medium, and Registration for small operators.",
                level="STATE",
                state_code="KA",
                state_name="Karnataka",
                department="Food Safety and Standards Authority of India (FSSAI)",
                category="business",
                benefits={"license_validity": "1–5 years (renewable)", "type": "Central License / State License / Basic Registration based on turnover"},
                eligibility_rules={"state": "Karnataka"},
                documents_required=[{"type": "AADHAAR"}, {"type": "PAN"}, {"type": "RENT_AGREEMENT"}],
                application_process="Apply online on FoSCoS portal (foscos.fssai.gov.in).",
                application_url="https://foscos.fssai.gov.in",
                official_source_url="https://www.fssai.gov.in/cms/food-safety-and-standards.php",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            # ----------------------------------------------------------------
            # GUJARAT STATE SCHEMES
            # ----------------------------------------------------------------
            SchemeDB(
                id="scheme_gj_mysy_education",
                name="MYSY — Mukhyamantri Yuva Swavalamban Yojana (Gujarat)",
                official_name="Mukhyamantri Yuva Swavalamban Yojana (MYSY), Gujarat",
                description="Gujarat government scholarship for students from families with annual income up to ₹6 lakh who have scored 80%+ in 10th or 12th standard. Covers tuition fees for recognized colleges in Gujarat.",
                level="STATE",
                state_code="GJ",
                state_name="Gujarat",
                department="Education Department, Govt of Gujarat",
                category="education",
                benefits={"tuition_fee_reimbursement": "50–100% tuition fee", "hostel_allowance": "Up to ₹1,200/month", "annual_income_limit": "₹6 lakh"},
                eligibility_rules={"state": "Gujarat", "annual_family_income_max": 600000},
                documents_required=[{"type": "AADHAAR"}, {"type": "INCOME_CERTIFICATE"}, {"type": "10TH_MARKSHEET"}],
                application_process="Apply on MYSY Gujarat portal (mysy.guj.nic.in) after admission.",
                application_url="https://mysy.guj.nic.in",
                official_source_url="https://mysy.guj.nic.in",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
            SchemeDB(
                id="scheme_gj_msme_assistance",
                name="Gujarat MSME Assistance Scheme",
                official_name="Gujarat MSME Assistance Scheme — Industrial Policy 2020",
                description="Gujarat state incentives for MSMEs including capital subsidy, power tariff subsidy, employment allowance, and SGST reimbursement for new units established in Gujarat.",
                level="STATE",
                state_code="GJ",
                state_name="Gujarat",
                department="Industries Commissionerate, Govt of Gujarat",
                category="business",
                benefits={"capital_subsidy": "10–25% (up to ₹35 lakh)", "power_tariff_subsidy": "₹1–2 per unit for 5 years", "sgst_reimbursement": "Up to 100% SGST for 7 years"},
                eligibility_rules={"state": "Gujarat"},
                documents_required=[{"type": "AADHAAR"}, {"type": "PAN"}, {"type": "UDYAM_CERTIFICATE"}],
                application_process="Apply through Gujarat Industries Commissionerate single-window portal.",
                application_url="https://ic.gujarat.gov.in",
                official_source_url="https://ic.gujarat.gov.in/MSME-assistance-scheme",
                start_date=now,
                last_verified_at=now,
                status="ACTIVE",
                source_confidence="OFFICIAL_VERIFIED"
            ),
        ]

        for scheme in schemes_data:
            db.add(scheme)
        db.commit()
        logger.info(f"Seeded {len(schemes_data)} government schemes successfully!")

        logger.info("Starting Interoperability Seeding...")
        seed_interop_data(db)

        # =====================================================================
        # SEED APPLICATIONS
        # =====================================================================
        logger.info("Seeding Application Records...")
        from datetime import timedelta
        now = datetime.utcnow()

        # Skip if already seeded
        existing_app_count = db.query(ApplicationDB).count()
        if existing_app_count > 0:
            logger.info(f"{existing_app_count} applications already seeded. Skipping.")
        else:
          applications_data = [
            ApplicationDB(
                application_id="APP-2026-001",
                user_id="user_hriday_bardia",
                service_id="svc_revenue_cert",
                department_id="dept_revenue",
                department_name="Industries Commissionerate, Gujarat",
                service_name="Business Registration",
                status="UNDER_VERIFICATION",
                universal_status="VERIFICATION",
                sla_target_hours=48,
                submitted_at=now - timedelta(days=2),
                documents=[{"name": "PAN Card", "status": "verified"}, {"name": "Aadhaar Card", "status": "verified"}, {"name": "Address Proof", "status": "verified"}, {"name": "Business Proof", "status": "pending"}],
                timeline=[
                    {"title": "Application Created", "description": "Business registration form submitted.", "timestamp": (now - timedelta(days=2)).isoformat(), "status": "SUBMITTED"},
                    {"title": "Documents Received", "description": "PAN, Aadhaar, and address proof received.", "timestamp": (now - timedelta(days=1)).isoformat(), "status": "DOCUMENTS_RECEIVED"},
                    {"title": "Verification Initiated", "description": "Identity and address checks via Interop Gateway.", "timestamp": (now - timedelta(hours=3)).isoformat(), "status": "UNDER_VERIFICATION"}
                ],
                required_actions=["Verify business documents"]
            ),
            ApplicationDB(
                application_id="APP-2026-002",
                user_id="user_hriday_bardia",
                service_id="svc_msme_support",
                department_id="dept_msme",
                department_name="Ministry of MSME",
                service_name="Government Business Support",
                status="DOCUMENTS_REQUIRED",
                universal_status="ACTION_REQUIRED",
                sla_target_hours=72,
                submitted_at=now - timedelta(days=3),
                documents=[{"name": "PAN Card", "status": "verified"}, {"name": "Aadhaar Card", "status": "verified"}, {"name": "Income Certificate", "status": "required"}, {"name": "Business Plan", "status": "required"}],
                timeline=[
                    {"title": "Application Created", "description": "Government business support scheme application submitted.", "timestamp": (now - timedelta(days=3)).isoformat(), "status": "SUBMITTED"},
                    {"title": "Documents Required", "description": "Income certificate and business plan needed.", "timestamp": (now - timedelta(hours=8)).isoformat(), "status": "DOCUMENTS_REQUIRED"}
                ],
                required_actions=["Upload income / business documents"]
            ),
            ApplicationDB(
                application_id="APP-2026-003",
                user_id="user_varad_kanade",
                service_id="svc_edu_scholarship",
                department_id="dept_education",
                department_name="Ministry of Education",
                service_name="Higher Education Assistance",
                status="UNDER_REVIEW",
                universal_status="VERIFICATION",
                sla_target_hours=96,
                submitted_at=now - timedelta(days=5),
                documents=[{"name": "Aadhaar Card", "status": "verified"}, {"name": "10th Marksheet", "status": "verified"}, {"name": "12th Marksheet", "status": "verified"}, {"name": "Degree Certificate", "status": "verified"}, {"name": "English Proficiency Test", "status": "pending"}],
                timeline=[
                    {"title": "Application Created", "description": "Higher education assistance application submitted.", "timestamp": (now - timedelta(days=5)).isoformat(), "status": "SUBMITTED"},
                    {"title": "Documents Verified", "description": "Academic records verified via DigiLocker.", "timestamp": (now - timedelta(days=3)).isoformat(), "status": "DOCUMENTS_VERIFIED"},
                    {"title": "Under Review", "description": "Eligibility review in progress.", "timestamp": (now - timedelta(hours=6)).isoformat(), "status": "UNDER_REVIEW"}
                ],
                required_actions=["Verify education documents"]
            ),
            ApplicationDB(
                application_id="APP-2026-004",
                user_id="user_satwik_guru",
                service_id="svc_revenue_cert",
                department_id="dept_revenue_ka",
                department_name="Kaveri Online Services, Karnataka",
                service_name="Property Registration",
                status="SUBMITTED",
                universal_status="SUBMITTED",
                sla_target_hours=72,
                submitted_at=now - timedelta(days=1),
                documents=[{"name": "Aadhaar Card", "status": "verified"}, {"name": "PAN Card", "status": "verified"}, {"name": "Sale Agreement", "status": "pending"}, {"name": "Title Deed", "status": "pending"}],
                timeline=[
                    {"title": "Application Created", "description": "Property registration application submitted.", "timestamp": (now - timedelta(days=1)).isoformat(), "status": "SUBMITTED"}
                ],
                required_actions=["Document verification"]
            ),
            ApplicationDB(
                application_id="APP-2026-005",
                user_id="user_satwik_guru",
                service_id="svc_residence",
                department_id="dept_revenue_ka",
                department_name="Revenue Department, Karnataka",
                service_name="Property-related Government Service",
                status="ACTION_REQUIRED",
                universal_status="ACTION_REQUIRED",
                sla_target_hours=72,
                submitted_at=now - timedelta(days=4),
                documents=[{"name": "Aadhaar Card", "status": "verified"}, {"name": "Property Tax Receipt", "status": "required"}],
                timeline=[
                    {"title": "Application Created", "description": "Property-related government service application.", "timestamp": (now - timedelta(days=4)).isoformat(), "status": "SUBMITTED"},
                    {"title": "Action Required", "description": "Property tax receipt needed.", "timestamp": (now - timedelta(hours=12)).isoformat(), "status": "ACTION_REQUIRED"}
                ],
                required_actions=["Upload property document"]
            ),
            ApplicationDB(
                application_id="APP-2026-006",
                user_id="user_ayuh_chauhan",
                service_id="svc_edu_scholarship",
                department_id="dept_education_rj",
                department_name="Industries Department, Rajasthan",
                service_name="Business Support Scheme",
                status="DOCUMENTS_REQUIRED",
                universal_status="ACTION_REQUIRED",
                sla_target_hours=72,
                submitted_at=now - timedelta(days=7),
                documents=[{"name": "Aadhaar Card", "status": "verified"}, {"name": "PAN Card", "status": "verified"}, {"name": "Income Certificate", "status": "required"}, {"name": "Caste Certificate", "status": "required"}],
                timeline=[
                    {"title": "Application Created", "description": "Business support scheme application submitted.", "timestamp": (now - timedelta(days=7)).isoformat(), "status": "SUBMITTED"},
                    {"title": "Documents Required", "description": "Income certificate and caste certificate needed.", "timestamp": (now - timedelta(hours=18)).isoformat(), "status": "DOCUMENTS_REQUIRED"}
                ],
                required_actions=["Upload required documents"]
            ),
        ]
          for app_record in applications_data:
              db.add(app_record)
          db.commit()
          logger.info(f"Seeded {len(applications_data)} application records!")

        # =====================================================================
        # SEED NOTIFICATIONS
        # =====================================================================
        logger.info("Seeding Notifications...")
        existing_notif_count = db.query(NotificationDB).count()
        if existing_notif_count > 0:
            logger.info(f"{existing_notif_count} notifications already seeded. Skipping.")
        else:
          notifications_data = [
            NotificationDB(user_id="user_hriday_bardia", title="Application Under Verification", message="Your application APP-2026-001 for Business Registration is now under verification.", category="application_update"),
            NotificationDB(user_id="user_hriday_bardia", title="Documents Required", message="Your application APP-2026-002 requires Income Certificate and Business Plan.", category="application_update"),
            NotificationDB(user_id="user_varad_kanade", title="Application Under Review", message="Your Higher Education Assistance application is being reviewed by the department.", category="application_update"),
            NotificationDB(user_id="user_satwik_guru", title="Application Submitted", message="Your Property Registration application has been submitted successfully.", category="application_update"),
            NotificationDB(user_id="user_satwik_guru", title="Action Required", message="Please upload your Property Tax Receipt for application APP-2026-005.", category="application_update"),
            NotificationDB(user_id="user_ayuh_chauhan", title="Documents Needed", message="Please upload Income Certificate and Caste Certificate for your Business Support Scheme application.", category="application_update"),
            NotificationDB(user_id="user_hriday_bardia", title="New Scheme Alert", message="PM SVANidhi street vendor loan scheme is now available. Check your eligibility.", category="scheme_alert", is_read=True),
            NotificationDB(user_id="user_varad_kanade", title="Scholarship Update", message="NSP scholarship application window opens next month. Prepare your documents.", category="scheme_alert", is_read=True),
        ]
          for n in notifications_data:
              db.add(n)
          db.commit()
          logger.info(f"Seeded {len(notifications_data)} notifications!")

        # =====================================================================
        # SEED AUDIT LOGS
        # =====================================================================
        logger.info("Seeding Audit Logs...")
        existing_audit_count = db.query(AuditLogDB).count()
        if existing_audit_count > 0:
            logger.info(f"{existing_audit_count} audit logs already seeded. Skipping.")
        else:
          audit_logs_data = [
            AuditLogDB(actor="user_hriday_bardia", action="LOGIN", resource="Citizen Portal", status="SUCCESS"),
            AuditLogDB(actor="user_hriday_bardia", action="API_REQUEST", resource="Identity Service (UIDAI) -> VerifyIdentity", status="SUCCESS"),
            AuditLogDB(actor="user_hriday_bardia", action="API_REQUEST", resource="State Property Registry -> VerifyAddress", status="SUCCESS"),
            AuditLogDB(actor="user_hriday_bardia", action="DOCUMENT_UPLOAD", resource="Aadhaar Card uploaded", status="SUCCESS"),
            AuditLogDB(actor="user_hriday_bardia", action="JOURNEY_CREATED", resource="Business Journey in Gujarat", status="SUCCESS"),
            AuditLogDB(actor="user_varad_kanade", action="LOGIN", resource="Citizen Portal", status="SUCCESS"),
            AuditLogDB(actor="user_varad_kanade", action="API_REQUEST", resource="Pune Municipal Corporation -> CreateApplication", status="SUCCESS"),
            AuditLogDB(actor="user_varad_kanade", action="DOCUMENT_UPLOAD", resource="Marksheets uploaded via DigiLocker", status="SUCCESS"),
            AuditLogDB(actor="user_satwik_guru", action="LOGIN", resource="Citizen Portal", status="SUCCESS"),
            AuditLogDB(actor="user_satwik_guru", action="APPLICATION_SUBMITTED", resource="Property Registration", status="SUCCESS"),
            AuditLogDB(actor="user_ayuh_chauhan", action="LOGIN", resource="Citizen Portal", status="SUCCESS"),
            AuditLogDB(actor="user_system_admin", action="ADMIN_LOGIN", resource="Admin Portal", status="SUCCESS"),
            AuditLogDB(actor="user_system_admin", action="ADMIN_ACCESS", resource="System Diagnostics", status="SUCCESS"),
            AuditLogDB(actor="user_jyoti_admin", action="ADMIN_LOGIN", resource="Admin Portal", status="SUCCESS"),
            AuditLogDB(actor="user_jyoti_admin", action="ADMIN_APPLICATION_STATUS_CHANGE", resource="Application: APP-2026-001, Status: UNDER_VERIFICATION", status="SUCCESS"),
            AuditLogDB(actor="system_gateway", action="API_REQUEST", resource="ServiceRegistry seeded", status="SUCCESS"),
        ]
          for log in audit_logs_data:
              db.add(log)
          db.commit()
          logger.info(f"Seeded {len(audit_logs_data)} audit logs!")

        # =====================================================================
        # SEED CONNECTOR HEALTH
        # =====================================================================
        logger.info("Seeding Connector Health Records...")
        existing_ch_count = db.query(ConnectorHealthDB).count()
        if existing_ch_count > 0:
            logger.info(f"{existing_ch_count} connector health records already seeded. Skipping.")
        else:
          connector_health_data = [
            ConnectorHealthDB(service_name="Identity Service (UIDAI)", connector_type="REST", health_status="Healthy", request_count=1250, failure_count=3, latency_ms=45),
            ConnectorHealthDB(service_name="DigiLocker Document Gateway", connector_type="REST", health_status="Healthy", request_count=890, failure_count=1, latency_ms=120),
            ConnectorHealthDB(service_name="State Scholarship Portal", connector_type="SOAP", health_status="Degraded", request_count=340, failure_count=28, latency_ms=450),
            ConnectorHealthDB(service_name="Pune Municipal Corporation", connector_type="REST", health_status="Healthy", request_count=560, failure_count=5, latency_ms=200),
            ConnectorHealthDB(service_name="Karnataka Revenue Department", connector_type="REST", health_status="Healthy", request_count=720, failure_count=2, latency_ms=180),
            ConnectorHealthDB(service_name="GSTN Portal", connector_type="REST", health_status="Healthy", request_count=1100, failure_count=4, latency_ms=112),
        ]
          for ch in connector_health_data:
              db.add(ch)
          db.commit()
          logger.info(f"Seeded {len(connector_health_data)} connector health records!")

        # =====================================================================
        # SEED CONSENT RECORDS
        # =====================================================================
        logger.info("Seeding Consent Records...")
        existing_consent_count = db.query(ConsentRecordDB).count()
        if existing_consent_count > 0:
            logger.info(f"{existing_consent_count} consent records already seeded. Skipping.")
        else:
          consent_data = [
            ConsentRecordDB(consent_id="consent_hriday_uidai", user_id="user_hriday_bardia", department_id="uidai", department_name="UIDAI (Aadhaar)", purpose="Identity Verification", requested_fields=["full_name", "date_of_birth", "gender", "address"], granted=True, granted_at=now, access_type="ALWAYS"),
            ConsentRecordDB(consent_id="consent_hriday_muncipal", user_id="user_hriday_bardia", department_id="pmc", department_name="Pune Municipal Corporation", purpose="Trade Licensing Verification", requested_fields=["address", "pincode"], granted=True, granted_at=now, access_type="ONCE"),
            ConsentRecordDB(consent_id="consent_varad_edu", user_id="user_varad_kanade", department_id="edu", department_name="Ministry of Education", purpose="Scholarship Verification", requested_fields=["full_name", "date_of_birth", "education_records"], granted=True, granted_at=now, access_type="ALWAYS"),
            ConsentRecordDB(consent_id="consent_satwik_rev", user_id="user_satwik_guru", department_id="rev_ka", department_name="Karnataka Revenue Department", purpose="Property Registration", requested_fields=["full_name", "address", "property_details"], granted=True, granted_at=now, access_type="ONCE"),
        ]
          for c in consent_data:
              db.add(c)
          db.commit()
          logger.info(f"Seeded {len(consent_data)} consent records!")

        # =====================================================================
        # SEED DATA CONFLICTS
        # =====================================================================
        logger.info("Seeding Data Conflicts...")
        existing_dc_count = db.query(DataConflictDB).count()
        if existing_dc_count > 0:
            logger.info(f"{existing_dc_count} data conflicts already seeded. Skipping.")
        else:
          conflict_data = [
            DataConflictDB(user_id="user_hriday_bardia", field_name="date_of_birth", source_a="Aadhaar ID Registry", value_a="2001-08-15", source_b="PAN Database", value_b="2001-08-16", status="RESOLVED", resolved_value="2001-08-15"),
            DataConflictDB(user_id="user_varad_kanade", field_name="address", source_a="Aadhaar ID Registry", value_a="12, Kothrud, Pune", source_b="Income Tax Portal", value_b="12, Kothrud Main Road, Pune", status="DETECTED"),
            DataConflictDB(user_id="user_satwik_guru", field_name="annual_income", source_a="Income Certificate", value_a="280000", source_b="Bank Statement", value_b="310000", status="DETECTED"),
        ]
          for dc in conflict_data:
              db.add(dc)
          db.commit()
          logger.info(f"Seeded {len(conflict_data)} data conflicts!")

        logger.info("Database seeding completed successfully!")
    finally:
        db.close()

def seed_baseline_if_empty():
    db = SessionLocal()
    try:
        user_count = db.query(UserDB).count()
        scheme_count = db.query(SchemeDB).count()
        app_count = db.query(ApplicationDB).count()
        if user_count > 0 and scheme_count > 0 and app_count > 0:
            logger.info(f"Database already seeded ({user_count} users, {scheme_count} schemes, {app_count} apps). Skipping auto-seed.")
            return
        logger.info(f"Database partially seeded (users={user_count}, schemes={scheme_count}, apps={app_count}). Running baseline seed...")
        seed_database(drop_tables=False)
    except Exception as e:
        logger.error(f"Error during baseline check/seed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
