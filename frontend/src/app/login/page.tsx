'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, User, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, Building, Users, CheckCircle2, FileText } from 'lucide-react';
import TermsConsentModal, { storeConsent } from '@/components/TermsConsentModal';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, setSessionConsent, sessionConsentAccepted } = useAuth();

  const [loginType, setLoginType] = useState<'CITIZEN' | 'ADMIN' | null>(null);
  
  const [username, setUsername] = useState('');
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Consent state — always starts false for every new login session
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Redirect if already authenticated AND has session consent
  useEffect(() => {
    if (!isLoading && isAuthenticated && sessionConsentAccepted && user) {
      if (user.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/citizen/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, sessionConsentAccepted, user, router]);

  // Consent always starts as false for new login sessions — do NOT restore from localStorage

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

  // Terms consent acceptance handler — session-level only
  const handleTermsAccept = () => {
    const role = loginType === 'CITIZEN' ? 'citizen' : 'admin';
    storeConsent(role); // Store for audit trail
    setConsentAccepted(true);
    setSessionConsent(true); // Mark session consent as accepted
    setShowTermsModal(false);
  };

  // Open terms modal
  const handleTermsClick = () => {
    setShowTermsModal(true);
  };

  const handleLogin = async () => {
    const pin = pinDigits.join('');
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      setErrorMsg('Please enter your username.');
      return;
    }
    if (pin.length < 6) {
      setErrorMsg('Please enter your complete 6-digit PIN.');
      return;
    }
    if (!consentAccepted) {
      setErrorMsg('Please accept the Terms & Conditions before logging in.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await login(trimmedUsername, pin);
      if (res && res.user) {
        if (res.user.role === 'ADMIN' || res.user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/citizen/dashboard');
        }
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

  const termsRole = loginType === 'ADMIN' ? 'admin' : 'citizen';

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

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: loginType ? '420px' : '500px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(24px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.05)',
        padding: '40px 36px',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.3s ease'
      }}>
        {/* Header */}
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
            fontSize: '26px', fontWeight: 800,
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: '0 0 8px',
            letterSpacing: '0.05em'
          }}>
            JANSETU
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', fontWeight: 500, margin: '0 0 4px', letterSpacing: '0.1em' }}>
            PAN-INDIA AI NAVIGATOR
          </p>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
            "One citizen. One journey. Connected government."
          </p>
        </div>

        {/* State 1: Select Login Type */}
        {!loginType && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 600, marginBottom: '20px', textAlign: 'center' }}>
              Select Login Type
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                onClick={() => setLoginType('CITIZEN')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '20px', borderRadius: '16px', cursor: 'pointer',
                  transition: 'all 0.2s', textAlign: 'left'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                <div style={{ background: 'rgba(59,130,246,0.2)', padding: '12px', borderRadius: '12px' }}>
                  <Users size={24} color="#60a5fa" />
                </div>
                <div>
                  <h3 style={{ color: '#f8fafc', margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>Citizen Portal</h3>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>Access your documents, journeys, and services.</p>
                </div>
              </button>

              <button 
                onClick={() => setLoginType('ADMIN')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '20px', borderRadius: '16px', cursor: 'pointer',
                  transition: 'all 0.2s', textAlign: 'left'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                <div style={{ background: 'rgba(139,92,246,0.2)', padding: '12px', borderRadius: '12px' }}>
                  <Building size={24} color="#a78bfa" />
                </div>
                <div>
                  <h3 style={{ color: '#f8fafc', margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>Government Administration</h3>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>System monitoring, audit logs, and analytics.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* State 2: Login Form */}
        {loginType && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <button 
              onClick={() => { setLoginType(null); setErrorMsg(null); setUsername(''); setPinDigits(['','','','','','']); setConsentAccepted(false); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px', padding: 0 }}
            >
              ← Back to role selection
            </button>

            <h2 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 600, marginBottom: '20px', textAlign: 'center' }}>
              {loginType === 'CITIZEN' ? 'Citizen Login' : 'Admin Login'}
            </h2>


            {/* Error Banner */}
            {errorMsg && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px',
                padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px'
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
                  autoComplete="off"
                  style={{
                    width: '100%', padding: '13px 14px 13px 40px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0',
                    fontSize: '15px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            {/* PIN Field */}
            <div style={{ marginBottom: '20px' }}>
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
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {pinDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={pinRefs[i]}
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinInput(i, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(i, e)}
                    style={{
                      width: '45px', height: '52px', textAlign: 'center', fontSize: '20px', fontWeight: 600,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px', color: '#fff', outline: 'none', transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ===== TERMS & CONDITIONS CONSENT LINE ===== */}
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={handleTermsClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${consentAccepted ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  background: consentAccepted ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseOver={(e) => {
                  if (!consentAccepted) {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = consentAccepted ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = consentAccepted ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)';
                }}
              >
                {consentAccepted ? (
                  <CheckCircle2 size={16} color="#22c55e" style={{ flexShrink: 0 }} />
                ) : (
                  <FileText size={16} color="#64748b" style={{ flexShrink: 0 }} />
                )}
                <span style={{
                  color: consentAccepted ? '#22c55e' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}>
                  {consentAccepted ? (
                    '✓ Terms & Conditions accepted'
                  ) : (
                    <>By continuing, you agree to the{' '}
                      <span style={{ color: '#60a5fa', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                        Terms & Conditions
                      </span>
                      {' '}and Privacy & Data Consent.
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Login Button - DISABLED without consent */}
            <button
              onClick={handleLogin}
              disabled={isSubmitting || !consentAccepted}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: (isSubmitting || !consentAccepted)
                  ? 'rgba(255,255,255,0.05)'
                  : 'linear-gradient(135deg, #2563eb, #4f46e5)',
                color: (isSubmitting || !consentAccepted) ? '#475569' : 'white',
                fontSize: '15px', fontWeight: 600,
                cursor: (isSubmitting || !consentAccepted) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: (isSubmitting || !consentAccepted) ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Login Securely'}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>

            {/* Consent required hint when not accepted */}
            {!consentAccepted && (
              <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginTop: '10px', marginBottom: 0 }}>
                Please accept the Terms & Conditions to enable login.
              </p>
            )}
            
            {loginType === 'CITIZEN' && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                  <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                </div>
                <button
                  onClick={() => {
                    // DigiLocker SSO button — also requires consent
                    if (!consentAccepted) {
                      setErrorMsg('Please accept the Terms & Conditions before using DigiLocker SSO.');
                      return;
                    }
                    // Mock Federated SSO - autofill demo credentials
                    setUsername('hriday');
                    const pin = '123456';
                    setPinDigits(pin.split(''));
                    setTimeout(() => {
                      handleLogin();
                    }, 500);
                  }}
                  disabled={isSubmitting}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)', color: '#e2e8f0',
                    fontSize: '14px', fontWeight: 500, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/fb/DigiLocker_Logo.png" alt="DigiLocker" style={{ height: '20px', objectFit: 'contain' }} onError={(e) => {e.currentTarget.style.display = 'none'}} />
                  <span>Sign in via DigiLocker (Federated SSO)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Terms & Conditions Modal */}
      <TermsConsentModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleTermsAccept}
        role={termsRole}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
