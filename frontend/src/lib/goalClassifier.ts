/**
 * JANSETU - UNIVERSAL GOAL CLASSIFICATION ENGINE
 * 
 * Intent-based classification using keyword groups (not exact phrases).
 * Handles natural language queries of any form.
 */

// ============================================================
// CITY → STATE MAPPING (comprehensive)
// ============================================================
const CITY_TO_STATE: Record<string, string> = {
  'bangalore': 'Karnataka', 'bengaluru': 'Karnataka', 'mysore': 'Karnataka', 'mysuru': 'Karnataka',
  'mangalore': 'Karnataka', 'hubli': 'Karnataka', 'belgaum': 'Karnataka', 'belagavi': 'Karnataka',
  'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra', 'nashik': 'Maharashtra',
  'aurangabad': 'Maharashtra', 'thane': 'Maharashtra', 'navi mumbai': 'Maharashtra',
  'hyderabad': 'Telangana', 'warangal': 'Telangana', 'nizamabad': 'Telangana',
  'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu', 'salem': 'Tamil Nadu',
  'trichy': 'Tamil Nadu', 'tiruchirappalli': 'Tamil Nadu', 'tirunelveli': 'Tamil Nadu',
  'delhi': 'Delhi', 'new delhi': 'Delhi', 'noida': 'Uttar Pradesh', 'ghaziabad': 'Uttar Pradesh',
  'lucknow': 'Uttar Pradesh', 'varanasi': 'Uttar Pradesh', 'agra': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh',
  'jaipur': 'Rajasthan', 'udaipur': 'Rajasthan', 'jodhpur': 'Rajasthan', 'kota': 'Rajasthan',
  'ajmer': 'Rajasthan', 'bikaner': 'Rajasthan', 'pushkar': 'Rajasthan', 'alwar': 'Rajasthan',
  'vadodara': 'Gujarat', 'surat': 'Gujarat', 'ahmedabad': 'Gujarat', 'gandhinagar': 'Gujarat',
  'rajkot': 'Gujarat', 'bhavnagar': 'Gujarat', 'jamnagar': 'Gujarat', 'anand': 'Gujarat',
  'kolkata': 'West Bengal', 'howrah': 'West Bengal', 'darjeeling': 'West Bengal',
  'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh', 'gwalior': 'Madhya Pradesh', 'jabalpur': 'Madhya Pradesh',
  'patna': 'Bihar', 'gaya': 'Bihar', 'muzaffarpur': 'Bihar',
  'ranchi': 'Jharkhand', 'jamshedpur': 'Jharkhand', 'dhanbad': 'Jharkhand',
  'bhubaneswar': 'Odisha', 'cuttack': 'Odisha', 'puri': 'Odisha',
  'guwahati': 'Assam', 'dispur': 'Assam',
  'goa': 'Goa', 'panaji': 'Goa', 'vasco': 'Goa',
  'chandigarh': 'Chandigarh',
  'shimla': 'Himachal Pradesh', 'manali': 'Himachal Pradesh',
  'dehradun': 'Uttarakhand', 'haridwar': 'Uttarakhand',
  'thiruvananthapuram': 'Kerala', 'kochi': 'Kerala', 'cochin': 'Kerala', 'calicut': 'Kerala', 'kozhikode': 'Kerala',
  'vizag': 'Andhra Pradesh', 'visakhapatnam': 'Andhra Pradesh', 'vijayawada': 'Andhra Pradesh',
  'amritsar': 'Punjab', 'ludhiana': 'Punjab', 'jalandhar': 'Punjab',
  'jammu': 'Jammu and Kashmir', 'srinagar': 'Jammu and Kashmir',
  'imphal': 'Manipur', 'shillong': 'Meghalaya', 'agartala': 'Tripura',
  'aizawl': 'Mizoram', 'kohima': 'Nagaland', 'itanagar': 'Arunachal Pradesh',
  'gangtok': 'Sikkim', 'puducherry': 'Puducherry', 'pondicherry': 'Puducherry',
  // International
  'australia': 'Australia', 'sydney': 'Australia', 'melbourne': 'Australia', 'brisbane': 'Australia',
  'london': 'United Kingdom', 'uk': 'United Kingdom',
  'new york': 'United States', 'usa': 'United States', 'us': 'United States',
  'canada': 'Canada', 'toronto': 'Canada', 'vancouver': 'Canada',
  'germany': 'Germany', 'berlin': 'Germany', 'munich': 'Germany',
  'singapore': 'Singapore', 'dubai': 'UAE', 'uae': 'UAE',
};

// ============================================================
// INTENT CLASSIFICATION - keyword groups
// ============================================================
interface IntentCategory {
  id: string;
  label: string;
  keywords: string[];     // any match boosts score
  excludeKeywords: string[]; // any match penalizes score
  baseScore: number;
}

