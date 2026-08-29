'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { isCitizenMatching } from '@/lib/vaultDetection';
import { eventBus } from '@/utils/eventBus';
import {
  toSupabaseApplication, fromSupabaseApplication,
  toSupabaseJourney, fromSupabaseJourney,
  toSupabaseConsent, fromSupabaseConsent,
  toSupabaseNotification, fromSupabaseNotification,
  toSupabaseDocRequest, fromSupabaseDocRequest
} from '@/lib/supabaseMapper';

export interface ApplicationRecord {
  id: string;
  citizenName: string;
  citizenId: string;
  service: string;
  department: string;
  status: 'SUBMITTED' | 'UNDER_VERIFICATION' | 'UNDER_REVIEW' | 'DOCUMENTS_REQUIRED' | 'ACTION_REQUIRED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  submittedDate: string;
  lastUpdated: string;
  nextAction: string;
  location?: string;
  sla?: string;
  documents?: { name: string; status: string }[];
  timeline?: { title: string; description: string; timestamp: string; status: string }[];
}

export interface JourneyRecord {
  id: string;
  title: string;
  category: string;
  citizenName?: string;
  status: 'Planning' | 'In Progress' | 'Action Required' | 'Completed' | 'Ready to Apply';
  progress: number;
  currentStage: string;
  documentsReady: number;
  documentsTotal: number;
  nextAction: string;
  lastUpdated: string;
  timestamp: number;
  location?: string;
}

export interface ConsentRecord {
  id: string;
  department: string;
  purpose: string;
  requestedFields: string[];
  status: 'ACTIVE' | 'PENDING' | 'REVOKED' | 'EXPIRED';
  grantedDate?: string;
  expiryDate?: string;
}

export interface NotificationRecord {
  id: string;
  timestamp: string;
  message: string;
  category: 'Application Update' | 'Document' | 'Verification' | 'Consent' | 'Journey' | 'Security';
  isNew: boolean;
  citizenName?: string;
  citizenId?: string;
  appId?: string;
  recipientRole?: 'ADMIN' | 'CITIZEN' | 'ALL';
}

export interface DocRequestRecord {
  id: string;
  deptName: string;
  docType: string;
  citizenId: string;
  citizenName: string;
  requestedAt: string;
  status: 'PENDING' | 'FULFILLED';
  appId?: string;
}

export interface PendingKycRequest {
  requestId?: string;
  appId: string;
  citizenName: string;
  citizenId?: string;
  docName: string;
  dept: string;
  timestamp: string;
  type?: string;
}

export type LiveSyncEventType = 
  | 'APPLICATION_CREATED'
  | 'APPLICATION_STATUS_UPDATED'
  | 'JOURNEY_STARTED'
  | 'JOURNEY_UPDATED'
  | 'DOCUMENT_REQUESTED'
  | 'DOC_KYC_REQUEST'
  | 'CITIZEN_DOC_REQUESTED'
  | 'TARGETED_CITIZEN_REQUEST'
  | 'DOC_KYC_FULFILLED'
  | 'CITIZEN_DOC_PROVIDED'
  | 'CITIZEN_DOC_FULFILLED'
  | 'CONSENT_REQUESTED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'ALERT_DISPATCHED';

export interface LiveSyncEvent {
  type: LiveSyncEventType;
  payload: any;
  sender?: 'CITIZEN' | 'ADMIN' | 'SYSTEM';
  timestamp?: string;
}

interface LiveSyncContextType {
  applications: ApplicationRecord[];
  journeys: JourneyRecord[];
  consents: ConsentRecord[];
  notifications: NotificationRecord[];
  allNotifications: NotificationRecord[];
  docRequests: DocRequestRecord[];
  pendingKycRequest: PendingKycRequest | null;
  pendingKycRequests: PendingKycRequest[];
  revokedDepartments: string[];
  liveEventNotice: { title: string; message: string; type: 'info' | 'warning' | 'success' } | null;
  recentlyAddedAppId: string | null;
  recentlyAddedJourneyId: string | null;
  
  // Methods
  startJourney: (journeyData: Partial<JourneyRecord>) => void;
  submitApplication: (appData: ApplicationRecord) => void;
  requestDocument: (deptName: string, docType: string, citizenId?: string, citizenName?: string) => void;
  requestCitizenDoc: (payload: { appId: string; citizenName?: string; citizenId?: string; docName: string; dept?: string; schemeName?: string; }) => void;
  authorizeCitizenDoc: (payload: { appId: string; docName: string; dept?: string; citizenName?: string; }) => void;
  dismissPendingKycRequest: (appId?: string) => void;
  grantConsent: (deptId: string, department?: string) => void;
  revokeConsent: (deptId: string, department?: string) => void;
  broadcastApplicationCreated: (app: ApplicationRecord) => void;
  broadcastConsentRequested: (req: { department: string; purpose: string; requestedFields: string[] }) => void;
  broadcastConsentRevoked: (department: string, consentId?: string) => void;
  broadcastConsentGranted: (department: string, consentId?: string) => void;
  broadcastApplicationStatusUpdated: (id: string, status: ApplicationRecord['status'], reason?: string) => void;
  markAllAsRead: () => void;
  markNotificationAsRead: (id: string) => void;
  clearLiveNotice: () => void;
  syncAll: () => void;
}

const DEFAULT_APPLICATIONS: ApplicationRecord[] = [
  {
    id: 'JS-2026-8801',
    citizenName: 'Ayush Singh Chauhan',
    citizenId: '1111 2222 0207',
    service: 'PM-KISAN DBT Direct Support',
    department: 'Ministry of Agriculture & Farmers Welfare',
    status: 'SUBMITTED',
    submittedDate: '2026-08-28',
    lastUpdated: '2026-08-28 14:30',
    nextAction: 'Land Record Verification via State Geo-Registry',
    location: 'Jaipur, Rajasthan',
    sla: '48 Hours',
    documents: [
      { name: 'Aadhaar e-KYC Certificate', status: 'VERIFIED' },
      { name: 'Land Record Khasra', status: 'PENDING_MATCH' }
    ]
  },
  {
    id: 'JS-2026-8802',
    citizenName: 'Hriday Bardia',
    citizenId: '1111 2222 1405',
    service: 'National Apprenticeship Training Scheme (NATS)',
    department: 'Ministry of Education',
    status: 'UNDER_VERIFICATION',
    submittedDate: '2026-08-27',
    lastUpdated: '2026-08-28 11:00',
    nextAction: 'Institution Polytechnic Diploma Cross-Check',
    location: 'Vadodara, Gujarat',
    sla: '24 Hours',
    documents: [
      { name: 'Aadhaar e-KYC', status: 'VERIFIED' },
      { name: 'Polytechnic Marksheet', status: 'PENDING_MATCH' }
    ]
  },
  {
    id: 'JS-2026-8803',
    citizenName: 'Varad Kanade',
    citizenId: '1111 2222 1304',
    service: 'PM Awas Yojana (PMAY-Gramin)',
    department: 'Ministry of Rural Development',
    status: 'DOCUMENTS_REQUIRED',
    submittedDate: '2026-08-26',
    lastUpdated: '2026-08-27 16:45',
    nextAction: 'Upload Geo-Tagged Site Inspection Photo',
    location: 'Pune, Maharashtra',
    sla: '72 Hours',
    documents: [
      { name: 'Aadhaar Identity', status: 'VERIFIED' },
      { name: 'Geo-Tagged Site Inspection Photo', status: 'PENDING_MATCH' }
    ]
  },
  {
    id: 'JS-2026-8804',
    citizenName: 'Satwik Guru',
    citizenId: '1111 2222 3333',
    service: 'Ayushman Bharat PM-JAY Golden Card',
    department: 'National Health Authority',
    status: 'APPROVED',
    submittedDate: '2026-08-25',
    lastUpdated: '2026-08-26 10:15',
    nextAction: 'E-Card Dispatched to DigiLocker',
    location: 'Bengaluru, Karnataka',
    sla: 'Completed',
    documents: [
      { name: 'Ration Card NFSA', status: 'VERIFIED' },
      { name: 'Income & Domicile Certificate', status: 'PENDING_MATCH' }
    ]
  }
];

