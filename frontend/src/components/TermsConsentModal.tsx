'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, FileText, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';

// ============================================================
// TERMS VERSION CONSTANTS
// ============================================================
export const CITIZEN_TERMS_VERSION = 'JANSETU-CITIZEN-TC-v1.0';
export const ADMIN_TERMS_VERSION = 'JANSETU-ADMIN-TC-v1.0';

// ============================================================
// CONSENT STORAGE HELPERS (localStorage for prototype)
// ============================================================
const CONSENT_STORAGE_KEY = 'jansetu_consent_records';

export interface ConsentRecord {
  role: 'citizen' | 'admin';
  consentAccepted: boolean;
  termsVersion: string;
  acceptedAt: string;
}

export function getStoredConsent(role: 'citizen' | 'admin'): ConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const records: ConsentRecord[] = JSON.parse(raw);
    const version = role === 'citizen' ? CITIZEN_TERMS_VERSION : ADMIN_TERMS_VERSION;
    return records.find(r => r.role === role && r.termsVersion === version) || null;
  } catch {
    return null;
  }
}

export function storeConsent(role: 'citizen' | 'admin'): ConsentRecord {
  const version = role === 'citizen' ? CITIZEN_TERMS_VERSION : ADMIN_TERMS_VERSION;
  const record: ConsentRecord = {
    role,
    consentAccepted: true,
    termsVersion: version,
    acceptedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      let records: ConsentRecord[] = raw ? JSON.parse(raw) : [];
      // Remove old consent for same role+version
      records = records.filter(r => !(r.role === role && r.termsVersion === version));
      records.push(record);
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(records));
    } catch {
      // ignore
    }
  }
  return record;
}

// ============================================================
// CITIZEN TERMS CONTENT
// ============================================================
const CITIZEN_TERMS_CONTENT = `
## Citizen Terms, Privacy & Data Consent

**Last Updated:** 24 August 2026 · **Version:** ${CITIZEN_TERMS_VERSION}

Please review the following Terms & Conditions and Data Consent before continuing.

---

### 1. Purpose

JANSETU is a citizen assistance and navigation platform designed to help individuals understand, access, and navigate government services, schemes, and document requirements across India. JANSETU is **not** an official Government of India platform. It is an independent assistance tool that connects citizens with publicly available government information and resources.

### 2. Information We Process

To provide personalised assistance, JANSETU may process the following categories of information that you voluntarily provide:

- **Personal details:** Name, date of birth, gender, age, and contact information.
- **Financial information:** Annual income range, income category, and occupation details.
- **Location information:** State, district, city, and pincode — used to identify relevant state-level schemes and services.
- **Goal and query information:** Life goals, service requests, and questions you submit through the platform.
- **Document-related information:** Types of documents you reference or upload for matching and eligibility analysis.
- **Profile data:** Education, social category, and other demographic fields provided during onboarding.

### 3. Use of Information

Information you provide is used solely to:

- Analyse your goals and life events to generate personalised action plans.
- Match you with relevant government schemes, subsidies, and benefits at the Central and State level.
- Identify document requirements and gaps for your specific journey.
- Provide step-by-step guidance through workflows and government service processes.
- Improve platform quality, accuracy, and user experience.

### 4. Document Assistance

JANSETU may help you identify required documents, check document consistency, and prepare application packets. Documents stored within the platform's demonstration vault are **simulated or mock documents** created for demonstration purposes only. They must not be treated as official government-issued records and cannot be used for any official submission, legal, or verification purpose.

### 5. Government Scheme Matching

JANSETU matches your profile against publicly available Central and State government schemes. This matching is informational and advisory in nature. Inclusion of a scheme in recommendations does not guarantee eligibility or approval. Final eligibility determination rests solely with the respective government authority.

### 6. Location & Domicile Information

Your domicile state and location data are used to filter state-specific schemes, document requirements, and jurisdictional workflows. This information remains within your profile and is not shared externally.

### 7. Data Security

JANSETU implements industry-standard security measures to protect your data, including encrypted storage, access controls, session management, and audit logging. However, no digital system can guarantee absolute security. You acknowledge this inherent risk when using any online platform.

### 8. Data Sharing

Your personal information is **not sold, traded, or shared** with third-party advertisers or data brokers. Limited data may be shared with government service gateways (such as DigiLocker sandboxes or scheme portals) strictly when you initiate a specific action that requires such sharing, and only with your explicit consent for that action.

### 9. Retention

Your data is retained only for as long as necessary to provide platform services. You may request data deletion through the Privacy Center. Demo and synthetic data associated with demonstration accounts may be retained for platform improvement and research purposes.

### 10. Citizen Responsibilities

You are responsible for:

- Providing accurate and truthful information.
- Understanding that JANSETU provides guidance, not legal or official advice.
- Verifying all information with the relevant government authority before taking official action.
- Protecting your login credentials and not sharing your account access.

### 11. Prototype Limitations

JANSETU is currently in a prototype and demonstration phase. During this phase:

- Documents within the platform may be simulated or synthetic demonstrations.
- Scheme data is sourced from publicly available government information but may not reflect the most recent policy changes.
- Service integrations may operate in sandbox or mock mode.
- Feature availability and data accuracy may vary.

You should always verify critical information directly with the relevant government authority.

### 12. Consent

By clicking "I Agree & Continue," you confirm that you have read, understood, and agree to these Terms & Conditions and Privacy & Data Consent. You acknowledge that JANSETU is an assistance platform and not an official government system. You consent to the processing of the information you provide for the purposes described above.

You may withdraw your consent at any time by logging out or contacting the platform administrators. Withdrawal of consent may limit your ability to use certain platform features.
`;

