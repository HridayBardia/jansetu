import React, { useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Compass, 
  Landmark, 
  MapPin, 
  FileText, 
  Briefcase, 
  Key, 
  Activity, 
  ShieldAlert, 
  Bell 
} from 'lucide-react';
import { useMockData } from '@/context/MockDataContext';
import { useLiveSync } from '@/context/LiveSyncContext';

export type TabState = 'planner' | 'schemes' | 'journeys' | 'documents' | 'applications' | 'consent' | 'interop' | 'conflicts' | 'alerts' | 'official';

interface CitizenNavTabsProps {
  activeTab: TabState;
  setActiveTab: (tab: TabState) => void;
  loadInteropData: () => void;
}

export const CitizenNavTabs: React.FC<CitizenNavTabsProps> = ({ activeTab, setActiveTab, loadInteropData }) => {
  const { t } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let targetScroll = container.scrollLeft;
    let isAnimating = false;

    const animateScroll = () => {
      container.scrollLeft += (targetScroll - container.scrollLeft) * 0.12;
      
      if (Math.abs(targetScroll - container.scrollLeft) > 0.5) {
        requestAnimationFrame(animateScroll);
      } else {
        isAnimating = false;
        container.scrollLeft = targetScroll;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        targetScroll = Math.max(0, Math.min(
          targetScroll + e.deltaY * 0.8,
          container.scrollWidth - container.clientWidth
        ));
        
        if (!isAnimating) {
          isAnimating = true;
          requestAnimationFrame(animateScroll);
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);
  
  const { 
    documents: mockDocs, 
    journeys: mockJourneys, 
    applications: mockApplications, 
    consents: mockConsents,
    alerts: mockAlerts
  } = useMockData();

  const { 
    applications: liveApps, 
    journeys: liveJourneys,
    consents: liveConsents, 
    notifications: liveNotifications,
    pendingKycRequest
  } = useLiveSync();

  const totalJourneysCount = liveJourneys.length;
  const totalAppsCount = liveApps.length;
  const activeConsentsCount = liveConsents.filter(c => c.status === 'ACTIVE').length;
  const pendingConsentsCount = liveConsents.filter(c => c.status === 'PENDING').length;
  const alertsCount = liveNotifications.filter(n => n.isNew).length + (pendingKycRequest ? 1 : 0);

  const getTabClass = (tabName: TabState) => {
    return `flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
      activeTab === tabName
        ? 'border-amber-500 text-amber-700 dark:text-amber-400 font-bold bg-amber-50/60 dark:bg-amber-950/30'
        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/40 rounded-t'
    }`;
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="hidden md:flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-px shrink-0 tab-scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style dangerouslySetInnerHTML={{ __html: `.tab-scrollbar-hide::-webkit-scrollbar { display: none; }` }} />
      
      <button onClick={() => setActiveTab('planner')} className={getTabClass('planner')}>
        <Compass className="w-4 h-4" />
        <span>{t('nav.goalPlanner', 'Goal Planner')}</span>
      </button>

      <button onClick={() => setActiveTab('schemes')} className={getTabClass('schemes')}>
        <Landmark className="w-4 h-4" />
        <span>{t('nav.welfareSchemes', 'Schemes & Benefits')}</span>
      </button>

      <button onClick={() => setActiveTab('journeys')} className={getTabClass('journeys')}>
        <MapPin className="w-4 h-4" />
        <span>{t('nav.activeJourneys', 'Active Journeys')}</span>
        {totalJourneysCount > 0 && (
          <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
            {totalJourneysCount}
          </span>
        )}
      </button>

      <button onClick={() => setActiveTab('documents')} className={getTabClass('documents')}>
        <FileText className="w-4 h-4" />
        <span>{t('nav.documentsVault', 'Document Vault')}</span>
        {mockDocs.length > 0 && (
          <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
            {mockDocs.length}
          </span>
        )}
      </button>

      <button onClick={() => { setActiveTab('applications'); loadInteropData(); }} className={getTabClass('applications')}>
        <Briefcase className="w-4 h-4" />
        <span>{t('nav.myApplications', 'My Applications')}</span>
        {totalAppsCount > 0 && (
          <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
            {totalAppsCount}
          </span>
        )}
      </button>

      <button onClick={() => { setActiveTab('conflicts'); loadInteropData(); }} className={getTabClass('conflicts')}>
        <ShieldAlert className="w-4 h-4" />
        <span>{t('nav.checkMyInformation', 'Check My Information')}</span>
        <span className="bg-emerald-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
          {t('check_info.perfectMatch', '100% Match')}
        </span>
      </button>

      <button onClick={() => { setActiveTab('consent'); loadInteropData(); }} className={getTabClass('consent')}>
        <Key className="w-4 h-4" />
        <span>{t('nav.yourDataConsent', 'Your Data & Consent')}</span>
        {pendingConsentsCount > 0 ? (
          <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1 animate-pulse">
            {pendingConsentsCount} {t('common.pending', 'Pending')}
          </span>
        ) : activeConsentsCount > 0 ? (
          <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
            {activeConsentsCount}
          </span>
        ) : null}
      </button>

      <button onClick={() => { setActiveTab('interop'); loadInteropData(); }} className={getTabClass('interop')}>
        <Activity className="w-4 h-4" />
        <span>{t('nav.govInteropHub', 'Gov Interop Hub')}</span>
      </button>

      <button onClick={() => setActiveTab('alerts')} className={getTabClass('alerts')}>
        <Bell className="w-4 h-4" />
        <span>{t('nav.alertsEvents', 'Alerts & Events')}</span>
        {alertsCount > 0 && (
          <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
            {alertsCount}
          </span>
        )}
      </button>
    </div>
  );
};
export default CitizenNavTabs;