const DEFAULT_JOURNEYS: JourneyRecord[] = [
  {
    id: 'journey_biz_vadodara',
    title: 'Start Commercial Food Business in Vadodara',
    category: 'Business & Commerce',
    citizenName: 'Hriday Bardia',
    status: 'In Progress',
    progress: 45,
    currentStage: 'FSSAI License & Municipal Trade Clearance',
    documentsReady: 4,
    documentsTotal: 6,
    nextAction: 'Upload Commercial Lease Agreement',
    lastUpdated: '2 hours ago',
    timestamp: Date.now() - 7200000,
    location: 'Vadodara, Gujarat'
  },
  {
    id: 'journey_edu_aust',
    title: 'Higher Education & Masters in Australia',
    category: 'Higher Education',
    citizenName: 'Hriday Bardia',
    status: 'In Progress',
    progress: 60,
    currentStage: 'Academic Marksheet Verification & Bank Mandate',
    documentsReady: 5,
    documentsTotal: 6,
    nextAction: 'Aadhaar e-KYC verification with National Overseas Portal',
    lastUpdated: '1 day ago',
    timestamp: Date.now() - 86400000,
    location: 'Udaipur, Rajasthan'
  },
  {
    id: 'journey_scholarship_rj',
    title: 'Post-Matric Scholarship Scheme Application',
    category: 'Scholarships & Welfare',
    citizenName: 'Hriday Bardia',
    status: 'Ready to Apply',
    progress: 90,
    currentStage: 'Final Eligibility & Direct DBT Seeding',
    documentsReady: 4,
    documentsTotal: 4,
    nextAction: 'Click Submit on Portal',
    lastUpdated: '3 days ago',
    timestamp: Date.now() - 259200000,
    location: 'Jaipur, Rajasthan'
  },
  {
    id: 'journey_farmer_kisan',
    title: 'PM-KISAN Beneficiary Registration & Land Linking',
    category: 'Agriculture & Rural',
    citizenName: 'Ayush Singh Chauhan',
    status: 'In Progress',
    progress: 75,
    currentStage: 'Land Revenue Khasra e-Authentication',
    documentsReady: 3,
    documentsTotal: 4,
    nextAction: 'Aadhaar biometric re-verification at CSC',
    lastUpdated: '4 days ago',
    timestamp: Date.now() - 345600000,
    location: 'Kota, Rajasthan'
  }
];

const DEFAULT_CONSENTS: ConsentRecord[] = [
  { id: 'cst_001', department: 'UIDAI', purpose: 'Identity verification', requestedFields: ['Name', 'DOB', 'Photo'], status: 'ACTIVE', grantedDate: '18 Aug 2026', expiryDate: '18 Feb 2027' },
  { id: 'cst_002', department: 'Education Department', purpose: 'Scholarship verification', requestedFields: ['Academic Records'], status: 'ACTIVE', grantedDate: '21 Aug 2026', expiryDate: '21 Aug 2027' },
  { id: 'cst_003', department: 'Transport Department', purpose: 'Driving licence application', requestedFields: ['Identity', 'Address'], status: 'PENDING' },
  { id: 'cst_004', department: 'Municipal Corporation', purpose: 'Address verification', requestedFields: ['Property Records'], status: 'REVOKED', grantedDate: '15 Jan 2026', expiryDate: '15 Jul 2026' },
  { id: 'cst_005', department: 'Revenue Department', purpose: 'Financial capacity check', requestedFields: ['PAN', 'Income Certificate'], status: 'ACTIVE', grantedDate: '22 Aug 2026', expiryDate: '22 Nov 2026' }
];

const DEFAULT_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: 'notif_ayush_init',
    timestamp: 'Yesterday',
    message: 'Application #JS-2026-8801 for PM Kisan Samman Nidhi submitted successfully. Land Revenue validation pending.',
    category: 'Application Update',
    citizenName: 'Ayush Singh Chauhan',
    appId: 'JS-2026-8801',
    recipientRole: 'CITIZEN',
    isNew: false
  },
  {
    id: 'notif_hriday_init',
    timestamp: '2 days ago',
    message: 'Application #JS-2026-8802 for National Apprenticeship Training Scheme (NATS) is Under Verification by Ministry of Education.',
    category: 'Application Update',
    citizenName: 'Hriday Bardia',
    appId: 'JS-2026-8802',
    recipientRole: 'CITIZEN',
    isNew: false
  },
  {
    id: 'notif_varad_init',
    timestamp: '3 days ago',
    message: 'Application #JS-2026-8803 for PM Awas Yojana (PMAY-Gramin): Geo-Tagged Site Inspection Photo required.',
    category: 'Document',
    citizenName: 'Varad Kanade',
    appId: 'JS-2026-8803',
    recipientRole: 'CITIZEN',
    isNew: false
  },
  {
    id: 'notif_satwik_init',
    timestamp: '4 days ago',
    message: '🎉 Benefit Disbursed: Application #JS-2026-8804 for Ayushman Bharat PM-JAY Golden Card has been APPROVED.',
    category: 'Application Update',
    citizenName: 'Satwik Guru',
    appId: 'JS-2026-8804',
    recipientRole: 'CITIZEN',
    isNew: false
  },
  {
    id: 'notif_admin_init',
    timestamp: '1 hour ago',
    message: 'Live Mesh active: 4 national welfare portals connected across State Geo-Registry.',
    category: 'Security',
    recipientRole: 'ADMIN',
    isNew: false
  }
];

const LiveSyncContext = createContext<LiveSyncContextType | undefined>(undefined);

