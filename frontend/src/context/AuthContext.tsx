'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchMeAPI, requestOtpAPI, verifyOtpAPI, logoutAPI, updateProfileAPI } from '@/lib/api';

export interface User {
  id: string;
  full_name: string;
  mobile_number: string;
  mobile_verified: boolean;
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
  isAuthModalOpen: boolean;
  isOnboardingModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  closeOnboardingModal: () => void;
  requestOtp: (fullName: string, mobileNumber: string) => Promise<any>;
  verifyOtp: (fullName: string, mobileNumber: string, otp: string) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<CitizenProfile>) => Promise<any>;
  refreshUser: () => Promise<void>;
  devOtpNotice: string | null;
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
  requestOtp: async () => {},
  verifyOtp: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  refreshUser: async () => {},
  devOtpNotice: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [devOtpNotice, setDevOtpNotice] = useState<string | null>(null);

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

  const requestOtp = async (fullName: string, mobileNumber: string) => {
    setDevOtpNotice(null);
    const res = await requestOtpAPI(fullName, mobileNumber);
    if (res && res.dev_otp) {
      setDevOtpNotice(`[DEV MODE] Verification OTP for ${res.mobile_number}: ${res.dev_otp}`);
    }
    return res;
  };

  const verifyOtp = async (fullName: string, mobileNumber: string, otp: string) => {
    const res = await verifyOtpAPI(fullName, mobileNumber, otp);
    if (res && res.user) {
      setUser(res.user);
      setProfile(res.profile || null);
      setIsAuthModalOpen(false);
      if (res.is_new_user) {
        setIsOnboardingModalOpen(true);
      }
    }
    return res;
  };

  const logout = async () => {
    await logoutAPI();
    setUser(null);
    setProfile(null);
    setDevOtpNotice(null);
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
        requestOtp,
        verifyOtp,
        logout,
        updateProfile,
        refreshUser,
        devOtpNotice
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
