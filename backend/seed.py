# -*- coding: utf-8 -*-
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import logging
from datetime import datetime
from app.core.database import engine, Base, SessionLocal
from app.models.db_models import (
    UserDB, JourneyDB, JourneyStepDB, StepDependencyDB,
    GovernmentSourceDB, UserDocumentDB, UserConsentDB, SystemAlertDB
)
from app.services.dependency_engine import DependencyEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

def seed_database():
    logger.info("Initializing database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        logger.info("Seeding Initial Demonstration Users (Hriday, Varad, Narayan)...")
        from app.services.demo_vault_service import DemoVaultService, DEMO_CITIZENS
        from app.models.db_models import CitizenProfileDB

        from app.core.security import hash_pin

        for key, info in DEMO_CITIZENS.items():
            user = UserDB(
                id=info["user_id"],
                username=key,
                pin_hash=hash_pin("123456"),
                full_name=info["full_name"],
                mobile_number=info["mobile_number"],
                email=info.get("email"),
                role="citizen"
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

        logger.info("Database seeding completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