const INTENT_CATEGORIES: IntentCategory[] = [
  {
    id: 'STUDY_ABROAD',
    label: 'Study Abroad / International Education',
    keywords: ['abroad', 'overseas', 'foreign university', 'international', 'australia', 'uk', 'united kingdom',
      'usa', 'united states', 'canada', 'germany', 'singapore', 'dubai', 'new zealand', 'ireland',
      'masters abroad', 'study abroad', 'travel abroad', 'go abroad', 'foreign country',
      'विदेश', 'परदेश', 'ऑस्ट्रेलिया', 'विदेशी', 'வெளிநாடு', 'విదేశీ', 'বিদেশ', 'ਵਿਦੇਸ਼', 'विदेशमा'],
    excludeKeywords: [],
    baseScore: 10,
  },
  {
    id: 'EDUCATION',
    label: 'Education / Scholarship',
    keywords: ['education', 'school', 'college', 'university', 'degree', 'bachelor', 'master', 'phd',
      'scholarship', 'stipend', 'fellowship', 'study', 'tuition', 'academic', 'engineering', 'medical college',
      'student', 'exam', 'competitive exam', 'upsc', 'ssc', 'jee', 'neet', 'gate',
      'शिक्षा', 'पढ़ाई', 'छात्रवृत्ति', 'શિક્ષણ', 'கல்வி', 'విద్య', 'ਪੜ੍ਹਾਈ', 'শিক্ষাবৃত্তি', 'vidya', 'padhai', 'shiksha'],
    excludeKeywords: ['abroad', 'overseas', 'australia', 'uk', 'usa', 'canada', 'germany'],
    baseScore: 8,
  },
  {
    id: 'HEALTHCARE',
    label: 'Healthcare / Hospital / Medical',
    keywords: ['hospital', 'healthcare', 'health care', 'medical', 'clinic', 'nursing', 'pharmacy',
      'health facility', 'diagnostic', 'pathology', 'blood bank', 'dental', 'eye care',
      'ambulance', 'health center', 'primary health', 'community health', 'ayurveda', 'yoga center',
      'स्वास्थ्य', 'अस्पताल', 'इलाज', 'आरोग्य', 'மருத்துவம்', 'వైద్యం', 'স্বাস্হ্য', 'sehat', 'chikitsa'],
    excludeKeywords: [],
    baseScore: 9,
  },
  {
    id: 'PROPERTY_LAND',
    label: 'Property / Land / Real Estate',
    keywords: ['land', 'property', 'real estate', 'plot', 'house', 'home', 'flat', 'apartment',
      'buy land', 'purchase land', 'acquire land', 'buy property', 'purchase property',
      'sell land', 'sell property', 'register property', 'property registration',
      'construct', 'construction', 'build house', 'build home', 'build a house',
      'residential', 'commercial property', 'commercial land', 'agricultural land',
      'farm land', 'farmhouse', 'villa', 'mansion', 'floor', 'building',
      'encumbrance', 'title deed', 'sale deed', 'mutation', 'partition',
      'stamp duty', 'registration', 'sub registrar', 'khasra', 'khata',
      'land record', 'land ownership', 'land transfer', 'land deal', 'land purchase',
      'buy a land', 'buy land', 'buy plot', 'purchase a land', 'acquire a property',
      'जमीन', 'मकान', 'घर', 'प्लॉट', 'જમીન', 'ઘર', 'நிலம்', 'భూమి', 'জমি', 'makan', 'zameen', 'ghar', 'dastavej'],
    excludeKeywords: [],
    baseScore: 10,
  },
  {
    id: 'BUSINESS',
    label: 'Business / Startup / Enterprise',
    keywords: ['business', 'startup', 'enterprise', 'company', 'firm', 'shop', 'store',
      'retail', 'wholesale', 'manufacturing', 'factory', 'industry', 'msme', 'udyam',
      'restaurant', 'cafe', 'food business', 'catering', 'bakery', 'dhaba',
      'textile', 'garment', 'pharmaceutical', 'trading', 'export', 'import',
      'consultancy', 'services', 'technology', 'it company', 'software',
      'franchise', 'dealership', 'agency', 'distributor', 'supply',
      'register company', 'register business', 'start a business', 'open a business',
      'entrepreneur', 'entrepreneurship', 'sole proprietor', 'partnership firm',
      'llp', 'private limited', 'pvt ltd', 'public limited', 'opc',
      'व्यापार', 'व्यवसाय', 'दुकान', 'उद्योग', 'વેપાર', 'ધંધો', 'વ્યાપાર', 'தொழில்', 'వ్యాపారం', 'ব্যবসা', 'ਬਿਜ਼ਨਸ', 'dhandha', 'vyapar', 'karobar', 'dukan'],
    excludeKeywords: [],
    baseScore: 9,
  },
  {
    id: 'AGRICULTURE',
    label: 'Agriculture / Farming',
    keywords: ['agriculture', 'agricultural', 'farming', 'farmer', 'crop', 'harvest',
      'irrigation', 'kisan', 'fasal', 'tractor', 'fertilizer', 'seed',
      'dairy', 'poultry', 'fishery', 'horticulture', 'sericulture',
      'food processing', 'cold storage', 'warehouse', 'mandi',
      'land record', 'khasra', 'khatauni', 'jamabandi',
      'खेती', 'किसान', 'कृषि', 'ખેતી', 'விவசாயம்', 'రైతు', 'কৃষি', 'kheti', 'kisan', 'krishi'],
    excludeKeywords: [],
    baseScore: 8,
  },
  {
    id: 'DRIVING_LICENCE',
    label: 'Driving Licence / Transport',
    keywords: ['driving licence', 'driving license', 'dl', 'learner licence', 'learner license',
      'driving', 'vehicle', 'car', 'bike', 'two wheeler', 'four wheeler',
      'motor', 'rto', 'transport', 'rc', 'registration certificate',
      'learner permit', 'driving test', 'traffic',
      'लाइसेंस', 'गाड़ी', 'ड्राइविंग', 'વાહન', 'வாகனம்', 'లైసెన్స్'],
    excludeKeywords: [],
    baseScore: 8,
  },
  {
    id: 'PASSPORT',
    label: 'Passport / Travel Documents',
    keywords: ['passport', 'travel document', 'visa', 'immigration',
      'emigration', 'foreign travel', 'travel abroad',
      'पासपोर्ट', 'વીઝા', 'பாஸ்போர்ட்', 'పాస్‌పోర్ట్'],
    excludeKeywords: ['australia', 'uk', 'usa', 'canada', 'germany', 'abroad', 'overseas'],
    baseScore: 8,
  },
  {
    id: 'GOVERNMENT_JOB',
    label: 'Government Job / Employment',
    keywords: ['government job', 'govt job', 'sarkari naukri', 'public service',
      'civil service', 'psu', 'public sector', 'government employment',
      'recruitment', 'competitive', 'upsc', 'bpsc', 'mpsc', 'gpsc',
      'ssc', 'railway', 'banking', 'ibps', 'clerk', 'constable',
      'police', 'army', 'navy', 'air force', 'defence', 'defense',
      'postal', 'post office', 'teacher', 'professor',
      'सरकारी नौकरी', 'नौकरी', 'સરકારી નોકરી', 'அரசு வேலை', 'ఉద్యోగం', 'sarkari naukri'],
    excludeKeywords: [],
    baseScore: 8,
  },
  {
    id: 'FINANCE_LOAN',
    label: 'Finance / Loan / Banking',
    keywords: ['loan', 'home loan', 'business loan', 'education loan', 'personal loan',
      'car loan', 'gold loan', 'agriculture loan', 'kcc', 'kisan credit card',
      'mudra loan', 'credit', 'subsidy', 'interest subsidy', 'bank', 'banking',
      'insurance', 'pension', 'provident fund', 'epf', 'esi', 'nps',
      'mutual fund', 'investment', 'financial', 'microfinance', 'nbfc',
      'लोन', 'ऋण', 'कर्ज', 'સબસિડી', 'கடன்', 'రుణం', 'rin', 'karz'],
    excludeKeywords: [],
    baseScore: 7,
  },
  {
    id: 'NGO',
    label: 'NGO / Non-Profit / Social Enterprise',
    keywords: ['ngo', 'non profit', 'non-profit', 'charity', 'trust', 'society',
      'foundation', 'social enterprise', 'social work', 'voluntary organization',
      'section 8', 'not for profit', 'community organization', 'संस्था', 'ट्रस्ट'],
    excludeKeywords: [],
    baseScore: 8,
  },
  {
    id: 'VOTER_ID',
    label: 'Electoral Registration / Voter ID (EPIC)',
    keywords: ['voter id', 'voter card', 'epic', 'epic card', 'voter', 'election card', 'chunav card', 'matdata',
      'nvsp', 'voters.eci.gov.in', 'form 6', 'electoral roll', 'voting card', 'voter id apply', 'voter helpline',
      'मतदाता पहचान पत्र', 'वोटर कार्ड', 'मतदाता', 'ચૂંટણી કાર્ડ', 'வாக்காளர் அட்டை', 'ఓటరు కార్డు', 'ভোটার কার্ড'],
    excludeKeywords: [],
    baseScore: 15,
  },
  {
    id: 'PAN_CARD',
    label: 'PAN Card Issuance & Updation',
    keywords: ['pan card', 'pan card apply', 'pan application', 'new pan', 'instant pan', 'e-pan', 'nsdl pan', 'utiitsl pan',
      'form 49a', 'pan correction', 'pan aadhaar link', 'tax identification',
      'पैन कार्ड', 'पैन', 'પાન કાર્ડ', 'பான் கார்டு', 'పాన్ కార్డు', 'প্যান কার্ড'],
    excludeKeywords: [],
    baseScore: 15,
  },
  {
    id: 'RATION_CARD',
    label: 'Ration Card / Food Security (NFSA)',
    keywords: ['ration card', 'ration card apply', 'rashan card', 'nfsa', 'pds', 'food card', 'ration',
      'bpl ration', 'apl ration', 'antyodaya', 'aay card', 'food grains card', 'epds',
      'राशन कार्ड', 'राशन', 'રેશન કાર્ડ', 'ரேஷன் கார்டு', 'రేషన్ కార్డు', 'রেশন কার্ড'],
    excludeKeywords: [],
    baseScore: 14,
  },
  {
    id: 'VISA',
    label: 'Visa & Consular Services',
    keywords: ['visa', 'student visa', 'tourist visa', 'work visa', 'schengen visa', 'vfs', 'consular',
      'visa application', 'visa appointment', 'immigration visa', 'visa interview',
      'वीज़ा', 'વીઝા', 'விசா', 'వీసా', 'ভিসা'],
    excludeKeywords: ['pan', 'ration', 'voter'],
    baseScore: 12,
  },
  {
    id: 'WELFARE',
    label: 'Government Welfare / Social Security',
    keywords: ['welfare', 'pension', 'disability', 'senior citizen', 'widow',
      'benefit', 'subsidy', 'scheme', 'yojana', 'annadatta',
      'food security', 'bpl', 'below poverty', 'sc scheme',
      'st scheme', 'obc scheme', 'minority scheme', 'handicap',
      'divyang', 'disabled', 'social security', 'old age',
      'maternity', 'child welfare', 'women welfare',
      'कल्याण', 'योजना', 'पेंशन', 'યોજના', 'திட்டம்', 'పథకం'],
    excludeKeywords: ['voter', 'election', 'pan card', 'passport', 'driving licence', 'ration card'],
    baseScore: 6,
  },
];

// ============================================================
// INTENT CLASSIFICATION FUNCTION
// ============================================================
export function classifyIntent(query: string): { primary: string; label: string; score: number } {
  const q = query.toLowerCase().trim();
  
  // Strict Instant Overrides for Legal Identity Documents
  if (q.includes('voter') || q.includes('epic') || q.includes('matdata') || q.includes('nvsp') || q.includes('election card') || q.includes('chunav')) {
    return { primary: 'VOTER_ID', label: 'Electoral Registration / Voter ID (EPIC)', score: 30 };
  }
  if (q.includes('pan card') || q.includes('e-pan') || q.includes('nsdl pan') || q.includes('utiitsl') || q.includes('form 49a') || q === 'pan') {
    return { primary: 'PAN_CARD', label: 'PAN Card Issuance & Updation', score: 30 };
  }
  if (q.includes('ration card') || q.includes('rashan') || q.includes('nfsa') || q.includes('food security card') || q.includes('epds')) {
    return { primary: 'RATION_CARD', label: 'Ration Card / Food Security (NFSA)', score: 30 };
  }
  if ((q.includes('visa') || q.includes('vfs')) && !q.includes('pan') && !q.includes('ration')) {
    return { primary: 'VISA', label: 'Visa & Consular Services', score: 25 };
  }

  const scores: Record<string, number> = {};
  
  for (const cat of INTENT_CATEGORIES) {
    let score = 0;
    
    // Check exclude keywords first - penalize
    const hasExclude = cat.excludeKeywords.some(ek => q.includes(ek));
    if (hasExclude) continue; // skip this category entirely if exclude keywords match
    
    // Score based on keyword matches
    for (const kw of cat.keywords) {
      if (q.includes(kw)) {
        // Longer keyword matches get higher weight
        score += cat.baseScore + kw.length;
      }
    }
    
    if (score > 0) {
      scores[cat.id] = score;
    }
  }
  
  // Find the highest scoring category
  let bestId = 'WELFARE'; // default fallback
  let bestLabel = 'Government Welfare / General';
  let bestScore = 0;
  
  for (const [id, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
      bestLabel = INTENT_CATEGORIES.find(c => c.id === id)?.label || id;
    }
  }
  
  // Special combined checks
  const isProperty = q.includes('land') || q.includes('property') || q.includes('plot') || q.includes('construct') || q.includes('build house') || q.includes('build a house') || q.includes('buy') || q.includes('purchase');
  const isBusiness = q.includes('business') || q.includes('startup') || q.includes('restaurant') || q.includes('shop') || q.includes('cafe') || q.includes('manufacturing') || q.includes('factory');
  const isHealthcare = q.includes('hospital') || q.includes('healthcare') || q.includes('medical facility') || q.includes('clinic');
  
  if (isHealthcare && !isBusiness) {
    return { primary: 'HEALTHCARE', label: 'Healthcare / Hospital / Medical', score: 20 };
  }
  if (isProperty && !isBusiness) {
    return { primary: 'PROPERTY_LAND', label: 'Property / Land / Real Estate', score: 20 };
  }
  if (isBusiness && q.includes('food')) {
    return { primary: 'BUSINESS', label: 'Business / Food Establishment', score: 20 };
  }
  
  return { primary: bestId, label: bestLabel, score: bestScore };
}