export const LiveSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jansetu_applications');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_APPLICATIONS;
  });

  const [journeys, setJourneys] = useState<JourneyRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jansetu_journeys');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_JOURNEYS;
  });

  const [consents, setConsents] = useState<ConsentRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jansetu_consents');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_CONSENTS;
  });

  const [notifications, setNotifications] = useState<NotificationRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jansetu_notifications');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_NOTIFICATIONS;
  });

  const [docRequests, setDocRequests] = useState<DocRequestRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jansetu_doc_requests');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [pendingKycRequests, setPendingKycRequests] = useState<PendingKycRequest[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jansetu_pending_kyc_requests');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
      const single = localStorage.getItem('jansetu_pending_kyc_request');
      if (single) {
        try { return [JSON.parse(single)]; } catch (e) {}
      }
    }
    return [];
  });

  const [revokedDepartments, setRevokedDepartments] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jansetu_revoked_departments');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return ['Municipal Corporation'];
  });

  const [liveEventNotice, setLiveEventNotice] = useState<{ title: string; message: string; type: 'info' | 'warning' | 'success' } | null>(null);
  const [recentlyAddedAppId, setRecentlyAddedAppId] = useState<string | null>(null);
  const [recentlyAddedJourneyId, setRecentlyAddedJourneyId] = useState<string | null>(null);

  // Helper to robustly extract active citizen credentials from storage
  const getActiveCitizenInfo = useCallback(() => {
    let currentCitName = '';
    let currentCitAadhaar = '';
    let currentCitUsername = '';

    if (typeof window !== 'undefined') {
      try {
        const rawCit = localStorage.getItem('jansetu_citizen_session') || sessionStorage.getItem('jansetu_citizen_session');
        if (rawCit) {
          const parsed = JSON.parse(rawCit);
          const prof = parsed.profile || parsed.user || {};
          const usr = parsed.user || {};
          const role = usr.role || prof.role || '';
          if (role !== 'ADMIN' && role !== 'SYSTEM_ADMIN' && role !== 'DEPARTMENT_ADMIN') {
            currentCitName = (prof.full_name || prof.name || usr.full_name || usr.name || '').toLowerCase().trim();
            currentCitAadhaar = (prof.aadhaar || prof.rawAadhaar || usr.id || prof.id || '').replace(/\D/g, '');
            currentCitUsername = (usr.username || prof.username || '').toLowerCase().trim();
          }
        }

        if (!currentCitName && !currentCitUsername) {
          const rawDemo = sessionStorage.getItem('demo_citizen') || localStorage.getItem('demo_citizen');
          if (rawDemo) {
            const parsed = JSON.parse(rawDemo);
            currentCitName = (parsed.name || parsed.full_name || '').toLowerCase().trim();
            currentCitAadhaar = (parsed.aadhaar || parsed.rawAadhaar || parsed.id || '').replace(/\D/g, '');
            currentCitUsername = (parsed.username || '').toLowerCase().trim();
          }
        }

        if (!currentCitName && !currentCitUsername) {
          const rawEkyc = localStorage.getItem('jansetu_ekyc_profile') || sessionStorage.getItem('jansetu_ekyc_profile');
          if (rawEkyc) {
            const parsed = JSON.parse(rawEkyc);
            currentCitName = (parsed.full_name || parsed.name || '').toLowerCase().trim();
            currentCitAadhaar = (parsed.aadhaar || parsed.rawAadhaar || parsed.id || '').replace(/\D/g, '');
            currentCitUsername = (parsed.username || '').toLowerCase().trim();
          }
        }

        if (!currentCitName && !currentCitUsername) {
          const rawLegacy = localStorage.getItem('jansetu_session') || sessionStorage.getItem('jansetu_session');
          if (rawLegacy) {
            const parsed = JSON.parse(rawLegacy);
            const prof = parsed.profile || parsed.user || {};
            const usr = parsed.user || {};
            const role = usr.role || prof.role || parsed.role || '';
            const uName = (usr.username || prof.username || '').toLowerCase();
            if (role !== 'ADMIN' && role !== 'SYSTEM_ADMIN' && role !== 'DEPARTMENT_ADMIN' && !uName.startsWith('dis') && !uName.startsWith('jyo')) {
              currentCitName = (prof.full_name || prof.name || usr.full_name || '').toLowerCase().trim();
              currentCitAadhaar = (prof.aadhaar || usr.id || '').replace(/\D/g, '');
              currentCitUsername = uName.trim();
            }
          }
        }
      } catch (e) {}
    }

    if (!currentCitName && !currentCitUsername) {
      currentCitName = 'hriday bardia';
      currentCitAadhaar = '111122221405';
      currentCitUsername = 'hriday';
    }

    return { currentCitName, currentCitAadhaar, currentCitUsername };
  }, []);

  // Filter pending KYC requests specifically for active logged-in citizen
  const activePendingKyc = useMemo(() => {
    if (pendingKycRequests.length === 0) return null;

    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname || '';
      if (pathname.startsWith('/admin')) return null; // Admin never gets citizen action banner
    }

    const { currentCitName, currentCitAadhaar, currentCitUsername } = getActiveCitizenInfo();

    if (!currentCitName && !currentCitAadhaar && !currentCitUsername) {
      return null;
    }

    return pendingKycRequests.find(req => {
      return isCitizenMatching(
        { citizenName: req.citizenName, appId: req.appId },
        { name: currentCitName, aadhaar: currentCitAadhaar, username: currentCitUsername }
      );
    }) || null;
  }, [pendingKycRequests, getActiveCitizenInfo]);

  // Session-isolated notifications:
  // Admin sees officer telemetry, citizen attestations, consent revocations/grants.
  // Citizen sees ONLY notifications specifically targeted for their name / Aadhaar / appId!
  const userNotifications = useMemo(() => {
    let isAdmin = false;
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname || '';
      isAdmin = pathname.startsWith('/admin');
    }

    if (isAdmin) {
      return notifications.filter(n => n.recipientRole === 'ADMIN' || n.category === 'Consent' || n.category === 'Verification');
    }

    const { currentCitName, currentCitAadhaar, currentCitUsername } = getActiveCitizenInfo();

    if (!currentCitName && !currentCitAadhaar && !currentCitUsername) {
      return [];
    }

    return notifications.filter(n => {
      if (n.recipientRole === 'ADMIN') return false;

      // If notification has citizenName or appId, match strictly
      if (n.citizenName || n.appId) {
        return isCitizenMatching(
          { citizenName: n.citizenName, appId: n.appId },
          { name: currentCitName, aadhaar: currentCitAadhaar, username: currentCitUsername }
        );
      }

      return n.recipientRole === 'ALL';
    });
  }, [notifications, getActiveCitizenInfo]);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jansetu_applications', JSON.stringify(applications));
    }
  }, [applications]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jansetu_journeys', JSON.stringify(journeys));
    }
  }, [journeys]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jansetu_consents', JSON.stringify(consents));
    }
  }, [consents]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jansetu_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jansetu_doc_requests', JSON.stringify(docRequests));
    }
  }, [docRequests]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jansetu_pending_kyc_requests', JSON.stringify(pendingKycRequests));
      if (activePendingKyc) {
        localStorage.setItem('jansetu_pending_kyc_request', JSON.stringify(activePendingKyc));
      } else {
        localStorage.removeItem('jansetu_pending_kyc_request');
      }
    }
  }, [pendingKycRequests, activePendingKyc]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jansetu_revoked_departments', JSON.stringify(revokedDepartments));
    }
  }, [revokedDepartments]);

  // Supabase PostgreSQL Realtime Subscription & Initial Ingestion
  useEffect(() => {
    const client = supabase;
    if (!client) return;

    // 1. Initial Baseline Fetch (Supabase Cloud PostgreSQL) with column mapping
    const fetchSupabaseBaseline = async () => {
      try {
        const [appRes, jrnRes, cstRes, notifRes, docReqRes] = await Promise.allSettled([
          client.from('applications').select('*').order('created_at', { ascending: false }).limit(50),
          client.from('journeys').select('*').order('created_at', { ascending: false }).limit(50),
          client.from('consents').select('*').limit(50),
          client.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
          client.from('doc_requests').select('*').order('created_at', { ascending: false }).limit(50),
        ]);

        if (appRes.status === 'fulfilled' && appRes.value?.data && appRes.value.data.length > 0) {
          const remoteData = appRes.value.data;
          setApplications(prev => {
            const remote = remoteData.map(fromSupabaseApplication);
            const ids = new Set(remote.map(r => r.id));
            return [...remote, ...prev.filter(p => !ids.has(p.id))];
          });
        }

        if (jrnRes.status === 'fulfilled' && jrnRes.value?.data && jrnRes.value.data.length > 0) {
          const remoteData = jrnRes.value.data;
          setJourneys(prev => {
            const remote = remoteData.map(fromSupabaseJourney);
            const ids = new Set(remote.map(r => r.id));
            return [...remote, ...prev.filter(p => !ids.has(p.id))];
          });
        }

        if (cstRes.status === 'fulfilled' && cstRes.value?.data && cstRes.value.data.length > 0) {
          const remoteData = cstRes.value.data;
          setConsents(prev => {
            const remote = remoteData.map(fromSupabaseConsent);
            const ids = new Set(remote.map(r => r.id));
            return [...remote, ...prev.filter(p => !ids.has(p.id))];
          });
        }

        if (notifRes.status === 'fulfilled' && notifRes.value?.data && notifRes.value.data.length > 0) {
          const remoteData = notifRes.value.data;
          setNotifications(prev => {
            const remote = remoteData.map(fromSupabaseNotification);
            const ids = new Set(remote.map(r => r.id));
            return [...remote, ...prev.filter(p => !ids.has(p.id))];
          });
        }

        if (docReqRes.status === 'fulfilled' && docReqRes.value?.data && docReqRes.value.data.length > 0) {
          const remoteData = docReqRes.value.data;
          setDocRequests(prev => {
            const remote = remoteData.map(fromSupabaseDocRequest);
            const ids = new Set(remote.map(r => r.id));
            return [...remote, ...prev.filter(p => !ids.has(p.id))];
          });
          
          setPendingKycRequests(prev => {
            const pendingFromRemote = remoteData.map(fromSupabaseDocRequest)
              .filter(r => r.status === 'PENDING')
              .map(r => ({
                requestId: r.id,
                appId: r.appId || r.id,
                citizenName: r.citizenName,
                citizenId: r.citizenId,
                docName: r.docType,
                dept: r.deptName,
                timestamp: r.requestedAt || 'Just now',
                type: 'DOC_KYC_REQUEST' as const
              }));
            
            const newIds = new Set(pendingFromRemote.map(r => r.requestId).filter(Boolean));
            return [...pendingFromRemote, ...prev.filter(p => !p.requestId || !newIds.has(p.requestId))];
          });
        }
      } catch {
        // Fallback gracefully to offline mock state
      }
    };

    fetchSupabaseBaseline();

    // 2. Setup Realtime Change Stream Subscriptions (with column mapping)
    try {
      const channel = client
        .channel('jansetu_realtime_mesh')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const mapped = fromSupabaseApplication(payload.new);
            setApplications(prev => [mapped, ...prev.filter(a => a.id !== mapped.id)]);
            setRecentlyAddedAppId(mapped.id);
            setTimeout(() => setRecentlyAddedAppId(null), 4500);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const mapped = fromSupabaseApplication(payload.new);
            setApplications(prev => prev.map(a => a.id === mapped.id ? { ...a, ...mapped } : a));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'journeys' }, (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const mapped = fromSupabaseJourney(payload.new);
            setJourneys(prev => [mapped, ...prev.filter(j => j.id !== mapped.id)]);
            setRecentlyAddedJourneyId(mapped.id);
            setTimeout(() => setRecentlyAddedJourneyId(null), 5000);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const mapped = fromSupabaseJourney(payload.new);
            setJourneys(prev => prev.map(j => j.id === mapped.id ? { ...j, ...mapped } : j));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consents' }, (payload: any) => {
          const mapped = fromSupabaseConsent(payload.new || {});
          if (payload.eventType === 'INSERT' && mapped.id) {
            setConsents(prev => {
              if (prev.some(c => c.id === mapped.id)) return prev.map(c => c.id === mapped.id ? { ...c, ...mapped } : c);
              return [mapped, ...prev];
            });
          } else if (payload.eventType === 'UPDATE' && mapped.id) {
            setConsents(prev => prev.map(c => c.id === mapped.id ? { ...c, ...mapped } : c));
            if (mapped.status === 'REVOKED') {
              setRevokedDepartments(prev => [...new Set([...prev, mapped.department])]);
            } else if (mapped.status === 'ACTIVE') {
              setRevokedDepartments(prev => prev.filter(d => d.toLowerCase() !== mapped.department.toLowerCase()));
            }
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: any) => {
          if (payload.new) {
            const mapped = fromSupabaseNotification(payload.new);
            setNotifications(prev => {
              if (prev.some(n => n.id === mapped.id)) return prev;
              return [mapped, ...prev];
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'doc_requests' }, (payload: any) => {
          if (payload.new) {
            const mapped = fromSupabaseDocRequest(payload.new);
            const pendingReq: PendingKycRequest = {
              requestId: mapped.id,
              appId: (payload.new as any).app_id || mapped.id,
              citizenName: mapped.citizenName,
              citizenId: mapped.citizenId,
              docName: mapped.docType,
              dept: mapped.deptName,
              timestamp: mapped.requestedAt || 'Just now',
              type: 'DOC_KYC_REQUEST'
            };

            if (payload.eventType === 'INSERT') {
              setDocRequests(prev => [mapped, ...prev.filter(r => r.id !== mapped.id)]);
              setPendingKycRequests(prev => {
                const updated = [...prev.filter(r => r.appId !== pendingReq.appId), pendingReq];
                if (typeof window !== 'undefined') {
                  try { localStorage.setItem('jansetu_pending_kyc_requests', JSON.stringify(updated)); } catch {}
                }
                return updated;
              });
            } else if (payload.eventType === 'UPDATE') {
              setDocRequests(prev => prev.map(r => r.id === mapped.id ? { ...r, ...mapped } : r));
              if (mapped.status === 'FULFILLED') {
                setPendingKycRequests(prev => prev.filter(r => r.requestId !== mapped.id));
              } else if (mapped.status === 'PENDING') {
                setPendingKycRequests(prev => {
                  const updated = [...prev.filter(r => r.appId !== pendingReq.appId), pendingReq];
                  if (typeof window !== 'undefined') {
                    try { localStorage.setItem('jansetu_pending_kyc_requests', JSON.stringify(updated)); } catch {}
                  }
                  return updated;
                });
              }
            }
          }
        })
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch {
      // Fallback
    }
  }, []);

  // Handle incoming broadcast events with sender / receiver role awareness
  const handleIncomingEvent = useCallback((event: LiveSyncEvent, isOriginSender: boolean = false) => {
    if (!event || !event.type) return;

    // Detect current session context
    let isAdminPortal = false;
    let isCitizenPortal = false;
    let activeCitizenName = '';
    let activeCitizenAadhaar = '';

    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname || '';
      isAdminPortal = pathname.startsWith('/admin');
      isCitizenPortal = pathname.startsWith('/citizen') || pathname === '/' || (!isAdminPortal && !pathname.startsWith('/login'));

      try {
        const rawCit = localStorage.getItem('jansetu_citizen_session');
        if (rawCit) {
          const parsed = JSON.parse(rawCit);
          const prof = parsed.profile || parsed.user || {};
          activeCitizenName = (prof.full_name || prof.username || '').toLowerCase().trim();
          activeCitizenAadhaar = (prof.aadhaar || prof.id || '').replace(/\D/g, '');
        }
      } catch (e) {}
    }

    switch (event.type) {
      case 'JOURNEY_STARTED': {
        const newJourney = event.payload as JourneyRecord;
        setJourneys(prev => {
          if (prev.some(j => j.id === newJourney.id)) return prev;
          return [newJourney, ...prev];
        });
        setRecentlyAddedJourneyId(newJourney.id);
        setTimeout(() => setRecentlyAddedJourneyId(null), 5000);

        if (isOriginSender) {
          setLiveEventNotice({
            title: 'Workflow Initiated',
            message: `Your journey "${newJourney.title}" has been started.`,
            type: 'success'
          });
        } else if (isAdminPortal) {
          setNotifications(prev => [
            {
              id: `alt_j_${Date.now()}`,
              timestamp: 'Just now',
              message: `Active Workflow: ${newJourney.citizenName || 'Citizen'} started "${newJourney.title}".`,
              category: 'Journey',
              isNew: true
            },
            ...prev
          ]);

          setLiveEventNotice({
            title: 'Live Telemetry: Workflow Initiated',
            message: `Citizen ${newJourney.citizenName || 'Citizen'} initiated "${newJourney.title}".`,
            type: 'info'
          });
        }
        setTimeout(() => setLiveEventNotice(null), 5000);
        break;
      }

      case 'DOCUMENT_REQUESTED': {
        const { deptName = '', docType = 'e-KYC Records', citizenId, citizenName, requestedAt } = event.payload || {};
        const safeDept = (deptName || '').toLowerCase();

        if (isOriginSender) {
          setLiveEventNotice({
            title: '📡 Request Transmitted across Live Mesh',
            message: `Document request for "${docType}" sent to ${citizenName || 'Citizen'}.`,
            type: 'info'
          });
        } else if (isCitizenPortal) {
          // Check if this citizen matches the target
          const targetName = (citizenName || '').toLowerCase();
          const targetId = (citizenId || '').replace(/\D/g, '');
          const matches = !activeCitizenName || 
            (targetName && (activeCitizenName.includes(targetName) || targetName.includes(activeCitizenName))) ||
            (targetId && activeCitizenAadhaar && (activeCitizenAadhaar.includes(targetId) || targetId.includes(activeCitizenAadhaar))) ||
            (!targetName && !targetId);

          if (matches) {
            const newReq: DocRequestRecord = {
              id: `req_${Date.now()}`,
              deptName: deptName || 'Government Department',
              docType,
              citizenId: citizenId || '1111 2222 1405',
              citizenName: citizenName || 'Hriday Bardia',
              requestedAt: requestedAt || new Date().toLocaleTimeString(),
              status: 'PENDING'
            };

            setDocRequests(prev => [newReq, ...prev]);

            setConsents(prev => {
              const exists = prev.find(c => {
                const cDept = (c?.department || '').toLowerCase();
                return cDept && safeDept && (cDept.includes(safeDept) || safeDept.includes(cDept));
              });
              if (exists) {
                return prev.map(c => c.id === exists.id ? { 
                  ...c, 
                  status: 'PENDING', 
                  purpose: `Verification of ${docType}`, 
                  requestedFields: [...(c.requestedFields || []), docType] 
                } : c);
              }
              return [
                {
                  id: `cst_${Date.now()}`,
                  department: deptName || 'Government Department',
                  purpose: `Verification of ${docType}`,
                  requestedFields: [docType, 'Aadhaar e-KYC'],
                  status: 'PENDING'
                },
                ...prev
              ];
            });

            setRevokedDepartments(prev => prev.filter(d => {
              const dLower = (d || '').toLowerCase();
              return !(dLower && safeDept && (dLower.includes(safeDept) || safeDept.includes(dLower)));
            }));

            setNotifications(prev => [
              {
                id: `alt_doc_${Date.now()}`,
                timestamp: 'Just now',
                message: `Consent Request: ${deptName || 'Department'} has requested your ${docType}.`,
                category: 'Document',
                isNew: true
              },
              ...prev
            ]);

            setLiveEventNotice({
              title: '📩 New Document Request',
              message: `${deptName || 'Department'} has requested your ${docType}. Please review under "Your Data & Consent".`,
              type: 'warning'
            });
          }
        }
        setTimeout(() => setLiveEventNotice(null), 6000);
        break;
      }

      case 'DOC_KYC_REQUEST':
      case 'TARGETED_CITIZEN_REQUEST':
      case 'CITIZEN_DOC_REQUESTED': {
        const { 
          id,
          requestId,
          appId, 
          schemeName,
          deptName, 
          dept, 
          targetCitizenName,
          citizenName, 
          targetCitizenUid,
          citizenId,
          requestedDoc,
          docName, 
          docType,
          timestamp,
          createdAt 
        } = event.payload || {};

        const targetAppId = appId || 'JS-2026-8802';
        const targetDoc = requestedDoc || docName || 'Polytechnic Marksheet';
        const targetDept = deptName || dept || 'Ministry of Education';
        const targetCitizen = targetCitizenName || citizenName || 'Hriday Bardia';
        const targetUid = targetCitizenUid || citizenId || (targetAppId === 'JS-2026-8801' ? '1111 2222 0207' : targetAppId === 'JS-2026-8802' ? '1111 2222 1405' : targetAppId === 'JS-2026-8803' ? '1111 2222 1304' : '1111 2222 3333');
        const reqId = id || requestId || `REQ_${targetAppId}_${targetDoc.replace(/\s+/g, '_').toUpperCase()}`;

        // 1. Strict Recipient Validation on Citizen Portal
        const { currentCitName, currentCitAadhaar, currentCitUsername } = getActiveCitizenInfo();
        const isTargetCitizen = isCitizenMatching(
          { citizenName: targetCitizen, citizenId: targetUid, appId: targetAppId },
          { name: currentCitName, aadhaar: currentCitAadhaar, username: currentCitUsername }
        );

        const pendingReq: PendingKycRequest = {
          requestId: reqId,
          appId: targetAppId,
          citizenName: targetCitizen,
          citizenId: targetUid,
          docName: targetDoc,
          dept: targetDept,
          timestamp: timestamp || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          type: 'DOC_KYC_REQUEST'
        };

        // Always register the pending request into the global pending list & localStorage
        setPendingKycRequests(prev => {
          const updated = [...prev.filter(r => r.appId !== targetAppId), pendingReq];
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('jansetu_pending_kyc_requests', JSON.stringify(updated));
              localStorage.setItem('jansetu_pending_kyc_request', JSON.stringify(pendingReq));
              const existing = JSON.parse(localStorage.getItem('jansetu_active_requests') || '[]');
              localStorage.setItem('jansetu_active_requests', JSON.stringify([pendingReq, ...existing.filter((r: any) => r.appId !== targetAppId)]));
            } catch (e) {}
          }
          return updated;
        });

        const newReq: DocRequestRecord = {
          id: reqId,
          deptName: targetDept,
          docType: targetDoc,
          citizenId: targetUid,
          citizenName: targetCitizen,
          requestedAt: timestamp || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          status: 'PENDING'
        };

        setDocRequests(prev => {
          const updated = [newReq, ...prev.filter(r => r.id !== reqId)];
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('jansetu_doc_requests', JSON.stringify(updated));
            } catch (e) {}
          }
          return updated;
        });

        const safeDept = targetDept.toLowerCase();
        setConsents(prev => {
          const exists = prev.find(c => {
            const cDept = (c?.department || '').toLowerCase();
            return cDept && safeDept && (cDept.includes(safeDept) || safeDept.includes(cDept));
          });
          let updated: ConsentRecord[];
          if (exists) {
            updated = prev.map(c => c.id === exists.id ? { 
              ...c, 
              status: 'PENDING', 
              purpose: `Verification of ${targetDoc} for Application #${targetAppId}`, 
              requestedFields: [...new Set([...(c.requestedFields || []), targetDoc])]
            } : c);
          } else {
            updated = [
              {
                id: `cst_${Date.now()}`,
                department: targetDept,
                purpose: `Verification of ${targetDoc} for Application #${targetAppId}`,
                requestedFields: [targetDoc, 'Aadhaar e-KYC'],
                status: 'PENDING'
              },
              ...prev
            ];
          }
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('jansetu_consents', JSON.stringify(updated));
            } catch (e) {}
          }
          return updated;
        });

        setRevokedDepartments(prev => prev.filter(d => {
          const dLower = (d || '').toLowerCase();
          return !(dLower && safeDept && (dLower.includes(safeDept) || safeDept.includes(dLower)));
        }));

        // 2. Deduplication check: Prevent duplicate notifications in Bell & Alerts
        const newNotifItem: NotificationRecord = {
          id: reqId,
          timestamp: 'Just now',
          message: `Action Required: ${targetDept} requested ${targetDoc} for Application #${targetAppId}.`,
          category: 'Document',
          citizenName: targetCitizen,
          appId: targetAppId,
          recipientRole: 'CITIZEN',
          isNew: true
        };

        setNotifications(prev => {
          if (prev.some(n => n.id === reqId || (n as any).requestId === reqId)) {
            return prev;
          }
          const updated = [newNotifItem, ...prev];
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('jansetu_notifications', JSON.stringify(updated));
            } catch (e) {}
          }
          return updated;
        });

        // Trigger mobile haptic feedback if supported
        if (typeof window !== 'undefined' && window.navigator?.vibrate) {
          try { window.navigator.vibrate(200); } catch (e) {}
        }

        if (isAdminPortal) {
          // Admin sender gets officer confirmation toast
          setLiveEventNotice({
            title: '📡 Request Transmitted across Live Mesh',
            message: `e-KYC verification request for "${targetDoc}" sent to ${targetCitizen} (UID: ${targetUid}, App #${targetAppId}).`,
            type: 'info'
          });
          setTimeout(() => setLiveEventNotice(null), 5000);
        }

        if (isCitizenPortal) {
          // Strict Recipient Filter: only trigger popup if targeted citizen
          if (isTargetCitizen) {
            setLiveEventNotice({
              title: '⚠️ Action Required: Department e-KYC Request',
              message: `${targetDept} has requested e-KYC verification for "${targetDoc}" (App #${targetAppId}).`,
              type: 'warning'
            });
            setTimeout(() => setLiveEventNotice(null), 8000);
          }
        }
        break;
      }

      case 'DOC_KYC_FULFILLED':
      case 'CITIZEN_DOC_FULFILLED':
      case 'CITIZEN_DOC_PROVIDED': {
        const { appId, docTitle, docName, status, citizenName, dept } = event.payload || {};
        const targetAppId = appId || 'JS-2026-8802';
        const targetDoc = docTitle || docName || 'Polytechnic Marksheet';
        const docStatus = status || 'VERIFIED';
        const targetDept = dept || 'Ministry of Education';
        const targetCitizen = citizenName || 'Hriday Bardia';

        setPendingKycRequests(prev => prev.filter(r => r.appId !== targetAppId));

        // Update application's document list and status in local state
        setApplications(prev => prev.map(app => {
          if (app.id === targetAppId) {
            const updatedDocs = (app.documents || []).map(doc => {
              const docNameMatch = doc.name.toLowerCase().includes(targetDoc.toLowerCase()) || targetDoc.toLowerCase().includes(doc.name.toLowerCase());
              if (docNameMatch) {
                return { ...doc, status: docStatus };
              }
              return doc;
            });
            const docExists = (app.documents || []).some(d => d.name.toLowerCase().includes(targetDoc.toLowerCase()) || targetDoc.toLowerCase().includes(d.name.toLowerCase()));
            const finalDocs = docExists ? updatedDocs : [...updatedDocs, { name: targetDoc, status: docStatus }];

            return {
              ...app,
              status: app.status === 'DOCUMENTS_REQUIRED' ? 'UNDER_VERIFICATION' : app.status,
              nextAction: 'Ready for Final Officer Approval & DBT Disbursement',
              lastUpdated: 'Just now',
              documents: finalDocs
            };
          }
          return app;
        }));

        if (isOriginSender || isCitizenPortal) {
          // Citizen sender gets verification confirmation
          setDocRequests(prev => prev.map(r => r.docType.toLowerCase().includes(targetDoc.toLowerCase()) ? { ...r, status: 'FULFILLED' } : r));
          setConsents(prev => prev.map(c => {
            if (c.requestedFields?.some(f => f.toLowerCase().includes(targetDoc.toLowerCase())) || c.purpose?.toLowerCase().includes(targetDoc.toLowerCase())) {
              return { ...c, status: 'ACTIVE', grantedDate: new Date().toLocaleDateString('en-GB') };
            }
            return c;
          }));

          if (isCitizenPortal) {
            setLiveEventNotice({
              title: '✓ e-KYC Attestation Transmitted',
              message: `Cryptographic token for "${targetDoc}" generated and shared with ${targetDept}.`,
              type: 'success'
            });
          }
        }
        
        if (isAdminPortal) {
          // Admin receiver gets alert that citizen has verified the document
          setNotifications(prev => [
            {
              id: `alt_doc_prv_${Date.now()}`,
              timestamp: 'Just now',
              message: `e-KYC Verified: ${targetCitizen} provided verified ${targetDoc} for App #${targetAppId}. Ready for approval.`,
              category: 'Verification',
              citizenName: targetCitizen,
              appId: targetAppId,
              recipientRole: 'ADMIN',
              isNew: true
            },
            ...prev
          ]);

          setLiveEventNotice({
            title: '✓ Live Alert: e-KYC Document Verified',
            message: `${targetCitizen} provided ${targetDoc} via Vault! Document status updated to VERIFIED.`,
            type: 'success'
          });
        }
        setTimeout(() => setLiveEventNotice(null), 5000);
        break;
      }

      case 'APPLICATION_CREATED': {
        const newApp = event.payload as ApplicationRecord;
        setApplications(prev => {
          if (prev.some(a => a.id === newApp.id)) return prev;
          return [newApp, ...prev];
        });

        if (isOriginSender) {
          setLiveEventNotice({
            title: 'Application Submitted',
            message: `Application #${newApp.id} for "${newApp.service}" submitted successfully.`,
            type: 'success'
          });
        } else if (isAdminPortal) {
          setRecentlyAddedAppId(newApp.id);
          setTimeout(() => setRecentlyAddedAppId(null), 4500);

          setNotifications(prev => [
            {
              id: `alt_app_${Date.now()}`,
              timestamp: 'Just now',
              message: `New application submitted for ${newApp.service} (${newApp.id}) by ${newApp.citizenName}.`,
              category: 'Application Update',
              citizenName: newApp.citizenName,
              appId: newApp.id,
              recipientRole: 'ADMIN',
              isNew: true
            },
            ...prev
          ]);

          setLiveEventNotice({
            title: 'Live Event: Application Received',
            message: `New incoming application ${newApp.id} for "${newApp.service}" from ${newApp.citizenName}.`,
            type: 'info'
          });
        }
        setTimeout(() => setLiveEventNotice(null), 5000);
        break;
      }

      case 'CONSENT_REQUESTED': {
        const { department = '', purpose = '', requestedFields = [], citizenName, appId } = event.payload || {};
        const safeDept = department.toLowerCase();

        if (isOriginSender) {
          setLiveEventNotice({
            title: '📡 Consent Request Dispatched',
            message: `Verification consent request dispatched to citizen for ${department}.`,
            type: 'info'
          });
        } else if (isCitizenPortal) {
          const { currentCitName, currentCitAadhaar, currentCitUsername } = getActiveCitizenInfo();
          const matches = !citizenName && !appId ? true : isCitizenMatching(
            { citizenName, appId },
            { name: currentCitName, aadhaar: currentCitAadhaar, username: currentCitUsername }
          );

          setConsents(prev => {
            const exists = prev.find(c => {
              const cDept = (c?.department || '').toLowerCase();
              return cDept && safeDept && (cDept.includes(safeDept) || safeDept.includes(cDept));
            });
            if (exists) {
              return prev.map(c => c.id === exists.id ? { ...c, status: 'PENDING', purpose, requestedFields } : c);
            }
            return [
              {
                id: `cst_${Date.now()}`,
                department,
                purpose,
                requestedFields,
                status: 'PENDING'
              },
              ...prev
            ];
          });

          setRevokedDepartments(prev => prev.filter(d => {
            const dLower = (d || '').toLowerCase();
            return !(dLower && safeDept && (dLower.includes(safeDept) || safeDept.includes(dLower)));
          }));

          setNotifications(prev => [
            {
              id: `alt_cst_${Date.now()}`,
              timestamp: 'Just now',
              message: `New consent request received from ${department}.`,
              category: 'Consent',
              citizenName,
              appId,
              recipientRole: 'CITIZEN',
              isNew: true
            },
            ...prev
          ]);

          if (matches) {
            setLiveEventNotice({
              title: '🔒 Dynamic Consent Requested',
              message: `${department} has requested access to [${requestedFields.join(', ')}]. Review under "Your Data & Consent".`,
              type: 'warning'
            });
          }
        }
        setTimeout(() => setLiveEventNotice(null), 6000);
        break;
      }

      case 'CONSENT_REVOKED': {
        const { department, deptId, id, citizenName } = event.payload || {};
        const targetDept = department || deptId || id;
        const safeDept = (targetDept || '').toLowerCase();
        const citName = citizenName || 'Citizen';

        setConsents(prev => prev.map(c => {
          const cDept = (c?.department || '').toLowerCase();
          if (c.id === deptId || c.id === id || (cDept && safeDept && (cDept === safeDept || cDept.includes(safeDept) || safeDept.includes(cDept)))) {
            return { ...c, status: 'REVOKED' };
          }
          return c;
        }));

        setRevokedDepartments(prev => [...new Set([...prev, targetDept])]);

        if (isOriginSender) {
          setLiveEventNotice({
            title: 'Consent Revoked (DPDP Lock Enforced)',
            message: `Access to your verified documents has been revoked for ${targetDept || 'Department'}.`,
            type: 'warning'
          });
        } else if (isAdminPortal) {
          setNotifications(prev => [
            {
              id: `alt_rev_${Date.now()}`,
              timestamp: 'Just now',
              message: `DPDP Warning: ${citName} revoked verification consent for ${targetDept || 'Department'}. Access locked.`,
              category: 'Consent',
              citizenName: citName,
              recipientRole: 'ADMIN',
              isNew: true
            },
            ...prev
          ]);

          setLiveEventNotice({
            title: '⚠️ DPDP Alert: Consent Revoked',
            message: `${citName} has dynamically revoked e-KYC consent for ${targetDept || 'Department'}. Scrutiny access locked.`,
            type: 'warning'
          });
        }
        setTimeout(() => setLiveEventNotice(null), 5000);
        break;
      }

      case 'CONSENT_GRANTED': {
        const { department, deptId, id, citizenName } = event.payload || {};
        const targetDept = department || deptId || id;
        const safeDept = (targetDept || '').toLowerCase();
        const citName = citizenName || 'Citizen';

        setConsents(prev => prev.map(c => {
          const cDept = (c?.department || '').toLowerCase();
          if (c.id === deptId || c.id === id || (cDept && safeDept && (cDept === safeDept || cDept.includes(safeDept) || safeDept.includes(cDept)))) {
            return { ...c, status: 'ACTIVE', grantedDate: new Date().toLocaleDateString('en-GB') };
          }
          return c;
        }));

        setRevokedDepartments(prev => prev.filter(d => {
          const dLower = (d || '').toLowerCase();
          return !(dLower && safeDept && (dLower === safeDept || dLower.includes(safeDept) || safeDept.includes(dLower)));
        }));

        if (isOriginSender) {
          setLiveEventNotice({
            title: 'Consent Granted',
            message: `e-KYC access authorized for ${targetDept || 'Department'}.`,
            type: 'success'
          });
        } else if (isAdminPortal) {
          setNotifications(prev => [
            {
              id: `alt_grt_${Date.now()}`,
              timestamp: 'Just now',
              message: `Consent Granted: ${citName} authorized e-KYC access to ${targetDept || 'Department'}. Scrutiny access restored.`,
              category: 'Consent',
              citizenName: citName,
              recipientRole: 'ADMIN',
              isNew: true
            },
            ...prev
          ]);

          setLiveEventNotice({
            title: 'Consent Restored',
            message: `${citName} granted e-KYC access to ${targetDept || 'Department'}. Scrutiny access restored.`,
            type: 'success'
          });
        }
        setTimeout(() => setLiveEventNotice(null), 4000);
        break;
      }

      case 'APPLICATION_STATUS_UPDATED': {
        const { id, status, reason, citizenName } = event.payload || {};
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status, lastUpdated: 'Just now' } : a));

        if (isOriginSender) {
          setLiveEventNotice({
            title: 'Application Status Updated',
            message: `Application ${id} transitioned to ${status}.`,
            type: 'info'
          });
        } else if (isCitizenPortal) {
          const { currentCitName, currentCitAadhaar, currentCitUsername } = getActiveCitizenInfo();
          const matches = isCitizenMatching(
            { citizenName, appId: id },
            { name: currentCitName, aadhaar: currentCitAadhaar, username: currentCitUsername }
          );

          const isApproved = status === 'APPROVED';
          setNotifications(prev => [
            {
              id: `alt_stat_${Date.now()}`,
              timestamp: 'Just now',
              message: isApproved 
                ? `🎉 Benefit Disbursed: Application #${id} has been APPROVED for Direct Benefit Transfer.`
                : `Application ${id} status updated to ${status}. ${reason || ''}`,
              category: 'Application Update',
              citizenName,
              appId: id,
              recipientRole: 'CITIZEN',
              isNew: true
            },
            ...prev
          ]);

          if (matches) {
            setLiveEventNotice({
              title: isApproved ? '🎉 Application Approved & DBT Disbursed!' : 'Application Status Updated',
              message: isApproved
                ? `Your application #${id} has been approved by the department. Direct Benefit Transfer initiated!`
                : `Application ${id} status changed to ${status}. ${reason || ''}`,
              type: isApproved ? 'success' : 'info'
            });
          }
        }
        setTimeout(() => setLiveEventNotice(null), 5000);
        break;
      }
    }
  }, []);

  useEffect(() => {
    // Legacy Transport Removal:
    // We previously used BroadcastChannel, eventBus, and localStorage 'storage' listeners.
    // They have been completely removed in V2 to rely exclusively on Supabase Realtime 
    // for cross-tab and cross-device synchronization, preventing duplicate event loops (flickering).
  }, []);

  // Dispatch event over Supabase Realtime
  const dispatchMeshEvent = (event: LiveSyncEvent) => {
    // V2: Rely exclusively on Supabase Realtime for cross-tab mesh
    // We only apply to local sender state optimistically to keep the UI snappy
    handleIncomingEvent(event, true);
  };

  // Specific Action Methods
  const startJourney = (journeyData: Partial<JourneyRecord>) => {
    const newJourney: JourneyRecord = {
      id: journeyData.id || `journey_${Date.now()}`,
      title: journeyData.title || 'New Citizen Journey',
      category: journeyData.category || 'General Welfare',
      citizenName: journeyData.citizenName || 'Hriday Bardia',
      status: 'In Progress',
      progress: journeyData.progress || 10,
      currentStage: journeyData.currentStage || 'Initial Documentation & Identity Verification',
      documentsReady: journeyData.documentsReady || 2,
      documentsTotal: journeyData.documentsTotal || 4,
      nextAction: journeyData.nextAction || 'Verify Aadhaar e-KYC and upload state credentials',
      lastUpdated: 'Just now',
      timestamp: Date.now(),
      location: journeyData.location || 'Vadodara, Gujarat'
    };

    if (supabase) {
      Promise.resolve(supabase.from('journeys').upsert(toSupabaseJourney(newJourney))).catch(() => {});
    }

    dispatchMeshEvent({
      type: 'JOURNEY_STARTED',
      payload: newJourney,
      sender: 'CITIZEN',
      timestamp: new Date().toISOString()
    });
  };

  const submitApplication = (appData: ApplicationRecord) => {
    if (supabase) {
      Promise.resolve(supabase.from('applications').upsert(toSupabaseApplication(appData), { onConflict: 'id' })).catch(() => {});
    }
    dispatchMeshEvent({
      type: 'APPLICATION_CREATED',
      payload: appData,
      sender: 'CITIZEN',
      timestamp: new Date().toISOString()
    });
  };

  const broadcastApplicationCreated = (app: ApplicationRecord) => {
    submitApplication(app);
  };

  const requestDocument = (deptName: string, docType: string, citizenId?: string, citizenName?: string) => {
    const reqPayload = {
      deptName,
      docType,
      citizenId: citizenId || '1111 2222 1405',
      citizenName: citizenName || 'Hriday Bardia',
      requestedAt: new Date().toLocaleTimeString()
    };

    if (supabase) {
      Promise.resolve(supabase.from('notifications').insert([toSupabaseNotification({
        category: 'Document',
        message: `${deptName} has requested your ${docType}.`,
        recipientRole: 'CITIZEN',
        citizenName: reqPayload.citizenName,
        citizenId: reqPayload.citizenId
      })])).catch(() => {});
    }

    dispatchMeshEvent({
      type: 'DOCUMENT_REQUESTED',
      payload: reqPayload,
      sender: 'ADMIN',
      timestamp: new Date().toISOString()
    });
  };

  const requestCitizenDoc = (payload: { 
    appId: string; 
    citizenName?: string; 
    citizenId?: string;
    docName: string; 
    dept?: string;
    schemeName?: string;
  }) => {
    const targetAppId = payload.appId || '';
    const targetDoc = payload.docName || '';
    const targetDept = payload.dept || 'Department';
    const targetCitizen = payload.citizenName || 'Citizen';
    const targetUid = payload.citizenId || '';
    const requestId = `REQ_${targetAppId}_${targetDoc.replace(/\s+/g, '_').toUpperCase()}`;

    const fullPayload = {
      requestId,
      appId: targetAppId,
      schemeName: payload.schemeName || 'National Apprenticeship Training Scheme (NATS)',
      deptName: targetDept,
      dept: targetDept,
      targetCitizenName: targetCitizen,
      citizenName: targetCitizen,
      targetCitizenUid: targetUid,
      citizenId: targetUid,
      requestedDoc: targetDoc,
      docName: targetDoc,
      docType: targetDoc.toLowerCase().includes('marksheet') ? 'polytechnic_marksheet' : targetDoc.toLowerCase().replace(/\s+/g, '_'),
      status: 'PENDING_CITIZEN_ACTION',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      type: 'DOC_KYC_REQUEST',
      createdAt: new Date().toISOString()
    };

    if (supabase) {
      Promise.resolve(supabase.from('doc_requests').upsert(toSupabaseDocRequest({
        id: requestId,
        appId: targetAppId,
        deptName: targetDept,
        docType: targetDoc,
        citizenName: targetCitizen,
        citizenId: targetUid,
        status: 'PENDING',
        requestedAt: fullPayload.timestamp
      }))).catch(() => {});

      Promise.resolve(supabase.from('notifications').insert([toSupabaseNotification({
        category: 'Document',
        message: `${targetDept} has requested ${targetDoc} for Application #${targetAppId}`,
        appId: targetAppId,
        citizenName: targetCitizen,
        citizenId: targetUid,
        recipientRole: 'CITIZEN'
      })])).catch(() => {});
    }

    dispatchMeshEvent({
      type: 'TARGETED_CITIZEN_REQUEST',
      payload: fullPayload,
      sender: 'ADMIN',
      timestamp: new Date().toISOString()
    });
  };

  const authorizeCitizenDoc = (payload: { appId: string; docName: string; dept?: string; citizenName?: string; }) => {
    const targetAppId = payload.appId || '';
    const targetDoc = payload.docName || '';
    const targetDept = payload.dept || 'Department';
    const targetCitizen = payload.citizenName || 'Citizen';

    const responsePayload = {
      appId: targetAppId,
      docTitle: targetDoc,
      docName: targetDoc,
      citizenName: targetCitizen,
      dept: targetDept,
      status: 'VERIFIED',
      verifiedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    if (supabase) {
      Promise.resolve(supabase.from('applications').update({
        status: 'UNDER_VERIFICATION',
        last_updated: 'Just now'
      }).eq('id', targetAppId)).catch(() => {});

      const requestId = `REQ_${targetAppId}_${targetDoc.replace(/\s+/g, '_').toUpperCase()}`;
      Promise.resolve(supabase.from('doc_requests').update({
        status: 'FULFILLED'
      }).eq('id', requestId)).catch(() => {});

      Promise.resolve(supabase.from('consents').upsert([toSupabaseConsent({
        id: `cst_${Date.now()}`,
        department: targetDept,
        purpose: `e-KYC Verification for ${targetDoc}`,
        status: 'ACTIVE',
        citizenName: targetCitizen
      })], { onConflict: 'dept_id' })).catch(() => {});

      Promise.resolve(supabase.from('notifications').insert([toSupabaseNotification({
        category: 'Verification',
        message: `${targetCitizen} has authorized access to ${targetDoc} for Application #${targetAppId}.`,
        appId: targetAppId,
        citizenName: targetCitizen,
        recipientRole: 'ADMIN'
      })])).catch(() => {});
    }

    dispatchMeshEvent({
      type: 'CITIZEN_DOC_FULFILLED',
      payload: responsePayload,
      sender: 'CITIZEN',
      timestamp: new Date().toISOString()
    });
  };

  const dismissPendingKycRequest = (appId?: string) => {
    if (appId) {
      setPendingKycRequests(prev => prev.filter(r => r.appId !== appId));
    } else if (activePendingKyc) {
      setPendingKycRequests(prev => prev.filter(r => r.appId !== activePendingKyc.appId));
    } else {
      setPendingKycRequests([]);
    }
  };

  const grantConsent = (deptId: string, department?: string) => {
    let citizenName = 'Citizen';
    try {
      const rawCit = localStorage.getItem('jansetu_citizen_session');
      if (rawCit) {
        const parsed = JSON.parse(rawCit);
        const prof = parsed.profile || parsed.user || {};
        citizenName = prof.full_name || prof.name || prof.username || 'Citizen';
      }
    } catch (e) {}

    if (supabase) {
      Promise.resolve(supabase.from('consents').upsert(toSupabaseConsent({
        id: deptId,
        department: department || deptId,
        purpose: 'Citizen DPDP Electronic Consent',
        status: 'ACTIVE',
        citizenName
      }), { onConflict: 'dept_id' })).catch(() => {});
    }
    dispatchMeshEvent({
      type: 'CONSENT_GRANTED',
      payload: { deptId, department: department || deptId, id: deptId, citizenName },
      sender: 'CITIZEN',
      timestamp: new Date().toISOString()
    });
  };

  const revokeConsent = (deptId: string, department?: string) => {
    let citizenName = 'Citizen';
    try {
      const rawCit = localStorage.getItem('jansetu_citizen_session');
      if (rawCit) {
        const parsed = JSON.parse(rawCit);
        const prof = parsed.profile || parsed.user || {};
        citizenName = prof.full_name || prof.name || prof.username || 'Citizen';
      }
    } catch (e) {}

    if (supabase) {
      Promise.resolve(supabase.from('consents').upsert(toSupabaseConsent({
        id: deptId,
        department: department || deptId,
        purpose: 'Citizen DPDP Electronic Consent',
        status: 'REVOKED',
        citizenName
      }), { onConflict: 'dept_id' })).catch(() => {});

      Promise.resolve(supabase.from('notifications').insert([toSupabaseNotification({
        category: 'Security',
        message: `${citizenName} has REVOKED consent for ${department || deptId}.`,
        citizenName: citizenName,
        recipientRole: 'ADMIN'
      })])).catch(() => {});
    }
    dispatchMeshEvent({
      type: 'CONSENT_REVOKED',
      payload: { deptId, department: department || deptId, id: deptId, citizenName },
      sender: 'CITIZEN',
      timestamp: new Date().toISOString()
    });
  };

  const broadcastConsentRequested = (req: { department: string; purpose: string; requestedFields: string[] }) => {
    dispatchMeshEvent({
      type: 'CONSENT_REQUESTED',
      payload: req,
      sender: 'ADMIN',
      timestamp: new Date().toISOString()
    });
  };

  const broadcastConsentRevoked = (department: string, consentId?: string) => {
    revokeConsent(consentId || department, department);
  };

  const broadcastConsentGranted = (department: string, consentId?: string) => {
    grantConsent(consentId || department, department);
  };

  const broadcastApplicationStatusUpdated = (id: string, status: ApplicationRecord['status'], reason?: string) => {
    if (supabase) {
      Promise.resolve(supabase.from('applications').update({ 
        status,
        last_updated: 'Just now'
      }).eq('id', id)).catch(() => {});

      Promise.resolve(supabase.from('notifications').insert([toSupabaseNotification({
        category: 'Application Update',
        message: `Application #${id} status updated to ${status}.${reason ? ` Reason: ${reason}` : ''}`,
        appId: id,
        recipientRole: 'CITIZEN'
      })])).catch(() => {});
    }
    dispatchMeshEvent({
      type: 'APPLICATION_STATUS_UPDATED',
      payload: { id, status, reason },
      sender: 'ADMIN',
      timestamp: new Date().toISOString()
    });
  };

  const syncAll = async () => {
    if (!supabase) return;
    try {
      const [appRes, jrnRes, cstRes, notifRes, docReqRes] = await Promise.allSettled([
        supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('journeys').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('consents').select('*').limit(50),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('doc_requests').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      if (appRes.status === 'fulfilled' && appRes.value?.data) {
        const remoteData = appRes.value.data;
        setApplications(remoteData.map(fromSupabaseApplication));
      }
      if (jrnRes.status === 'fulfilled' && jrnRes.value?.data) {
        const remoteData = jrnRes.value.data;
        setJourneys(remoteData.map(fromSupabaseJourney));
      }
      if (cstRes.status === 'fulfilled' && cstRes.value?.data) {
        const remoteData = cstRes.value.data;
        setConsents(remoteData.map(fromSupabaseConsent));
      }
      if (notifRes.status === 'fulfilled' && notifRes.value?.data) {
        const remoteData = notifRes.value.data;
        setNotifications(remoteData.map(fromSupabaseNotification));
      }
      if (docReqRes.status === 'fulfilled' && docReqRes.value?.data) {
        const remoteData = docReqRes.value.data;
        setDocRequests(remoteData.map(fromSupabaseDocRequest));
      }
    } catch (e) {}
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isNew: false } : n));
  };

  const clearLiveNotice = () => setLiveEventNotice(null);

  return (
    <LiveSyncContext.Provider value={{
      applications,
      journeys,
      consents,
      notifications: userNotifications,
      allNotifications: notifications,
      docRequests,
      pendingKycRequest: activePendingKyc,
      pendingKycRequests,
      revokedDepartments,
      liveEventNotice,
      recentlyAddedAppId,
      recentlyAddedJourneyId,
      startJourney,
      submitApplication,
      requestDocument,
      requestCitizenDoc,
      authorizeCitizenDoc,
      dismissPendingKycRequest,
      grantConsent,
      revokeConsent,
      broadcastApplicationCreated,
      broadcastConsentRequested,
      broadcastConsentRevoked,
      broadcastConsentGranted,
      broadcastApplicationStatusUpdated,
      markAllAsRead,
      markNotificationAsRead,
      clearLiveNotice,
      syncAll
    }}>
      {children}
    </LiveSyncContext.Provider>
  );
};

export const useLiveSync = () => {
  const context = useContext(LiveSyncContext);
  if (!context) {
    throw new Error('useLiveSync must be used within a LiveSyncProvider');
  }
  return context;
};

export default LiveSyncProvider;
