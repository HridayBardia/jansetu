from typing import Dict, Any, List, Optional
from app.models.schemas import LocationContext

STATES_AND_UTS = {
    # 28 States
    "AP": {"name": "Andhra Pradesh", "is_ut": False},
    "AR": {"name": "Arunachal Pradesh", "is_ut": False},
    "AS": {"name": "Assam", "is_ut": False},
    "BR": {"name": "Bihar", "is_ut": False},
    "CG": {"name": "Chhattisgarh", "is_ut": False},
    "GA": {"name": "Goa", "is_ut": False},
    "GJ": {"name": "Gujarat", "is_ut": False},
    "HR": {"name": "Haryana", "is_ut": False},
    "HP": {"name": "Himachal Pradesh", "is_ut": False},
    "JH": {"name": "Jharkhand", "is_ut": False},
    "KA": {"name": "Karnataka", "is_ut": False},
    "KL": {"name": "Kerala", "is_ut": False},
    "MP": {"name": "Madhya Pradesh", "is_ut": False},
    "MH": {"name": "Maharashtra", "is_ut": False},
    "MN": {"name": "Manipur", "is_ut": False},
    "ML": {"name": "Meghalaya", "is_ut": False},
    "MZ": {"name": "Mizoram", "is_ut": False},
    "NL": {"name": "Nagaland", "is_ut": False},
    "OD": {"name": "Odisha", "is_ut": False},
    "PB": {"name": "Punjab", "is_ut": False},
    "RJ": {"name": "Rajasthan", "is_ut": False},
    "SK": {"name": "Sikkim", "is_ut": False},
    "TN": {"name": "Tamil Nadu", "is_ut": False},
    "TS": {"name": "Telangana", "is_ut": False},
    "TR": {"name": "Tripura", "is_ut": False},
    "UP": {"name": "Uttar Pradesh", "is_ut": False},
    "UK": {"name": "Uttarakhand", "is_ut": False},
    "WB": {"name": "West Bengal", "is_ut": False},
    # 8 Union Territories
    "AN": {"name": "Andaman and Nicobar Islands", "is_ut": True},
    "CH": {"name": "Chandigarh", "is_ut": True},
    "DH": {"name": "Dadra and Nagar Haveli and Daman and Diu", "is_ut": True},
    "DL": {"name": "Delhi", "is_ut": True},
    "JK": {"name": "Jammu and Kashmir", "is_ut": True},
    "LA": {"name": "Ladakh", "is_ut": True},
    "LD": {"name": "Lakshadweep", "is_ut": True},
    "PY": {"name": "Puducherry", "is_ut": True},
}