// ============================================================
// LOCATION EXTRACTION
// ============================================================
export function extractLocation(query: string, domicileState: string): { location: string; state: string; destination: string | null } {
  const q = query.toLowerCase();
  
  // Check city → state mapping
  let foundState = '';
  let foundCity = '';
  
  // Sort by longest key first to match "bengaluru" before "bengal"
  const sortedCities = Object.keys(CITY_TO_STATE).sort((a, b) => b.length - a.length);
  
  for (const city of sortedCities) {
    if (q.includes(city)) {
      foundCity = city.charAt(0).toUpperCase() + city.slice(1);
      foundState = CITY_TO_STATE[city];
      break;
    }
  }
  
  // Check if it's an international destination
  const internationalDests = ['australia', 'uk', 'united kingdom', 'usa', 'united states', 'canada',
    'germany', 'singapore', 'dubai', 'uae', 'new zealand', 'ireland'];
  for (const dest of internationalDests) {
    if (q.includes(dest)) {
      return {
        location: foundCity || dest.charAt(0).toUpperCase() + dest.slice(1),
        state: domicileState || 'Not specified',
        destination: dest.charAt(0).toUpperCase() + dest.slice(1),
      };
    }
  }
  
  if (foundState) {
    return { location: foundCity, state: foundState, destination: null };
  }
  
  // Use domicile as fallback
  return {
    location: domicileState || 'Not specified',
    state: domicileState || 'Not specified',
    destination: null,
  };
}

// ============================================================
// UNIVERSAL DOCUMENT KNOWLEDGE BASE
// ============================================================

// Common documents available to most citizens
const BASE_AVAILABLE_DOCS = [
  { name: 'Aadhaar Card', verification_status: 'VERIFIED', type: 'AADHAAR' },
  { name: 'PAN Card', verification_status: 'VERIFIED', type: 'PAN' },
];

const EXTENDED_AVAILABLE_DOCS = [
  ...BASE_AVAILABLE_DOCS,
  { name: '10th Marksheet (SSC)', verification_status: 'VERIFIED', type: 'CLASS_10_MARKSHEET' },
  { name: '12th Marksheet (HSC)', verification_status: 'VERIFIED', type: 'CLASS_12_MARKSHEET' },
  { name: 'Degree Certificate', verification_status: 'VERIFIED', type: 'DEGREE_CERTIFICATE' },
];

// Document requirements by intent
interface DocRequirement {
  name: string;
  status: string;
  reason: string;
  priority: string;
}

const DOCUMENT_REQUIREMENTS: Record<string, DocRequirement[]> = {
  STUDY_ABROAD: [
    { name: 'Valid Passport', status: 'Required', reason: 'Required for international travel and student visa', priority: 'Required' },
    { name: 'English Proficiency Test Score (IELTS/PTE/TOEFL)', status: 'Required', reason: 'Required by most international universities for admission', priority: 'Required' },
    { name: 'University Offer / Admission Letter', status: 'Conditional', reason: 'Required for student visa application', priority: 'Conditional' },
    { name: 'Academic Transcripts', status: 'Required', reason: 'Official transcripts from all attended institutions', priority: 'Required' },
    { name: 'Statement of Purpose (SOP)', status: 'Required', reason: 'Required for university application', priority: 'Required' },
    { name: 'Letters of Recommendation (LOR)', status: 'Required', reason: 'Required by most universities', priority: 'Conditional' },
    { name: 'Financial Capacity Certificate / Bank Statements', status: 'Required', reason: 'Proof of funds for GTE assessment and visa', priority: 'Required' },
    { name: 'Income Certificate', status: 'Required', reason: 'May be required for scholarships and financial assessment', priority: 'Conditional' },
    { name: 'Medical Insurance', status: 'Conditional', reason: 'Required by some countries/universities', priority: 'Conditional' },
  ],
  EDUCATION: [
    { name: 'Income Certificate (Family)', status: 'Required', reason: 'Most scholarships require proof of family income below threshold', priority: 'Required' },
    { name: 'College Admission Letter / Fee Receipt', status: 'Required', reason: 'Proof of enrollment in a recognized institution', priority: 'Required' },
    { name: 'Previous Academic Mark Sheets', status: 'Required', reason: 'Required for scholarship and admission applications', priority: 'Required' },
    { name: 'Caste Certificate (if applicable)', status: 'Conditional', reason: 'Required for SC/ST/OBC scholarship categories', priority: 'Conditional' },
    { name: 'Domicile Certificate', status: 'Conditional', reason: 'Required for state-specific scholarships', priority: 'Conditional' },
    { name: 'Bank Passbook', status: 'Required', reason: 'For direct benefit transfer of scholarship amount', priority: 'Required' },
  ],
  HEALTHCARE: [
    { name: 'Business Registration Certificate', status: 'Required', reason: 'Proof of entity registration for healthcare facility', priority: 'Required' },
    { name: 'Land / Premises Ownership or Lease', status: 'Required', reason: 'Proof of premises for healthcare establishment', priority: 'Required' },
    { name: 'FSSAI License (if applicable)', status: 'Conditional', reason: 'Required if facility includes food/pharmacy services', priority: 'Conditional' },
    { name: 'Drug License', status: 'Required', reason: 'Required for dispensing pharmacy within healthcare facility', priority: 'Required' },
    { name: 'NOC from Local Authority', status: 'Required', reason: 'No objection certificate from municipal/local body', priority: 'Required' },
    { name: 'Fire Safety NOC', status: 'Required', reason: 'Mandatory for healthcare establishments', priority: 'Required' },
    { name: 'Biomedical Waste Management Authorization', status: 'Required', reason: 'Mandatory under Biomedical Waste Management Rules', priority: 'Required' },
    { name: 'Establishment License / Trade License', status: 'Required', reason: 'Local body license for operating healthcare facility', priority: 'Required' },
    { name: 'Professional Medical Practitioner Registration', status: 'Required', reason: 'Registration of qualified medical practitioners', priority: 'Required' },
  ],
  PROPERTY_LAND: [
    { name: 'Identity Proof (Aadhaar + PAN)', status: 'Required', reason: 'Mandatory for property transactions and registration', priority: 'Required' },
    { name: 'Address Proof', status: 'Required', reason: 'Current address verification for registration', priority: 'Required' },
    { name: 'Sale Agreement / Sale Deed', status: 'Required', reason: 'Legal document for property transfer', priority: 'Required' },
    { name: 'Title Deed / Ownership Document', status: 'Required', reason: 'Proof of clear title of the seller', priority: 'Required' },
    { name: 'Encumbrance Certificate', status: 'Required', reason: 'Confirms no legal dues or charges on property', priority: 'Required' },
    { name: 'Property Tax Receipts', status: 'Required', reason: 'Proof of up-to-date property tax payments', priority: 'Required' },
    { name: 'Stamp Duty Payment Receipt', status: 'Required', reason: 'Mandatory for property registration', priority: 'Required' },
    { name: 'Mutation Record / Khata', status: 'Conditional', reason: 'Required for agricultural land transfer', priority: 'Conditional' },
    { name: 'NOC from Relevant Authority', status: 'Conditional', reason: 'May be required for specific property types (agricultural, heritage, etc.)', priority: 'Conditional' },
    { name: 'Sub-Registrar Documents', status: 'Required', reason: 'Documents required at the sub-registrar office', priority: 'Required' },
  ],
  BUSINESS: [
    { name: 'Business Constitution Document', status: 'Required', reason: 'Partnership deed / MOA / AOA depending on business structure', priority: 'Required' },
    { name: 'Commercial Premises Lease / Rent Agreement', status: 'Required', reason: 'Proof of business address for registrations', priority: 'Required' },
    { name: 'Udyam / MSME Registration', status: 'Required', reason: 'Central MSME recognition for subsidies and lending', priority: 'Required' },
    { name: 'Trade License', status: 'Required', reason: 'Local municipal authority license to operate commercial business', priority: 'Required' },
    { name: 'GST Registration', status: 'Conditional', reason: 'Required if annual turnover exceeds ₹20 lakhs', priority: 'Conditional' },
    { name: 'FSSAI License', status: 'Conditional', reason: 'Mandatory for food businesses', priority: 'Conditional' },
    { name: 'Fire Safety NOC', status: 'Conditional', reason: 'Required for commercial premises with specific conditions', priority: 'Conditional' },
    { name: 'Shops and Establishment Registration', status: 'Required', reason: 'State-level mandatory registration for commercial establishments', priority: 'Required' },
    { name: 'Professional Tax Registration', status: 'Conditional', reason: 'Required in states with professional tax', priority: 'Conditional' },
    { name: 'Bank Account (Current Account)', status: 'Required', reason: 'For business transactions and compliance', priority: 'Required' },
  ],
  AGRICULTURE: [
    { name: 'Land Record (Khasra/Khatoni)', status: 'Required', reason: 'Proof of agricultural land ownership', priority: 'Required' },
    { name: 'Bank Passbook (Nationalized Bank)', status: 'Required', reason: 'For Direct Benefit Transfer (DBT) of subsidies', priority: 'Required' },
    { name: 'Aadhaar Card (Linked to Bank)', status: 'Required', reason: 'Required for PM-KISAN and other scheme DBT', priority: 'Required' },
    { name: 'Land Ownership / Possession Certificate', status: 'Required', reason: 'Proof of cultivable land for scheme eligibility', priority: 'Required' },
    { name: 'Soil Health Card', status: 'Conditional', reason: 'Recommended for scheme benefits and soil testing', priority: 'Conditional' },
    { name: 'Crop Insurance Receipt', status: 'Conditional', reason: 'For PMFBY crop insurance claims', priority: 'Conditional' },
  ],
  DRIVING_LICENCE: [
    { name: 'Proof of Date of Birth', status: 'Required', reason: 'Required to verify minimum age of 18', priority: 'Required' },
    { name: 'Address Proof', status: 'Required', reason: 'Required for RTO application', priority: 'Required' },
    { name: 'Learner\'s Licence', status: 'Required', reason: 'Mandatory prerequisite before driving test', priority: 'Required' },
    { name: 'Passport-size Photograph', status: 'Required', reason: 'Required for licence application', priority: 'Required' },
    { name: 'Medical Certificate (Form 1A)', status: 'Conditional', reason: 'Required for applicants above 40 years', priority: 'Conditional' },
  ],
  PASSPORT: [
    { name: 'Proof of Date of Birth', status: 'Required', reason: 'Required for passport application', priority: 'Required' },
    { name: 'Address Proof (Current Residence)', status: 'Required', reason: 'Required to verify current address', priority: 'Required' },
    { name: 'Aadhaar Card', status: 'Required', reason: 'Primary identity document for passport application', priority: 'Required' },
    { name: 'PAN Card', status: 'Conditional', reason: 'Required for Tatkal passport applications', priority: 'Conditional' },
    { name: 'Old Passport (if applicable)', status: 'Conditional', reason: 'Required for renewal/reissue', priority: 'Conditional' },
  ],
  GOVERNMENT_JOB: [
    { name: 'Educational Certificates (All levels)', status: 'Required', reason: 'Proof of educational qualification for eligibility', priority: 'Required' },
    { name: 'Caste Certificate (if applicable)', status: 'Conditional', reason: 'Required for reserved category candidates', priority: 'Conditional' },
    { name: 'Domicile Certificate', status: 'Required', reason: 'Required for state-level government positions', priority: 'Required' },
    { name: 'Character Certificate', status: 'Required', reason: 'Required during document verification', priority: 'Required' },
    { name: 'Medical Fitness Certificate', status: 'Required', reason: 'Required for physical/medical fitness verification', priority: 'Required' },
    { name: 'Experience Certificate', status: 'Conditional', reason: 'Required for experienced/recruitment positions', priority: 'Conditional' },
    { name: 'NCC Certificate (if applicable)', status: 'Conditional', reason: 'Additional weightage for NCC certificate holders', priority: 'Conditional' },
  ],
  FINANCE_LOAN: [
    { name: 'Income Certificate (Family)', status: 'Required', reason: 'Required to assess loan eligibility and interest rates', priority: 'Required' },
    { name: 'Bank Statements (Last 6 months)', status: 'Required', reason: 'Required for financial assessment', priority: 'Required' },
    { name: 'Business Plan / Project Report', status: 'Required', reason: 'Required for business loan applications', priority: 'Conditional' },
    { name: 'Property Documents (for secured loans)', status: 'Conditional', reason: 'Required for home/land/collateral-based loans', priority: 'Conditional' },
    { name: 'Salary Slips (if salaried)', status: 'Conditional', reason: 'Required for salaried individual loan applications', priority: 'Conditional' },
    { name: 'PAN Card', status: 'Required', reason: 'Mandatory for all loan applications', priority: 'Required' },
  ],
  NGO: [
    { name: 'Trust Deed / Memorandum of Association', status: 'Required', reason: 'Legal document establishing the organization', priority: 'Required' },
    { name: 'Registration Certificate', status: 'Required', reason: 'Proof of registration under applicable Act', priority: 'Required' },
    { name: 'PAN Card (Organization)', status: 'Required', reason: 'Tax registration for the organization', priority: 'Required' },
    { name: 'Board Resolution', status: 'Required', reason: 'Authorizing document for organizational decisions', priority: 'Required' },
    { name: 'FCRA Registration (if accepting foreign funds)', status: 'Conditional', reason: 'Required for receiving foreign contributions', priority: 'Conditional' },
    { name: 'Annual Audit Reports', status: 'Required', reason: 'Mandatory for compliance and transparency', priority: 'Required' },
  ],
  VOTER_ID: [
    { name: 'Proof of Date of Birth (Aadhaar / 10th Marksheet / Birth Certificate)', status: 'Required', reason: 'To verify age eligibility (18+ years) under ECI norms', priority: 'Required' },
    { name: 'Proof of Ordinary Residence / Address (Electricity Bill / Aadhaar / Rent Agreement)', status: 'Required', reason: 'To determine your Assembly Constituency and Polling Part Number', priority: 'Required' },
    { name: 'Passport-size Photograph (White Background)', status: 'Required', reason: 'For digital printing on the physical EPIC smart card', priority: 'Required' },
    { name: 'Family Member EPIC / Voter ID (Optional)', status: 'Conditional', reason: 'Helps in automatic grouping with same polling booth / part', priority: 'Conditional' },
    { name: 'Aadhaar Card (Form 6B Seeding)', status: 'Conditional', reason: 'For voluntary biometric authentication with Electoral Roll', priority: 'Conditional' },
  ],
  PAN_CARD: [
    { name: 'Proof of Identity (Aadhaar Card / Voter ID / Passport)', status: 'Required', reason: 'Primary identity verification for CBDT tax database', priority: 'Required' },
    { name: 'Proof of Date of Birth (Aadhaar / Birth Certificate / Marksheet)', status: 'Required', reason: 'Mandatory DOB record for Income Tax Department', priority: 'Required' },
    { name: 'Proof of Address (Aadhaar / Utility Bill / Bank Statement)', status: 'Required', reason: 'For physical PAN card dispatch via India Post Speed Post', priority: 'Required' },
    { name: 'Digital Passport-size Photo & Signature', status: 'Required', reason: 'Required for Form 49A physical card printing', priority: 'Required' },
  ],
  RATION_CARD: [
    { name: 'Aadhaar Cards of All Family Members', status: 'Required', reason: 'Mandatory seeding for One Nation One Ration Card (ONORC)', priority: 'Required' },
    { name: 'Income Certificate / BPL Certificate', status: 'Required', reason: 'Determines NFSA Priority Household (PHH) or Antyodaya (AAY) category', priority: 'Required' },
    { name: 'Current Residence Proof / Electricity Bill', status: 'Required', reason: 'To assign designated Fair Price Shop (FPS) in your ward/village', priority: 'Required' },
    { name: 'Bank Passbook (Head of Household)', status: 'Required', reason: 'For direct food subsidy transfer and DBTL schemes', priority: 'Required' },
    { name: 'Family Group Photograph', status: 'Required', reason: 'Required for State Food & Civil Supplies departmental card record', priority: 'Required' },
  ],
  VISA: [
    { name: 'Valid Indian Passport (Min. 6 months validity)', status: 'Required', reason: 'Primary international travel document', priority: 'Required' },
    { name: 'Visa Application Form & Confirmation Page', status: 'Required', reason: 'Official consular application record (DS-160 / VFS / E-Visa)', priority: 'Required' },
    { name: 'Proof of Financial Means / Bank Statements (6 Months)', status: 'Required', reason: 'Proof of sufficient funds to cover foreign stay', priority: 'Required' },
    { name: 'Invitation Letter / University Offer / Travel Itinerary', status: 'Required', reason: 'Purpose of visit verification', priority: 'Required' },
    { name: 'Travel Medical Insurance', status: 'Required', reason: 'Mandatory for Schengen, UK, and overseas territories', priority: 'Required' },
  ],
  WELFARE: [
    { name: 'Aadhaar Card', status: 'Required', reason: 'Primary identity document for welfare schemes', priority: 'Required' },
    { name: 'Income Certificate', status: 'Required', reason: 'Required for eligibility assessment for BPL/EWS schemes', priority: 'Required' },
    { name: 'Caste Certificate (if applicable)', status: 'Conditional', reason: 'Required for category-specific welfare schemes', priority: 'Conditional' },
    { name: 'Domicile Certificate', status: 'Conditional', reason: 'Required for state-specific welfare schemes', priority: 'Conditional' },
    { name: 'Bank Account Details', status: 'Required', reason: 'For Direct Benefit Transfer', priority: 'Required' },
    { name: 'BPL Certificate (if applicable)', status: 'Conditional', reason: 'Required for Below Poverty Line schemes', priority: 'Conditional' },
  ],
};

