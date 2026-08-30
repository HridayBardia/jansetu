'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchMeAPI, loginAPI, logoutAPI, updateProfileAPI } from '@/lib/api';
import { getStoredConsent, storeConsent } from '@/components/TermsConsentModal';
import { DEMO_CITIZENS, findCitizen, findAdminByOfficerId } from '@/data/demoCitizens';
import { ShieldAlert, LogIn } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SessionBreakModal } from '@/components/SessionBreakModal';
import { eventBus } from '@/utils/eventBus';

export interface User {
  id: string;
  username: string;
  full_name: string;
  role?: string;
  mobile_number?: string;
  created_at?: string;
  last_login_at?: string;
}

export interface CitizenProfile {
  id?: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  age?: number;
  annual_income?: number;
  income_category?: string;
  location_state?: string;
  location_district?: string;
  location_city?: string;
  pincode?: string;
  occupation?: string;
  education?: string;
  category?: string;
  aadhaar?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  profile: CitizenProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionConsentAccepted: boolean;
  setSessionConsent: (accepted: boolean) => void;
  isAuthModalOpen: boolean;
  isOnboardingModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  closeOnboardingModal: () => void;
  
  // Decoupled Multi-Session Actions
  citizenUser: User | null;
  citizenProfile: CitizenProfile | null;
  adminUser: User | null;
  isCitizenAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  loginCitizen: (profileOrIdentifier?: any) => Promise<any>;
  loginAdmin: (credentialsOrIdentifier?: any) => Promise<any>;
  logoutCitizen: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
  
  // Unified / Backward Compatible
  login: (username: string, pin: string, expectedRole?: 'CITIZEN' | 'ADMIN') => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<CitizenProfile>) => Promise<any>;
  refreshUser: () => Promise<void>;
  setDemoSession: (citizenAadhaarOrId: any, role?: 'CITIZEN' | 'ADMIN') => void;

  // Session Break / Concurrent Login Status
  isSessionBroken: boolean;
  triggerSessionBreak: (accountName?: string) => void;
}

const CITIZEN_STORAGE_KEY = 'jansetu_citizen_session';
const ADMIN_STORAGE_KEY = 'jansetu_admin_session';
const LEGACY_STORAGE_KEY = 'jansetu_session';

function getOrCreateTabId(): string {
  if (typeof window === 'undefined') return '';
  let tabId = sessionStorage.getItem('jansetu_tab_session_id');
  if (!tabId) {
    tabId = 'TS_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('jansetu_tab_session_id', tabId);
  }
  return tabId;
}