// ============================================================
// ADMIN TERMS CONTENT
// ============================================================
const ADMIN_TERMS_CONTENT = `
## Administrator Terms, Access & Data Handling Policy

**Last Updated:** 24 August 2026 · **Version:** ${ADMIN_TERMS_VERSION}

Please review the following Terms & Conditions and Data Consent before continuing.

---

<div style="background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.3); border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 10px;">
  <span style="font-size: 18px; line-height: 1;">⚠️</span>
  <div>
    <strong style="color: #fbbf24;">Administrative Access Notice</strong><br/>
    <span style="color: #d4a819; font-size: 14px;">
      Administrative access is provided only for authorized operational purposes. Citizen information, documents, applications, and workflow data must not be accessed, copied, exported, disclosed, or modified except as permitted by assigned responsibilities and applicable policy.
    </span>
  </div>
</div>

### 1. Administrative Access

JANSETU administrative access is provided to authorized personnel for the purposes of system monitoring, citizen support operations, audit review, analytics, and platform management. Administrative privileges grant elevated access to citizen data and system functions.

### 2. Authorized Use

Administrative access must be used exclusively for legitimate operational duties, including:

- Monitoring system health, workflows, and service integrations.
- Reviewing citizen journeys and application statuses to provide support.
- Analysing aggregate platform usage and performance metrics.
- Managing schemes, alerts, and knowledge base content.
- Conducting audit reviews and compliance checks.

Any use of administrative access for personal, unauthorised, or malicious purposes is strictly prohibited and may result in immediate access revocation and disciplinary action.

### 3. Citizen Data Confidentiality

All citizen information accessible through administrative functions — including personal details, documents, financial data, application information, workflow status, and journey history — is **strictly confidential**. You must treat citizen data with the same level of care as regulated personal information.

### 4. Least-Privilege & Role-Based Access

Administrative access follows the principle of least privilege. Your role determines which data and functions you can access. You must not attempt to access data or functions outside your assigned role scope. Role assignments are managed by the platform administrator.

### 5. Data Handling Responsibilities

As an administrator, you are responsible for:

- Viewing citizen profiles, documents, and applications only when operationally necessary.
- Never accessing citizen data for purposes outside your assigned duties.
- Ensuring any data viewed or referenced is handled in accordance with data protection principles.
- Maintaining the integrity and confidentiality of all data encountered during administrative operations.

### 6. Audit Logging

All administrative actions within JANSETU are logged, including data access, modifications, and system operations. Audit logs are maintained for accountability, compliance, and incident investigation. You acknowledge that your administrative activities are subject to review.

### 7. Prohibited Actions

The following actions are strictly prohibited:

- Downloading, copying, or exporting citizen data without explicit authorization.
- Sharing citizen information with unauthorized individuals or external systems.
- Modifying citizen records, documents, or application data without proper authorization.
- Using administrative access to bypass security controls or access restricted data.
- Using citizen data for research, profiling, or any purpose beyond operational duties.

### 8. Security Responsibilities

You are responsible for:

- Protecting your administrative credentials and not sharing them with anyone.
- Ensuring session security by logging out when administrative work is complete.
- Reporting any suspected security incidents, data breaches, or unauthorized access immediately.
- Maintaining awareness of security policies and procedures applicable to your role.

### 9. Data Breach & Incident Reporting

If you become aware of any data breach, security incident, or unauthorised access to citizen information, you must report it immediately to the platform security team. Delayed reporting may worsen the impact and may result in disciplinary action.

### 10. Administrative Accountability

Administrators are personally accountable for all actions performed under their credentials. Administrative access logs tie all operations to your account. Ignorance of policy does not exempt you from accountability.

### 11. Prototype Limitations

JANSETU is currently in a prototype and demonstration phase. During this phase:

- Citizen data within the platform may include simulated or synthetic demonstration data.
- Audit logs and monitoring features may not yet reflect full production-grade capabilities.
- Administrative features and access controls may evolve as the platform matures.

Administrators must still adhere to all policies and best practices even during the prototype phase.

### 12. Consent & Acknowledgement

By clicking "I Agree & Continue," you acknowledge that:

- You have read, understood, and agree to these Administrator Terms & Data Handling Policy.
- You understand that citizen information is confidential and must be protected.
- You will use administrative access only for authorized operational purposes.
- You understand that all administrative actions are logged and subject to review.
- You accept personal accountability for all actions performed under your administrative credentials.

You may withdraw your administrative access acknowledgement at any time by logging out. Continued use of administrative features constitutes ongoing acceptance of these terms.
`;

