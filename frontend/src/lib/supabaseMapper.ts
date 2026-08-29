/**
 * Supabase ↔ Frontend Bidirectional Column Mapper
 * 
 * Single source of truth for transforming between:
 * - Frontend camelCase models (ApplicationRecord, JourneyRecord, etc.)
 * - Supabase snake_case PostgreSQL columns
 * 
 * Every Supabase read passes through fromSupabase*()
 * Every Supabase write passes through toSupabase*()
 */

import type { ApplicationRecord, JourneyRecord, ConsentRecord, NotificationRecord, DocRequestRecord } from '@/context/LiveSyncContext';

// ─── Applications ────────────────────────────────────────────────────────────

export function toSupabaseApplication(app: Partial<ApplicationRecord>): Record<string, any> {
  const row: Record<string, any> = {};
  if (app.id !== undefined) row.id = app.id;
  if (app.citizenName !== undefined) row.citizen_name = app.citizenName;
  if (app.citizenId !== undefined) row.citizen_id = app.citizenId;
  if (app.service !== undefined) row.scheme_name = app.service;
  if (app.department !== undefined) row.department = app.department;
  if (app.status !== undefined) row.status = app.status;
  if (app.submittedDate !== undefined) row.submitted_date = app.submittedDate;
  if (app.lastUpdated !== undefined) row.last_updated = app.lastUpdated;
  if (app.nextAction !== undefined) row.next_action = app.nextAction;
  if (app.location !== undefined) row.location = app.location;
  if (app.sla !== undefined) row.sla = app.sla;
  if (app.documents !== undefined) row.documents = JSON.stringify(app.documents);
  if (app.timeline !== undefined) row.timeline = JSON.stringify(app.timeline);
  // Derive category from department if not stored
  row.category = app.department?.split(' ').pop() || 'Welfare';
  return row;
}

export function fromSupabaseApplication(row: Record<string, any>): ApplicationRecord {
  return {
    id: row.id || '',
    citizenName: row.citizen_name || '',
    citizenId: row.citizen_id || '',
    service: row.scheme_name || '',
    department: row.department || '',
    status: row.status || 'SUBMITTED',
    submittedDate: row.submitted_date || row.created_at?.split('T')[0] || '',
    lastUpdated: row.last_updated || 'Recently',
    nextAction: row.next_action || '',
    location: row.location || '',
    sla: row.sla || '',
    documents: typeof row.documents === 'string' ? JSON.parse(row.documents || '[]') : (row.documents || []),
    timeline: typeof row.timeline === 'string' ? JSON.parse(row.timeline || '[]') : (row.timeline || []),
  };
}

// ─── Journeys ────────────────────────────────────────────────────────────────

export function toSupabaseJourney(j: Partial<JourneyRecord>): Record<string, any> {
  const row: Record<string, any> = {};
  // journeys.id is UUID in Supabase — we generate one if the frontend id is not UUID-shaped
  if (j.id !== undefined) {
    row.id = isUUID(j.id) ? j.id : undefined; // Let Supabase auto-generate if not UUID
  }
  if (j.title !== undefined) row.title = j.title;
  if (j.category !== undefined) row.category = j.category;
  if (j.citizenName !== undefined) row.citizen_name = j.citizenName;
  if (j.status !== undefined) row.status = j.status;
  if (j.progress !== undefined) row.progress = j.progress;
  if (j.currentStage !== undefined) row.current_stage = j.currentStage;
  if (j.documentsReady !== undefined) row.documents_ready = j.documentsReady;
  if (j.documentsTotal !== undefined) row.documents_total = j.documentsTotal;
  if (j.nextAction !== undefined) row.next_action = j.nextAction;
  if (j.lastUpdated !== undefined) row.last_updated = j.lastUpdated;
  if (j.timestamp !== undefined) row.timestamp = j.timestamp;
  if (j.location !== undefined) row.location = j.location;
  return row;
}

export function fromSupabaseJourney(row: Record<string, any>): JourneyRecord {
  return {
    id: row.id || '',
    title: row.title || '',
    category: row.category || '',
    citizenName: row.citizen_name || '',
    status: row.status || 'In Progress',
    progress: row.progress || 0,
    currentStage: row.current_stage || '',
    documentsReady: row.documents_ready || 0,
    documentsTotal: row.documents_total || 0,
    nextAction: row.next_action || '',
    lastUpdated: row.last_updated || 'Recently',
    timestamp: row.timestamp || Date.now(),
    location: row.location || '',
  };
}

// ─── Consents ────────────────────────────────────────────────────────────────

