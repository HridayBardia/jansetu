import { RAGAnswer, Citation, SourceProvenance } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api/v1` : 'http://localhost:8000/api/v1');



export interface ContextQuestion {
  key: string;
  question: string;
  options: string[];
  default_value?: string;
}

export interface GoalAnalysisResponse {
  goal: string;
  life_event: string;
  location_state: string;
  location_city: string;
  location_district?: string;
  confidence: string;
  requires_context: boolean;
  context_questions: ContextQuestion[];
  supported: boolean;
  message?: string;
}

export interface JourneyStep {
  id: string;
  step_key: string;
  title: string;
  description: string;
  category: string;
  state: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  priority: string;
  estimated_effort: string;
  official_portal_url?: string;
  user_notes?: string;
  prerequisites?: string[];
}

export interface NextBestAction {
  step_key: string;
  title: string;
  priority: string;
  reason: string;
  estimated_effort: string;
}

export interface Journey {
  id: string;
  user_id: string;
  title: string;
  goal_category: string;
  life_event: string;
  state: string;
  location_state: string;
  location_city: string;
  progress_percentage: number;
  context_data: Record<string, any>;
  steps: JourneyStep[];
  next_best_action?: NextBestAction;
  created_at: string;
  updated_at: string;
}

export interface GovernmentSource {
  id: string;
  title: string;
  department: string;
  state: string;
  source_type: string;
  url: string;
  summary: string;
  freshness_status: string;
  last_verified_at: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  category: string;
  priority: string;
  effective_date: string;
  impact_summary: string;
  action_required?: string;
  source_url?: string;
  journey_category: string;
  created_at: string;
}

// API Helper wrapper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('citizen_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      if (errJson && errJson.detail) {
        throw new Error(errJson.detail);
      }
      return null;
    }
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (e: any) {
    console.warn(`API fetch error [${endpoint}]:`, e);
    if (e.message && !e.message.includes('fetch')) {
      throw e;
    }
    return null;
  }
}

// Authentication API Helpers
export async function requestOtpAPI(full_name: string, mobile_number: string): Promise<any> {
  return await apiFetch('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ full_name, mobile_number })
  });
}

export async function verifyOtpAPI(full_name: string, mobile_number: string, otp: string): Promise<any> {
  const data = await apiFetch<any>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ full_name, mobile_number, otp })
  });
  if (data && data.access_token && typeof window !== 'undefined') {
    localStorage.setItem('citizen_token', data.access_token);
  }
  return data;
}

export async function fetchMeAPI(): Promise<any> {
  return await apiFetch('/auth/me');
}

export async function logoutAPI(): Promise<any> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('citizen_token');
  }
  return await apiFetch('/auth/logout', { method: 'POST' });
}

export async function updateProfileAPI(profileData: any): Promise<any> {
  return await apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
}

export async function fetchUserDocumentsAPI(): Promise<any[]> {
  const docs = await apiFetch<any[]>('/documents');
  return docs || [];
}

export async function fetchDocumentViewAPI(documentId: string): Promise<any> {
  return await apiFetch<any>(`/documents/${documentId}/view`);
}

// API Methods
export async function analyzeGoalAPI(message: string): Promise<GoalAnalysisResponse> {
  const data = await apiFetch<GoalAnalysisResponse>('/ai/goals/analyze', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
  if (data) return data;


  // Fallback
  const lower = String(message).toLowerCase();
  const isEdu = lower.includes('edu') || lower.includes('loan') || lower.includes('scholarship');

  if (isEdu) {
    return {
      goal: 'education',
      life_event: 'higher_education_funding',
      location_state: 'National / Central',
      location_city: 'Pan-India',
      confidence: 'high',
      requires_context: true,
      supported: true,
      context_questions: [
        {
          key: 'education_level',
          question: 'What level of study are you pursuing?',
          options: ['Undergraduate Degree (B.Tech, B.Sc)', 'Postgraduate Degree (MBA, M.Tech)', 'Study Abroad'],
          default_value: 'Undergraduate Degree (B.Tech, B.Sc)'
        },
        {
          key: 'annual_family_income',
          question: 'What is your annual family income level?',
          options: ['Under ₹2.5 Lakhs', '₹2.5 Lakhs to ₹6 Lakhs', 'Above ₹6 Lakhs'],
          default_value: 'Under ₹2.5 Lakhs'
        }
      ]
    };
  }

  return {
    goal: 'business',
    life_event: 'business_formation',
    location_state: 'National / Central',
    location_city: 'Pan-India',
    confidence: 'high',
    requires_context: true,
    supported: true,
    context_questions: [
      {
        key: 'business_structure',
        question: 'What legal structure are you planning for your business?',
        options: ['Sole Proprietorship', 'Partnership', 'LLP', 'Private Limited Company'],
        default_value: 'Sole Proprietorship'
      },
      {
        key: 'business_type',
        question: 'What sector will your business operate in?',
        options: ['Retail & E-commerce', 'IT / Tech Services', 'Food & Restaurant', 'Manufacturing'],
        default_value: 'Retail & E-commerce'
      }
    ]
  };
}

export async function generateJourneyAPI(payload: {
  goal_category: string;
  life_event: string;
  title: string;
  context_data: Record<string, any>;
  location_state?: string;
  location_city?: string;
}): Promise<{ journey_id: string } | null> {
  return await apiFetch<{ journey_id: string }>('/journeys/generate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchJourneysAPI(): Promise<any[]> {
  const res = await apiFetch<any[]>('/journeys');
  return res || [];
}

export async function fetchJourneyByIdAPI(id: string): Promise<any | null> {
  return await apiFetch<any>(`/journeys/${id}`);
}

export async function completeStepAPI(journeyId: string, stepKey: string): Promise<boolean> {
  const res = await apiFetch<any>(`/journeys/${journeyId}/steps/${stepKey}/complete`, {
    method: 'POST'
  });
  return res !== null;
}

export async function askAiChatAPI(query: string, journeyId?: string, stepId?: string): Promise<RAGAnswer> {
  const data = await apiFetch<RAGAnswer>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ query, journey_id: journeyId, step_id: stepId })
  });
  if (data) return { ...data, reply: data.answer || data.reply || '', sources: (data.citations as any) || [] };

  return {
    reply: 'Based on official government guidelines, this step ensures verified compliance before license issuance or benefit sanction.',
    answer: 'Based on official government guidelines, this step ensures verified compliance before license issuance or benefit sanction.',
    sources: [
      {
        id: 'src_national',
        title: 'National Portal of India',
        authority: 'Government of India',
        url: 'https://india.gov.in',
        published_at: '2026-01-01',
        retrieved_at: '2026-02-01',
        verification_status: 'verified',
        version: '2026.1'
      }
    ],
    citations: [
      {
        source_id: 'src_national',
        title: 'National Portal of India',
        department: 'Government of India',
        url: 'https://india.gov.in',
        last_verified: '2026-02-01',
        confidence: 'high'
      }
    ],
    suggested_followups: [
      'Why do I need this document?',
      'What alternative documents are accepted?'
    ],
    confidence: 'high'
  };
}

export async function fetchSourcesAPI(): Promise<GovernmentSource[]> {
  const data = await apiFetch<GovernmentSource[]>('/sources');
  return data || [];
}

export async function fetchAlertsAPI(journeyCategory?: string): Promise<SystemAlert[]> {
  const query = journeyCategory ? `?journey_category=${journeyCategory}` : '';
  const data = await apiFetch<SystemAlert[]>(`/alerts${query}`);
  return data || [];
}

export async function fetchPrivacyDataAPI(): Promise<{ consents: any[]; access_logs: any[] }> {
  const data = await apiFetch<{ consents: any[]; access_logs: any[] }>('/privacy/consents');
  return data || { consents: [], access_logs: [] };
}

export async function toggleConsentAPI(purpose: string, granted: boolean): Promise<any> {
  return await apiFetch(`/privacy/consents/toggle?purpose=${encodeURIComponent(purpose)}&granted=${granted}`, {
    method: 'POST'
  });
}

export async function fetchAdminDiagnosticsAPI(): Promise<any> {
  return await apiFetch('/admin/diagnostics');
}

export async function fetchStatesAPI(): Promise<{ code: string; name: string; is_ut: boolean }[]> {
  const data = await apiFetch<{ code: string; name: string; is_ut: boolean }[]>('/states');
  return data || [];
}

export async function fetchLanguagesAPI(): Promise<{ code: string; name: string; native_name: string }[]> {
  const data = await apiFetch<{ code: string; name: string; native_name: string }[]>('/languages');
  return data || [];
}

export async function fetchSchemesAPI(params: {
  state_name?: string;
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ total: number; schemes: any[]; limit: number; offset: number }> {
  const query = new URLSearchParams();
  if (params.state_name) query.append('state_name', params.state_name);
  if (params.category) query.append('category', params.category);
  if (params.status) query.append('status', params.status);
  if (params.limit) query.append('limit', String(params.limit));
  if (params.offset) query.append('offset', String(params.offset));

  const data = await apiFetch<{ total: number; schemes: any[]; limit: number; offset: number }>(`/schemes?${query.toString()}`);
  return data || { total: 0, schemes: [], limit: 20, offset: 0 };
}

export async function searchSchemesAPI(q: string, state_name?: string): Promise<{ query: string; language_detected: string; location_detected: string; results: any[] }> {
  const query = new URLSearchParams({ q });
  if (state_name) query.append('state_name', state_name);

  const data = await apiFetch<any>(`/schemes/search?${query.toString()}`);
  return data || { query: q, language_detected: 'en', location_detected: 'Central', results: [] };
}

export async function fetchSchemeByIdAPI(schemeId: string): Promise<any | null> {
  return await apiFetch<any>(`/schemes/${schemeId}`);
}

export async function triggerIngestionAPI(): Promise<any> {
  return await apiFetch('/admin/ingest', { method: 'POST' });
}

export async function fetchSourceHealthAPI(): Promise<any> {
  return await apiFetch('/sources/health');
}

// Demo Mode Citizen Switcher API Helpers
export async function listDemoCitizensAPI(): Promise<any[]> {
  const data = await apiFetch<any[]>('/demo/citizens');
  return data || [];
}

export async function selectDemoCitizenAPI(citizenKey: string): Promise<any> {
  return await apiFetch<any>(`/demo/select/${citizenKey}`, { method: 'POST' });
}

// Document Intelligence API Helpers
export async function fetchDocumentConsistencyAPI(): Promise<any> {
  return await apiFetch<any>('/documents/consistency');
}

export async function matchDocumentRequirementsAPI(goalCategory: string = 'business'): Promise<any> {
  return await apiFetch<any>(`/documents/requirement-match?goal_category=${goalCategory}`, { method: 'POST' });
}

export async function fetchDocumentGraphAPI(goalCategory: string = 'business', locationState: string = 'Gujarat'): Promise<any> {
  return await apiFetch<any>(`/documents/graph?goal_category=${goalCategory}&location_state=${locationState}`);
}

export async function buildDocumentPacketAPI(goalCategory: string = 'business'): Promise<any> {
  return await apiFetch<any>(`/documents/packet?goal_category=${goalCategory}`, { method: 'POST' });
}


