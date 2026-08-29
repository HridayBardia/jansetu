'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Users, 
  CheckCircle2, 
  RotateCw, 
  Smartphone, 
  CreditCard,
  ArrowLeft,
  Sparkles,
  Check,
  Lock,
  UserCheck,
  Shield,
  FileText,
  Building2,
  KeyRound,
  Info,
  ExternalLink,
  Award
} from 'lucide-react';
import { LegalConsentModal } from '@/components/LegalConsentModal';
import { GovHeader } from '@/components/GovHeader';
import { GovFooter } from '@/components/GovFooter';
import { 
  DEMO_CITIZENS, 
  DEMO_ADMINS,
  GLOBAL_DEMO_OTP, 
  formatAadhaarNumber, 
  findCitizenByAadhaar
} from '@/data/demoCitizens';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, setSessionConsent, sessionConsentAccepted } = useAuth();
  const { t } = useLanguage();

  // Portal view: null = Selection, 'CITIZEN' = Citizen Aadhaar e-KYC, 'ADMIN' = Admin Login
  const [loginType, setLoginType] = useState<'CITIZEN' | 'ADMIN' | null>(null);

  // Citizen Step: 1 = Aadhaar & Captcha, 2 = OTP Verification
  const [citizenStep, setCitizenStep] = useState<1 | 2>(1);

  // Citizen Input States
  const [aadhaarRaw, setAadhaarRaw] = useState('');
  const [citizenCaptchaInput, setCitizenCaptchaInput] = useState('');
  const [citizenCaptchaCode, setCitizenCaptchaCode] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);

  // OTP States
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showSmsToast, setShowSmsToast] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Admin Input States
  const [adminUserId, setAdminUserId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminCaptchaInput, setAdminCaptchaInput] = useState('');
  const [adminCaptchaCode, setAdminCaptchaCode] = useState('');
  const [adminComplianceAccepted, setAdminComplianceAccepted] = useState(false);

  // Common States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [citizenConsentAccepted, setCitizenConsentAccepted] = useState(false);

  // Legal Modal States
  const [legalModalState, setLegalModalState] = useState<{
    isOpen: boolean;
    type: 'terms' | 'privacy';
    role: 'citizen' | 'admin';
  }>({
    isOpen: false,
    type: 'terms',
    role: 'citizen',
  });

  const [citizenConsentShake, setCitizenConsentShake] = useState(false);
  const [adminConsentShake, setAdminConsentShake] = useState(false);

  const citizenCanvasRef = useRef<HTMLCanvasElement>(null);
  const adminCanvasRef = useRef<HTMLCanvasElement>(null);

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && sessionConsentAccepted && user) {
      if (user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN' || user.role === 'DEPARTMENT_ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/citizen/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, sessionConsentAccepted, user, router]);

  // Captcha Generator
  const generateRandomCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const refreshCitizenCaptcha = () => {
    setCitizenCaptchaCode(generateRandomCaptcha());
    setCitizenCaptchaInput('');
    setErrorMsg(null);
  };

  const refreshAdminCaptcha = () => {
    setAdminCaptchaCode(generateRandomCaptcha());
    setAdminCaptchaInput('');
    setErrorMsg(null);
  };

  // Draw Captcha on Canvas
  const drawCaptcha = (canvas: HTMLCanvasElement | null, code: string) => {
    if (!canvas || !code) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 100 + 50)}, ${Math.floor(Math.random() * 100 + 50)}, 180, 0.4)`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Characters
    const colors = ['#1e3a8a', '#1e293b', '#0f766e', '#b45309', '#4338ca'];
    for (let i = 0; i < code.length; i++) {
      ctx.save();
      const char = code[i];
      const x = 14 + i * 19;
      const y = 26 + (Math.random() * 4 - 2);
      const angle = (Math.random() * 20 - 10) * (Math.PI / 180);

      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  };

  // Draw Citizen Captcha
  useEffect(() => {
    if (loginType === 'CITIZEN' && citizenStep === 1) {
      if (!citizenCaptchaCode) {
        setCitizenCaptchaCode(generateRandomCaptcha());
      } else {
        drawCaptcha(citizenCanvasRef.current, citizenCaptchaCode);
      }
    }
  }, [loginType, citizenStep, citizenCaptchaCode]);

  // Draw Admin Captcha
  useEffect(() => {
    if (loginType === 'ADMIN') {
      if (!adminCaptchaCode) {
        setAdminCaptchaCode(generateRandomCaptcha());
      } else {
        drawCaptcha(adminCanvasRef.current, adminCaptchaCode);
      }
    }
  }, [loginType, adminCaptchaCode]);

  // Resend Countdown
  useEffect(() => {
    let interval: any = null;
    if (citizenStep === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [citizenStep, resendTimer]);

  // Auto-hide SMS toast
  useEffect(() => {
    let timeout: any = null;
    if (showSmsToast) {
      timeout = setTimeout(() => {
        setShowSmsToast(false);
      }, 10000);
    }
    return () => clearTimeout(timeout);
  }, [showSmsToast]);

  // Quick Persona Handler - CITIZEN
  const handleSelectAadhaarChip = (aadhaarRawValue: string) => {
    setAadhaarRaw(aadhaarRawValue);
    const matched = findCitizenByAadhaar(aadhaarRawValue);
    setSelectedCitizen(matched || null);
    setCitizenCaptchaInput(citizenCaptchaCode);
    setErrorMsg(null);
  };

  // Step 1: Request OTP
  const handleGetAadhaarOtp = () => {
    const cleanDigits = aadhaarRaw.replace(/\D/g, '');

    if (!citizenConsentAccepted) {
      setCitizenConsentShake(true);
      setTimeout(() => setCitizenConsentShake(false), 600);
      setErrorMsg('Please review and accept the statutory terms and e-KYC privacy policy to proceed.');
      openLegalModal('terms', 'citizen');
      return;
    }

    if (cleanDigits.length !== 12) {
      setErrorMsg('Please enter a valid 12-digit Aadhaar Number.');
      return;
    }

    if (!citizenCaptchaInput || citizenCaptchaInput.trim().toUpperCase() !== citizenCaptchaCode.toUpperCase()) {
      setErrorMsg('Invalid Security Captcha Code. Please enter the characters shown.');
      return;
    }

    const matched = findCitizenByAadhaar(cleanDigits) || {
      name: 'Citizen Beneficiary',
      aadhaar: formatAadhaarNumber(cleanDigits),
      rawAadhaar: cleanDigits,
      phone: `+91 XXXXX ${cleanDigits.slice(-4) || '1405'}`,
      rawPhone: '+919876543210',
      dob: '15/08/1998',
      gender: 'Male',
      address: '42, Residency Road, Bengaluru, Karnataka - 560025',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560025',
      username: `citizen_${cleanDigits.slice(-4) || 'user'}`,
      role: 'CITIZEN',
      annualIncome: 300000,
      incomeCategory: 'EWS',
      category: 'General',
      avatarColor: 'from-blue-500 to-indigo-500'
    };

    setSelectedCitizen(matched);
    setErrorMsg(null);
    setCitizenStep(2);
    setResendTimer(30);
    setCanResend(false);
    setOtpDigits(['', '', '', '', '', '']);
    setShowSmsToast(true);

    setTimeout(() => {
      otpRefs[0]?.current?.focus();
    }, 150);
  };

  // OTP Input Handlers
  const handleOtpInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setErrorMsg(null);

    if (digit && index < 5) {
      otpRefs[index + 1]?.current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpRefs[index - 1]?.current?.focus();
      }
    }
    if (e.key === 'Enter') {
      handleVerifyCitizenOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      if (pasted.length === 6) {
        otpRefs[5]?.current?.focus();
      } else {
        otpRefs[pasted.length]?.current?.focus();
      }
    }
  };

  // Step 2: Verify OTP
  const handleVerifyCitizenOtp = async () => {
    const enteredOtp = otpDigits.join('');

    if (!citizenConsentAccepted) {
      setCitizenConsentShake(true);
      setTimeout(() => setCitizenConsentShake(false), 600);
      setErrorMsg('Please accept the Terms & Conditions and Privacy Policy to proceed.');
      return;
    }

    if (enteredOtp.length < 6) {
      setErrorMsg('Please enter the 6-digit OTP sent to your registered mobile.');
      return;
    }

    if (enteredOtp !== GLOBAL_DEMO_OTP) {
      setErrorMsg('Invalid OTP. Please check the SMS or use demo code 123456.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const cleanDigits = selectedCitizen?.rawAadhaar || aadhaarRaw.replace(/\D/g, '');
      const citizenToLogin = selectedCitizen || findCitizenByAadhaar(cleanDigits);
      const res = await login(cleanDigits, enteredOtp, 'CITIZEN');

      if (res && res.user) {
        if (typeof window !== 'undefined' && citizenToLogin) {
          localStorage.setItem('jansetu_ekyc_profile', JSON.stringify(citizenToLogin));
        }
        setSessionConsent(true);
        router.replace('/citizen/dashboard');
      } else {
        setErrorMsg('Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Quick Chip Select
  const handleSelectAdminChip = (officerId: string) => {
    setAdminUserId(officerId);
    setAdminPassword('password123');
    setAdminCaptchaInput(adminCaptchaCode);
    setAdminComplianceAccepted(true);
    setSessionConsent(true);
    setErrorMsg(null);
  };

  // Admin Login Handler
  const handleAdminLogin = async () => {
    const trimmedId = adminUserId.trim().toLowerCase();

    if (!adminComplianceAccepted) {
      setAdminConsentShake(true);
      setTimeout(() => setAdminConsentShake(false), 600);
      setErrorMsg('Official compliance terms and statutory audit rules must be accepted.');
      openLegalModal('terms', 'admin');
      return;
    }

    if (!trimmedId) {
      setErrorMsg('Please enter your designated Government Officer ID.');
      return;
    }

    if (!adminPassword) {
      setErrorMsg('Please enter your departmental password.');
      return;
    }

    if (!adminCaptchaInput || adminCaptchaInput.trim().toUpperCase() !== adminCaptchaCode.toUpperCase()) {
      setErrorMsg('Invalid Security Captcha Code. Please enter the characters shown.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await login(trimmedId, adminPassword, 'ADMIN');
      if (res && res.user) {
        setSessionConsent(true);
        router.replace('/admin/dashboard');
      } else {
        setErrorMsg('Invalid officer credentials or unauthorized access level.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Departmental login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLegalModal = (type: 'terms' | 'privacy', role: 'citizen' | 'admin') => {
    setLegalModalState({
      isOpen: true,
      type,
      role,
    });
  };

  const closeLegalModal = () => {
    setLegalModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleLegalModalAccepted = () => {
    if (legalModalState.role === 'citizen') {
      setCitizenConsentAccepted(true);
      setSessionConsent(true);
    } else {
      setAdminComplianceAccepted(true);
      setSessionConsent(true);
    }
    setErrorMsg(null);
    closeLegalModal();
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-center py-4">
      {/* Main Portal Authentication Container */}
      <div className="w-full">
        {/* ========================================================================= */}
        {/* VIEW 1: ROLE SELECTION (UNIFIED ACCESS PORTAL)                            */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* VIEW 1: ROLE SELECTION (UNIFIED ACCESS PORTAL)                            */}
        {/* ========================================================================= */}
        {loginType === null && (
          <div className="space-y-8 animate-fade-in">
            {/* Heading */}
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-serif">
                {t('Unified Access Portal', 'Unified Access Portal')}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('Select your designated authorization category to access public services, scheme benefits, and departmental administration.', 'Select your designated authorization category to access public services, scheme benefits, and departmental administration.')}
              </p>
            </div>

            {/* Portal Selection Cards (GIGW Compliant Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
              {/* CARD 1: CITIZEN SERVICES */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 md:p-8 shadow-sm hover:shadow-md hover:border-blue-600 dark:hover:border-blue-500 transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  {/* Top Badge & Ashoka Blue Icon */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t('UIDAI e-KYC Verified Flow', 'UIDAI e-KYC Verified Flow')}</span>
                    </span>

                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition">
                      {t('Citizen Portal', 'Citizen Portal')}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {t('Unified gateway for Indian residents to access national welfare schemes, Direct Benefit Transfers (DBT), and authoritative DigiLocker integration.', 'Unified gateway for Indian residents to access national welfare schemes, Direct Benefit Transfers (DBT), and authoritative DigiLocker integration.')}
                    </p>
                  </div>

                  {/* Feature Bullet Points */}
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{t('Aadhaar OTP e-KYC authentication & residency verification', 'Aadhaar OTP e-KYC authentication & residency verification')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{t('Direct Benefit Transfer (DBT) bank linking & tracking', 'Direct Benefit Transfer (DBT) bank linking & tracking')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{t('Instant AI scheme discovery & eligibility matching', 'Instant AI scheme discovery & eligibility matching')}</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLoginType('CITIZEN');
                    setCitizenStep(1);
                    setErrorMsg(null);
                  }}
                  className="w-full mt-6 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded text-sm transition-colors text-center cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <span>{t('Access Citizen Portal', 'Access Citizen Portal')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* CARD 2: ADMINISTRATION PORTAL */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 md:p-8 shadow-sm hover:shadow-md hover:border-slate-600 dark:hover:border-slate-500 transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  {/* Top Badge & Steel Slate Icon */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t('Departmental Access Only', 'Departmental Access Only')}</span>
                    </span>

                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-300 dark:border-slate-700 shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-slate-800 dark:group-hover:text-slate-200 transition">
                      {t('Official Administration Portal', 'Official Administration Portal')}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {t('Designated portal for System Administrators, District Nodal Officers, and Ministry Reviewers to process beneficiary applications and audit logs.', 'Designated portal for System Administrators, District Nodal Officers, and Ministry Reviewers to process beneficiary applications and audit logs.')}
                    </p>
                  </div>

                  {/* Feature Bullet Points */}
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                      <span>{t('Officer credential login with MFA security tokens', 'Officer credential login with MFA security tokens')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                      <span>{t('Real-time telemetry oversight & SLA compliance monitoring', 'Real-time telemetry oversight & SLA compliance monitoring')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                      <span>{t('Beneficiary sanction desk & digital signature approval', 'Beneficiary sanction desk & digital signature approval')}</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLoginType('ADMIN');
                    setErrorMsg(null);
                  }}
                  className="w-full mt-6 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold rounded text-sm transition-colors text-center cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <span>{t('Access Official Portal', 'Access Official Portal')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: CITIZEN LOGIN (AADHAAR e-KYC AUTHENTICATION)                       */}
        {/* ========================================================================= */}
        {loginType === 'CITIZEN' && (
          <div className="max-w-lg w-full mx-auto space-y-4 animate-fade-in">
            {/* Back to Portal Selector */}
            <button
              type="button"
              onClick={() => {
                setLoginType(null);
                setCitizenStep(1);
                setErrorMsg(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Portal Selection</span>
            </button>

            {/* Main Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 md:p-8 shadow-sm space-y-5 text-slate-900 dark:text-white">
              {/* Card Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    UIDAI e-KYC Level 2
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Step {citizenStep} of 2
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Citizen Resident Login
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Authenticate using your 12-digit Aadhaar Number and OTP.
                </p>
              </div>

              {/* Fast Demo Test Personas */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 block">
                  Quick Demo Beneficiary Personas (Click to Populate):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {DEMO_CITIZENS.map((cit) => (
                    <button
                      key={cit.rawAadhaar}
                      type="button"
                      onClick={() => handleSelectAadhaarChip(cit.rawAadhaar)}
                      className={`px-2 py-1 rounded text-xs font-mono font-bold transition border cursor-pointer ${
                        aadhaarRaw === cit.rawAadhaar
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-blue-500'
                      }`}
                    >
                      {cit.name.split(' ')[0]} ({cit.rawAadhaar.slice(-4)})
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 1: Aadhaar & Captcha Input */}
              {citizenStep === 1 && (
                <div className="space-y-4">
                  {/* Aadhaar Input */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      12-Digit Aadhaar Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={aadhaarRaw.length === 12 ? formatAadhaarNumber(aadhaarRaw) : aadhaarRaw}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setAadhaarRaw(raw);
                        setSelectedCitizen(findCitizenByAadhaar(raw) || null);
                        setErrorMsg(null);
                      }}
                      placeholder="1111 2222 0207"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent tracking-widest placeholder-slate-400"
                    />
                  </div>

                  {/* Captcha Box */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Security Captcha Code <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="border border-slate-300 dark:border-slate-600 rounded overflow-hidden shadow-inner bg-slate-100">
                        <canvas ref={citizenCanvasRef} width={130} height={38} />
                      </div>
                      <button
                        type="button"
                        onClick={refreshCitizenCaptcha}
                        title="Refresh Captcha"
                        className="p-2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        maxLength={6}
                        value={citizenCaptchaInput}
                        onChange={(e) => {
                          setCitizenCaptchaInput(e.target.value.toUpperCase());
                          setErrorMsg(null);
                        }}
                        placeholder="Enter Code"
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white font-mono text-sm uppercase focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-slate-400"
                      />
                    </div>
                  </div>

                  {/* Statutory Terms & DPDP Privacy Checkbox */}
                  <div className={`p-3 rounded border text-xs transition ${
                    citizenConsentAccepted 
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' 
                      : citizenConsentShake 
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 animate-shake' 
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
                  }`}>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={citizenConsentAccepted}
                        onChange={(e) => {
                          if (e.target.checked) {
                            openLegalModal('terms', 'citizen');
                          } else {
                            setCitizenConsentAccepted(false);
                            setSessionConsent(false);
                          }
                        }}
                        className="mt-0.5 w-4 h-4 accent-blue-700 cursor-pointer"
                      />
                      <span className="text-slate-700 dark:text-slate-300 leading-relaxed select-none">
                        I hereby provide statutory consent under the Digital Personal Data Protection (DPDP) Act 2023 for UIDAI Aadhaar verification and agree to the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            openLegalModal('terms', 'citizen');
                          }}
                          className="text-blue-700 dark:text-blue-400 font-bold underline hover:text-blue-800"
                        >
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            openLegalModal('privacy', 'citizen');
                          }}
                          className="text-emerald-700 dark:text-emerald-400 font-bold underline hover:text-emerald-800"
                        >
                          Privacy Policy
                        </button>.
                      </span>
                    </label>
                  </div>

                  {/* Error Banner */}
                  {errorMsg && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 rounded text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleGetAadhaarOtp}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded text-sm transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Get Aadhaar OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: OTP Verification */}
              {citizenStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded text-xs text-blue-900 dark:text-blue-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <span>OTP Sent Successfully</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Enter the 6-digit authentication code sent to mobile linked with Aadhaar <strong>{formatAadhaarNumber(aadhaarRaw)}</strong>.
                    </p>
                  </div>

                  {/* 6-Digit OTP Boxes */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Enter 6-Digit OTP <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center justify-between gap-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={otpRefs[idx]}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpInput(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
                          className="w-12 h-12 text-center text-lg font-black font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 dark:text-white"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resend OTP Bar */}
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
                    <button
                      type="button"
                      onClick={() => setCitizenStep(1)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-white underline cursor-pointer"
                    >
                      Change Aadhaar Number
                    </button>

                    {canResend ? (
                      <button
                        type="button"
                        onClick={() => {
                          setResendTimer(30);
                          setCanResend(false);
                          setShowSmsToast(true);
                        }}
                        className="text-blue-700 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <span>Resend OTP in <strong className="font-mono text-blue-700 dark:text-blue-400">{resendTimer}s</strong></span>
                    )}
                  </div>

                  {/* Error Banner */}
                  {errorMsg && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 rounded text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Verify Button */}
                  <button
                    type="button"
                    onClick={handleVerifyCitizenOtp}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-sm transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying e-KYC Credentials...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Enter Citizen Dashboard</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Official IT Act Security Callout Banner */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-3 rounded text-[11px] text-amber-900 dark:text-amber-300 space-y-0.5">
                <p className="font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Statutory Security Notice</span>
                </p>
                <p>
                  Unauthorized access to this government portal or falsification of electronic records is strictly prohibited and punishable under the Information Technology Act, 2000 and the Aadhaar Act, 2016.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: ADMIN LOGIN (OFFICIAL ADMINISTRATION ACCESS)                      */}
        {/* ========================================================================= */}
        {loginType === 'ADMIN' && (
          <div className="max-w-lg w-full mx-auto space-y-4 animate-fade-in">
            {/* Back to Portal Selector */}
            <button
              type="button"
              onClick={() => {
                setLoginType(null);
                setErrorMsg(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Portal Selection</span>
            </button>

            {/* Main Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 md:p-8 shadow-sm space-y-5 text-slate-900 dark:text-white">
              {/* Card Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                  Government Official Authorization
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Departmental Admin Sign In
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Access restricted to authorized Nodal Officers and System Administrators.
                </p>
              </div>

              {/* Fast Demo Officer Chips */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 block">
                  Quick Demo Officer Accounts (Click to Populate):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {DEMO_ADMINS.map((adm) => (
                    <button
                      key={adm.officerId}
                      type="button"
                      onClick={() => handleSelectAdminChip(adm.officerId)}
                      className={`px-2 py-1 rounded text-xs font-mono font-bold transition border cursor-pointer ${
                        adminUserId === adm.officerId
                          ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {adm.officerId} ({adm.role === 'SYSTEM_ADMIN' ? 'System Admin' : 'Dept Admin'})
                    </button>
                  ))}
                </div>
              </div>

              {/* Officer Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Designated Officer User ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminUserId}
                    onChange={(e) => {
                      setAdminUserId(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="e.g. dis123456 or jyo123456"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-slate-600 focus:border-transparent placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Departmental Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-slate-600 focus:border-transparent placeholder-slate-400"
                  />
                </div>

                {/* Captcha Box */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Security Captcha Code <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="border border-slate-300 dark:border-slate-600 rounded overflow-hidden shadow-inner bg-slate-100">
                      <canvas ref={adminCanvasRef} width={130} height={38} />
                    </div>
                    <button
                      type="button"
                      onClick={refreshAdminCaptcha}
                      title="Refresh Captcha"
                      className="p-2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      maxLength={6}
                      value={adminCaptchaInput}
                      onChange={(e) => {
                        setAdminCaptchaInput(e.target.value.toUpperCase());
                        setErrorMsg(null);
                      }}
                      placeholder="Enter Code"
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white font-mono text-sm uppercase focus:ring-2 focus:ring-slate-600 focus:border-transparent placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Official Compliance Checkbox */}
                <div className={`p-3 rounded border text-xs transition ${
                  adminComplianceAccepted 
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' 
                    : adminConsentShake 
                      ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 animate-shake' 
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
                }`}>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminComplianceAccepted}
                      onChange={(e) => {
                        if (e.target.checked) {
                          openLegalModal('terms', 'admin');
                        } else {
                          setAdminComplianceAccepted(false);
                          setSessionConsent(false);
                        }
                      }}
                      className="mt-0.5 w-4 h-4 accent-slate-800 cursor-pointer"
                    />
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed select-none">
                      I agree to the statutory government non-disclosure agreement and official compliance protocols under the Official Secrets Act and the DPDP Act 2023.
                    </span>
                  </label>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 rounded text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleAdminLogin}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded text-sm transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating Official Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Authenticate & Enter Administration Console</span>
                    </>
                  )}
                </button>
              </div>

              {/* Official IT Act Security Callout Banner */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-3 rounded text-[11px] text-amber-900 dark:text-amber-300 space-y-0.5">
                <p className="font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Statutory Security Notice</span>
                </p>
                <p>
                  Unauthorized access to this government portal is punishable under the Information Technology Act, 2000. All administrative sessions and IP traces are logged for national security auditing.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simulated SMS Toast Notification */}
      {showSmsToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-4 shadow-2xl animate-scale-up space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              <span>Govt SMS Gateway (AD-UIDAI)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowSmsToast(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            {GLOBAL_DEMO_OTP} is your UIDAI Aadhaar verification OTP for JanSetu login. Valid for 10 mins. Do not share with anyone.
          </p>
        </div>
      )}

      {/* Mandatory Double-Lock Legal Consent Modal */}
      <LegalConsentModal
        isOpen={legalModalState.isOpen}
        onClose={closeLegalModal}
        initialTab={legalModalState.type}
        role={legalModalState.role}
        onAccept={handleLegalModalAccepted}
      />
    </div>
  );
}
