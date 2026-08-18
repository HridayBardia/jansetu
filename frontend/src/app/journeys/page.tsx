'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Journey } from '@/types';
import { fetchJourneysAPI } from '@/lib/api';
import { ActiveJourneysCard } from '@/components/ActiveJourneysCard';

export default function JourneysPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);

  useEffect(() => {
    fetchJourneysAPI().then((data) => setJourneys(data));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">
            Your Active Citizen Journeys
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track, complete, and manage your step-by-step government workflows
          </p>
        </div>
      </div>

      <ActiveJourneysCard journeys={journeys} />
    </div>
  );
}