export function toSupabaseConsent(c: Partial<ConsentRecord> & { citizenName?: string; citizenId?: string }): Record<string, any> {
  const row: Record<string, any> = {};
  if (c.id !== undefined) row.dept_id = c.id;
  if (c.department !== undefined) row.dept_name = c.department;
  if (c.purpose !== undefined) row.purpose = c.purpose;
  if (c.status !== undefined) row.status = c.status;
  if (c.requestedFields !== undefined) row.requested_fields = JSON.stringify(c.requestedFields);
  if (c.grantedDate !== undefined) row.granted_date = c.grantedDate;
  if (c.expiryDate !== undefined) row.expiry_date = c.expiryDate;
  if (c.citizenName !== undefined) row.citizen_name = c.citizenName;
  if (c.citizenId !== undefined) row.citizen_id = c.citizenId;
  return row;
}

export function fromSupabaseConsent(row: Record<string, any>): ConsentRecord {
  return {
    id: row.dept_id || row.id || '',
    department: row.dept_name || '',
    purpose: row.purpose || '',
    requestedFields: typeof row.requested_fields === 'string' 
      ? JSON.parse(row.requested_fields || '[]') 
      : (row.requested_fields || []),
    status: row.status || 'PENDING',
    grantedDate: row.granted_date || undefined,
    expiryDate: row.expiry_date || undefined,
  };
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function toSupabaseNotification(n: Partial<NotificationRecord>): Record<string, any> {
  const row: Record<string, any> = {};
  if (n.id !== undefined) row.id = isUUID(n.id) ? n.id : undefined;
  row.title = n.category || 'Notification';
  if (n.message !== undefined) row.message = n.message;
  row.type = mapCategoryToType(n.category);
  if (n.citizenName !== undefined) row.citizen_name = n.citizenName;
  if (n.citizenId !== undefined) row.citizen_id = n.citizenId;
  if (n.appId !== undefined) row.app_id = n.appId;
  if (n.recipientRole !== undefined) row.recipient_role = n.recipientRole;
  if (n.category !== undefined) row.category = n.category;
  if (n.isNew !== undefined) row.is_new = n.isNew;
  return row;
}

export function fromSupabaseNotification(row: Record<string, any>): NotificationRecord {
  return {
    id: row.id || '',
    timestamp: row.created_at ? formatTimestamp(row.created_at) : 'Just now',
    message: row.message || '',
    category: (row.category || mapTypeToCategory(row.type)) as NotificationRecord['category'],
    isNew: row.is_new ?? true,
    citizenName: row.citizen_name || undefined,
    citizenId: row.citizen_id || undefined,
    appId: row.app_id || undefined,
    recipientRole: row.recipient_role as NotificationRecord['recipientRole'] || undefined,
  };
}

// ─── Doc Requests ────────────────────────────────────────────────────────────

export function toSupabaseDocRequest(d: Partial<DocRequestRecord> & { appId?: string }): Record<string, any> {
  const row: Record<string, any> = {};
  if (d.id !== undefined) row.id = d.id;
  if (d.deptName !== undefined) row.dept_name = d.deptName;
  if (d.docType !== undefined) row.doc_type = d.docType;
  if (d.citizenId !== undefined) row.citizen_id = d.citizenId;
  if (d.citizenName !== undefined) row.citizen_name = d.citizenName;
  if (d.requestedAt !== undefined) row.requested_at = d.requestedAt;
  if (d.status !== undefined) row.status = d.status;
  if (d.appId !== undefined) row.app_id = d.appId;
  return row;
}

export function fromSupabaseDocRequest(row: Record<string, any>): DocRequestRecord {
  return {
    id: row.id || '',
    deptName: row.dept_name || '',
    docType: row.doc_type || '',
    citizenId: row.citizen_id || '',
    citizenName: row.citizen_name || '',
    requestedAt: row.requested_at || '',
    status: row.status || 'PENDING',
    appId: row.app_id || row.id,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function mapCategoryToType(category?: string): string {
  if (!category) return 'info';
  const lower = category.toLowerCase();
  if (lower.includes('document')) return 'doc_request';
  if (lower.includes('consent')) return 'consent';
  if (lower.includes('verification')) return 'verification';
  if (lower.includes('journey')) return 'journey';
  if (lower.includes('security')) return 'security';
  return 'info';
}

function mapTypeToCategory(type?: string): string {
  if (!type) return 'Application Update';
  if (type === 'doc_request') return 'Document';
  if (type === 'consent') return 'Consent';
  if (type === 'verification') return 'Verification';
  if (type === 'journey') return 'Journey';
  if (type === 'security') return 'Security';
  return 'Application Update';
}

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  } catch {
    return 'Recently';
  }
}