# City / District -> (State Code, District Name)
CITY_DISTRICT_MAP: Dict[str, tuple[str, str]] = {
    # Gujarat
    "vadodara": ("GJ", "Vadodara"),
    "ahmedabad": ("GJ", "Ahmedabad"),
    "surat": ("GJ", "Surat"),
    "rajkot": ("GJ", "Rajkot"),
    "gandhinagar": ("GJ", "Gandhinagar"),
    "bhavnagar": ("GJ", "Bhavnagar"),
    "jamnagar": ("GJ", "Jamnagar"),
    "junagadh": ("GJ", "Junagadh"),
    "anand": ("GJ", "Anand"),
    "bharuch": ("GJ", "Bharuch"),
    "navsari": ("GJ", "Navsari"),
    # Rajasthan
    "jaipur": ("RJ", "Jaipur"),
    "jodhpur": ("RJ", "Jodhpur"),
    "udaipur": ("RJ", "Udaipur"),
    "kota": ("RJ", "Kota"),
    "bikaner": ("RJ", "Bikaner"),
    "ajmer": ("RJ", "Ajmer"),
    "bhilwara": ("RJ", "Bhilwara"),
    "alwar": ("RJ", "Alwar"),
    "sikar": ("RJ", "Sikar"),
    # Maharashtra
    "mumbai": ("MH", "Mumbai"),
    "pune": ("MH", "Pune"),
    "nagpur": ("MH", "Nagpur"),
    "thane": ("MH", "Thane"),
    "nashik": ("MH", "Nashik"),
    "aurangabad": ("MH", "Chhatrapati Sambhajinagar"),
    "chhatrapati sambhajinagar": ("MH", "Chhatrapati Sambhajinagar"),
    "solapur": ("MH", "Solapur"),
    "kolhapur": ("MH", "Kolhapur"),
    "navi mumbai": ("MH", "Thane"),
    # Karnataka
    "bangalore": ("KA", "Bengaluru Urban"),
    "bengaluru": ("KA", "Bengaluru Urban"),
    "mysore": ("KA", "Mysuru"),
    "mysuru": ("KA", "Mysuru"),
    "hubli": ("KA", "Dharwad"),
    "hubballi": ("KA", "Dharwad"),
    "mangalore": ("KA", "Dakshina Kannada"),
    "mangaluru": ("KA", "Dakshina Kannada"),
    "belagavi": ("KA", "Belagavi"),
    "belgaum": ("KA", "Belagavi"),
    "gulbarga": ("KA", "Kalaburagi"),
    "kalaburagi": ("KA", "Kalaburagi"),
    # Tamil Nadu
    "chennai": ("TN", "Chennai"),
    "coimbatore": ("TN", "Coimbatore"),
    "madurai": ("TN", "Madurai"),
    "trichy": ("TN", "Tiruchirappalli"),
    "tiruchirappalli": ("TN", "Tiruchirappalli"),
    "salem": ("TN", "Salem"),
    "tirunelveli": ("TN", "Tirunelveli"),
    # West Bengal
    "kolkata": ("WB", "Kolkata"),
    "howrah": ("WB", "Howrah"),
    "siliguri": ("WB", "Darjeeling"),
    "durgapur": ("WB", "Paschim Bardhaman"),
    "asansol": ("WB", "Paschim Bardhaman"),
    # Uttar Pradesh
    "lucknow": ("UP", "Lucknow"),
    "kanpur": ("UP", "Kanpur Nagar"),
    "varanasi": ("UP", "Varanasi"),
    "agra": ("UP", "Agra"),
    "noida": ("UP", "Gautam Buddha Nagar"),
    "ghaziabad": ("UP", "Ghaziabad"),
    "prayagraj": ("UP", "Prayagraj"),
    "allahabad": ("UP", "Prayagraj"),
    "meerut": ("UP", "Meerut"),
    # Bihar
    "patna": ("BR", "Patna"),
    "gaya": ("BR", "Gaya"),
    "muzaffarpur": ("BR", "Muzaffarpur"),
    "bhagalpur": ("BR", "Bhagalpur"),
    # Madhya Pradesh
    "bhopal": ("MP", "Bhopal"),
    "indore": ("MP", "Indore"),
    "gwalior": ("MP", "Gwalior"),
    "jabalpur": ("MP", "Jabalpur"),
    "ujjain": ("MP", "Ujjain"),
    # Telangana
    "hyderabad": ("TS", "Hyderabad"),
    "warangal": ("TS", "Warangal"),
    "nizamabad": ("TS", "Nizamabad"),
    "karimnagar": ("TS", "Karimnagar"),
    # Kerala
    "kochi": ("KL", "Ernakulam"),
    "thiruvananthapuram": ("KL", "Thiruvananthapuram"),
    "trivandrum": ("KL", "Thiruvananthapuram"),
    "kozhikode": ("KL", "Kozhikode"),
    "calicut": ("KL", "Kozhikode"),
    "thrissur": ("KL", "Thrissur"),
    # Punjab
    "amritsar": ("PB", "Amritsar"),
    "ludhiana": ("PB", "Ludhiana"),
    "jalandhar": ("PB", "Jalandhar"),
    "patiala": ("PB", "Patiala"),
    "mohali": ("PB", "SAS Nagar"),
    # Assam
    "guwahati": ("AS", "Kamrup Metropolitan"),
    "dispur": ("AS", "Kamrup Metropolitan"),
    "silchar": ("AS", "Cachar"),
    # Jharkhand
    "ranchi": ("JH", "Ranchi"),
    "jamshedpur": ("JH", "East Singhbhum"),
    "dhanbad": ("JH", "Dhanbad"),
    # Odisha
    "bhubaneswar": ("OD", "Khurda"),
    "cuttack": ("OD", "Cuttack"),
    "rourkela": ("OD", "Sundargarh"),
    # Himachal Pradesh
    "shimla": ("HP", "Shimla"),
    "dharamshala": ("HP", "Kangra"),
    # Uttarakhand
    "dehradun": ("UK", "Dehradun"),
    "haridwar": ("UK", "Haridwar"),
    "rishikesh": ("UK", "Dehradun"),
    # Jammu and Kashmir
    "srinagar": ("JK", "Srinagar"),
    "jammu": ("JK", "Jammu"),
    # Delhi
    "new delhi": ("DL", "New Delhi"),
    "delhi": ("DL", "Delhi"),
    "delhi ncr": ("DL", "Delhi"),
    # Goa
    "panaji": ("GA", "North Goa"),
    "margao": ("GA", "South Goa"),
    "vasco": ("GA", "South Goa"),
    # Chhattisgarh
    "raipur": ("CG", "Raipur"),
    "bhilai": ("CG", "Durg"),
    "bilaspur": ("CG", "Bilaspur"),
    # Andhra Pradesh
    "visakhapatnam": ("AP", "Visakhapatnam"),
    "vijayawada": ("AP", "NTR"),
    "tirupati": ("AP", "Tirupati"),
    "guntur": ("AP", "Guntur"),
}

