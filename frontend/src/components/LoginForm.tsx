'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, User, Lock, ArrowRight, Loader2, X, AlertCircle, Eye, EyeOff, FileText, CheckCircle2 } from 'lucide-react';
import TermsConsentModal, { storeConsent } from '@/components/TermsConsentModal';
import { LegalModal } from '@/components/LegalModal';

interface LoginFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onClose }) => {
  const router = useRouter();
  const { login, setSessionConsent } = useAuth();
  const { t } = useLanguage();

  const [username, setUsername] = useState('');
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Consent state
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [legalModalState, setLegalModalState] = useState<{
    isOpen: boolean;
    type: 'terms' | 'privacy';
  }>({
    isOpen: false,
    type: 'terms',
  });

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Consent always starts as false for new login sessions - do NOT restore from localStorage

  const handlePinInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = digit;
    setPinDigits(newDigits);
    setErrorMsg(null);
    if (digit && index < 5) {
      pinRefs[index + 1]?.current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinRefs[index - 1]?.current?.focus();
    }
    if (e.key === 'Enter') handleLogin();
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
    setPinDigits(newDigits);
    pinRefs[Math.min(pasted.length, 5)]?.current?.focus();
  };

  // Terms consent acceptance handler - session-level only
  const handleTermsAccept = () => {
    storeConsent('citizen'); // Store for audit trail
    setConsentAccepted(true);
    setSessionConsent(true); // Mark session consent as accepted
    setLegalModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleLogin = async () => {
    const pin = pinDigits.join('');
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername || trimmedUsername.length < 4) {
      setErrorMsg(t('auth.enterUsername'));
      return;
    }
    if (pin.length < 6) {
      setErrorMsg(t('auth.enterPin'));
      return;
    }
    if (!consentAccepted) {
      setErrorMsg(t('auth.acceptTermsFirst'));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await login(trimmedUsername, pin);
      if (res && res.user) {
        onSuccess?.();
        onClose?.();
        if (res.user.role === 'ADMIN' || res.user.role === 'admin' || res.user.role === 'SYSTEM_ADMIN') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/citizen/dashboard');
        }
      } else {
        setErrorMsg(t('auth.invalidCredentials'));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl p-7 w-full max-w-sm shadow-2xl">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
            <ShieldCheck size={24} color="white" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">{t('auth.citizenLogin')}</h2>
          <p className="text-slate-400 text-xs mt-1">{t('auth.enterUsernamePin')}</p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-300 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Username */}
        <div className="mb-4">
          <label className="block text-slate-400 text-xs font-medium mb-2">{t('auth.username')}</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
            <input
              id="modal-login-username"
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value.toLowerCase()); setErrorMsg(null); }}
              onKeyDown={e => e.key === 'Enter' && pinRefs[0]?.current?.focus()}
              placeholder={t('auth.username')}
              autoComplete="off"
              autoFocus
              className="w-full bg-slate-900/80 border-[1.5px] border-blue-500/45 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 text-sm placeholder-slate-500 shadow-[0_0_12px_rgba(59,130,246,0.15)] focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/40 focus:shadow-[0_0_16px_rgba(59,130,246,0.35)] transition-all"
            />
          </div>
        </div>

        {/* PIN */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-400 text-xs font-medium">{t('auth.sixDigitPin')}</label>
            <button
              onClick={() => setShowPin(!showPin)}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs font-medium transition"
            >
              {showPin ? <EyeOff size={12} /> : <Eye size={12} />}
              <span>{showPin ? t('auth.hide') : t('auth.show')}</span>
            </button>
          </div>
          <div className="flex gap-2 justify-center">
            {pinDigits.map((digit, i) => (
              <input
                key={i}
                ref={pinRefs[i]}
                id={`modal-pin-digit-${i}`}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handlePinInput(i, e.target.value)}
                onKeyDown={e => handlePinKeyDown(i, e)}
                onPaste={handlePinPaste}
                className={`w-full max-w-[42px] min-w-0 h-11 text-center text-lg font-bold rounded-xl text-slate-100 outline-none transition-all border-[1.5px] ${
                  digit
                    ? 'border-blue-400 bg-blue-600/20 shadow-[0_0_14px_rgba(59,130,246,0.35)]'
                    : 'border-blue-500/45 bg-slate-900/80 shadow-[0_0_10px_rgba(59,130,246,0.12)]'
                } focus:border-blue-400 focus:ring-1 focus:ring-blue-400/40 focus:shadow-[0_0_18px_rgba(59,130,246,0.45)]`}
              />
            ))}
          </div>
        </div>

        {/* ===== DYNAMIC TERMS & PRIVACY CONSENT CHECKBOX ===== */}
        <div className="mb-4">
          <div
            onClick={() => setLegalModalState({ isOpen: true, type: 'terms' })}
            className={`w-full p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 cursor-pointer ${
              consentAccepted
                ? 'border-emerald-500 bg-emerald-500/20 focus-within:ring-2 focus-within:ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'border-red-500 bg-red-500/10 ring-1 ring-red-500/60 focus-within:ring-2 focus-within:ring-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
            }`}
          >
            <input
              type="checkbox"
              checked={consentAccepted}
              readOnly
              className={`mt-0.5 w-4.5 h-4.5 rounded pointer-events-none transition ${
                consentAccepted 
                  ? 'accent-emerald-500 text-emerald-500' 
                  : 'accent-red-500'
              }`}
            />
            <span className="text-slate-300 text-xs leading-relaxed select-none">
              I agree to the{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLegalModalState({ isOpen: true, type: 'terms' });
                }}
                className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4 decoration-blue-500/60 transition-colors cursor-pointer"
              >
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLegalModalState({ isOpen: true, type: 'privacy' });
                }}
                className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4 decoration-emerald-500/60 transition-colors cursor-pointer"
              >
                Privacy Policy
              </a>
            </span>
          </div>
        </div>

        {/* Submit - DISABLED without consent */}
        <button
          id="modal-login-submit-btn"
          onClick={handleLogin}
          disabled={isSubmitting || !consentAccepted}
          className={`w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg ${
            (isSubmitting || !consentAccepted)
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-blue-500/20'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>{t('auth.verifying')}</span>
            </>
          ) : (
            <>
              <Lock size={15} />
              <span>{t('auth.signIn')}</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>

        {/* Consent hint */}
        {!consentAccepted && (
          <p className="text-slate-500 text-xs text-center mt-2.5">
            {t('auth.acceptTermsHint')}
          </p>
        )}
      </div>

      {/* Accessible Legal Policy Modal (Terms vs Privacy) */}
      <LegalModal
        isOpen={legalModalState.isOpen}
        onClose={() => setLegalModalState(prev => ({ ...prev, isOpen: false }))}
        type={legalModalState.type}
        role="citizen"
        onAccept={() => {
          storeConsent('citizen');
          setConsentAccepted(true);
          setSessionConsent(true);
          setErrorMsg(null);
        }}
      />
    </>
  );
};

export default LoginForm;
