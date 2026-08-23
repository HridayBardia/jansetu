'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// --- Interfaces ---
export interface Profile {
  id: string;
  name: string;
  relationship: string;
  location: string;
  domicile: string;
  verifiedAttributes: number;
}

export interface DocumentRecord {
  id: string;
  name: string;
  type: string;
  status: 'AVAILABLE' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'EXPIRED' | 'MISSING';
  uploadDate: string;
  fileType: string;
  pageCount: number;
  source: string;
  isDemo: boolean;
  fileObject?: File; // Reference to the actual uploaded file
}

export interface Journey {
  id: string;
  title: string;
  category: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ACTION_REQUIRED' | 'COMPLETED' | 'PAUSED' | 'READY_TO_APPLY';
  progress: number;
  currentStage: string;
  documentsReady: number;
  documentsTotal: number;
  nextAction: string;
  lastUpdated: string;
  isDemo: boolean;
}

export interface Application {
  id: string;
  title: string;
  department: string;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFICATION' | 'ACTION_REQUIRED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  submittedDate: string;
  lastUpdated: string;
  nextStep: string;
  timeline: { title: string; status: 'completed' | 'current' | 'pending'; date?: string }[];
  isDemo: boolean;
}

export interface Consent {
  id: string;
  department: string;
  purpose: string;
  requestedFields: string[];
  status: 'ACTIVE' | 'PENDING' | 'REVOKED' | 'EXPIRED';
  grantedDate?: string;
  expiryDate?: string;
}

export interface GovConnection {
  id: string;
  provider: string;
  purpose: string;
  status: 'CONNECTED_DEMO' | 'AVAILABLE' | 'DISCONNECTED' | 'ERROR';
  dataShared: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  message: string;
  category: 'Application Update' | 'Document' | 'Verification' | 'Consent' | 'Journey' | 'Security';
  isNew: boolean;
}

export interface MockDataState {
  profile: Profile;
  familyMembers: Profile[];
  documents: DocumentRecord[];
  journeys: Journey[];
  applications: Application[];
  consents: Consent[];
  governmentConnections: GovConnection[];
  alerts: Alert[];
  addDocument: (doc: DocumentRecord) => void;
  updateApplicationStatus: (id: string, status: Application['status']) => void;
  revokeConsent: (id: string) => void;
}

// --- Initial Data ---
const initialProfile: Profile = {
  id: 'cit_001',
  name: 'Hriday Bardia',
  relationship: 'Self',
  location: 'Bangalore, Karnataka',
  domicile: 'Gujarat',
  verifiedAttributes: 8
};

const initialFamily: Profile[] = [
  { id: 'cit_002', name: 'Rajesh Bardia', relationship: 'Father', location: 'Ahmedabad, Gujarat', domicile: 'Gujarat', verifiedAttributes: 5 },
  { id: 'cit_003', name: 'Meena Bardia', relationship: 'Mother', location: 'Ahmedabad, Gujarat', domicile: 'Gujarat', verifiedAttributes: 5 },
  { id: 'cit_004', name: 'Aarav Bardia', relationship: 'Brother', location: 'Bangalore, Karnataka', domicile: 'Gujarat', verifiedAttributes: 3 }
];

const initialDocuments: DocumentRecord[] = [
  { id: 'doc_001', name: 'Aadhaar.pdf', type: 'Aadhaar Card', status: 'AVAILABLE', uploadDate: '22 Aug 2026', fileType: 'PDF', pageCount: 2, source: 'DigiLocker', isDemo: true },
  { id: 'doc_002', name: 'PAN.pdf', type: 'PAN Card', status: 'AVAILABLE', uploadDate: '21 Aug 2026', fileType: 'PDF', pageCount: 1, source: 'Income Tax Dept', isDemo: true },
  { id: 'doc_003', name: 'Driving_Licence.pdf', type: 'Driving Licence', status: 'VERIFIED', uploadDate: '20 Aug 2026', fileType: 'PDF', pageCount: 1, source: 'Parivahan', isDemo: true },
  { id: 'doc_004', name: 'Voter_ID.pdf', type: 'Voter ID', status: 'AVAILABLE', uploadDate: '19 Aug 2026', fileType: 'PDF', pageCount: 2, source: 'Election Commission', isDemo: true },
  { id: 'doc_005', name: '10th_Marksheet.pdf', type: '10th Marksheet', status: 'VERIFIED', uploadDate: '18 Aug 2026', fileType: 'PDF', pageCount: 1, source: 'CBSE', isDemo: true },
  { id: 'doc_006', name: '12th_Marksheet.pdf', type: '12th Marksheet', status: 'VERIFIED', uploadDate: '18 Aug 2026', fileType: 'PDF', pageCount: 1, source: 'CBSE', isDemo: true },
  { id: 'doc_007', name: 'Degree_Certificate.pdf', type: 'Degree Certificate', status: 'VERIFIED', uploadDate: '15 Aug 2026', fileType: 'PDF', pageCount: 1, source: 'University', isDemo: true },
  { id: 'doc_008', name: 'Income_Certificate.pdf', type: 'Income Certificate', status: 'EXPIRED', uploadDate: '10 Jan 2025', fileType: 'PDF', pageCount: 1, source: 'Revenue Dept', isDemo: true }
];