// Available docs by intent
const AVAILABLE_DOCS_BY_INTENT: Record<string, typeof EXTENDED_AVAILABLE_DOCS> = {
  STUDY_ABROAD: EXTENDED_AVAILABLE_DOCS,
  EDUCATION: EXTENDED_AVAILABLE_DOCS,
  HEALTHCARE: BASE_AVAILABLE_DOCS,
  PROPERTY_LAND: BASE_AVAILABLE_DOCS,
  BUSINESS: BASE_AVAILABLE_DOCS,
  AGRICULTURE: BASE_AVAILABLE_DOCS,
  DRIVING_LICENCE: BASE_AVAILABLE_DOCS,
  PASSPORT: BASE_AVAILABLE_DOCS,
  VOTER_ID: BASE_AVAILABLE_DOCS,
  PAN_CARD: BASE_AVAILABLE_DOCS,
  RATION_CARD: BASE_AVAILABLE_DOCS,
  VISA: EXTENDED_AVAILABLE_DOCS,
  GOVERNMENT_JOB: EXTENDED_AVAILABLE_DOCS,
  FINANCE_LOAN: BASE_AVAILABLE_DOCS,
  NGO: BASE_AVAILABLE_DOCS,
  WELFARE: BASE_AVAILABLE_DOCS,
};

// ============================================================
// GOVERNMENT SCHEME KNOWLEDGE BASE
// ============================================================
interface SchemeInfo {
  id: string;
  name: string;
  description: string;
  level: 'CENTRAL' | 'STATE';
  department: string;
  category: string;
  official_source_url: string;
  eligibility_summary: string;
}

