'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, User, ArrowRight, Loader2, RefreshCw, AlertCircle, CheckCircle2, PhoneCall } from 'lucide-react';

declare global {
  interface Window {
    initSendOTP?: (config: any) => void;
    sendOtp?: (identifier: string, success: (data: any) => void, failure: (error: any) => void) => void;
    verifyOtp?: (otp: string, success: (data: any) => void, failure: (error: any) => void) => void;
    retryOtp?: (channel: string | null, success: (data: any) => void, failure: (error: any) => void, reqId?: string | null) => void;
    isCaptchaVerified?: () => boolean;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, requestOtp, verifyOtp, devOtpNotice } = useAuth();

  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reqId, setReqId] = useState<string | null>(null);

  // Resend cooldown timer
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

  // Load MSG91 OTP Provider Widget script on mount
  useEffect(() => {
    const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '366872725377313536323534';
    const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || '';

    const script = document.createElement('script');
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.onload = () => {
      if (window.initSendOTP) {
        window.initSendOTP({
          widgetId: widgetId,
          tokenAuth: tokenAuth,
          identifier: '',
          exposeMethods: true,
          captchaRenderId: 'msg91-captcha',
          success: (data: any) => {
            if (data?.reqId) {
              setReqId(data.reqId);
            }
          },
          failure: (error: any) => {
            console.error('MSG91 Widget Initialization Error:', error);
          }
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  // Cooldown Timer
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

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setErrorMsg('Please enter a valid Indian mobile number.');
      return;
    }

    // MSG91 Identifier format: 917016918865 (no + symbol)
    const formattedIdentifier = `91${cleanMobile.slice(-10)}`;

    console.log("MSG91 widget loaded:", typeof window.sendOtp);
    console.log("Captcha verified:", typeof window.isCaptchaVerified === 'function' ? window.isCaptchaVerified() : false);
    console.log("Identifier:", formattedIdentifier.replace(/\d(?=\d{4})/g, "*"));

    // Verify Captcha if rendered
    if (typeof window.isCaptchaVerified === 'function' && !window.isCaptchaVerified()) {
      setErrorMsg('Please complete the verification before continuing.');
      return;
    }

    setIsSubmitting(true);

    // If MSG91 widget sendOtp method is available, use it directly
    if (typeof window.sendOtp === 'function') {
      window.sendOtp(
        formattedIdentifier,
        (data: any) => {
          console.log("MSG91 SEND OTP SUCCESS:", {
            callbackType: 'success',
            status: data?.type || 'success',
            reqId: data?.reqId,
            message: data?.message,
            response: data,
            timestamp: new Date().toISOString()
          });
          setIsSubmitting(false);
          if (data?.reqId) {
            setReqId(data.reqId);
          }
          setStep('OTP');
          setCountdown(60);
          setCanResend(false);
          setTimeout(() => otpInputRefs[0].current?.focus(), 100);
        },
        (error: any) => {
          console.error("MSG91 SEND OTP FAILURE:", {
            callbackType: 'failure',
            status: error?.type || 'failure',
            errorCode: error?.code,
            errorMessage: error?.message,
            response: error,
            timestamp: new Date().toISOString()
          });
          setIsSubmitting(false);
          setErrorMsg("We couldn't send the verification code. Please try again.");
        }
      );
    } else {
      // Direct API fallback via backend request
      try {
        await requestOtp(fullName.trim(), cleanMobile);
        setStep('OTP');
        setCountdown(60);
        setCanResend(false);
        setTimeout(() => otpInputRefs[0].current?.focus(), 100);
      } catch (err: any) {
        setErrorMsg("We couldn't send the verification code. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOtpDigitChange = async (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }

    const currentOtp = newDigits.join('');
    if (currentOtp.length === 6) {
      await triggerVerifyOtp(fullName.trim(), mobileNumber.replace(/\D/g, ''), currentOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i];
      }
      setOtpDigits(newDigits);
      
      const currentOtp = newDigits.join('');
      if (currentOtp.length === 6) {
        await triggerVerifyOtp(fullName.trim(), mobileNumber.replace(/\D/g, ''), currentOtp);
      } else {
        const nextFocus = Math.min(pastedData.length, 5);
        otpInputRefs[nextFocus].current?.focus();
      }
    }
  };

  const triggerVerifyOtp = async (name: string, mobile: string, code: string) => {
    setErrorMsg(null);
    setIsSubmitting(true);

    const completeBackendVerification = async () => {
      try {
        await verifyOtp(name, mobile, code);
        router.push('/dashboard');
      } catch (err: any) {
        setErrorMsg('The verification code is incorrect.');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (typeof window.verifyOtp === 'function') {
      window.verifyOtp(
        code,
        async (data: any) => {
          await completeBackendVerification();
        },
        (error: any) => {
          setIsSubmitting(false);
          setErrorMsg('The verification code is incorrect.');
        }
      );
    } else {
      await completeBackendVerification();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    if (typeof window.retryOtp === 'function') {
      window.retryOtp(
        null,
        (data: any) => {
          setIsSubmitting(false);
          setCountdown(60);
          setCanResend(false);
          setOtpDigits(['', '', '', '', '', '']);
          otpInputRefs[0].current?.focus();
        },
        (error: any) => {
          setIsSubmitting(false);
          setErrorMsg("We couldn't send the verification code. Please try again.");
        },
        reqId
      );
    } else {
      try {
        const cleanMobile = mobileNumber.replace(/\D/g, '');
        await requestOtp(fullName.trim(), cleanMobile);
        setCountdown(60);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        otpInputRefs[0].current?.focus();
      } catch (err: any) {
        setErrorMsg("We couldn't send the verification code. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getMaskedMobileNumber = () => {
    const clean = mobileNumber.replace(/\D/g, '');
    if (clean.length >= 4) {
      const lastFour = clean.slice(-4);
      return `+91 ••••••${lastFour}`;
    }
    return `+91 ••••••${clean}`;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            AI CITIZEN JOURNEY ENGINE
          </h2>
          <p className="text-slate-400 text-xs">
            Your government journey, simplified.
          </p>
        </div>

        {/* Development Mode Notice if active */}
        {devOtpNotice && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center gap-2 text-xs text-amber-200 font-semibold animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{devOtpNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex flex-col items-center gap-3 text-xs text-rose-300 text-center">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {step === 'DETAILS' && (
              <button
                type="button"
                onClick={handleSendOtp}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider"
              >
                Try Again
              </button>
            )}
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
                  placeholder="Enter your full name"
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
                  placeholder="Enter mobile number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-14 pr-4 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 tracking-wider font-mono"
                />
              </div>
            </div>

            {/* MSG91 Captcha Container */}
            <div id="msg91-captcha" className="flex justify-center my-2"></div>

            <button
              type="submit"
              disabled={isSubmitting || !fullName.trim() || mobileNumber.length < 10}
              className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>VERIFY YOUR MOBILE</span>
              </div>
              <h3 className="text-sm font-bold text-white">Enter SMS Code</h3>
              <p className="text-xs text-slate-400">
                We sent a verification code to
              </p>
              <p className="font-semibold text-amber-300 text-sm tracking-wide">
                {getMaskedMobileNumber()}
              </p>
            </div>

            {/* 6 OTP Input Boxes */}
            <div className="flex justify-center gap-2.5 my-4">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpInputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className="w-11 h-12 bg-slate-950 border border-slate-800 focus:border-amber-500/80 rounded-xl text-center text-lg font-bold text-amber-300 focus:ring-1 focus:ring-amber-500/80 focus:outline-none transition"
                />
              ))}
            </div>

            <div className="text-center">
              {isSubmitting && (
                <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Verifying Code...</span>
                </span>
              )}
            </div>

            {/* Countdown / Resend */}
            <div className="flex items-center justify-between text-xs pt-1 text-slate-400 border-t border-slate-800/80 mt-2">
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
          </div>
        )}
      </div>
    </div>
  );
}
