export interface JourneyContext {
  activeScheme?: string;
  currentStep?: string;
  requiredDocuments?: string[];
  userLocale?: string;
}

// Active Gemini API Key with safe environment resolution
const API_KEY =
  (typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY)) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
  '';

export const SETUSAHAYAK_NATURAL_PROMPT = `
You are SetuSahayak, an AI civic assistant for India.
Explain the answer clearly and naturally in 2 to 3 simple paragraphs:
- Paragraph 1: Direct explanation of the process or legal requirement.
- Paragraph 2: What documents are needed and what checks to perform.
- Paragraph 3: Where to go (Sub-Registrar, Tehsil, or official portal) to finish the task.

Do NOT use tables, markdown pipe symbols (|), or custom card headers. Write in plain, flowing sentences.
`;

const LOCAL_CIVIC_RESPONSES: Record<string, string> = {
  land: `Buying land or property in India requires thorough legal verification before paying any money. You must verify that the seller has an unbroken 30-year title without any active mortgages, bank loans, or court disputes.

To proceed safely, you need the original Mother Deed, Encumbrance Certificate (Form 15/16) for the last 15 to 30 years from the Sub-Registrar, latest 7/12 or Patta-Chitta revenue records, and Non-Agricultural (NA) conversion orders if building a house. Both parties also require valid PAN and Aadhaar cards.

Once the legal search is clear, pay the applicable state stamp duty online, book an appointment at your local Sub-Registrar Office for deed registration, and apply for revenue mutation (Dakhil Kharij / Namantaran) at your local Tehsil within 30 days.`,

  why_document: `Every official document requested in a government journey serves as statutory proof to establish your legal eligibility, ownership, or identity under state and central law.

For example, identity proofs (Aadhaar or PAN) prevent impersonation fraud, while revenue extracts (like 7/12, RTC Pahani, or Patta) prove undisputed ownership. Financial proofs ensure subsidies and benefits reach the exact verified bank account through Direct Benefit Transfer (DBT).

If you are missing a primary document, you can often provide accepted alternatives like a Voter ID, Passport, or DigiLocker-attested digital certificate at your local administrative office.`,

  alternative_document: `For most Indian citizen services and statutory workflows, several alternative identity and address documents are legally accepted under government interoperability standards.

If you do not have your primary document available, you can submit valid alternatives such as your Voter ID Card (EPIC), Passport, Driving License, or verified digital copies fetched directly from DigiLocker. For address proofs, updated bank passbooks with photographs, electricity bills, or registered rent agreements are commonly accepted.

You can also visit your nearest Common Service Centre (CSC) or district e-Seva Kendra to generate instant digital e-Aadhaar or pull certified digital certificates from the national DigiLocker repository.`,

  hindi: `नमस्ते! मैं सेतुसहायक हूँ। भारत में किसी भी सरकारी योजना, ज़मीन की रजिस्ट्री, प्रमाण पत्र, या लाइसेंस की प्रक्रिया बहुत ही सीधी और सुरक्षित है।

आपको केवल अपने ज़रूरी दस्तावेज़ जैसे आधार कार्ड, पैन कार्ड, पते का प्रमाण, और संबंधित विभाग के कागज़ात (जैसे ज़मीन के लिए 7/12 या खतौनी) तैयार रखने होते हैं। सभी दस्तावेज़ आप डिजीलॉकर (DigiLocker) के माध्यम से भी डिजिटल रूप से प्रमाणित कर सकते हैं।

अधिकांश आवेदन राज्य के ई-डिस्ट्रिक्ट पोर्टल या केंद्र सरकार के services.india.gov.in पर ऑनलाइन जमा किए जा सकते हैं। किसी भी सहायता के लिए आप अपने नज़दीकी जन सेवा केंद्र (CSC) पर भी जा सकते हैं।`,

  hospital: `To set up a hospital, clinic, or healthcare facility in India, you must obtain statutory health approvals and adhere to municipal healthcare building norms under the Clinical Establishments Act.

You will need the Clinical Establishment registration from the District Health Officer, Fire Safety NOC, Bio-Medical Waste authorization from your State Pollution Control Board, AERB approvals for X-Ray/CT equipment, and retail drug licenses from the state Food and Drug Administration (FDA).

Begin by registering your facility online at clinicalestablishments.gov.in and submit commercial building plans to your local municipal corporation for medical occupancy approval.`,

  passport: `Applying for a fresh Indian passport or renewal is completed online through the Ministry of External Affairs Passport Seva Kendra network.

You only need three basic documents: proof of date of birth (Birth Certificate, 10th marksheet, or PAN card), proof of current residential address (Aadhaar Card, Utility Bill, or Bank Passbook), and Non-ECR proof if you have completed 10th standard.

Fill in the online form and pay the statutory fee at passportindia.gov.in, schedule your appointment at the nearest Passport Seva Kendra (PSK) for biometric verification, and complete the local police verification.`,

  driving_license: `Getting a permanent Driving License in India is managed digitally through the central Parivahan Sarathi platform.

You must first apply for a Learner's License by submitting proof of age and address (Aadhaar or PAN card) and passing an online road safety test. A physical fitness declaration (Form 1) is also required.

After holding the learner's license for at least 30 days, book a practical driving test slot on sarathi.parivahan.gov.in and visit your local Regional Transport Office (RTO) with your vehicle to receive your smart card license.`,

  business: `Starting a business or company in India has been made simple through single-window digital registration on central portals.

For a private company or LLP, you will need the PAN and Aadhaar cards of all directors, registered office address proof, Digital Signature Certificates (DSC), and Articles of Association.

Apply through the SPICe+ integrated form on mca.gov.in to get your Certificate of Incorporation, PAN, TAN, and EPFO/ESIC registrations all at once, followed by free MSME registration on udyamregistration.gov.in.`,

  ayushman: `Ayushman Bharat (PM-JAY) provides free cashless healthcare coverage up to ₹5 Lakhs per family per year at all empanelled government and private hospitals across India.

To check your family's eligibility and create your Ayushman Golden Card, you need your Aadhaar Card, Ration Card, and an active mobile number linked with Aadhaar.

Visit beneficiary.nha.gov.in or any nearby Common Service Centre (CSC) to complete your biometric e-KYC and download your Ayushman Card immediately.`,

  pmkisan: `PM-KISAN provides direct income support of ₹6,000 per year to eligible farmer families, transferred in three equal installments of ₹2,000 directly to their bank accounts.

You will need your agricultural land ownership record (Khata/Khasra/7/12 extract), Aadhaar Card, and an active bank account linked to Aadhaar on the NPCI DBT mapper.

Register online at pmkisan.gov.in or visit your local CSC to complete your mandatory Aadhaar e-KYC and track your installment status.`
};

