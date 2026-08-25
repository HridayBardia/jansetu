'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, MapPin, Briefcase, Calendar, DollarSign, ArrowRight, Loader2, X } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { user, profile, updateProfile, isOnboardingModalOpen, closeOnboardingModal } = useAuth();
  const { t } = useLanguage();

  const [state, setState] = useState(profile?.location_state || 'Gujarat');
  const [city, setCity] = useState(profile?.location_city || 'Vadodara');
  const [occupation, setOccupation] = useState(profile?.occupation || 'Entrepreneur / Business');
  const [income, setIncome] = useState<string>('350000');
  const [dob, setDob] = useState(profile?.date_of_birth || '2001-08-15');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOnboardingModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile({
        location_state: state,
        location_city: city,
        location_district: city,
        occupation: occupation,
        annual_income: parseFloat(income) || 0,
        date_of_birth: dob
      });
      closeOnboardingModal();
    } catch {
      closeOnboardingModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative animate-fade-in">
        <button
          onClick={closeOnboardingModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('onboarding.welcome')}, {user?.full_name || t('dashboard.citizen')}!</span>
          </div>
          <h2 className="text-xl font-bold text-white">{t('onboarding.personalize')}</h2>
          <p className="text-xs text-slate-400">
            {t('onboarding.tellAbout')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {t('onboarding.homeState')}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500/60"
                >
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Telangana">Telangana</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {t('onboarding.cityDistrict')}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('onboarding.cityDistrict')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {t('onboarding.occupation')}
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500/60"
                >
                  <option value="Entrepreneur / Business">{t('onboarding.entrepreneur')}</option>
                  <option value="Student">{t('onboarding.student')}</option>
                  <option value="Salaried Employee">{t('onboarding.salaried')}</option>
                  <option value="Farmer / Agriculture">{t('onboarding.farmer')}</option>
                  <option value="Self-Employed">{t('onboarding.selfEmployed')}</option>
                  <option value="Homemaker">{t('onboarding.homemaker')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {t('onboarding.annualIncome')}
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="350000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t('onboarding.dateOfBirth')}
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={closeOnboardingModal}
              className="text-xs text-slate-400 hover:text-white"
            >
              {t('onboarding.skipForNow')}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{t('onboarding.saveContinue')}</span>}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
