export type StepStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'pending' | 'active' | 'completed' | 'blocked';

export type ConfidenceLevel = 'OFFICIAL_VERIFIED' | 'OFFICIAL_BUT_STALE' | 'CROSS_VERIFIED' | 'UNVERIFIED' | 'verified' | 'likely' | 'need_info' | 'not_applicable';

export type AlertSeverity = 'high' | 'medium' | 'low' | 'critical' | 'important' | 'informational';

export interface Citation {
  source_id: string;
  title: string;
  department: string;
  url: string;
  last_verified: string;
  confidence: string;
}

export interface RAGAnswer {
  reply: string;
  answer?: string;
  sources: SourceProvenance[];
  citations?: Citation[];
  suggested_followups?: string[];
  confidence: string;
}

export interface SourceProvenance {
  id: string;
  title: string;
  authority: string;
  department?: string;
  url: string;
  published_at?: string;
  retrieved_at?: string;
  last_verified_at?: string;
  verification_status?: ConfidenceLevel;
  version?: string;
  excerpt?: string;
  summary?: string;
  freshness_status?: string;
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  accepted_types?: string[];
  is_mandatory: boolean;
  status: 'missing' | 'available' | 'needs_verification' | 'VERIFIED' | 'UPLOADED' | 'REJECTED';
  file_reference?: string;
  source_id?: string;
}

export interface JourneyStep {
  id: string;
  step_key: string;
  title: string;
  description: string;
  category: string;
  state: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  status?: string;
  priority: string;
  estimated_effort: string;
  estimated_time?: string;
  official_portal_url?: string;
  user_notes?: string;
  prerequisites?: string[];
  department?: string;
  consequential?: boolean;
  required_documents?: DocumentRequirement[];
  official_sources?: SourceProvenance[];
  is_locked?: boolean;
  lock_reason?: string;
  dependencies?: string[];
}

export interface NextBestAction {
  step_key: string;
  title: string;
  priority: string;
  reason: string;
  estimated_effort: string;
  step_id?: string;
  urgency?: string;
  estimated_time?: string;
  prerequisite_summary?: string;
  cta_label?: string;
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
  goal_raw?: string;
  location?: string;
  city?: string;
}

export interface ContextQuestion {
  key: string;
  question: string;
  options: string[];
  default_value?: string;
}

export type WorkflowStep = JourneyStep;

export interface GoalAnalysisResponse {
  goal: string;
  life_event: string;
  location_state: string;
  location_city: string;
  confidence: string;
  requires_context: boolean;
  context_questions: ContextQuestion[];
  supported: boolean;
  message?: string;
  clarification_question?: string;
  clarification_options?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: SourceProvenance[];
  suggested_followups?: string[];
  timestamp: string;
}

export interface ImpactAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  affected_journey_ids: string[];
  effective_date: string;
  deadline?: string;
  required_action: string;
  source_title: string;
  source_url: string;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  purpose: string;
  scope: string;
  granted_at: string;
  revoked_at?: string;
  is_active: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  action: string;
  resource: string;
  details: string;
}

export interface AnalyticsSummary {
  total_journeys_started: number;
  prerequisites_auto_resolved: number;
  sources_indexed: number;
  avg_completion_rate: number;
  time_saved_hours_per_citizen: number;
}