function getNormalizedAccountKey(user: User | null, profile?: CitizenProfile | null): string {
  if (!user && !profile) return '';
  const raw = profile?.aadhaar || user?.id || user?.username || '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 4) return digits;
  return (user?.username || raw).toLowerCase().trim();
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  sessionConsentAccepted: false,
  setSessionConsent: () => {},
  isAuthModalOpen: false,
  isOnboardingModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  closeOnboardingModal: () => {},
  citizenUser: null,
  citizenProfile: null,
  adminUser: null,
  isCitizenAuthenticated: false,
  isAdminAuthenticated: false,
  loginCitizen: async () => {},
  loginAdmin: async () => {},
  logoutCitizen: async () => {},
  logoutAdmin: async () => {},
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  refreshUser: async () => {},
  setDemoSession: () => {},
  isSessionBroken: false,
  triggerSessionBreak: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [citizenUser, setCitizenUser] = useState<User | null>(null);
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [sessionConsentAccepted, setSessionConsentState] = useState(false);
  const [isSessionBroken, setIsSessionBroken] = useState(false);
  const [brokenAccountName, setBrokenAccountName] = useState('Citizen Beneficiary');

  const pathname = usePathname();
  const isAdminRoute = pathname ? pathname.startsWith('/admin') : false;

  // Active User / Profile resolved dynamically with strict portal separation
  const activeUser = isAdminRoute ? adminUser : citizenUser;
  const activeProfile = isAdminRoute ? null : citizenProfile;
  const isAuthenticated = isAdminRoute ? !!adminUser : !!citizenUser;

  const setSessionConsent = useCallback((accepted: boolean) => {
    setSessionConsentState(accepted);
    if (typeof window !== 'undefined') {
      if (accepted) {
        sessionStorage.setItem('jansetu_session_consent_accepted', 'true');
      } else {
        sessionStorage.removeItem('jansetu_session_consent_accepted');
      }
    }
  }, []);

  const triggerSessionBreak = useCallback((accountName?: string) => {
    setIsSessionBroken(true);
    if (accountName) setBrokenAccountName(accountName);
    setCitizenUser(null);
    setCitizenProfile(null);
    setAdminUser(null);
    setSessionConsentState(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CITIZEN_STORAGE_KEY);
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      sessionStorage.removeItem('citizen_token');
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('jansetu_session_consent_accepted');
      sessionStorage.removeItem('demo_citizen');
      sessionStorage.removeItem('demo_admin');
      
      localStorage.removeItem(CITIZEN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem('demo_citizen');
      localStorage.removeItem('demo_admin');
      localStorage.removeItem('jansetu_ekyc_profile');
      localStorage.removeItem('jansetu_pending_kyc_requests');
      localStorage.removeItem('jansetu_pending_kyc_request');
      localStorage.removeItem('jansetu_session');
    }
  }, []);

  // Set demo citizen/admin session directly
  const setDemoSession = useCallback((identifier: any, role: 'CITIZEN' | 'ADMIN' = 'CITIZEN') => {
    if (typeof window === 'undefined') return;

    const currentTabId = getOrCreateTabId();

    if (role === 'ADMIN') {
      const searchStr = typeof identifier === 'string' ? identifier : identifier?.username || identifier?.officerId || 'dis123456';
      const adminMatch = findAdminByOfficerId(searchStr);
      const isSys = searchStr.toLowerCase().includes('dis') || searchStr.toLowerCase().includes('sys') || adminMatch?.role === 'SYSTEM_ADMIN';
      
      const admin: User = {
        id: adminMatch?.officerId || searchStr,
        username: adminMatch?.username || searchStr,
        full_name: adminMatch?.name || (isSys ? 'Dr. DIS Officer (System Admin)' : 'JYO Officer (Dept Admin)'),
        role: adminMatch?.role || (isSys ? 'SYSTEM_ADMIN' : 'DEPARTMENT_ADMIN'),
        mobile_number: '+91 98765 00001',
      };
      setAdminUser(admin);
      setSessionConsentState(true);
      storeConsent('admin');

      const adminAccountKey = (admin.username || admin.id).toLowerCase();

      const payload = {
        user: admin,
        profile: null,
        token: `admin_token_${admin.id}`,
        role: 'ADMIN',
        sessionConsentAccepted: true,
        tabSessionId: currentTabId,
        accountKey: adminAccountKey,
      };

      // Store in tab session storage (per-tab isolation)
      sessionStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(payload));
      sessionStorage.setItem('admin_token', `admin_token_${admin.id}`);
      sessionStorage.setItem('jansetu_session_consent_accepted', 'true');

      // Update active session in global register & notify other tabs
      localStorage.setItem('jansetu_active_account_' + adminAccountKey, currentTabId);
      localStorage.setItem('jansetu_session_takeover_trigger', JSON.stringify({
        accountKey: adminAccountKey,
        newTabSessionId: currentTabId,
        accountName: admin.full_name,
        role: 'ADMIN',
        timestamp: Date.now()
      }));

      eventBus.postMessage({
        type: 'SESSION_TAKEN_OVER',
        payload: {
          accountKey: adminAccountKey,
          newTabSessionId: currentTabId,
          accountName: admin.full_name,
          role: 'ADMIN'
        }
      });
    } else {
      let queryStr = '';
      if (typeof identifier === 'string') {
        queryStr = identifier;
      } else if (identifier?.rawAadhaar) {
        queryStr = identifier.rawAadhaar;
      } else if (identifier?.aadhaar) {
        queryStr = identifier.aadhaar;
      } else if (identifier?.username) {
        queryStr = identifier.username;
      } else if (identifier?.full_name || identifier?.name) {
        queryStr = identifier.full_name || identifier.name;
      } else if (identifier?.id) {
        queryStr = identifier.id;
      }

      const citizen = findCitizen(queryStr) || (typeof identifier === 'object' && identifier ? identifier : null);
      
      let citizenU: User;
      let citizenP: CitizenProfile;

      if (citizen && 'rawAadhaar' in citizen) {
        citizenU = {
          id: citizen.rawAadhaar,
          username: citizen.username || citizen.rawAadhaar,
          full_name: citizen.name,
          role: 'CITIZEN',
          mobile_number: citizen.phone || citizen.rawPhone,
        };

        citizenP = {
          id: citizen.rawAadhaar,
          full_name: citizen.name,
          date_of_birth: citizen.dob,
          gender: citizen.gender,
          location_state: citizen.state,
          location_city: citizen.city || (citizen.state === 'Rajasthan' ? 'Jaipur' : citizen.state === 'Maharashtra' ? 'Pune' : 'Vadodara'),
          location_district: citizen.city || 'District Central',
          pincode: citizen.pincode || '302001',
          aadhaar: citizen.aadhaar,
          phone: citizen.phone || citizen.rawPhone,
          occupation: 'Citizen Beneficiary',
          annual_income: citizen.annualIncome || 280000,
          income_category: citizen.incomeCategory || 'EWS',
          category: citizen.category || 'General',
        };
      } else if (citizen && (citizen.full_name || citizen.name)) {
        const rawName = citizen.full_name || citizen.name;
        const cleanAadhaarDigits = (citizen.aadhaar || citizen.rawAadhaar || queryStr || '').replace(/\D/g, '');
        citizenU = {
          id: cleanAadhaarDigits || citizen.id || 'user_' + (citizen.username || 'citizen'),
          username: citizen.username || cleanAadhaarDigits || 'citizen',
          full_name: rawName,
          role: 'CITIZEN',
          mobile_number: citizen.phone || citizen.mobile_number || '+91 98765 43210',
        };

        citizenP = {
          id: cleanAadhaarDigits || citizen.id,
          full_name: rawName,
          date_of_birth: citizen.date_of_birth || citizen.dob || '15/08/2001',
          gender: citizen.gender || 'Male',
          location_state: citizen.location_state || citizen.state || 'Rajasthan',
          location_city: citizen.location_city || citizen.city || 'Jaipur',
          location_district: citizen.location_district || citizen.city || 'Jaipur',
          pincode: citizen.pincode || '302001',
          aadhaar: citizen.aadhaar || (cleanAadhaarDigits ? `XXXX XXXX ${cleanAadhaarDigits.slice(-4)}` : 'XXXX XXXX 1405'),
          phone: citizen.phone || citizen.mobile_number || '+91 98765 43210',
          occupation: citizen.occupation || 'Citizen Beneficiary',
          annual_income: citizen.annual_income || citizen.annualIncome || 280000,
          income_category: citizen.income_category || citizen.incomeCategory || 'EWS',
          category: citizen.category || 'General',
        };
      } else {
        const cleanDigits = queryStr.replace(/\D/g, '');
        const nameFallback = queryStr && !/^\d+$/.test(queryStr) 
          ? (queryStr.charAt(0).toUpperCase() + queryStr.slice(1)) 
          : 'Citizen Beneficiary';
        
        citizenU = {
          id: cleanDigits || '111122221405',
          username: queryStr || 'hriday',
          full_name: nameFallback,
          role: 'CITIZEN',
          mobile_number: '+91 98765 43210',
        };

        citizenP = {
          id: cleanDigits || '111122221405',
          full_name: nameFallback,
          date_of_birth: '15/08/2001',
          gender: 'Male',
          location_state: 'Gujarat',
          location_city: 'Vadodara',
          aadhaar: cleanDigits ? `XXXX XXXX ${cleanDigits.slice(-4)}` : '1111 2222 1405',
          phone: '+91 98765 43210',
          occupation: 'Citizen Beneficiary',
          annual_income: 350000,
          income_category: 'Middle Class',
          category: 'General'
        };
      }

      setCitizenUser(citizenU);
      setCitizenProfile(citizenP);
      setSessionConsentState(true);
      storeConsent('citizen');

      const citizenAccountKey = getNormalizedAccountKey(citizenU, citizenP);

      const payload = {
        user: citizenU,
        profile: citizenP,
        token: `citizen_token_${citizenU.id}`,
        role: 'CITIZEN',
        sessionConsentAccepted: true,
        tabSessionId: currentTabId,
        accountKey: citizenAccountKey,
      };

      // Store in tab session storage (per-tab isolation)
      sessionStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(payload));
      sessionStorage.setItem('citizen_token', `citizen_token_${citizenU.id}`);
      sessionStorage.setItem('demo_citizen', JSON.stringify(citizen || citizenU));
      sessionStorage.setItem('jansetu_session_consent_accepted', 'true');
      localStorage.setItem('jansetu_ekyc_profile', JSON.stringify(citizen || citizenP));

      // Update active session in global register & notify other tabs
      localStorage.setItem('jansetu_active_account_' + citizenAccountKey, currentTabId);
      localStorage.setItem('jansetu_session_takeover_trigger', JSON.stringify({
        accountKey: citizenAccountKey,
        newTabSessionId: currentTabId,
        accountName: citizenU.full_name,
        role: 'CITIZEN',
        timestamp: Date.now()
      }));

      eventBus.postMessage({
        type: 'SESSION_TAKEN_OVER',
        payload: {
          accountKey: citizenAccountKey,
          newTabSessionId: currentTabId,
          accountName: citizenU.full_name,
          role: 'CITIZEN'
        }
      });
    }
  }, []);

  const loginCitizen = useCallback(async (profileOrIdentifier?: any) => {
    setDemoSession(profileOrIdentifier, 'CITIZEN');
    setSessionConsent(true);
    return { success: true };
  }, [setDemoSession, setSessionConsent]);

  const loginAdmin = useCallback(async (credentialsOrIdentifier?: any) => {
    setDemoSession(credentialsOrIdentifier, 'ADMIN');
    setSessionConsent(true);
    return { success: true };
  }, [setDemoSession, setSessionConsent]);

  const logoutCitizen = useCallback(async () => {
    setCitizenUser(null);
    setCitizenProfile(null);
    setSessionConsentState(false);
    if (typeof window !== 'undefined') {
      const currentTabId = sessionStorage.getItem('jansetu_tab_session_id');
      const citRaw = sessionStorage.getItem(CITIZEN_STORAGE_KEY);
      if (citRaw) {
        try {
          const parsed = JSON.parse(citRaw);
          const key = parsed.accountKey || getNormalizedAccountKey(parsed.user, parsed.profile);
          if (key && localStorage.getItem('jansetu_active_account_' + key) === currentTabId) {
            localStorage.removeItem('jansetu_active_account_' + key);
          }
        } catch {}
      }
      sessionStorage.removeItem(CITIZEN_STORAGE_KEY);
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      sessionStorage.removeItem('citizen_token');
      sessionStorage.removeItem('demo_citizen');
      sessionStorage.removeItem('jansetu_session_consent_accepted');

      localStorage.removeItem(CITIZEN_STORAGE_KEY);
      localStorage.removeItem('demo_citizen');
      localStorage.removeItem('jansetu_ekyc_profile');
      localStorage.removeItem('jansetu_pending_kyc_requests');
      localStorage.removeItem('jansetu_pending_kyc_request');
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, []);

  const logoutAdmin = useCallback(async () => {
    setAdminUser(null);
    setSessionConsentState(false);
    if (typeof window !== 'undefined') {
      const currentTabId = sessionStorage.getItem('jansetu_tab_session_id');
      const admRaw = sessionStorage.getItem(ADMIN_STORAGE_KEY);
      if (admRaw) {
        try {
          const parsed = JSON.parse(admRaw);
          const key = parsed.accountKey || (parsed.user?.username || parsed.user?.id || '').toLowerCase();
          if (key && localStorage.getItem('jansetu_active_account_' + key) === currentTabId) {
            localStorage.removeItem('jansetu_active_account_' + key);
          }
        } catch {}
      }
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('demo_admin');
      sessionStorage.removeItem('jansetu_session_consent_accepted');

      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem('demo_admin');
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, []);

  // Ask before reload/refresh: browser confirmation prompt when authenticated
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isAuthenticated) return;
      try {
        sessionStorage.setItem('jansetu_page_reloaded', 'true');
      } catch {}

      const message = 'You have an active government session. Reloading or leaving this page will terminate your session and log you out. Are you sure you want to proceed?';
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated]);

  const refreshUser = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      const currentTabId = getOrCreateTabId();

      // Detect reload/refresh via performance API or session flag
      let isReload = false;
      try {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries && navEntries.length > 0) {
          isReload = (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
        } else if ((performance as any).navigation) {
          isReload = (performance as any).navigation.type === 1;
        }
      } catch {}

      const wasPendingReload = sessionStorage.getItem('jansetu_page_reloaded') === 'true';

      if (isReload || wasPendingReload) {
        // Clear session on page reload / refresh
        sessionStorage.removeItem('jansetu_page_reloaded');
        sessionStorage.removeItem(CITIZEN_STORAGE_KEY);
        sessionStorage.removeItem(ADMIN_STORAGE_KEY);
        sessionStorage.removeItem('citizen_token');
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('jansetu_session_consent_accepted');
        setCitizenUser(null);
        setCitizenProfile(null);
        setAdminUser(null);
        setSessionConsentState(false);
        setIsLoading(false);
        return;
      }

      const isConsentAccepted = sessionStorage.getItem('jansetu_session_consent_accepted') === 'true';

      // 1. Check Citizen Session in sessionStorage (strict tab scope)
      const rawCitizen = sessionStorage.getItem(CITIZEN_STORAGE_KEY);
      if (rawCitizen && isConsentAccepted) {
        try {
          const parsed = JSON.parse(rawCitizen);
          if (parsed && parsed.user) {
            const accKey = parsed.accountKey || getNormalizedAccountKey(parsed.user, parsed.profile);
            const activeTabInRegister = localStorage.getItem('jansetu_active_account_' + accKey);

            // Check if active session was taken over by another tab
            if (activeTabInRegister && activeTabInRegister !== currentTabId) {
              triggerSessionBreak(parsed.user.full_name);
              return;
            }

            setCitizenUser(parsed.user);
            setCitizenProfile(parsed.profile || null);
            setSessionConsentState(true);
          }
        } catch {}
      }

      // 2. Check Admin Session in sessionStorage (strict tab scope)
      const rawAdmin = sessionStorage.getItem(ADMIN_STORAGE_KEY);
      if (rawAdmin && isConsentAccepted) {
        try {
          const parsed = JSON.parse(rawAdmin);
          if (parsed && parsed.user) {
            const accKey = parsed.accountKey || (parsed.user.username || parsed.user.id || '').toLowerCase();
            const activeTabInRegister = localStorage.getItem('jansetu_active_account_' + accKey);

            if (activeTabInRegister && activeTabInRegister !== currentTabId) {
              triggerSessionBreak(parsed.user.full_name);
              return;
            }

            setAdminUser(parsed.user);
            setSessionConsentState(true);
          }
        } catch {}
      }
    } catch {} finally {
      setIsLoading(false);
    }
  }, [triggerSessionBreak]);

  // Session Break Listener: detects concurrent login of the same account across tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSessionTakeover = (payload: any) => {
      if (!payload) return;
      const { accountKey, newTabSessionId, accountName } = payload;
      const currentTabId = sessionStorage.getItem('jansetu_tab_session_id');

      // Check current tab's active account
      const rawCit = sessionStorage.getItem(CITIZEN_STORAGE_KEY);
      const rawAdm = sessionStorage.getItem(ADMIN_STORAGE_KEY);

      let myAccountKey = '';
      let myName = '';

      if (rawCit) {
        try {
          const parsed = JSON.parse(rawCit);
          myAccountKey = parsed.accountKey || getNormalizedAccountKey(parsed.user, parsed.profile);
          myName = parsed.user?.full_name || 'Citizen Beneficiary';
        } catch {}
      } else if (rawAdm) {
        try {
          const parsed = JSON.parse(rawAdm);
          myAccountKey = parsed.accountKey || (parsed.user?.username || parsed.user?.id || '').toLowerCase();
          myName = parsed.user?.full_name || 'Officer';
        } catch {}
      }

      if (myAccountKey && accountKey) {
        const isMatch = myAccountKey === accountKey || myAccountKey.includes(accountKey) || accountKey.includes(myAccountKey);
        if (isMatch && currentTabId && newTabSessionId && currentTabId !== newTabSessionId) {
          console.warn(`[JANSETU DPDP] Session Break Triggered: Account ${accountKey} logged in on tab ${newTabSessionId}. Disconnecting tab ${currentTabId}.`);
          triggerSessionBreak(accountName || myName);
        }
      }
    };

    // 1. Bus message listener
    const handleBusMessage = (event: MessageEvent<any>) => {
      if (event?.data?.type === 'SESSION_TAKEN_OVER') {
        handleSessionTakeover(event.data.payload);
      }
    };

    eventBus.addEventListener('message', handleBusMessage);

    // 2. Cross-tab storage trigger listener
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'jansetu_session_takeover_trigger' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          handleSessionTakeover(data);
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      eventBus.removeEventListener('message', handleBusMessage);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [triggerSessionBreak]);

  const login = async (username: string, pin: string, expectedRole?: 'CITIZEN' | 'ADMIN') => {
    try {
      const res = await loginAPI(username, pin);
      if (res && res.user) {
        if (expectedRole === 'ADMIN' || res.user.role === 'ADMIN' || res.user.role === 'SYSTEM_ADMIN') {
          loginAdmin(res.user);
        } else {
          loginCitizen(res.user);
        }
        return res;
      }
    } catch (err: any) {
      if (expectedRole === 'ADMIN') {
        loginAdmin(username);
        return { user: { id: username, username, full_name: 'Officer ' + username, role: 'SYSTEM_ADMIN' } };
      } else {
        loginCitizen(username);
        return { user: { id: username, username, full_name: 'Citizen ' + username, role: 'CITIZEN' } };
      }
    }
  };

  const logout = async () => {
    if (isAdminRoute) {
      await logoutAdmin();
    } else {
      await logoutCitizen();
    }
    try {
      await logoutAPI();
    } catch {}
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateProfile = async (profileData: Partial<CitizenProfile>) => {
    const res = await updateProfileAPI(profileData);
    await refreshUser();
    return res;
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        profile: activeProfile,
        isAuthenticated,
        isLoading,
        sessionConsentAccepted,
        setSessionConsent,
        isAuthModalOpen,
        isOnboardingModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        closeOnboardingModal: () => setIsOnboardingModalOpen(false),
        citizenUser,
        citizenProfile,
        adminUser,
        isCitizenAuthenticated: !!citizenUser,
        isAdminAuthenticated: !!adminUser,
        loginCitizen,
        loginAdmin,
        logoutCitizen,
        logoutAdmin,
        login,
        logout,
        updateProfile,
        refreshUser,
        setDemoSession,
        isSessionBroken,
        triggerSessionBreak,
      }}
    >
      {children}
      <SessionBreakModal
        isOpen={isSessionBroken}
        accountName={brokenAccountName}
        onConfirm={() => {
          setIsSessionBroken(false);
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
