'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, User, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login } = useAuth();

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

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2e 50%, #0a1628 100%)' }}>
        <Loader2 size={40} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

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
    if (e.key === 'Backspace') {
      if (!pinDigits[index] && index > 0) {
        pinRefs[index - 1]?.current?.focus();
      }
    }
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setPinDigits(newDigits);
    // Focus the last filled digit or last input
    const focusIndex = Math.min(pasted.length, 5);
    pinRefs[focusIndex]?.current?.focus();
  };

  const handleLogin = async () => {
    const pin = pinDigits.join('');
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      setErrorMsg('Please enter your username.');
      return;
    }
    if (trimmedUsername.length < 4) {
      setErrorMsg('Username must be at least 4 characters.');
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
        router.replace('/dashboard');
      } else {
        setErrorMsg('Invalid username or PIN. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #050510 0%, #0a1628 50%, #081220 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient background effects */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(24px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.05)',
        padding: '40px 36px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(59,130,246,0.3)'
          }}>
            <ShieldCheck size={32} color="white" />
          </div>
          <h1 style={{
            fontSize: '24px', fontWeight: 700,
            background: 'linear-gradient(to right, #e2e8f0, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: '0 0 8px'
          }}>
            Citizen Login
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
            AI Citizen Journey Engine
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            animation: 'slideIn 0.2s ease'
          }}>
            <AlertCircle size={16} color="#ef4444" style={{ marginTop: '1px', flexShrink: 0 }} />
            <p style={{ color: '#fca5a5', fontSize: '14px', margin: 0, lineHeight: '1.4' }}>{errorMsg}</p>
          </div>
        )}

        {/* Username Field */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '8px', letterSpacing: '0.02em' }}>
            Username
          </label>
          <div style={{ position: 'relative' }}>
            <User size={16} color="#475569" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value.toLowerCase()); setErrorMsg(null); }}
              onKeyDown={e => e.key === 'Enter' && pinRefs[0]?.current?.focus()}
              placeholder="Enter your username"
              autoComplete="username"
              autoFocus
              style={{
                width: '100%',
                padding: '13px 14px 13px 40px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#e2e8f0',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(59,130,246,0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* PIN Field */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, letterSpacing: '0.02em' }}>
              6-Digit PIN
            </label>
            <button
              onClick={() => setShowPin(!showPin)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            >
              {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showPin ? 'Hide' : 'Show'}</span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {pinDigits.map((digit, i) => (
              <input
                key={i}
                ref={pinRefs[i]}
                id={`pin-digit-${i}`}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handlePinInput(i, e.target.value)}
                onKeyDown={e => handlePinKeyDown(i, e)}
                onPaste={handlePinPaste}
                style={{
                  flex: 1,
                  height: '52px',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${digit ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '10px',
                  color: '#e2e8f0',
                  outline: 'none',
                  transition: 'all 0.2s',
                  caretColor: '#3b82f6',
                  fontFamily: 'inherit'
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(59,130,246,0.7)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = digit ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            ))}
          </div>
        </div>

        {/* Login Button */}
        <button
          id="login-submit-btn"
          onClick={handleLogin}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '14px',
            background: isSubmitting
              ? 'rgba(59,130,246,0.4)'
              : 'linear-gradient(135deg, #2563eb, #7c3aed)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '15px',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(59,130,246,0.3)',
            fontFamily: 'inherit'
          }}
          onMouseEnter={e => { if (!isSubmitting) (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'none'; }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Verifying...
            </>
          ) : (
            <>
              <Lock size={16} />
              Sign In to Citizen Portal
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Footer Note */}
        <p style={{ textAlign: 'center', color: '#334155', fontSize: '12px', marginTop: '24px', lineHeight: '1.5' }}>
          This is a secured demonstration system.
          <br />Contact your administrator to obtain credentials.
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        input::placeholder { color: #334155; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px rgba(15,23,42,0.95) inset !important;
          -webkit-text-fill-color: #e2e8f0 !important;
        }
      `}</style>
    </div>
  );
}