const CENTRAL_SCHEMES: Record<string, SchemeInfo[]> = {
  STUDY_ABROAD: [
    {
      id: 'nos', name: 'National Overseas Scholarship (NOS)',
      description: 'GOI scholarship for SC/ST/Denotified Tribes to pursue Master\'s or Ph.D. abroad. Covers tuition, living expenses, and allowances.',
      level: 'CENTRAL', department: 'Ministry of Social Justice & Empowerment', category: 'education',
      official_source_url: 'https://nosmsje.gov.in', eligibility_summary: 'SC/ST/DNT category with family income below threshold'
    },
    {
      id: 'pm-vidyalaxmi', name: 'PM Vidyalaxmi - Education Loan & Interest Subvention',
      description: 'Full interest subvention during moratorium for education loans up to ₹10 lakhs.',
      level: 'CENTRAL', department: 'Ministry of Education', category: 'education',
      official_source_url: 'https://www.vidyalakshmi.co.in', eligibility_summary: 'Family income below ₹8 lakh'
    },
  ],
  EDUCATION: [
    {
      id: 'nsp', name: 'National Scholarship Portal (NSP) Schemes',
      description: 'Centralized portal for Post-Matric and Pre-Matric scholarships for SC/ST/OBC/Minority students.',
      level: 'CENTRAL', department: 'Ministry of Education', category: 'education',
      official_source_url: 'https://scholarships.gov.in', eligibility_summary: 'Students from SC/ST/OBC/Minority with income below threshold'
    },
    {
      id: 'pm-vidya', name: 'PM Vidya - Digital Learning Initiative',
      description: 'Free digital learning resources and platforms for students.',
      level: 'CENTRAL', department: 'Ministry of Education', category: 'education',
      official_source_url: 'https://www.education.gov.in', eligibility_summary: 'All enrolled students'
    },
  ],
  HEALTHCARE: [
    {
      id: 'pmjay', name: 'Ayushman Bharat - PM-JAY',
      description: 'Health insurance coverage up to ₹5 lakh per family per year for secondary and tertiary hospitalization.',
      level: 'CENTRAL', department: 'Ministry of Health & Family Welfare', category: 'health',
      official_source_url: 'https://pmjay.gov.in', eligibility_summary: 'Families in deprivation categories as per SECC database'
    },
    {
      id: 'ab-hwc', name: 'Ayushman Bharat - Health & Wellness Centres',
      description: 'Comprehensive primary healthcare services at upgraded health centres.',
      level: 'CENTRAL', department: 'Ministry of Health & Family Welfare', category: 'health',
      official_source_url: 'https://abdm.gov.in', eligibility_summary: 'All citizens - free primary healthcare services'
    },
  ],
  PROPERTY_LAND: [
    {
      id: 'pmay', name: 'Pradhan Mantri Awas Yojana (PMAY)',
      description: 'Housing for All - credit-linked subsidy for construction/purchase of house.',
      level: 'CENTRAL', department: 'Ministry of Housing & Urban Affairs', category: 'housing',
      official_source_url: 'https://pmaymis.gov.in', eligibility_summary: 'EWS/LIG/MIG families without pucca house'
    },
    {
      id: 'swayam', name: 'Swaminathan Research Foundation - Land Records Digitization',
      description: 'Digital India Land Records Modernization Programme for transparent land records.',
      level: 'CENTRAL', department: 'Department of Land Resources', category: 'land',
      official_source_url: 'https://dilr.gov.in', eligibility_summary: 'All landowners - free digital access to land records'
    },
  ],
  BUSINESS: [
    {
      id: 'udyam', name: 'Udyam Registration - MSME Recognition',
      description: 'Free MSME registration unlocking priority lending, credit guarantee, and government tender preferences.',
      level: 'CENTRAL', department: 'Ministry of MSME', category: 'business',
      official_source_url: 'https://udyamregistration.gov.in', eligibility_summary: 'All micro, small, and medium enterprises'
    },
    {
      id: 'startup-india', name: 'Startup India - Tax & Regulatory Benefits',
      description: '3-year income tax exemption, fast-track patent examination, and self-certification for DPIIT-recognized startups.',
      level: 'CENTRAL', department: 'DPIIT', category: 'business',
      official_source_url: 'https://www.startupindia.gov.in', eligibility_summary: 'Startups under 10 years with turnover < ₹100 crore'
    },
    {
      id: 'mudra', name: 'Mudra Loan - Pradhan Mantri Mudra Yojana',
      description: 'Collateral-free loans up to ₹10 lakh for non-farm micro enterprises.',
      level: 'CENTRAL', department: 'Ministry of Finance', category: 'finance',
      official_source_url: 'https://www.mudra.org.in', eligibility_summary: 'Non-farm micro enterprises and small businesses'
    },
  ],
  AGRICULTURE: [
    {
      id: 'pm-kisan', name: 'PM-KISAN - Direct Income Support for Farmers',
      description: '₹6,000/year in 3 instalments of ₹2,000 directly to eligible farmer families\' bank accounts.',
      level: 'CENTRAL', department: 'Ministry of Agriculture & Farmers Welfare', category: 'agriculture',
      official_source_url: 'https://pmkisan.gov.in', eligibility_summary: 'Small/marginal farmer families with cultivable land'
    },
    {
      id: 'pmfby', name: 'PMFBY - Pradhan Mantri Fasal Bima Yojana',
      description: 'Comprehensive crop insurance at 2% (Kharif) / 1.5% (Rabi) premium - government pays the rest.',
      level: 'CENTRAL', department: 'Ministry of Agriculture & Farmers Welfare', category: 'agriculture',
      official_source_url: 'https://pmfby.gov.in', eligibility_summary: 'All farmers including sharecroppers and tenant farmers'
    },
    {
      id: 'kcc', name: 'Kisan Credit Card (KCC)',
      description: 'Easy credit at 4% interest for agricultural needs including crop production and post-harvest expenses.',
      level: 'CENTRAL', department: 'Ministry of Agriculture & Farmers Welfare', category: 'finance',
      official_source_url: 'https://pmkisan.gov.in', eligibility_summary: 'All farmers with cultivable land'
    },
  ],
  DRIVING_LICENCE: [
    {
      id: 'sarathi', name: 'Sarathi Parivahan - Driving Licence Service',
      description: 'Online portal for learner licence, permanent DL, renewal, and international DL.',
      level: 'CENTRAL', department: 'Ministry of Road Transport & Highways', category: 'documents',
      official_source_url: 'https://sarathi.parivahan.gov.in', eligibility_summary: 'All Indian residents above 18 years'
    },
  ],
  PASSPORT: [
    {
      id: 'passport-seva', name: 'Passport Seva - Official Passport Issuance',
      description: 'Online passport issuance with PSK appointment, document verification, and home delivery.',
      level: 'CENTRAL', department: 'Ministry of External Affairs', category: 'documents',
      official_source_url: 'https://passportindia.gov.in', eligibility_summary: 'All Indian citizens'
    },
  ],
  GOVERNMENT_JOB: [
    {
      id: 'upsc', name: 'UPSC - Civil Services Examination',
      description: 'Annual recruitment for IAS, IPS, IFS, and other Central Services.',
      level: 'CENTRAL', department: 'Union Public Service Commission', category: 'employment',
      official_source_url: 'https://www.upsc.gov.in', eligibility_summary: 'Indian citizens aged 21-32 with graduation'
    },
    {
      id: 'ssc', name: 'Staff Selection Commission (SSC)',
      description: 'Recruitment for Group B and C posts in Central Government departments.',
      level: 'CENTRAL', department: 'Staff Selection Commission', category: 'employment',
      official_source_url: 'https://ssc.nic.in', eligibility_summary: 'Indian citizens with 10th/12th/Graduation qualification'
    },
  ],
  FINANCE_LOAN: [
    {
      id: 'pm-swanidhi', name: 'PM SVANidhi - Street Vendor Support',
      description: 'Working capital loan up to ₹50,000 for street vendors with interest subsidy.',
      level: 'CENTRAL', department: 'Ministry of Housing & Urban Affairs', category: 'finance',
      official_source_url: 'https://pmsvanidhi.mohua.gov.in', eligibility_summary: 'Street vendors with certificate of vending'
    },
    {
      id: 'cgfp', name: 'Credit Guarantee Fund Trust (CGTMSE)',
      description: 'Collateral-free loans up to ₹2 crore for MSMEs without third-party guarantee.',
      level: 'CENTRAL', department: 'Ministry of MSME', category: 'finance',
      official_source_url: 'https://www.cgtmse.in', eligibility_summary: 'Registered MSMEs with viable business plans'
    },
  ],
  NGO: [
    {
      id: 'csr', name: 'CSR Funding - Corporate Social Responsibility',
      description: 'Access CSR funds from corporates for social development projects.',
      level: 'CENTRAL', department: 'Ministry of Corporate Affairs', category: 'social',
      official_source_url: 'https://www.mca.gov.in', eligibility_summary: 'Registered NGOs with track record'
    },
  ],
  WELFARE: [
    {
      id: 'pm-uday', name: 'PM UDAY - Ujala LED Distribution',
      description: 'Free LED bulb distribution to reduce electricity bills.',
      level: 'CENTRAL', department: 'Ministry of Power', category: 'welfare',
      official_source_url: 'https://www.jagardishti.gov.in', eligibility_summary: 'All BPL families'
    },
    {
      id: 'pm-svanidhi-w', name: 'PM SVANidhi - Street Vendor Support',
      description: 'Working capital loan up to ₹50,000 for street vendors.',
      level: 'CENTRAL', department: 'Ministry of Housing & Urban Affairs', category: 'finance',
      official_source_url: 'https://pmsvanidhi.mohua.gov.in', eligibility_summary: 'Street vendors'
    },
  ],
  VOTER_ID: [
    {
      id: 'eci-epic', name: 'ECI Form 6 - New Voter Registration & EPIC Issuance',
      description: 'Official Election Commission of India digital enrollment for first-time voters (18+) with electronic e-EPIC download and doorstep speed post delivery.',
      level: 'CENTRAL', department: 'Election Commission of India (ECI)', category: 'documents',
      official_source_url: 'https://voters.eci.gov.in', eligibility_summary: 'All Indian citizens aged 18 years or above'
    },
    {
      id: 'eci-form8', name: 'ECI Form 8 - Electoral Roll Correction & Shifting',
      description: 'Online correction of name, photo, address, or constituency transfer on national voter register.',
      level: 'CENTRAL', department: 'Election Commission of India (ECI)', category: 'documents',
      official_source_url: 'https://voters.eci.gov.in', eligibility_summary: 'Existing registered electors in India'
    },
  ],
  PAN_CARD: [
    {
      id: 'nsdl-pan', name: 'Protean NSDL - Form 49A Online PAN Card Service',
      description: 'Central Board of Direct Taxes (CBDT) online PAN issuance with Paperless Aadhaar e-KYC and digital e-PAN delivery within 2 hours.',
      level: 'CENTRAL', department: 'Income Tax Department / Ministry of Finance', category: 'documents',
      official_source_url: 'https://onlineservices.nsdl.com/paam/endUserRegisterContact.html', eligibility_summary: 'All Indian citizens and tax entities'
    },
    {
      id: 'utiitsl-pan', name: 'UTIITSL National PAN Portal',
      description: 'Alternate official Government gateway for physical and digital PAN card processing.',
      level: 'CENTRAL', department: 'UTI Infrastructure Technology And Services Limited', category: 'documents',
      official_source_url: 'https://www.pan.utiitsl.com', eligibility_summary: 'All Indian residents'
    },
  ],
  RATION_CARD: [
    {
      id: 'onorc-nfsa', name: 'One Nation One Ration Card (ONORC) - NFSA',
      description: 'National food security entitlement scheme enabling subsidized food grains from any Fair Price Shop across India via biometric authentication.',
      level: 'CENTRAL', department: 'Department of Food & Public Distribution', category: 'welfare',
      official_source_url: 'https://nfsa.gov.in', eligibility_summary: 'Eligible households identified under NFSA criteria'
    },
    {
      id: 'state-pds-card', name: 'State PDS Digital Ration Card Issuance',
      description: 'State Food & Civil Supplies online portal for new ration card issuance and member addition.',
      level: 'CENTRAL', department: 'Ministry of Consumer Affairs, Food & Public Distribution', category: 'welfare',
      official_source_url: 'https://nfsa.gov.in/portal/State_UT_Portals', eligibility_summary: 'Households residing in respective state jurisdiction'
    },
  ],
  VISA: [
    {
      id: 'mea-visa-consular', name: 'Ministry of External Affairs - Consular & Visa Guidance',
      description: 'National consular clearance advisory and document attestation for overseas visa processing.',
      level: 'CENTRAL', department: 'Ministry of External Affairs (MEA)', category: 'documents',
      official_source_url: 'https://www.mea.gov.in', eligibility_summary: 'Indian passport holders traveling abroad'
    },
  ],
};

