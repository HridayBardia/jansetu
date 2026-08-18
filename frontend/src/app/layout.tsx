'use client';

import React, { useState } from 'react';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/LoginForm';
import { OnboardingModal } from '@/components/OnboardingModal';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AppContent({ children, sandboxMode, setSandboxMode }: { children: React.ReactNode; sandboxMode: boolean; setSandboxMode: (val: boolean) => void }) {
  const { isAuthModalOpen, closeAuthModal, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading) {
      const protectedRoutes = ['/dashboard', '/journeys', '/alerts', '/help', '/privacy', '/admin'];
      const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
      if (isProtected && !isAuthenticated) {
        router.replace('/login');
      }
      if (pathname === '/login' && isAuthenticated) {
        router.replace('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }


  return (
    <>
      <Navbar
        sandboxMode={sandboxMode}
        setSandboxMode={setSandboxMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 mb-20 md:mb-10">
        {children}
      </main>

      {/* Global Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <LoginForm onClose={closeAuthModal} />
        </div>
      )}

      {/* Global Onboarding Modal */}
      <OnboardingModal />

      <footer className="hidden md:block bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © 2026 AI Citizen Journey Engine • Official Government Services Navigator
          </p>
          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <span>Arbitrary Mobile OTP Auth Active</span>
            <span>•</span>
            <span className="text-amber-400">Production Ready Architecture</span>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sandboxMode, setSandboxMode] = useState(true);

  return (
    <html lang="en" className="dark">
      <head>
        <title>AI Citizen Journey Engine | Government Made Simpler</title>
        <meta name="description" content="Production-Ready OTP Authentication + Citizen Document Vault + AI Journey Retrieval." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen">
        <LanguageProvider>
          <AuthProvider>
            <AppContent sandboxMode={sandboxMode} setSandboxMode={setSandboxMode}>
              {children}
            </AppContent>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}