# Vernacular Script Aliases
VERNACULAR_LOCATIONS: Dict[str, Dict[str, Any]] = {
    # Gujarati script
    "વડોદરા": {"city": "Vadodara", "district": "Vadodara", "state_code": "GJ"},
    "અમદાવાદ": {"city": "Ahmedabad", "district": "Ahmedabad", "state_code": "GJ"},
    "સુરત": {"city": "Surat", "district": "Surat", "state_code": "GJ"},
    "રાજકોટ": {"city": "Rajkot", "district": "Rajkot", "state_code": "GJ"},
    "ગુજરાત": {"state_code": "GJ"},
    # Devanagari script (Hindi/Marathi/Rajasthan/UP/MP)
    "जयपुर": {"city": "Jaipur", "district": "Jaipur", "state_code": "RJ"},
    "जोधपुर": {"city": "Jodhpur", "district": "Jodhpur", "state_code": "RJ"},
    "उदयपुर": {"city": "Udaipur", "district": "Udaipur", "state_code": "RJ"},
    "राजस्थान": {"state_code": "RJ"},
    "मुंबई": {"city": "Mumbai", "district": "Mumbai", "state_code": "MH"},
    "पुणे": {"city": "Pune", "district": "Pune", "state_code": "MH"},
    "नासिक": {"city": "Nashik", "district": "Nashik", "state_code": "MH"},
    "महाराष्ट्र": {"state_code": "MH"},
    "दिल्ली": {"state_code": "DL"},
    "लखनऊ": {"city": "Lucknow", "district": "Lucknow", "state_code": "UP"},
    "उत्तर प्रदेश": {"state_code": "UP"},
    "बिहार": {"state_code": "BR"},
    "पटना": {"city": "Patna", "district": "Patna", "state_code": "BR"},
    # Kannada script
    "ಕರ್ನಾಟಕ": {"state_code": "KA"},
    "ಬೆಂಗಳೂರು": {"city": "Bengaluru", "district": "Bengaluru Urban", "state_code": "KA"},
    "ಮೈಸೂರು": {"city": "Mysuru", "district": "Mysuru", "state_code": "KA"},
    # Bengali script
    "পশ্চিমবঙ্গ": {"state_code": "WB"},
    "কলকাতা": {"city": "Kolkata", "district": "Kolkata", "state_code": "WB"},
    # Tamil script
    "தமிழ்நாடு": {"state_code": "TN"},
    "சென்னை": {"city": "Chennai", "district": "Chennai", "state_code": "TN"},
    # Telugu script
    "తెలంగాణ": {"state_code": "TS"},
    "హైదరాబాద్": {"city": "Hyderabad", "district": "Hyderabad", "state_code": "TS"},
    "ఆంధ్ర ప్రదేశ్": {"state_code": "AP"},
    # Punjabi script
    "ਪੰਜਾਬ": {"state_code": "PB"},
    "ਅੰਮ੍ਰਿਤਸਰ": {"city": "Amritsar", "district": "Amritsar", "state_code": "PB"},
    # Malayalam script
    "കേരളം": {"state_code": "KL"},
    # Odia script
    "ଓଡ଼ିଶା": {"state_code": "OD"},
}

