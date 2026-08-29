from typing import List, Dict, Any, Optional
from app.ai.providers.base import BaseAIProvider
from app.services.goal_engine import GoalEngine
from app.models.schemas import GoalAnalysisRequest, GoalAnalysisResponse, ContextQuestion, RAGQueryResponse, Citation

class MockAIProvider(BaseAIProvider):
    def analyze_goal(self, message: str) -> GoalAnalysisResponse:
        return GoalEngine.analyze_goal(GoalAnalysisRequest(message=message))

    def answer_query(
        self,
        query: str,
        context_docs: List[Dict[str, Any]],
        journey_context: Optional[Dict[str, Any]] = None
    ) -> RAGQueryResponse:
        lower_q = query.lower()

        # 1. Land & Real Estate
        if any(w in lower_q for w in ["land", "plot", "property", "patta", "7/12", "rtc", "khata", "bhoomi", "bhulekh", "buy land", "real estate"]):
            citations = [
                Citation(
                    source_id="src_igrs",
                    title="Inspector General of Registration & Stamps (State IGRS)",
                    department="Department of Stamps and Registration",
                    url="https://services.india.gov.in/service/search?kw=property+registration",
                    last_verified="2026-02-01",
                    confidence="high"
                ),
                Citation(
                    source_id="src_bhoomi",
                    title="Bhoomi & Kaveri 2.0 (Karnataka Land & Property Records)",
                    department="Revenue Department, Government of Karnataka",
                    url="https://landrecords.karnataka.gov.in",
                    last_verified="2026-02-01",
                    confidence="high"
                ),
                Citation(
                    source_id="src_bhulekh_up",
                    title="UP Bhulekh & IGRSUP Land Gateway",
                    department="Board of Revenue, Uttar Pradesh",
                    url="https://upbhulekh.gov.in",
                    last_verified="2026-02-01",
                    confidence="high"
                ),
                Citation(
                    source_id="src_mahabhulekh",
                    title="Mahabhulekh & IGR Maharashtra",
                    department="Revenue Department, Government of Maharashtra",
                    url="https://bhulekh.mahabhumi.gov.in",
                    last_verified="2026-02-01",
                    confidence="high"
                ),
                Citation(
                    source_id="src_digilocker",
                    title="DigiLocker Property & Identity Document Vault",
                    department="Ministry of Electronics and IT (MeitY)",
                    url="https://www.digilocker.gov.in",
                    last_verified="2026-02-01",
                    confidence="high"
                )
            ]
            answer = (
                "Buying land or real estate in India is a major legal and financial milestone that requires thorough due diligence, clear title verification, and proper statutory registration. Because land and revenue administration is governed at the state level under the Transfer of Property Act and the Indian Registration Act, here is a complete, step-by-step advisory on how to safely navigate the process:\n\n"
                "### 1. Legal Due Diligence & 30-Year Title Search\n"
                "Before signing any agreement or paying an advance, hire an experienced property advocate to verify the root of title and search for encumbrances:\n"
                "- **30-Year Chain of Title Deeds**: Examine the original Mother Deed and all consecutive registered Sale, Gift, Partition, or Inheritance Deeds spanning at least the last 30 years. This confirms that the seller possesses an unbroken, marketable title without minor or coparcenary ownership disputes.\n"
                "- **Encumbrance Certificate (EC Form 15 & 16)**: Apply for an Encumbrance Certificate for the past 15 to 30 years from the Sub-Registrar Office (SRO) or the state IGRS portal. Form 15 lists all registered mortgages, bank charges, and court litigations, while Form 16 confirms that the property has a Nil Encumbrance.\n"
                "- **State Revenue Records & Mutation Extract**: Check that the seller is officially listed as the khatedar or owner in current state land records—such as the 7/12 Extract (Maharashtra/Gujarat), RTC Pahani (Karnataka), Patta-Chitta (Tamil Nadu), Khasra-Khatauni (UP/MP/North India), Dharani Record (Telangana), or Meebhoomi Adangal (Andhra Pradesh).\n"
                "- **Land Conversion & Zoning (NA / CLU)**: If purchasing agricultural land for residential, commercial, or industrial construction, verify that a formal Non-Agricultural (NA) conversion order or Change of Land Use (CLU) approval has been sanctioned by the District Collector or Town Planning Authority.\n"
                "- **RERA & Layout Sanctions**: For plotted development layouts, verify that the master layout is approved by the competent local authority (such as BDA, DTCP, PMRDA, HMDA, or DDA) and that the project is actively registered on your State RERA Portal.\n"
                "- **Cadastral Boundary Survey & Demarcation**: Conduct a physical survey with a licensed revenue surveyor to verify the on-ground boundaries and GPS coordinates against official revenue cadastral maps (Tippan, FMB, or Akarband) to rule out physical encroachment.\n\n"
                "### 2. Mandatory Documents Checklist\n"
                "Ensure the seller provides clear, legible copies of all required documents prior to execution:\n"
                "- Original Mother Deed and all subsequent registered conveyance deeds in the 30-year chain\n"
                "- Latest State Revenue Record (7/12, RTC Pahani, Patta-Chitta, or Khasra-Khatauni) in the seller's name\n"
                "- Encumbrance Certificate (Form 15/16) for the past 30 years\n"
                "- Khata Certificate and latest Mutation Extract confirming revenue ledger entry\n"
                "- Non-Agricultural (NA) Sanction Order and Town Planning Approved Layout Plan\n"
                "- Latest Property Tax Receipts and Municipal No-Dues Certificate (NDC)\n"
                "- KYC Documents: Aadhaar Card, PAN Card, and passport-size photographs of both buyer and seller\n"
                "- Proof of identification for two independent adult witnesses who will attend registration\n\n"
                "### 3. Financial, Stamp Duty & Registration Process\n"
                "Once title diligence is clear, draft a formal **Agreement to Sell (ATS)** specifying the total consideration, token advance, payment milestones, and possession timeline:\n"
                "- **Stamp Duty & Registration Charges**: Calculate the applicable stamp duty (typically 5%–8% of the higher of circle/guidance rate or actual consideration) and 1% registration fee. Pay these fees online through your State IGRS e-Challan gateway to obtain the official e-Stamp certificate.\n"
                "- **TDS on Property Purchase (Section 194-IA)**: If the total purchase value exceeds ₹50 Lakhs, the Income Tax Act legally requires the buyer to deduct 1% TDS from the seller's payment and deposit it within 30 days using Form 26QB on the Income Tax Portal.\n"
                "- **Sub-Registrar Execution**: Both the buyer and seller, accompanied by two witnesses with original Aadhaar cards, must appear before the Sub-Registrar for biometric verification, photo capture, and execution of the final Sale Deed.\n"
                "- **Post-Purchase Revenue Mutation (Namantaran / Dakhil Kharij)**: Registration confers legal conveyance, but revenue ownership is updated through mutation. Submit a mutation application to the local Tehsildar or Taluk Revenue Office within 30 days of registration to ensure the land record is issued in your name.\n\n"
                "### 4. Official Government Portals for Verification & Registration\n"
                "You can verify land ownership, search encumbrances, and book registration slots through these official state and national portals:\n"
                "- [National IGRS Portal Finder](https://services.india.gov.in/service/search?kw=property+registration): Search registration departments, calculate stamp duties, and book Sub-Registrar appointment slots nationwide.\n"
                "- [Bhoomi & Kaveri 2.0 (Karnataka)](https://landrecords.karnataka.gov.in): Inspect digital RTC Pahani records, download EC Form 15/16, and initiate property registrations.\n"
                "- [UP Bhulekh & IGRSUP (Uttar Pradesh)](https://upbhulekh.gov.in): Verify digital Khasra-Khatauni records and submit e-Registration deeds.\n"
                "- [Mahabhulekh & IGR Maharashtra](https://bhulekh.mahabhumi.gov.in): Access digital 7/12 & 8A land records and calculate stamp duty valuations.\n"
                "- [TNREGINET & e-Services (Tamil Nadu)](https://tnreginet.gov.in): Search online Encumbrance Certificates and verify Patta-Chitta land ownership.\n"
                "- [Dharani Portal (Telangana)](https://dharani.telangana.gov.in): Access integrated land records, mutation tracking, and registration slot booking.\n"
                "- [Meebhoomi (Andhra Pradesh)](https://meebhoomi.ap.gov.in): Download digital Adangal, 1B records, and village cadastral maps.\n"
                "- [DigiLocker Property & Identity Vault](https://www.digilocker.gov.in): Store and share legally verified Aadhaar, PAN, and land ownership records."
            )

        # 2. Healthcare & Hospitals
        elif any(w in lower_q for w in ["hospital", "clinic", "doctor", "nursing home", "clinical"]):
            citations = [
                Citation(
                    source_id="src_cea",
                    title="National Clinical Establishments Registry",
                    department="Ministry of Health and Family Welfare (MoHFW)",
                    url="https://clinicalestablishments.gov.in",
                    last_verified="2026-02-01",
                    confidence="high"
                ),
                Citation(
                    source_id="src_cpcb",
                    title="Central & State Pollution Control Board (Bio-Medical Waste)",
                    department="Ministry of Environment, Forest and Climate Change",
                    url="https://cpcb.nic.in",
                    last_verified="2026-02-01",
                    confidence="high"
                )
            ]
            answer = (
                "1. Core Procedure & Verification (The \"Theory\")\n"
                "• **Clinical Establishment Registration**: Register under the Clinical Establishments Act with the District Health Authority.\n"
                "• **Fire Safety NOC & Town Planning Approval**: Secure commercial fire clearance and municipal building sanction.\n"
                "• **Bio-Medical Waste (BMW) Consent**: Obtain Consent to Establish (CTE) & Operate (CTO) from State Pollution Control Board.\n"
                "• **Pharmacy & Radiation Safety Clearance**: Secure Retail Drug License (Forms 20/21) and AERB clearance for X-ray/CT units.\n\n"
                "2. Mandatory Documents Checklist\n"
                "• Clinical Establishment Blueprint & Doctor/Staff Registration Certificates\n"
                "• Bio-Medical Waste Management Agreement & State PCB NOC\n"
                "• Fire Department NOC & Municipal Commercial Trade Permit\n"
                "• Pharmacist Registration Certificate & Drug Storage Clearance\n\n"
                "3. Official Portals & How to Use Them\n"
                "• **[Clinical Establishments National Portal](https://clinicalestablishments.gov.in)**: Submit registration applications for healthcare establishments online.\n"
                "• **[State Pollution Control Board](https://cpcb.nic.in)**: Apply for Bio-Medical Waste authorization and environmental consent."
            )

        # 3. Passports & Travel
        elif any(w in lower_q for w in ["passport", "visa", "embassy", "psk"]):
            citations = [
                Citation(
                    source_id="src_passport",
                    title="Passport Seva Official Portal",
                    department="Ministry of External Affairs (MEA)",
                    url="https://www.passportindia.gov.in",
                    last_verified="2026-02-01",
                    confidence="high"
                ),
                Citation(
                    source_id="src_digilocker",
                    title="DigiLocker National Document Gateway",
                    department="MeitY, Government of India",
                    url="https://www.digilocker.gov.in",
                    last_verified="2026-02-01",
                    confidence="high"
                )
            ]
            answer = (
                "1. Core Procedure & Verification (The \"Theory\")\n"
                "• **Online Registration & ARN Generation**: Complete application on Passport Seva Portal and pay fee online.\n"
                "• **In-Person PSK Verification**: Attend appointment for mandatory biometric capture and physical document verification.\n"
                "• **Police Verification & Dispatch**: Local police station verifies residential record before passport dispatch via Speed Post.\n\n"
                "2. Mandatory Documents Checklist\n"
                "• Proof of Date of Birth (Birth Certificate, 10th Standard Certificate, or PAN Card)\n"
                "• Proof of Present Residential Address (Aadhaar Card, Utility Bill, Bank Passbook)\n"
                "• Proof of Non-ECR Status (Matriculation or Higher Educational Degree)\n\n"
                "3. Official Portals & How to Use Them\n"
                "• **[Passport Seva Portal](https://www.passportindia.gov.in)**: Complete Passport applications, pay fees, and book appointment slots.\n"
                "• **[DigiLocker](https://www.digilocker.gov.in)**: Share verified digital Aadhaar and educational certificates directly."
            )

        # 4. RTI (Right to Information)
        elif any(w in lower_q for w in ["rti", "right to info", "public information"]):
            citations = [
                Citation(
                    source_id="src_rti",
                    title="RTI Online Central Gateway",
                    department="Department of Personnel and Training (DoPT)",
                    url="https://rtionline.gov.in",
                    last_verified="2026-02-01",
                    confidence="high"
                )
            ]
            answer = (
                "1. Core Procedure & Verification (The \"Theory\")\n"
                "• **Identify Public Authority**: Pinpoint the exact Central or State ministry/department holding the required records.\n"
                "• **Draft Specific Factual Queries**: Request specific official documents, circulars, or inspection of records.\n"
                "• **Pay Statutory Fee**: Pay ₹10 application fee online or via Indian Postal Order.\n"
                "• **30-Day Legal Timeline**: Public Information Officer (PIO) is legally bound to provide information within 30 days.\n\n"
                "2. Mandatory Documents Checklist\n"
                "• RTI Application Text with exact subject matter and date range\n"
                "• Proof of Identity / Address (Aadhaar / Voter ID)\n"
                "• BPL Certificate (if claiming statutory fee exemption)\n\n"
                "3. Official Portals & How to Use Them\n"
                "• **[RTI Online Portal](https://rtionline.gov.in)**: Submit RTI applications and first appeals for all Central Government authorities."
            )

        # 5. Default Business / General
        else:
            citations = [
                Citation(
                    source_id="src_services_gov",
                    title="National Services Portal of India",
                    department="National Informatics Centre (NIC), Government of India",
                    url="https://services.india.gov.in",
                    last_verified="2026-02-01",
                    confidence="high"
                ),
                Citation(
                    source_id="src_digilocker",
                    title="DigiLocker National Document Gateway",
                    department="MeitY, Government of India",
                    url="https://www.digilocker.gov.in",
                    last_verified="2026-02-01",
                    confidence="high"
                )
            ]
            answer = (
                f"1. Core Procedure & Verification\n"
                f"• Regarding **{query}**: Verify eligibility criteria and statutory compliance requirements from official government department circulars.\n"
                f"• Complete online verification through single-window government portals with valid mobile-linked Aadhaar OTP.\n"
                f"• Track application status using official reference/acknowledgment numbers.\n\n"
                f"2. Mandatory Documents Checklist\n"
                f"• Identity Proof: Aadhaar Card / PAN Card / Voter ID\n"
                f"• Address Proof: Electricity Bill / Bank Passbook / Rent Agreement\n"
                f"• Income / Category Certificate (if applying for targeted subsidies)\n\n"
                f"3. Official Portals & How to Use Them\n"
                f"• **[National Government Services Portal](https://services.india.gov.in)**: Search and apply for over 12,000+ central and state citizen services online.\n"
                f"• **[DigiLocker](https://www.digilocker.gov.in)**: Access legally valid digital copies of all your certificates and records."
            )

        return RAGQueryResponse(
            answer=answer,
            citations=citations,
            confidence="high"
        )
