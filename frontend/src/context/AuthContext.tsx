'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchMeAPI, loginAPI, logoutAPI, updateProfileAPI } from '@/lib/api';
import { getStoredConsent, storeConsent } from '@/components/TermsConsentModal';
import { DEMO_CITIZENS, findCitizen, findAdminByOfficerId } from '@/data/demoCitizens';
import { ShieldAlert, LogIn } from 'lucide-react';
import { usePathname } from 'next/navigation';

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
}

const CITIZEN_STORAGE_KEY = 'jansetu_citizen_session';
const ADMIN_STORAGE_KEY = 'jansetu_admin_session';
const LEGACY_STORAGE_KEY = 'jansetu_session';

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
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [citizenUser, setCitizenUser] = useState<User | null>(null);
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [sessionConsentAccepted, setSessionConsent] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const pathname = usePathname();
  const isAdminRoute = pathname ? pathname.startsWith('/admin') : false;

  // Baseline citizen fallback for citizen portal routes
  const defaultCitizenUser: User = {
    id: '111122221405',
    username: 'hriday',
    full_name: 'Hriday Bardia',
    role: 'CITIZEN',
    mobile_number: '+91 98765 00002'
  };

  const defaultCitizenProfile: CitizenProfile = {
    id: '111122221405',
    full_name: 'Hriday Bardia',
    date_of_birth: '15/08/2001',
    gender: 'Male',
    location_state: 'Gujarat',
    location_city: 'Vadodara',
    location_district: 'Vadodara',
    pincode: '390007',
    aadhaar: 'XXXX XXXX 1405',
    phone: '+91 98765 00002',
    occupation: 'Citizen Beneficiary',
    annual_income: 350000,
    income_category: 'Middle Class',
    category: 'General'
  };

  // Active User / Profile resolved dynamically with strict portal separation
  const activeUser = isAdminRoute ? adminUser : (citizenUser || defaultCitizenUser);
  const activeProfile = isAdminRoute ? null : (citizenProfile || defaultCitizenProfile);
  const isAuthenticated = isAdminRoute ? !!adminUser : !!citizenUser;

  // Set demo citizen/admin session directly
  const setDemoSession = useCallback((identifier: any, role: 'CITIZEN' | 'ADMIN' = 'CITIZEN') => {
    if (typeof window === 'undefined') return;

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
      storeConsent('admin');

      const payload = {
        user: admin,
        profile: null,
        token: `admin_token_${admin.id}`,
        role: 'ADMIN',
        sessionConsentAccepted: true,
      };

      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(payload));
      sessionStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(payload));
      sessionStorage.setItem('admin_token', `admin_token_${admin.id}`);
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
      storeConsent('citizen');

      const payload = {
        user: citizenU,
        profile: citizenP,
        token: `citizen_token_${citizenU.id}`,
        role: 'CITIZEN',
        sessionConsentAccepted: true,
      };

      localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(payload));
      sessionStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(payload));
      sessionStorage.setItem('citizen_token', `citizen_token_${citizenU.id}`);
      sessionStorage.setItem('demo_citizen', JSON.stringify(citizen || citizenU));
      localStorage.setItem('jansetu_ekyc_profile', JSON.stringify(citizen || citizenP));
    }
  }, []);

  const loginCitizen = useCallback(async (profileOrIdentifier?: any) => {
    setDemoSession(profileOrIdentifier, 'CITIZEN');
    setSessionConsent(true);
    return { success: true };
  }, [setDemoSession]);

  const loginAdmin = useCallback(async (credentialsOrIdentifier?: any) => {
    setDemoSession(credentialsOrIdentifier, 'ADMIN');
    setSessionConsent(true);
    return { success: true };
  }, [setDemoSession]);

  const logoutCitizen = useCallback(async () => {
    setCitizenUser(null);
    setCitizenProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CITIZEN_STORAGE_KEY);
      sessionStorage.removeItem(CITIZEN_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      sessionStorage.removeItem('citizen_token');
      sessionStorage.removeItem('demo_citizen');
      localStorage.removeItem('demo_citizen');
      localStorage.removeItem('jansetu_ekyc_profile');
      sessionStorage.removeItem('jansetu_ekyc_profile');
    }
  }, []);

  const logoutAdmin = useCallback(async () => {
    setAdminUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('demo_admin');
      localStorage.removeItem('demo_admin');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Check Citizen Session
      const rawCitizen = localStorage.getItem(CITIZEN_STORAGE_KEY) || sessionStorage.getItem(CITIZEN_STORAGE_KEY);
      if (rawCitizen) {
        try {
          const parsed = JSON.parse(rawCitizen);
          if (parsed && parsed.user) {
            setCitizenUser(parsed.user);
            setCitizenProfile(parsed.profile || null);
          }
        } catch {}
      }

      // 2. Check Admin Session
      const rawAdmin = localStorage.getItem(ADMIN_STORAGE_KEY) || sessionStorage.getItem(ADMIN_STORAGE_KEY);
      if (rawAdmin) {
        try {
          const parsed = JSON.parse(rawAdmin);
          if (parsed && parsed.user) {
            setAdminUser(parsed.user);
          }
        } catch {}
      }

      // 3. Fallback Legacy check
      if (!rawCitizen && !rawAdmin) {
        const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY) || sessionStorage.getItem(LEGACY_STORAGE_KEY);
        if (rawLegacy) {
          try {
            const parsed = JSON.parse(rawLegacy);
            if (parsed?.role === 'ADMIN' || parsed?.user?.role === 'ADMIN' || parsed?.user?.role === 'SYSTEM_ADMIN') {
              setAdminUser(parsed.user);
            } else if (parsed?.user) {
              setCitizenUser(parsed.user);
              setCitizenProfile(parsed.profile || null);
            }
          } catch {}
        }
      }
    } catch {} finally {
      setIsLoading(false);
    }
  }, []);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
