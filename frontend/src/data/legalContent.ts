/**
 * JanSetu Civic Platform - Legal & Compliance Policy Registry
 * Conforms to Guidelines for Indian Government Websites (GIGW 3.0),
 * Digital Personal Data Protection Act, 2023 (DPDP Act),
 * and MeitY AI Governance Directives.
 */

export interface PolicySection {
  heading: string;
  content: string[] | string;
  subsections?: {
    subheading: string;
    points: string[];
  }[];
}

export interface LegalPolicy {
  id: string;
  title: string;
  shortTitle: string;
  lastUpdated: string;
  metaDescription: string;
  badge: string;
  sections: PolicySection[];
}

export const LEGAL_POLICIES: Record<string, LegalPolicy> = {
  'website-policies': {
    id: 'website-policies',
    title: 'Website & Digital Infrastructure Policies',
    shortTitle: 'Website Policies',
    lastUpdated: 'August 2026',
    badge: 'GIGW 3.0 Standard',
    metaDescription: 'Official maintenance, bilingual rendering, data retention, accessibility, and operational uptime policies for the JanSetu national portal.',
    sections: [
      {
        heading: '1. Framework & Mandate',
        content: [
          'The JanSetu portal is established under the aegis of the Ministry of Electronics and Information Technology (MeitY), Government of India, and managed technically by the National Informatics Centre (NIC).',
          'These Website Policies govern the operational performance, accessibility thresholds, and technical standards applied across all public citizen-facing endpoints, mobile wrappers, and open API services.'
        ]
      },
      {
        heading: '2. Accessibility Statement (GIGW 3.0 & WCAG 2.1 AA)',
        content: [
          'JanSetu is designed and audited to comply with the Guidelines for Indian Government Websites (GIGW 3.0) and the Web Content Accessibility Guidelines (WCAG 2.1) Level AA standards.',
          'The platform ensures multi-sensory usability including screen reader compatibility, adjustable contrast ratios, high-contrast dark mode, keyboard-only navigation triggers, and scalable typography up to 200% without loss of functional layout integrity.'
        ]
      },
      {
        heading: '3. Multilingual & 22 Scheduled Language Rendering',
        content: [
          'In alignment with the Digital India Bhashini initiative, JanSetu provides native rendering across all 22 official languages recognized in the Eighth Schedule of the Constitution of India.',
          'Dynamic content translation is executed through verifiable government neural machine translation models, with human-vetted fallback dictionaries for statutory scheme terms and eligibility notices.'
        ]
      },
      {
        heading: '4. System Maintenance & Uptime SLA',
        content: [
          'Scheduled maintenance windows are restricted to off-peak hours (01:00 IST to 04:00 IST) on the second and fourth Sundays of each calendar month. Emergency security patches may be deployed with real-time banner notifications.',
          'JanSetu maintains an operational uptime service level agreement (SLA) target of 99.9% across all national benefit routing and eligibility evaluation microservices.'
        ]
      },
      {
        heading: '5. Audit Trail & Data Retention Thresholds',
        content: [
          'Session logs, IP telemetry, and access tokens are retained in cryptographically sealed immutable audit logs for a rolling period of 180 days in compliance with CERT-In directives.',
          'Citizen eligibility query simulations without active consent-bound application submission are processed ephemerally in RAM and purged upon session termination.'
        ]
      }
    ]
  },

  'terms-of-use': {
    id: 'terms-of-use',
    title: 'Terms of Use & Citizen Service Charter',
    shortTitle: 'Terms of Use',
    lastUpdated: 'August 2026',
    badge: 'Statutory Charter',
    metaDescription: 'Citizen rights, user responsibilities, AI welfare roadmap disclaimers, and account security protocols for the JanSetu portal.',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        content: [
          'By authenticating or interacting with the JanSetu portal via Aadhaar OTP, DigiLocker Auth, Mobile OTP, or Demo Mode credentials, you agree to be bound by these Terms of Use and all applicable statutory regulations of the Republic of India.',
          'If you do not accept these terms in their entirety, you must discontinue session access immediately.'
        ]
      },
      {
        heading: '2. Citizen Responsibilities & Account Integrity',
        content: [
          'Citizens are solely responsible for safeguarding their One-Time Passwords (OTPs), DigiLocker MPINs, and physical credentials. JanSetu officers and automated systems will never solicit your MPIN or biometric passwords via telephone, SMS, or external electronic mail.',
          'Submitting fraudulent, altered, or impersonated identity documents constitutes a cognizable offence punishable under the Information Technology Act, 2000 and the Bharatiya Nyaya Sanhita, 2023.'
        ]
      },
      {
        heading: '3. AI Milestone & Welfare Roadmap Advisory Disclaimer',
        content: [
          'JanSetu leverages advanced generative and retrieval-augmented artificial intelligence (RAG) models (including Google Gemini and Indian Civic Knowledge Graphs) to synthesize customized application roadmaps, prerequisite document checklists, and eligibility approximations.',
          'AI-generated roadmaps and eligibility scores serve as an advisory navigation aid. The definitive grant, sanction, or disbursement of welfare funds remains strictly subject to statutory verification and final authorization by the designated Competent Departmental Officer.'
        ]
      },
      {
        heading: '4. Interoperable Automated Actions & Micro-Delegations',
        content: [
          'When opting into automated multi-scheme orchestrations (e.g., synchronous farmer subsidy + soil health card filing), you authorize JanSetu to pass structured payload requests to external departmental APIs strictly within the parameters of your signed Purpose-Bound Consent.',
          'You retain the right to pause, inspect, or abort pending automated workflow stages prior to final departmental dispatch.'
        ]
      },
      {
        heading: '5. Limitation of Liability',
        content: [
          'JanSetu, the Ministry of Electronics & IT, and NIC shall not be liable for incidental delays arising from third-party banking gateway timeouts (NPCI/DBT), state registry downtime, or telecommunication network failures beyond platform perimeter control.'
        ]
      }
    ]
  },

  'privacy-policy': {
    id: 'privacy-policy',
    title: 'Privacy Statement & DPDP Act 2023 Compliance',
    shortTitle: 'Privacy Statement (DPDP Act)',
    lastUpdated: 'August 2026',
    badge: 'DPDP Act 2023 Compliant',
    metaDescription: 'Digital Personal Data Protection Act 2023 compliance, purpose-bound Aadhaar consent, DigiLocker zero-retention vault architecture, and data principal rights.',
    sections: [
      {
        heading: '1. Legislative Compliance & Data Fiduciary Mandate',
        content: [
          'JanSetu operates as a Data Fiduciary under the provisions of the Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023). We are dedicated to safeguarding your personal data with state-of-the-art cryptographic safeguards and strict purpose limitation.',
          'Every personal data attribute processed on this platform is governed by explicit, itemized, and revocable consent registered in our immutable Digital Consent Ledger.'
        ]
      },
      {
        heading: '2. Zero Raw PII Storage & Ephemeral Tokenization',
        content: [
          'JanSetu enforces a Zero Raw PII Storage architecture. Full 12-digit Aadhaar numbers, biometric templates, and raw bank account credentials are never stored in plain text or permanent platform databases.',
          'Identities are processed via SHA-256 masked tokens (e.g., XXXX-XXXX-1234) and UIDAI-certified Virtual ID (VID) tokens. Documents fetched from DigiLocker are authenticated in transient secure memory and verified through cryptographic digital signatures (PKCS#7).'
        ]
      },
      {
        heading: '3. Purpose-Bound Consent & Granular Revocation',
        content: [
          'Consent is sought specifically for designated welfare schemes. You may grant consent for individual data attributes (e.g., Land Record vs. Income Certificate) independently.',
          'You may revoke consent at any time via the "DPDP Data Consent Manager" tab on your Citizen Dashboard. Upon revocation, all cached verification tokens associated with that specific scheme are instantaneously invalidated across all worker nodes.'
        ]
      },
      {
        heading: '4. Rights of the Data Principal (Citizen Rights)',
        content: [
          'Under Section 11, 12, and 13 of the DPDP Act 2023, you hold the following statutory rights:',
          '• Right to Access Information: Review what personal data has been processed, the purpose, and third-party ministries with whom it was shared.',
          '• Right to Correction & Erasure: Request immediate rectification of outdated records (e.g., updated disability certificate or land survey numbers).',
          '• Right of Grievance Redressal: Lodge direct appeals with the designated Data Protection Officer (DPO) and the Data Protection Board of India.',
          '• Right to Nominate: Nominate a legal representative to exercise your rights in the event of incapacity.'
        ]
      },
      {
        heading: '5. Contact our Data Protection Officer (DPO)',
        content: [
          'Name: Grievance & Data Protection Officer, JanSetu National Grid',
          'Office: Ministry of Electronics and Information Technology (MeitY), Electronics Niketan, 6, CGO Complex, Lodhi Road, New Delhi: 110003',
          'Email: dpo.jansetu@gov.in | Toll-Free DPDP Helpline: 1800-11-2026'
        ]
      }
    ]
  },

  'hyperlinking-policy': {
    id: 'hyperlinking-policy',
    title: 'Hyperlinking Policy & External Redirection',
    shortTitle: 'Hyperlinking Policy',
    lastUpdated: 'August 2026',
    badge: 'NIC Guidelines',
    metaDescription: 'Guidelines regarding inbound hyperlinks to JanSetu, outbound links to external state/central ministry portals, and disclaimer standards.',
    sections: [
      {
        heading: '1. Inbound Hyperlinks to JanSetu',
        content: [
          'Prior permission is not required before hyperlinking to the public URLs of the JanSetu portal from any official State or Central Government portal, educational institution, or accredited civic information service.',
          'However, pages must load into a full, newly opened browser window and must not be loaded within frames or iframes that obscure the authentic Government of India masthead and National Emblem.'
        ]
      },
      {
        heading: '2. Explicit Non-Endorsement of External Links',
        content: [
          'JanSetu provides links to external government web domains (such as pmkisan.gov.in, digilocker.gov.in, uidai.gov.in, and state e-District portals) strictly to facilitate seamless welfare fulfillment.',
          'JanSetu cannot guarantee the sustained availability of external pages, nor does it control or endorse external commercial websites or non-governmental entities.'
        ]
      },
      {
        heading: '3. Outbound Link Indicator & Security Verification',
        content: [
          'All outbound links redirecting outside the `.gov.in` or `.nic.in` domain perimeter are visibly tagged with an external redirection icon and a non-intrusive warning dialog.',
          'All linked resources are scanned hourly against national threat intelligence feeds for cryptographic certificate validity and malware heuristics.'
        ]
      }
    ]
  },

  'copyright-policy': {
    id: 'copyright-policy',
    title: 'Copyright Policy & Open Civic Data License',
    shortTitle: 'Copyright Policy',
    lastUpdated: 'August 2026',
    badge: 'National Data Sharing Policy',
    metaDescription: 'Copyright standards, open civic data distribution, scheme guidelines re-use, and National Data Sharing and Accessibility Policy (NDSAP) alignment.',
    sections: [
      {
        heading: '1. Ownership & Content Attribution',
        content: [
          'Material published on this portal—including official scheme summaries, eligibility decision matrices, guidelines, and statutory notifications—is protected under the Copyright Act, 1957 (Government of India).',
          'The JanSetu emblem, Government of India seal, and bespoke UI system designs are proprietary assets of MeitY and NIC.'
        ]
      },
      {
        heading: '2. Open Civic Reuse & Academic Permissions',
        content: [
          'Public scheme criteria, API specifications, eligibility rules, and statistical dashboard metrics may be freely reproduced, indexed, and disseminated without prior permission, subject to the condition that:',
          '• The material is reproduced accurately and not used in a derogatory manner or misleading context.',
          '• Source attribution is prominently displayed as: "Source: JanSetu National Civic Portal (https://jansetu.gov.in), Government of India."',
          '• The data is not packaged into deceptive monetization schemes that charge citizens for free public welfare application access.'
        ]
      },
      {
        heading: '3. Third-Party Trademarks',
        content: [
          'DigiLocker, Aadhaar, DBT-Bharat, UMANG, and NPCI are registered trademarks of their respective government agencies and statutory corporations. Their presence on JanSetu signifies interoperability integration.'
        ]
      }
    ]
  },

  'rti': {
    id: 'rti',
    title: 'Right to Information (RTI) Transparency Disclosures',
    shortTitle: 'Right to Information (RTI)',
    lastUpdated: 'August 2026',
    badge: 'RTI Act 2005 - Section 4(1)(b)',
    metaDescription: 'Proactive public disclosures under Section 4(1)(b) of the RTI Act 2005, Public Information Officer (PIO) directory, and appellate filing procedures.',
    sections: [
      {
        heading: '1. Proactive Suo-Motu Disclosures',
        content: [
          'In compliance with Section 4(1)(b) of the Right to Information Act, 2005, the JanSetu Directorate maintains proactive online disclosures concerning organizational architecture, automated decision logic, vendor empanelment, and budget outlays.',
          'Citizens can inspect system audit certifications, uptime telemetry, and anonymized algorithmic transparency benchmarks directly via our public reports.'
        ]
      },
      {
        heading: '2. Designated Central Public Information Officer (CPIO)',
        content: [
          'Name: Shri Rajeshwar Sharma, Scientist-F / Additional Director',
          'Division: JanSetu Digital Infrastructure Division, NIC / MeitY',
          'Address: National Informatics Centre, A-Block, CGO Complex, Lodhi Road, New Delhi - 110003',
          'Email: cpio.jansetu@nic.in | Telephone: +91-11-2430-XXXX'
        ]
      },
      {
        heading: '3. First Appellate Authority (FAA)',
        content: [
          'Name: Smt. Ananya Sengupta, Joint Secretary (e-Governance)',
          'Ministry of Electronics and Information Technology, Electronics Niketan, New Delhi - 110003',
          'Email: faa.jansetu@meity.gov.in'
        ]
      },
      {
        heading: '4. Electronic RTI Application Submission',
        content: [
          'Citizens wishing to submit formal RTI applications or First Appeals may file directly through the National RTI Online Portal at https://rtionline.gov.in by selecting "Ministry of Electronics & Information Technology" as the parent public authority.'
        ]
      }
    ]
  },

  'help-faq': {
    id: 'help-faq',
    title: 'Help, FAQ & Citizen Troubleshooting Guide',
    shortTitle: 'Help & FAQ',
    lastUpdated: 'August 2026',
    badge: 'Citizen Helpdesk 24x7',
    metaDescription: 'Frequently asked questions regarding JanSetu AI eligibility, DigiLocker e-KYC vault syncing, Aadhaar OTP authentication, and grievance ticketing.',
    sections: [
      {
        heading: '1. How does JanSetu calculate my scheme eligibility?',
        content: [
          'JanSetu utilizes a verified knowledge graph of Central and State government welfare schemes combined with your consent-linked profile attributes (e.g., state, occupation, land holding, annual family income, category).',
          'Our AI engine evaluates rule-based eligibility predicates instantly, highlighting exact qualifying criteria, benefit sums, and missing prerequisite certificates before you apply.'
        ]
      },
      {
        heading: '2. Is my Aadhaar biometric or OTP stored on JanSetu?',
        content: [
          'No. JanSetu operates on a strict zero-knowledge, zero-PII storage paradigm. Aadhaar OTP authentications are forwarded directly to UIDAI servers over encrypted TLS 1.3 channels.',
          'JanSetu only receives an ephemeral demographic validation token and never stores your biometrics or full Aadhaar number.'
        ]
      },
      {
        heading: '3. What should I do if my DigiLocker document is missing or outdated?',
        content: [
          'Navigate to your "DigiLocker Document Vault" tab on the Citizen Dashboard and click "Sync DigiLocker Records". If your latest Caste, Income, or Land record is not reflected, please ensure the issuing State Department has pushed the signed record to the National DigiLocker Repository.'
        ]
      },
      {
        heading: '4. How do I switch my interface language?',
        content: [
          'Use the language selector button located in the top navigation bar. You can choose from English, Hindi (हिंदी), or any of the 22 Eighth Schedule regional languages. All menus, scheme titles, and roadmap steps will dynamically translate.'
        ]
      },
      {
        heading: '5. National Helpdesk & Emergency Support Channels',
        content: [
          '• Toll-Free National Citizen Helpline: 1800-11-2026 (Available 24x7 in 22 languages)',
          '• WhatsApp AI Assistance: Send "Namaste" to +91-90131-XXXXX',
          '• Email Support: support.jansetu@gov.in (Average ticket resolution time: < 4 business hours)'
        ]
      }
    ]
  }
};

export const POLICY_SLUGS = Object.keys(LEGAL_POLICIES);

export function getPolicyById(id: string): LegalPolicy | undefined {
  return LEGAL_POLICIES[id];
}

export function getAllPolicies(): LegalPolicy[] {
  return Object.values(LEGAL_POLICIES);
}