// State-specific scheme templates (applied when domicile matches)
const STATE_SCHEME_TEMPLATES: Record<string, SchemeInfo[]> = {
  Rajasthan: [
    { id: 'raj-rgs', name: 'Rajiv Gandhi Scholarship for Academic Excellence', description: 'Full scholarship for top QS universities - tuition, living, travel, visa.', level: 'STATE', department: 'Higher Education Dept, Rajasthan', category: 'education', official_source_url: 'https://hte.rajasthan.gov.in', eligibility_summary: 'Rajasthan domicile, top 200 QS university admission' },
    { id: 'raj-mlupy', name: 'MLUPY - Mukhyamantri Laghu Udyog Protsahan Yojana', description: 'Interest subsidy of 5-8% per annum for 5 years on bank loans for new micro/small enterprises.', level: 'STATE', department: 'Rajasthan MSME & Industries Dept', category: 'business', official_source_url: 'https://industries.rajasthan.gov.in', eligibility_summary: 'New MSMEs in Rajasthan' },
    { id: 'raj-kisan', name: 'Mukhyamantri Krishak Saathi Yojana', description: 'Financial compensation to farmers in case of death/disability during agricultural work.', level: 'STATE', department: 'Agriculture Dept, Rajasthan', category: 'agriculture', official_source_url: 'https://agriculture.rajasthan.gov.in', eligibility_summary: 'Farmers in Rajasthan' },
  ],
  Gujarat: [
    { id: 'gj-msme', name: 'Gujarat MSME Assistance Scheme', description: 'Capital subsidy, power tariff subsidy, and SGST reimbursement for new enterprises.', level: 'STATE', department: 'Industries Commissionerate, Gujarat', category: 'business', official_source_url: 'https://ic.gujarat.gov.in', eligibility_summary: 'New MSMEs in Gujarat' },
    { id: 'gj-kutir', name: 'Gujarat Cottage & Rural Industries', description: 'Subsidies for cottage industries and rural enterprise development.', level: 'STATE', department: 'Industries Dept, Gujarat', category: 'business', official_source_url: 'https://industries.gujarat.gov.in', eligibility_summary: 'Rural enterprises in Gujarat' },
  ],
  Karnataka: [
    { id: 'ka-fssai', name: 'FSSAI Food License - Karnataka (FoSCoS)', description: 'Mandatory food license for all restaurant/food businesses.', level: 'STATE', department: 'FSSAI Karnataka', category: 'business', official_source_url: 'https://foscos.fssai.gov.in', eligibility_summary: 'All food businesses in Karnataka' },
    { id: 'ka-msme', name: 'Karnataka MSME & Entrepreneurship Policy 2020', description: '15-20% capital investment subsidy and ₹50,000 per Kannadiga employee for new MSMEs.', level: 'STATE', department: 'Dept of Industries & Commerce, Karnataka', category: 'business', official_source_url: 'https://investkarnataka.com/policies', eligibility_summary: 'New MSMEs in Karnataka' },
  ],
  Maharashtra: [
    { id: 'mh-startup', name: 'Maharashtra Startup Policy', description: 'Seed funding, stamp duty exemption, and electricity duty exemption for startups.', level: 'STATE', department: 'Industries Dept, Maharashtra', category: 'business', official_source_url: 'https://startup.maharashtra.gov.in', eligibility_summary: 'DPIIT-registered startups in Maharashtra' },
  ],
  'Tamil Nadu': [
    { id: 'tn-msme', name: 'TN MSME Subsidy Scheme', description: 'Capital subsidy and interest subsidy for new MSMEs in Tamil Nadu.', level: 'STATE', department: 'Industries Dept, Tamil Nadu', category: 'business', official_source_url: 'https://www.tn.gov.in', eligibility_summary: 'New MSMEs in Tamil Nadu' },
  ],
  'Andhra Pradesh': [
    { id: 'ap-msme', name: 'AP MSME Subsidy & Incentive Scheme', description: 'Capital and interest subsidies for new enterprises in AP.', level: 'STATE', department: 'Industries Dept, AP', category: 'business', official_source_url: 'https://www.apindustries.gov.in', eligibility_summary: 'New MSMEs in Andhra Pradesh' },
  ],
  Telangana: [
    { id: 'ts-msme', name: 'TS - TS-iPASS / MSME Subsidies', description: 'Single-window clearance and subsidies for new enterprises in Telangana.', level: 'STATE', department: 'Industries & Commerce Dept, Telangana', category: 'business', official_source_url: 'https://tsipass.telangana.gov.in', eligibility_summary: 'New enterprises in Telangana' },
  ],
  'Uttar Pradesh': [
    { id: 'up-startup', name: 'UP Startup Policy & Implementation Scheme', description: 'Seed funding, tax incentives, and mentoring for startups in UP.', level: 'STATE', department: 'IT & Electronics Dept, UP', category: 'business', official_source_url: 'https://invest.up.gov.in', eligibility_summary: 'Startups registered in Uttar Pradesh' },
  ],
  'West Bengal': [
    { id: 'wb-msme', name: 'WB MSME Subsidy Scheme', description: 'Capital and interest subsidies for MSMEs in West Bengal.', level: 'STATE', department: 'MSME Dept, West Bengal', category: 'business', official_source_url: 'https://msme.wb.gov.in', eligibility_summary: 'MSMEs in West Bengal' },
  ],
  'Madhya Pradesh': [
    { id: 'mp-startup', name: 'MP Startup Policy', description: 'Financial assistance and incentives for startups in Madhya Pradesh.', level: 'STATE', department: 'Industries Dept, MP', category: 'business', official_source_url: 'https://invest.mp.gov.in', eligibility_summary: 'Startups in Madhya Pradesh' },
  ],
};

