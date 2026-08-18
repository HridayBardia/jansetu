'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, User, Lock, ArrowRight, Loader2, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onClose }) => {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

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

  const handleLogin = async () => {
    const pin = pinDigits.join('');
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername || trimmedUsername.length < 4) {
      setErrorMsg('Please enter a valid username (min 4 characters).');
      return;
    }
    if (pin.length < 6) {
      setErrorMsg('Please enter your complete 6-digit PIN.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await login(trimmedUsername, pin);
      if (res && res.user) {
        onSuccess?.();
        onClose?.();
        router.replace('/dashboard');
      } else {
        setErrorMsg('Invalid username or PIN. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
        <h2 className="text-lg font-bold text-slate-100">Citizen Login</h2>
        <p className="text-slate-400 text-xs mt-1">Enter your username and PIN</p>
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
        <label className="block text-slate-400 text-xs font-medium mb-2">Username</label>
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="modal-login-username"
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value.toLowerCase()); setErrorMsg(null); }}
            onKeyDown={e => e.key === 'Enter' && pinRefs[0]?.current?.focus()}
            placeholder="your_username"
            autoComplete="username"
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-3 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
          />
        </div>
      </div>

      {/* PIN */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-slate-400 text-xs font-medium">6-Digit PIN</label>
          <button
            onClick={() => setShowPin(!showPin)}
            className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-xs transition"
          >
            {showPin ? <EyeOff size={12} /> : <Eye size={12} />}
            <span>{showPin ? 'Hide' : 'Show'}</span>
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
              className={`w-full max-w-[40px] min-w-0 h-11 text-center text-lg font-bold bg-slate-800 border rounded-lg text-slate-100 outline-none transition ${
                digit ? 'border-blue-500/60' : 'border-slate-700'
              } focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20`}
            />
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        id="modal-login-submit-btn"
        onClick={handleLogin}
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:from-blue-900 disabled:to-violet-900 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/20"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Verifying...</span>
          </>
        ) : (
          <>
            <Lock size={15} />
            <span>Sign In</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </div>
  );
};

export default LoginForm;
