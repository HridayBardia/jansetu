'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchMeAPI, loginAPI, logoutAPI, updateProfileAPI } from '@/lib/api';

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
}

interface AuthContextType {
  user: User | null;
  profile: CitizenProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Modal state (for Navbar login button & OnboardingModal)
  isAuthModalOpen: boolean;
  isOnboardingModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  closeOnboardingModal: () => void;
  // Auth actions
  login: (username: string, pin: string) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<CitizenProfile>) => Promise<any>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  isAuthModalOpen: false,
  isOnboardingModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  closeOnboardingModal: () => {},
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  const refreshUser = async () => {
    try {
      const data = await fetchMeAPI();
      if (data && data.user) {
        setUser(data.user);
        setProfile(data.profile || null);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const closeOnboardingModal = () => setIsOnboardingModalOpen(false);

  const login = async (username: string, pin: string) => {
    const res = await loginAPI(username, pin);
    if (res && res.user) {
      setUser(res.user);
      setIsAuthModalOpen(false);
      // Refresh full profile data
      await refreshUser();
    }
    return res;
  };

  const logout = async () => {
    await logoutAPI();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('citizen_token');
    }
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (profileData: Partial<CitizenProfile>) => {
    const res = await updateProfileAPI(profileData);
    await refreshUser();
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        isOnboardingModalOpen,
        openAuthModal,
        closeAuthModal,
        closeOnboardingModal,
        login,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