// ============================================================
// SCHEME MATCHING ENGINE
// ============================================================
export function matchSchemesForIntent(
  intentId: string,
  domicileState: string,
  locationState: string,
  allDbSchemes?: any[]
): { central: any[]; state: any[]; targetLocation: any[] } {
  const central: any[] = [];
  const state: any[] = [];
  const targetLocation: any[] = [];
  const seen = new Set<string>();
  
  // 1. Match central schemes from knowledge base
  const centralKB = CENTRAL_SCHEMES[intentId] || CENTRAL_SCHEMES['WELFARE'] || [];
  for (const scheme of centralKB) {
    if (seen.has(scheme.id)) continue;
    seen.add(scheme.id);
    central.push({
      id: scheme.id,
      name: scheme.name,
      level: 'CENTRAL',
      match_status: 'HIGH_MATCH',
      description: scheme.description,
      why_matches: ['✓ Central Government Scheme', `✓ Relevant to: ${scheme.eligibility_summary}`],
      eligibility_status: scheme.eligibility_summary,
      official_source_url: scheme.official_source_url,
      department: scheme.department,
      last_verified_at: 'August 2026',
    });
  }
  
  // 2. Match state schemes from knowledge base
  const stateKB = STATE_SCHEME_TEMPLATES[domicileState] || [];
  for (const scheme of stateKB) {
    if (seen.has(scheme.id)) continue;
    // Check category relevance
    if (scheme.category !== intentId.toLowerCase() && scheme.category !== 'business' && scheme.category !== 'finance') continue;
    seen.add(scheme.id);
    state.push({
      id: scheme.id,
      name: scheme.name,
      level: 'STATE',
      match_status: 'HIGH_MATCH',
      state_name: domicileState,
      description: scheme.description,
      why_matches: [`✓ Domicile Match: Resident of ${domicileState}`, `✓ Relevant: ${scheme.eligibility_summary}`],
      eligibility_status: scheme.eligibility_summary,
      official_source_url: scheme.official_source_url,
      department: scheme.department,
      last_verified_at: 'August 2026',
    });
  }
  
  // 3. If destination state is different from domicile, add destination state schemes
  if (locationState && locationState !== domicileState && locationState !== 'Not specified' && !locationState.includes('Australia')) {
    const destKB = STATE_SCHEME_TEMPLATES[locationState] || [];
    for (const scheme of destKB) {
      if (seen.has(scheme.id)) continue;
      if (scheme.category !== intentId.toLowerCase() && scheme.category !== 'business') continue;
      seen.add(scheme.id);
      targetLocation.push({
        id: scheme.id,
        name: scheme.name,
        level: 'STATE',
        match_status: 'POSSIBLE_MATCH',
        state_name: locationState,
        description: scheme.description,
        why_matches: [`✓ Operating Location: ${locationState}`, `✓ Relevant: ${scheme.eligibility_summary}`],
        eligibility_status: scheme.eligibility_summary,
        official_source_url: scheme.official_source_url,
        department: scheme.department,
        last_verified_at: 'August 2026',
      });
    }
  }
  
  // 4. If we have database schemes, also match those
  if (allDbSchemes && allDbSchemes.length > 0) {
    for (const s of allDbSchemes) {
      if (seen.has(s.id)) continue;
      if (s.status !== 'ACTIVE' && s.status) continue;
      
      const sCat = (s.category || '').toLowerCase();
      const intentLower = intentId.toLowerCase().replace(/_/g, '');
      const matchCategory = sCat.includes(intentLower) || intentLower.includes(sCat);
      
      if (!matchCategory) continue;
      
      seen.add(s.id);
      
      if (s.level === 'CENTRAL') {
        central.push({
          id: s.id,
          name: s.name,
          level: 'CENTRAL',
          match_status: 'POSSIBLE_MATCH',
          description: s.description,
          why_matches: ['✓ Central Government Scheme', `✓ Category match: ${s.category}`],
          eligibility_status: 'Review eligibility on official portal',
          official_source_url: s.official_source_url || '#',
          department: s.department,
          last_verified_at: s.last_verified_at || 'Recently',
        });
      } else if (s.state_name === domicileState) {
        state.push({
          id: s.id,
          name: s.name,
          level: 'STATE',
          match_status: 'HIGH_MATCH',
          state_name: s.state_name,
          description: s.description,
          why_matches: [`✓ Domicile Match: ${domicileState}`, `✓ State scheme`],
          eligibility_status: 'Review eligibility on official portal',
          official_source_url: s.official_source_url || '#',
          department: s.department,
          last_verified_at: s.last_verified_at || 'Recently',
        });
      }
    }
  }
  
  return { central, state, targetLocation };
}

// ============================================================
// MAIN: UNIVERSAL GOAL ANALYSIS
// ============================================================
export interface GoalAnalysisResult {
  goal: { title: string; description: string };
  location: { current_location: string; domicile_state: string; destination: string | null };
  intent: { primary: string; sub?: string };
  documents: {
    available: { name: string; verification_status: string }[];
    needed: { name: string; status: string; reason: string; priority: string }[];
  };
  schemes: any;
  next_steps: string[];
  sources: { name: string; url: string; last_verified: string }[];
  journeyId: string;
}