NATIONAL_KEYWORDS = ["across india", "all india", "nationwide", "central government", "india", "entire country", "pan india"]

class LocationEngine:
    @staticmethod
    def get_all_states_and_uts() -> List[Dict[str, Any]]:
        results = []
        for code, info in STATES_AND_UTS.items():
            results.append({
                "code": code,
                "name": info["name"],
                "is_ut": info["is_ut"]
            })
        return sorted(results, key=lambda x: x["name"])

    @staticmethod
    def extract_location(text: str) -> LocationContext:
        if not text:
            return LocationContext(
                country="India",
                confidence=0.0,
                needs_clarification=True,
                source="missing"
            )

        lower_text = text.lower()

        # 1. Vernacular Script Check
        for v_token, meta in VERNACULAR_LOCATIONS.items():
            if v_token in text:
                code = meta["state_code"]
                info = STATES_AND_UTS[code]
                return LocationContext(
                    country="India",
                    state_name=info["name"],
                    state_code=code,
                    is_ut=info["is_ut"],
                    district=meta.get("district"),
                    city=meta.get("city"),
                    confidence=0.99,
                    source="vernacular_user_text",
                    needs_clarification=False
                )

        # 2. City / District Match
        for city_key, (code, dist_name) in CITY_DISTRICT_MAP.items():
            if city_key in lower_text:
                info = STATES_AND_UTS[code]
                city_name = city_key.title() if city_key not in ["delhi ncr", "navi mumbai"] else city_key.title()
                return LocationContext(
                    country="India",
                    state_name=info["name"],
                    state_code=code,
                    is_ut=info["is_ut"],
                    district=dist_name,
                    city=city_name,
                    confidence=0.99,
                    source="explicit_user_text",
                    needs_clarification=False
                )

        # 3. Direct State / UT Match
        for code, info in STATES_AND_UTS.items():
            sname = info["name"].lower()
            if sname in lower_text:
                return LocationContext(
                    country="India",
                    state_name=info["name"],
                    state_code=code,
                    is_ut=info["is_ut"],
                    district=None,
                    city=None,
                    confidence=0.95,
                    source="explicit_user_text",
                    needs_clarification=False
                )

        # 4. Explicit National Scope Match
        if any(nk in lower_text for nk in NATIONAL_KEYWORDS):
            return LocationContext(
                country="India",
                state_name="Central",
                state_code="CENTRAL",
                is_ut=False,
                district=None,
                city=None,
                confidence=0.90,
                source="national_keyword",
                needs_clarification=False
            )

        # 5. NO location detected: Strictly return needs_clarification=True (Zero Karnataka Assumption!)
        return LocationContext(
            country="India",
            state_name=None,
            state_code=None,
            is_ut=False,
            district=None,
            city=None,
            confidence=0.0,
            source="unspecified",
            needs_clarification=True
        )