// ============================================================
// MARKDOWN-TO-HTML SIMPLE RENDERER
// ============================================================
function renderMarkdown(text: string): string {
  let html = text;

  // Handle the styled div block for admin warning
  html = html.replace(/<div style="([^"]*)">([\s\S]*?)<\/div>/g, (_match, style, content) => {
    // Process inner content
    let inner = content
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fbbf24;">$1</strong>')
      .replace(/\n/g, '<br/>');
    return `<div style="${style}">${inner}</div>`;
  });

  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3 style="color: #e2e8f0; font-size: 15px; font-weight: 600; margin: 20px 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.08);">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 style="color: #f1f5f9; font-size: 18px; font-weight: 700; margin: 0 0 6px 0;">$1</h2>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #e2e8f0;">$1</strong>');

  // Bullet points
  html = html.replace(/^- (.*$)/gm, '<li style="color: #cbd5e1; margin: 4px 0; line-height: 1.6; font-size: 14px;">$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul style="margin: 8px 0; padding-left: 24px; list-style-type: disc;">$1</ul>');

  // Paragraphs for non-tagged lines
  html = html.replace(/^(?!<[hulo]|<div|<hr|<li|<ul|<strong)(.*[^\n].*)$/gm, '<p style="color: #94a3b8; font-size: 14px; line-height: 1.7; margin: 8px 0;">$1</p>');

  return html;
}

// ============================================================
// MODAL PROPS
// ============================================================
interface TermsConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  role: 'citizen' | 'admin';
}

