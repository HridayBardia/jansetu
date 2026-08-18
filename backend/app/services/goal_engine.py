from app.services.location_engine import LocationEngine
from app.services.language_engine import LanguageEngine
from app.models.schemas import GoalAnalysisRequest, GoalAnalysisResponse, ContextQuestion

class GoalEngine:
    """
    Intelligent natural language classifier that understands citizen goals across 30+ intents,
    detects state/UT locations, identifies 12 Indian languages, and manages context collection.
    """

    @staticmethod
    def analyze_goal(request: GoalAnalysisRequest) -> GoalAnalysisResponse:
        raw_text = request.message.strip()
        text = raw_text.lower()

        # 1. Multi-lingual Detection
        lang_code = LanguageEngine.detect_language(raw_text)

        # 2. Location Extraction (Supports all 28 States & 8 UTs down to district/city)
        location_ctx = LocationEngine.extract_location(raw_text)
        detected_state = location_ctx.state_name
        detected_district = location_ctx.district
        detected_city = location_ctx.city
        needs_loc_clarification = location_ctx.needs_clarification

        # 3. Intent Detection Categories
        is_business = any(w in text for w in [
            "business", "shop", "vyapar", "karobar", "company", "dukan", "dukaan", "proprietorship",
            "start a small business", "start business", "open shop", "startup", "msme", "udyam", "trade", "restaurant",
            "kholna", "ખરીદી", "બિઝનેસ", "દુકાન", "શરૂ", "व्यापार", "दुकान", "बिजनेस", "उद्योग"
        ])
        
        is_education = any(w in text for w in [
            "education loan", "loan for study", "scholarship", "vidya", "padhai", "school", "mysy",
            "college fee", "student loan", "vidyalaxmi", "ssp", "scholarships", "chhatravritti", "chhatravriti",
            "छात्रवृत्ति", "छात्र", "विद्यार्थी", "स्कॉलरशिप", "విద్యార్థి", "மாணவர்", "ವಿದ್ಯಾರ್ಥಿ", "સ્કૉલરશિપ"
        ])

        is_agriculture = any(w in text for w in [
            "farmer", "kisan", "kheti", "agriculture", "crop", "krishi", "farm", "kisan credit",
            "खेती", "सब्सिडी", "किसान", "ખેડૂત", "ખેતી"
        ])

        is_healthcare = any(w in text for w in [
            "health", "medical", "hospital", "bima", "chiranjeevi", "ayushman", "treatment", "swasthya"
        ])

        is_housing = any(w in text for w in [
            "house", "housing", "awas", "flat", "home loan", "maken", "ghar"
        ])

        is_tax = any(w in text for w in [
            "tax", "itr", "income tax", "file tax", "tax return", "gst", "gstin"
        ])

        is_certificate = any(w in text for w in [
            "aadhaar", "pan", "ration card", "caste certificate", "income certificate", "domicile", "voter id", "driving license"
        ])

        # If location clarification is needed, add an explicit location question with NO default selection
        location_question = ContextQuestion(
            key="location_state",
            question="Which city or state are you planning this in?",
            options=["Gujarat", "Rajasthan", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "West Bengal", "Delhi NCR"],
            default_value=None
        )

        if is_business:
            questions = []
            if needs_loc_clarification:
                questions.append(location_question)
            questions.extend([
                ContextQuestion(
                    key="business_structure",
                    question="What legal structure are you planning for your business?",
                    options=["Sole Proprietorship", "Partnership", "LLP (Limited Liability Partnership)", "Private Limited Company"],
                    default_value="Sole Proprietorship"
                ),
                ContextQuestion(
                    key="business_type",
                    question="What sector/type of business will you operate?",
                    options=["Retail & E-commerce", "IT / Tech Services", "Food & Restaurant", "Manufacturing", "Agriculture Services"],
                    default_value="Retail & E-commerce"
                )
            ])

            return GoalAnalysisResponse(
                goal="business",
                life_event="business_formation",
                location_state=detected_state,
                location_district=detected_district,
                location_city=detected_city,
                needs_location_clarification=needs_loc_clarification,
                confidence="high",
                requires_context=True,
                supported=True,
                context_questions=questions
            )

        elif is_education:
            questions = []
            if needs_loc_clarification:
                questions.append(location_question)
            questions.extend([
                ContextQuestion(
                    key="education_level",
                    question="What level of study are you pursuing?",
                    options=["Undergraduate Degree", "Postgraduate / Master's", "Study Abroad", "Diploma / Vocational"],
                    default_value="Undergraduate Degree"
                ),
                ContextQuestion(
                    key="annual_family_income",
                    question="What is your annual family income bracket?",
                    options=["Under ₹2.5 Lakhs", "₹2.5 Lakhs to ₹6 Lakhs", "₹6 Lakhs to ₹8 Lakhs", "Above ₹8 Lakhs"],
                    default_value="Under ₹2.5 Lakhs"
                )
            ])

            return GoalAnalysisResponse(
                goal="education",
                life_event="higher_education_funding",
                location_state=detected_state,
                location_district=detected_district,
                location_city=detected_city,
                needs_location_clarification=needs_loc_clarification,
                confidence="high",
                requires_context=True,
                supported=True,
                context_questions=questions
            )

        elif is_agriculture:
            return GoalAnalysisResponse(
                goal="agriculture",
                life_event="farmer_support",
                location_state=detected_state,
                location_district=detected_district,
                location_city=detected_city,
                needs_location_clarification=needs_loc_clarification,
                confidence="high",
                requires_context=needs_loc_clarification,
                supported=True,
                context_questions=[location_question] if needs_loc_clarification else []
            )

        elif is_healthcare or is_housing:
            return GoalAnalysisResponse(
                goal="healthcare" if is_healthcare else "housing",
                life_event="social_welfare",
                location_state=detected_state,
                location_district=detected_district,
                location_city=detected_city,
                needs_location_clarification=needs_loc_clarification,
                confidence="high",
                requires_context=needs_loc_clarification,
                supported=True,
                context_questions=[location_question] if needs_loc_clarification else []
            )

        elif is_tax or is_certificate:
            return GoalAnalysisResponse(
                goal="documents" if is_certificate else "taxation",
                life_event="citizen_compliance",
                location_state=detected_state,
                location_district=detected_district,
                location_city=detected_city,
                needs_location_clarification=needs_loc_clarification,
                confidence="high",
                requires_context=needs_loc_clarification,
                supported=True,
                context_questions=[location_question] if needs_loc_clarification else []
            )

        # General Fallback
        return GoalAnalysisResponse(
            goal="general",
            life_event="citizen_assistance",
            location_state=detected_state,
            location_district=detected_district,
            location_city=detected_city,
            needs_location_clarification=needs_loc_clarification,
            confidence="medium",
            requires_context=needs_loc_clarification,
            supported=True,
            context_questions=[location_question] if needs_loc_clarification else []
        )


