'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'CITIZEN' | 'ADMIN';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'CITIZEN' 
}) => {
  const { 
    isLoading, 
    isCitizenAuthenticated, 
    isAdminAuthenticated, 
    isAuthenticated 
  } = useAuth();
  const router = useRouter();

  const hasAccess = requiredRole === 'ADMIN' ? isAdminAuthenticated : isCitizenAuthenticated || isAuthenticated;

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      if (requiredRole === 'ADMIN') {
        router.replace('/login');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, hasAccess, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#133E87]" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