// ============================================================
// TERMS CONSENT MODAL COMPONENT
// ============================================================
const TermsConsentModal: React.FC<TermsConsentModalProps> = ({ isOpen, onClose, onAccept, role }) => {
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showReachedEnd, setShowReachedEnd] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const checkboxRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const termsContent = role === 'citizen' ? CITIZEN_TERMS_CONTENT : ADMIN_TERMS_CONTENT;
  const termsTitle = role === 'citizen'
    ? 'Terms & Conditions & Data Consent'
    : 'Administrator Terms, Access & Data Handling Policy';

  // Reset state when modal opens or role changes
  useEffect(() => {
    if (isOpen) {
      setHasReachedBottom(false);
      setConsentChecked(false);
      setShowReachedEnd(false);
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus close button after a tick
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      // Restore focus
      previousFocusRef.current?.focus();
    }
  }, [isOpen, role]);

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll detection
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const tolerance = 8;
    const atBottom = scrollTop + clientHeight >= scrollHeight - tolerance;

    if (atBottom && !hasReachedBottom) {
      setHasReachedBottom(true);
      setShowReachedEnd(true);
    }
  }, [hasReachedBottom]);

  // Checkbox toggle
  const handleCheckboxToggle = () => {
    if (!hasReachedBottom) return;
    setConsentChecked(prev => !prev);
  };

  // Accept handler
  const handleAccept = () => {
    if (consentChecked && hasReachedBottom) {
      onAccept();
    }
  };

  if (!isOpen) return null;

  const loginAllowed = consentChecked && hasReachedBottom;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={termsTitle}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(24px)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: role === 'citizen'
                  ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))'
                  : 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(245,158,11,0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {role === 'citizen'
                ? <FileText size={18} color="#60a5fa" />
                : <Shield size={18} color="#fbbf24" />
              }
            </div>
            <h2
              style={{
                color: '#f1f5f9',
                fontSize: '16px',
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {termsTitle}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close terms modal"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            maxHeight: '55vh',
            scrollBehavior: 'smooth',
          }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: renderMarkdown(termsContent) }}
            style={{
              fontSize: '14px',
              lineHeight: '1.7',
              color: '#94a3b8',
            }}
          />
        </div>

        {/* Bottom Consent Area */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 24px',
            flexShrink: 0,
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Scroll instruction / reached end message */}
          {!hasReachedBottom ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.15)',
              }}
            >
              <span style={{ fontSize: '14px' }}>↓</span>
              <span style={{ color: '#60a5fa', fontSize: '13px', fontWeight: 500 }}>
                Please scroll to the bottom to continue
              </span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.15)',
              }}
            >
              <CheckCircle2 size={14} color="#22c55e" />
              <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: 500 }}>
                You have reached the end of the Terms & Conditions.
              </span>
            </div>
          )}

          {/* Checkbox */}
          <button
            ref={checkboxRef}
            onClick={handleCheckboxToggle}
            disabled={!hasReachedBottom}
            aria-checked={consentChecked}
            role="checkbox"
            aria-label="I have read and agree to the Terms & Conditions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: `1px solid ${consentChecked ? 'rgba(34,197,94,0.3)' : hasReachedBottom ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
              background: consentChecked
                ? 'rgba(34,197,94,0.08)'
                : 'rgba(255,255,255,0.03)',
              cursor: hasReachedBottom ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              marginBottom: '12px',
              textAlign: 'left',
            }}
            onMouseOver={(e) => {
              if (hasReachedBottom) {
                e.currentTarget.style.background = consentChecked ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = consentChecked ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)';
            }}
          >
            {/* Custom checkbox indicator */}
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '6px',
                border: `2px solid ${consentChecked ? '#22c55e' : hasReachedBottom ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}`,
                background: consentChecked ? '#22c55e' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0,
                opacity: hasReachedBottom ? 1 : 0.5,
              }}
            >
              {consentChecked && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span
              style={{
                color: hasReachedBottom ? '#e2e8f0' : '#475569',
                fontSize: '14px',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              I have read and agree to the Terms & Conditions
            </span>
          </button>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            disabled={!loginAllowed}
            aria-label="Accept terms and continue"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              background: loginAllowed
                ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                : 'rgba(255,255,255,0.05)',
              color: loginAllowed ? 'white' : '#475569',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loginAllowed ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: loginAllowed ? '0 4px 14px rgba(37, 99, 235, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <CheckCircle2 size={16} />
            I Agree & Continue
          </button>
        </div>
      </div>

      {/* Global styles for scroll */}
      <style dangerouslySetInnerHTML={{ __html: `
        [role="dialog"] [style*="overflow-y: auto"]::-webkit-scrollbar {
          width: 6px;
        }
        [role="dialog"] [style*="overflow-y: auto"]::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.03);
          border-radius: 3px;
        }
        [role="dialog"] [style*="overflow-y: auto"]::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 3px;
        }
        [role="dialog"] [style*="overflow-y: auto"]::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}} />
    </div>
  );
};

export default TermsConsentModal;
