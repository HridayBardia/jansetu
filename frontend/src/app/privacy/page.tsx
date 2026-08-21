'use client';
 
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard?tab=consent');
  }, [router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
    </div>
  );
}