const initialJourneys: Journey[] = [
  { id: 'jrn_001', title: 'Study in Australia — Master\'s', category: 'Education', status: 'PLANNING', progress: 35, currentStage: 'Document Preparation', documentsReady: 6, documentsTotal: 11, nextAction: 'Upload passport and academic transcripts', lastUpdated: 'Just now', isDemo: true },
  { id: 'jrn_002', title: 'Apply for Government Scholarship', category: 'Education', status: 'ACTION_REQUIRED', progress: 60, currentStage: 'Income Verification', documentsReady: 3, documentsTotal: 4, nextAction: 'Upload renewed income certificate', lastUpdated: '2 hours ago', isDemo: true },
  { id: 'jrn_003', title: 'Driving Licence', category: 'Transport', status: 'IN_PROGRESS', progress: 75, currentStage: 'Learner Verification', documentsReady: 2, documentsTotal: 2, nextAction: 'Complete learner\'s licence verification', lastUpdated: '1 day ago', isDemo: true },
  { id: 'jrn_004', title: 'Domicile Certificate', category: 'Revenue', status: 'READY_TO_APPLY', progress: 90, currentStage: 'Final Review', documentsReady: 3, documentsTotal: 3, nextAction: 'Review and submit application', lastUpdated: '3 days ago', isDemo: true }
];

const initialApplications: Application[] = [
  { id: 'DEMO-INC-2026-001', title: 'Income Certificate', department: 'Revenue Department', status: 'VERIFICATION', submittedDate: '18 Aug 2026', lastUpdated: 'Just now', nextStep: 'Awaiting department verification', isDemo: true, timeline: [
    { title: 'Application Created', status: 'completed', date: '18 Aug 2026' },
    { title: 'Documents Submitted', status: 'completed', date: '18 Aug 2026' },
    { title: 'Verification', status: 'current' },
    { title: 'Certificate Issued', status: 'pending' }
  ]},
  { id: 'DEMO-DOM-2026-002', title: 'Domicile Certificate', department: 'District Administration', status: 'ACTION_REQUIRED', submittedDate: '15 Aug 2026', lastUpdated: '1 day ago', nextStep: 'Upload clear address proof', isDemo: true, timeline: [
    { title: 'Application Created', status: 'completed', date: '15 Aug 2026' },
    { title: 'Documents Submitted', status: 'completed', date: '15 Aug 2026' },
    { title: 'Verification', status: 'current' },
    { title: 'Action Required', status: 'current' },
    { title: 'Decision', status: 'pending' }
  ]},
  { id: 'DEMO-SCH-2026-003', title: 'Scholarship Application', department: 'Education Department', status: 'SUBMITTED', submittedDate: '19 Aug 2026', lastUpdated: '2 days ago', nextStep: 'Application under review', isDemo: true, timeline: [
    { title: 'Application Created', status: 'completed', date: '19 Aug 2026' },
    { title: 'Application Submitted', status: 'current' },
    { title: 'Verification', status: 'pending' },
    { title: 'Sanction', status: 'pending' }
  ]},
  { id: 'DEMO-DL-2026-004', title: 'Learner\'s Licence', department: 'Transport Department', status: 'COMPLETED', submittedDate: '01 Aug 2026', lastUpdated: '10 Aug 2026', nextStep: 'Certificate issued', isDemo: true, timeline: [
    { title: 'Application Created', status: 'completed', date: '01 Aug 2026' },
    { title: 'Verification', status: 'completed', date: '05 Aug 2026' },
    { title: 'Test Completed', status: 'completed', date: '08 Aug 2026' },
    { title: 'Licence Issued', status: 'completed', date: '10 Aug 2026' }
  ]},
  { id: 'DEMO-TRD-2026-005', title: 'Trade License Renewal', department: 'Municipal Corporation', status: 'DRAFT', submittedDate: '-', lastUpdated: '5 days ago', nextStep: 'Complete application form', isDemo: true, timeline: [
    { title: 'Application Created', status: 'current' },
    { title: 'Documents Submitted', status: 'pending' },
    { title: 'Payment', status: 'pending' },
    { title: 'Certificate Issued', status: 'pending' }
  ]}
];

