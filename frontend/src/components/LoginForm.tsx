'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Phone, User, ArrowRight, Loader2, RefreshCw, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onClose }) => {
  const { requestOtp, verifyOtp, devOtpNotice } = useAuth();

  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer state
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestOtp(fullName.trim(), cleanMobile);
      setStep('OTP');
      setCountdown(60);
      setCanResend(false);
      setTimeout(() => otpInputRefs[0].current?.focus(), 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send verification code. Please check your number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i];
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pastedData.length, 5);
      otpInputRefs[nextFocus].current?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      await verifyOtp(fullName.trim(), cleanMobile, enteredOtp);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      await requestOtp(fullName.trim(), cleanMobile);
      setCountdown(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs[0].current?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Welcome to Citizen Journey
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          Your personalized gateway to government services, schemes and documents.
        </p>
      </div>

      {/* Development OTP Banner */}
      {devOtpNotice && (
        <div className="mb-4 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center gap-2 text-xs text-amber-200 font-semibold animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{devOtpNotice}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {step === 'DETAILS' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Hriday Bardia"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Mobile Number
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 font-semibold text-sm select-none">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="70169 18865"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-14 pr-4 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 tracking-wider font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Any valid 10-digit Indian mobile number works for authentication.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !fullName.trim() || mobileNumber.length < 10}
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending OTP Code...</span>
              </>
            ) : (
              <>
                <span>Send OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="text-center">
            <span className="text-xs text-slate-400">
              We sent a 6-digit verification code to
            </span>
            <div className="font-semibold text-amber-300 text-sm mt-0.5 flex items-center justify-center gap-1.5">
              <span>+91 {mobileNumber}</span>
              <button
                type="button"
                onClick={() => setStep('DETAILS')}
                className="text-[11px] text-slate-400 hover:text-white underline font-normal"
              >
                Change
              </button>
            </div>
          </div>

          {/* 6 OTP Boxes */}
          <div className="flex justify-center gap-2 sm:gap-2.5 my-4">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={otpInputRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={handleOtpPaste}
                className="w-10 h-12 sm:w-11 sm:h-12 bg-slate-950 border border-slate-800 focus:border-amber-500/80 rounded-xl text-center text-lg font-bold text-amber-300 focus:ring-1 focus:ring-amber-500/80 focus:outline-none transition"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otpDigits.join('').length < 6}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>

          {/* Countdown & Resend */}
          <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
            {countdown > 0 ? (
              <span>Resend OTP in <strong className="text-amber-400 font-mono">{countdown}s</strong></span>
            ) : (
              <span>Didn't receive the code?</span>
            )}

            <button
              type="button"
              disabled={!canResend || isSubmitting}
              onClick={handleResendOtp}
              className="text-amber-400 hover:text-amber-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 underline"
            >
              <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>Resend OTP</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