export function analyzeGoalUniversal(
  query: string,
  domicileState: string,
  allDbSchemes?: any[]
): GoalAnalysisResult {
  const q = query.trim();
  const qLower = q.toLowerCase();
  const verified = 'August 2026';
  
  // 1. Classify intent
  const intent = classifyIntent(q);
  
  // 2. Extract location
  const locationInfo = extractLocation(q, domicileState);
  
  // 3. Get available documents
  const availableDocs = AVAILABLE_DOCS_BY_INTENT[intent.primary] || BASE_AVAILABLE_DOCS;
  
  // 4. Get required documents
  const requiredDocs = DOCUMENT_REQUIREMENTS[intent.primary] || DOCUMENT_REQUIREMENTS['WELFARE'];
  
  // 5. Match schemes
  const schemes = matchSchemesForIntent(intent.primary, domicileState, locationInfo.state, allDbSchemes);
  
  // 6. Generate goal title and description
  const goalTitle = generateGoalTitle(intent.primary, q, locationInfo);
  const goalDescription = generateGoalDescription(intent.primary, q, locationInfo, domicileState);
  
  // 7. Generate next steps
  const nextSteps = generateNextSteps(intent.primary, locationInfo);
  
  // 8. Generate sources
  const sources = generateSources(intent.primary);
  
  // 9. Generate journeyId
  const journeyId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `analysis-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  return {
    goal: { title: goalTitle, description: goalDescription },
    location: {
      current_location: locationInfo.location,
      domicile_state: domicileState || 'Not specified',
      destination: locationInfo.destination,
    },
    intent: { primary: intent.primary, sub: intent.label },
    documents: {
      available: availableDocs.map(d => ({ name: d.name, verification_status: d.verification_status })),
      needed: requiredDocs,
    },
    schemes,
    next_steps: nextSteps,
    sources,
    journeyId,
  };
}

// ============================================================
// HELPER: Generate goal title
// ============================================================
function generateGoalTitle(intentId: string, query: string, locationInfo: any): string {
  const loc = locationInfo.location ? ` in ${locationInfo.location}` : '';
  const dest = locationInfo.destination ? ` to ${locationInfo.destination}` : '';
  
  const titles: Record<string, string> = {
    STUDY_ABROAD: `Study Abroad${dest}`,
    EDUCATION: `Education & Academic Pursuit${loc}`,
    HEALTHCARE: `Healthcare / Medical Facility${loc}`,
    PROPERTY_LAND: `Property / Land Transaction${loc}`,
    BUSINESS: `Business / Enterprise Setup${loc}`,
    AGRICULTURE: `Agricultural Activity${loc}`,
    DRIVING_LICENCE: `Driving Licence Application${loc}`,
    PASSPORT: `Passport Application${loc}`,
    VOTER_ID: `Electoral Registration & Voter ID (EPIC)${loc}`,
    PAN_CARD: `PAN Card Application & Digital e-PAN Issuance${loc}`,
    RATION_CARD: `NFSA Ration Card & Food Subsidy Enrollment${loc}`,
    VISA: `International Visa & Consular Application${dest}`,
    GOVERNMENT_JOB: `Government Employment${loc}`,
    FINANCE_LOAN: `Financial Services / Loan${loc}`,
    NGO: `NGO / Non-Profit Organization${loc}`,
    WELFARE: `Government Welfare / Support${loc}`,
  };
  
  return titles[intentId] || `Citizen Goal - ${query.substring(0, 50)}`;
}

// ============================================================
// HELPER: Generate goal description
// ============================================================
function generateGoalDescription(intentId: string, query: string, locationInfo: any, domicileState: string): string {
  const state = locationInfo.state || domicileState;
  
  const descriptions: Record<string, string> = {
    STUDY_ABROAD: `Regulatory and document roadmap for pursuing education in ${locationInfo.destination || 'abroad'}. This covers visa requirements, university documents, financial evidence, and relevant scholarship schemes.`,
    EDUCATION: `Academic and document checklist for ${state}. This covers admission requirements, scholarship eligibility, and supporting documents needed for educational pursuits.`,
    HEALTHCARE: `Regulatory and licensing roadmap for healthcare facility establishment in ${state}. This covers healthcare registrations, NOCs, and compliance requirements.`,
    PROPERTY_LAND: `Legal and document roadmap for property/land transactions in ${state}. This covers registration, title verification, stamp duty, and compliance requirements.`,
    BUSINESS: `Business setup and regulatory compliance mapping for ${state}. This covers entity registration, trade licensing, and MSME support schemes.`,
    AGRICULTURE: `Agricultural support and scheme eligibility mapping for ${state}. This covers farm subsidies, insurance, and land-related documentation.`,
    DRIVING_LICENCE: `Driving licence application roadmap for ${state}. This covers learner licence, permanent licence, and RTO requirements.`,
    PASSPORT: `Passport application and document roadmap. This covers identity verification, address proof, and passport issuance process.`,
    VOTER_ID: `Official Election Commission of India (ECI) voter registration roadmap for ${state}. This covers Form 6 submission, Assembly Constituency mapping, Booth Level Officer (BLO) physical verification, and digital e-EPIC card generation.`,
    PAN_CARD: `Central Board of Direct Taxes (CBDT) permanent tax identifier issuance roadmap. This covers Form 49A submission via NSDL/UTIITSL, instant Aadhaar e-KYC paperless allotment, and physical card dispatch.`,
    RATION_CARD: `National Food Security Act (NFSA) ration card enrollment for ${state}. This covers family unit Aadhaar seeding, fair price shop (FPS) allocation, and One Nation One Ration Card (ONORC) portability.`,
    VISA: `International visa application and consular document roadmap for ${locationInfo.destination || 'overseas travel'}. Covers visa scheduling, biometric appointment at VFS Global / Embassy, and fund verification.`,
    GOVERNMENT_JOB: `Government employment preparation roadmap for ${state}. This covers eligibility documents, competitive exam preparation, and application requirements.`,
    FINANCE_LOAN: `Financial services and loan eligibility mapping for ${state}. This covers loan documents, credit requirements, and government financing schemes.`,
    NGO: `Non-profit organization setup roadmap for ${state}. This covers trust/society registration, compliance, and funding mechanisms.`,
    WELFARE: `Government welfare and social security scheme eligibility for ${state}. This covers scheme identification, document requirements, and application processes.`,
  };
  
  return descriptions[intentId] || `Detailed regulatory checklist for your query in ${state}.`;
}

// ============================================================
// HELPER: Generate next steps
// ============================================================
function generateNextSteps(intentId: string, locationInfo: any): string[] {
  const steps: Record<string, string[]> = {
    STUDY_ABROAD: [
      'Apply for or renew passport at passportindia.gov.in',
      'Register and prepare for English proficiency exam (IELTS/PTE/TOEFL)',
      'Shortlist universities in destination country',
      'Prepare Statement of Purpose and academic transcripts',
      'Apply for relevant scholarships (NOS, state scholarships)',
      'Prepare financial documents and GTE statement',
      'Apply for student visa after receiving university offer letter',
    ],
    EDUCATION: [
      'Register on National Scholarship Portal (scholarships.gov.in)',
      'Obtain income certificate from Tehsildar office',
      'Prepare Aadhaar, mark sheets, and income certificate',
      'Apply for relevant state/central scholarships',
      'Submit applications before deadline',
    ],
    HEALTHCARE: [
      'Obtain business registration certificate',
      'Secure premises through lease or purchase agreement',
      'Apply for Drug License from state drug controller',
      'Obtain NOC from local municipal authority',
      'Get Fire Safety NOC from State Fire Department',
      'Obtain Biomedical Waste Management Authorization',
      'Apply for local trade/establishment license',
    ],
    PROPERTY_LAND: [
      'Verify title deed and encumbrance certificate',
      'Execute sale agreement with seller',
      'Pay stamp duty at sub-registrar office',
      'Complete property registration at sub-registrar',
      'Update mutation records at revenue office',
      'Update property tax records in your name',
    ],
    BUSINESS: [
      'Choose business structure (Proprietorship, Partnership, LLP, Pvt Ltd)',
      'Register for Udyam MSME at udyamregistration.gov.in',
      'Execute commercial rent agreement for business premises',
      'Apply for Trade License from local municipality',
      'Register for GST if annual turnover exceeds ₹20 lakhs',
      'Open commercial bank account',
      'Apply for FSSAI license if food business',
    ],
    AGRICULTURE: [
      'Ensure Aadhaar is linked to bank account for DBT',
      'Register on PM-KISAN portal for ₹6,000/year support',
      'Apply for PMFBY crop insurance before sowing season',
      'Apply for Kisan Credit Card at your bank',
      'Check state-specific agricultural subsidies',
    ],
    DRIVING_LICENCE: [
      'Apply for Learner Licence on Sarathi Parivahan portal',
      'Book test slot at nearest state RTO',
      'Practice driving for 30+ days after Learner Licence',
      'Apply for Permanent Driving Licence via Sarathi portal',
      'Book driving test appointment',
    ],
    PASSPORT: [
      'Register on Passport Seva portal (passportindia.gov.in)',
      'Fill online application and pay fee',
      'Book appointment at nearest Passport Seva Kendra',
      'Visit PSK with original documents and photocopies',
      'Complete police verification at registered address',
    ],
    VOTER_ID: [
      'Visit Election Commission of India Voters Portal (voters.eci.gov.in)',
      'Fill Form 6 for New Voter Registration (18+ age qualification)',
      'Upload Age Proof (Aadhaar/10th Marksheet) and Current Residence Proof',
      'Submit form to receive 12-digit Application Reference Number (ARN)',
      'Booth Level Officer (BLO) performs field verification at your doorstep',
      'Download digital e-EPIC from Voters Portal and receive physical Smart Card via Speed Post',
    ],
    PAN_CARD: [
      'Open Protean NSDL / UTIITSL Form 49A Portal',
      'Authenticate identity via Aadhaar Paperless OTP e-KYC',
      'Verify name, father name, and date of birth details',
      'Pay statutory processing fee (₹107 for physical card, ₹72 for e-PAN)',
      'Download digitally signed e-PAN within 2 hours and receive plastic card via India Post',
    ],
    RATION_CARD: [
      'Access State Food & Civil Supplies / NFSA Portal (nfsa.gov.in)',
      'Submit Form for New Family Ration Card or Member Addition',
      'Seed Aadhaar numbers of all family members for ONORC deduplication',
      'Upload Income Certificate to establish Priority Household (PHH) or Antyodaya status',
      'Collect digitized Smart Ration Card from Local Supply Office / Fair Price Shop',
    ],
    VISA: [
      'Verify passport validity (at least 6 months with 2 blank visa pages)',
      'Complete official Online Visa Application (DS-160 / VFS / Consular Portal)',
      'Pay consular visa processing fee and schedule biometric & interview appointment',
      'Compile flight itinerary, hotel booking, and 6-month certified bank statements',
      'Attend consular interview / VFS biometric appointment and track passport return',
    ],
    GOVERNMENT_JOB: [
      'Check eligibility for UPSC/SSC/Banking exams',
      'Register on examination portals',
      'Prepare required certificates and documents',
      'Apply for relevant competitive examinations',
      'Appear for examination and document verification',
    ],
    FINANCE_LOAN: [
      'Obtain income certificate from Tehsildar office',
      'Prepare bank statements (last 6 months)',
      'Research applicable loan schemes (Mudra, PMEGP)',
      'Prepare business/project plan if applicable',
      'Approach bank with complete documentation',
    ],
    NGO: [
      'Draft Trust Deed or Memorandum of Association',
      'Register under appropriate Act (Trust Act / Societies Registration Act)',
      'Apply for PAN card for the organization',
      'Open bank account in organization name',
      'Apply for FCRA registration if accepting foreign funds',
      'Complete annual compliance and audit requirements',
    ],
    WELFARE: [
      'Identify applicable welfare schemes based on eligibility',
      'Obtain required certificates (Income, Caste, Domicile)',
      'Register on relevant government portals',
      'Apply for schemes through official channels',
      'Track application status and DBT transfers',
    ],
  };
  
  return steps[intentId] || steps['WELFARE'];
}

// ============================================================
// HELPER: Generate sources
// ============================================================
function generateSources(intentId: string): { name: string; url: string; last_verified: string }[] {
  const verified = 'August 2026';
  
  const sources: Record<string, { name: string; url: string; last_verified: string }[]> = {
    STUDY_ABROAD: [
      { name: 'Passport Seva - Ministry of External Affairs', url: 'https://passportindia.gov.in', last_verified: verified },
      { name: 'National Overseas Scholarship Portal', url: 'https://nosmsje.gov.in', last_verified: verified },
      { name: 'PM Vidyalaxmi Education Loan', url: 'https://www.vidyalakshmi.co.in', last_verified: verified },
    ],
    EDUCATION: [
      { name: 'National Scholarship Portal', url: 'https://scholarships.gov.in', last_verified: verified },
      { name: 'Ministry of Education', url: 'https://www.education.gov.in', last_verified: verified },
    ],
    HEALTHCARE: [
      { name: 'Ayushman Bharat - PM-JAY', url: 'https://pmjay.gov.in', last_verified: verified },
      { name: 'National Health Authority', url: 'https://nha.gov.in', last_verified: verified },
    ],
    PROPERTY_LAND: [
      { name: 'DILRMP - Digital India Land Records', url: 'https://dilr.gov.in', last_verified: verified },
      { name: 'PM Awas Yojana', url: 'https://pmaymis.gov.in', last_verified: verified },
    ],
    BUSINESS: [
      { name: 'Udyam MSME Registration', url: 'https://udyamregistration.gov.in', last_verified: verified },
      { name: 'Startup India', url: 'https://www.startupindia.gov.in', last_verified: verified },
      { name: 'GST Portal', url: 'https://gst.gov.in', last_verified: verified },
      { name: 'Mudra Loan Portal', url: 'https://www.mudra.org.in', last_verified: verified },
    ],
    AGRICULTURE: [
      { name: 'PM-KISAN Portal', url: 'https://pmkisan.gov.in', last_verified: verified },
      { name: 'PMFBY Portal', url: 'https://pmfby.gov.in', last_verified: verified },
    ],
    DRIVING_LICENCE: [
      { name: 'Sarathi Parivahan Portal', url: 'https://sarathi.parivahan.gov.in', last_verified: verified },
    ],
    PASSPORT: [
      { name: 'Passport Seva - Ministry of External Affairs', url: 'https://passportindia.gov.in', last_verified: verified },
    ],
    VOTER_ID: [
      { name: 'Election Commission of India - Voters Portal', url: 'https://voters.eci.gov.in', last_verified: verified },
      { name: 'ECI National Voter Services (NVSP)', url: 'https://www.nvsp.in', last_verified: verified },
      { name: 'ECI Voter Helpline Services', url: 'https://eci.gov.in', last_verified: verified },
    ],
    PAN_CARD: [
      { name: 'Protean NSDL e-PAN Portal', url: 'https://onlineservices.nsdl.com/paam/endUserRegisterContact.html', last_verified: verified },
      { name: 'UTIITSL Pan Services Portal', url: 'https://www.pan.utiitsl.com', last_verified: verified },
      { name: 'Income Tax e-Filing Portal', url: 'https://www.incometax.gov.in', last_verified: verified },
    ],
    RATION_CARD: [
      { name: 'National Food Security Portal (NFSA)', url: 'https://nfsa.gov.in', last_verified: verified },
      { name: 'Department of Food & Public Distribution', url: 'https://dfpd.gov.in', last_verified: verified },
    ],
    VISA: [
      { name: 'Ministry of External Affairs Consular Portal', url: 'https://www.mea.gov.in', last_verified: verified },
      { name: 'VFS Global India Center', url: 'https://www.vfsglobal.com', last_verified: verified },
    ],
    GOVERNMENT_JOB: [
      { name: 'UPSC Portal', url: 'https://www.upsc.gov.in', last_verified: verified },
      { name: 'SSC Portal', url: 'https://ssc.nic.in', last_verified: verified },
    ],
    FINANCE_LOAN: [
      { name: 'Mudra Loan Portal', url: 'https://www.mudra.org.in', last_verified: verified },
      { name: 'CGTMSE', url: 'https://www.cgtmse.in', last_verified: verified },
    ],
    NGO: [
      { name: 'Ministry of Corporate Affairs', url: 'https://www.mca.gov.in', last_verified: verified },
    ],
    WELFARE: [
      { name: 'National Portal of India', url: 'https://india.gov.in', last_verified: verified },
      { name: 'UMANG App', url: 'https://web.umang.gov.in', last_verified: verified },
    ],
  };
  
  return sources[intentId] || sources['WELFARE'];
}