const initialConsents: Consent[] = [
  { id: 'cst_001', department: 'UIDAI', purpose: 'Identity verification', requestedFields: ['Name', 'DOB', 'Photo'], status: 'ACTIVE', grantedDate: '18 Aug 2026', expiryDate: '18 Feb 2027' },
  { id: 'cst_002', department: 'Education Department', purpose: 'Scholarship verification', requestedFields: ['Academic Records'], status: 'ACTIVE', grantedDate: '21 Aug 2026', expiryDate: '21 Aug 2027' },
  { id: 'cst_003', department: 'Transport Department', purpose: 'Driving licence application', requestedFields: ['Identity', 'Address'], status: 'PENDING' },
  { id: 'cst_004', department: 'Municipal Corporation', purpose: 'Address verification', requestedFields: ['Property Records'], status: 'REVOKED', grantedDate: '15 Jan 2026', expiryDate: '15 Jul 2026' },
  { id: 'cst_005', department: 'Income Tax Dept', purpose: 'Financial capacity check', requestedFields: ['PAN', 'Income'], status: 'ACTIVE', grantedDate: '22 Aug 2026', expiryDate: '22 Nov 2026' }
];

const initialGovConnections: GovConnection[] = [
  { id: 'gov_001', provider: 'UIDAI', purpose: 'Identity verification', status: 'CONNECTED_DEMO', dataShared: 'Identity attributes' },
  { id: 'gov_002', provider: 'Municipal Corporation', purpose: 'Address/service verification', status: 'CONNECTED_DEMO', dataShared: 'Address information' },
  { id: 'gov_003', provider: 'Income Tax Department', purpose: 'PAN/tax-related verification', status: 'CONNECTED_DEMO', dataShared: 'Tax identity attributes' },
  { id: 'gov_004', provider: 'Education Records (DigiLocker)', purpose: 'Academic verification', status: 'CONNECTED_DEMO', dataShared: 'Academic credentials' }
];

const initialAlerts: Alert[] = [
  { id: 'alt_001', timestamp: 'Just now', message: 'Document verification completed for 10th Marksheet.', category: 'Document', isNew: true },
  { id: 'alt_002', timestamp: '12 mins ago', message: 'Scholarship journey updated to 60% progress.', category: 'Journey', isNew: false },
  { id: 'alt_003', timestamp: '2 hours ago', message: 'New consent request received from Transport Department.', category: 'Consent', isNew: false },
  { id: 'alt_004', timestamp: '1 day ago', message: 'Domicile application moved to Action Required status.', category: 'Application Update', isNew: false }
];

const eventQueue = [
  { message: 'Your scholarship application moved to verification.', category: 'Application Update' },
  { message: 'A new document requirement was detected for Driving Licence.', category: 'Document' },
  { message: 'Domicile certificate review completed.', category: 'Verification' },
  { message: 'Application status changed to Submitted.', category: 'Application Update' },
  { message: 'New consent request from Revenue Department.', category: 'Consent' }
];

// --- Context Definition ---
const MockDataContext = createContext<MockDataState | undefined>(undefined);

export const MockDataProvider = ({ children }: { children: ReactNode }) => {
  const [profile] = useState<Profile>(initialProfile);
  const [familyMembers] = useState<Profile[]>(initialFamily);
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [journeys, setJourneys] = useState<Journey[]>(initialJourneys);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [consents, setConsents] = useState<Consent[]>(initialConsents);
  const [governmentConnections] = useState<GovConnection[]>(initialGovConnections);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  // Deterministic event streamer
  useEffect(() => {
    let eventIndex = 0;
    const interval = setInterval(() => {
      if (eventIndex < eventQueue.length) {
        const nextEvent = eventQueue[eventIndex];
        setAlerts(prev => [
          {
            id: `alt_new_${Date.now()}`,
            timestamp: 'Just now',
            message: nextEvent.message,
            category: nextEvent.category as Alert['category'],
            isNew: true
          },
          ...prev.map(a => ({ ...a, isNew: false })) // Older alerts lose 'isNew' status
        ]);
        eventIndex++;
      }
    }, 4000); // 4 seconds between events to be readable

    return () => clearInterval(interval);
  }, []);

  const addDocument = (doc: DocumentRecord) => {
    setDocuments(prev => [doc, ...prev]);
    // Adding a document might update a journey automatically in a real app
  };

  const updateApplicationStatus = (id: string, status: Application['status']) => {
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
  };

  const revokeConsent = (id: string) => {
    setConsents(prev => prev.map(c => c.id === id ? { ...c, status: 'REVOKED' } : c));
  };

  return (
    <MockDataContext.Provider value={{
      profile, familyMembers, documents, journeys, applications, consents, governmentConnections, alerts,
      addDocument, updateApplicationStatus, revokeConsent
    }}>
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
};