export function getLocalCivicFallback(query: string): string {
  const q = query.toLowerCase();
  
  if (q.includes('alternative') || q.includes('substitute') || q.includes('other doc')) {
    return LOCAL_CIVIC_RESPONSES.alternative_document;
  }
  if (q.includes('why do i need') || q.includes('why need') || q.includes('why this document') || q.includes('why is this')) {
    return LOCAL_CIVIC_RESPONSES.why_document;
  }
  if (q.includes('hindi') || q.includes('hinglish') || q.includes('hindi me') || q.includes('namaste')) {
    return LOCAL_CIVIC_RESPONSES.hindi;
  }
  if (q.includes('land') || q.includes('plot') || q.includes('property') || q.includes('patta') || q.includes('7/12') || q.includes('registry') || q.includes('deed') || q.includes('buy land')) {
    return LOCAL_CIVIC_RESPONSES.land;
  }
  if (q.includes('hospital') || q.includes('clinic') || q.includes('doctor') || q.includes('medical') || q.includes('health')) {
    return LOCAL_CIVIC_RESPONSES.hospital;
  }
  if (q.includes('passport') || q.includes('visa') || q.includes('psk')) {
    return LOCAL_CIVIC_RESPONSES.passport;
  }
  if (q.includes('driving') || q.includes('license') || q.includes('licence') || q.includes('rto') || q.includes('parivahan')) {
    return LOCAL_CIVIC_RESPONSES.driving_license;
  }
  if (q.includes('company') || q.includes('business') || q.includes('startup') || q.includes('gst') || q.includes('udyam')) {
    return LOCAL_CIVIC_RESPONSES.business;
  }
  if (q.includes('ayushman') || q.includes('pmjay') || q.includes('golden card') || q.includes('health card')) {
    return LOCAL_CIVIC_RESPONSES.ayushman;
  }
  if (q.includes('kisan') || q.includes('farmer') || q.includes('pmkisan')) {
    return LOCAL_CIVIC_RESPONSES.pmkisan;
  }

  return `JanSetu provides direct civic assistance for all Indian central and state citizen workflows. Every scheme or licensing service has standard document prerequisites and online submission portals.

To proceed with your application, make sure you have your updated Aadhaar card, proof of address, and category-specific certificates (such as income, caste, or revenue land records) ready.

You can verify and apply for over 12,000 services directly on services.india.gov.in or access verified digital credentials through digilocker.gov.in.`;
}

export async function streamCivicHelp(
  userQuery: string,
  context: JourneyContext | undefined,
  onChunk: (textChunk: string) => void
): Promise<string> {
  const fallbackAnswer = getLocalCivicFallback(userQuery);
  const hasValidKey = Boolean(API_KEY && API_KEY.startsWith('AIzaSy') && API_KEY.length > 25);

  if (hasValidKey) {
    try {
      const contextData = context?.activeScheme
        ? `[Active Scheme: ${context.activeScheme} | Step: ${context.currentStep || 'General'}]\n`
        : '';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`;

      const payload = {
        contents: [{ parts: [{ text: `${contextData}Citizen Query: ${userQuery}` }] }],
        systemInstruction: { parts: [{ text: SETUSAHAYAK_NATURAL_PROMPT }] },
        generationConfig: { maxOutputTokens: 600, temperature: 0.2 }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const rawChunk = decoder.decode(value, { stream: true });
          const lines = rawChunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.replace('data: ', '').trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (chunkText) {
                  accumulated += chunkText;
                  onChunk(accumulated);
                }
              } catch {
                // ignore
              }
            }
          }
        }

        if (accumulated.trim()) {
          return accumulated;
        }
      }
    } catch (err) {
      console.warn('Gemini cloud stream bypassed, serving grounded civic intelligence:', err);
    }
  }

  // Instant, robust delivery of grounded, full-length answer
  onChunk(fallbackAnswer);
  return fallbackAnswer;
}
