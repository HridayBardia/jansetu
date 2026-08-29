-- =====================================================================
-- JANSETU Full-Stack Supabase Interlinking — Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- All operations are idempotent (safe to run multiple times)
-- =====================================================================

-- 1. APPLICATIONS TABLE — Add operational columns
ALTER TABLE applications ADD COLUMN IF NOT EXISTS citizen_id TEXT DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS submitted_date TEXT DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_updated TEXT DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS next_action TEXT DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS sla TEXT DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;

-- 2. NOTIFICATIONS TABLE — Add targeting columns
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS citizen_name TEXT DEFAULT '';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS citizen_id TEXT DEFAULT '';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS app_id TEXT DEFAULT '';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_role TEXT DEFAULT 'ALL';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Application Update';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT true;

-- 3. CONSENTS TABLE — Add citizen association & DPDP fields
ALTER TABLE consents ADD COLUMN IF NOT EXISTS citizen_name TEXT DEFAULT '';
ALTER TABLE consents ADD COLUMN IF NOT EXISTS citizen_id TEXT DEFAULT '';
ALTER TABLE consents ADD COLUMN IF NOT EXISTS requested_fields JSONB DEFAULT '[]'::jsonb;
ALTER TABLE consents ADD COLUMN IF NOT EXISTS granted_date TEXT DEFAULT '';
ALTER TABLE consents ADD COLUMN IF NOT EXISTS expiry_date TEXT DEFAULT '';

-- 4. JOURNEYS TABLE — Add operational columns
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS citizen_name TEXT DEFAULT '';
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT '';
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS documents_ready INT DEFAULT 0;
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS documents_total INT DEFAULT 0;
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS next_action TEXT DEFAULT '';
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS last_updated TEXT DEFAULT '';
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS "timestamp" BIGINT DEFAULT 0;

-- 5. NEW TABLE: doc_requests — Document KYC Request Ledger
CREATE TABLE IF NOT EXISTS doc_requests (
  id TEXT PRIMARY KEY,
  dept_name TEXT NOT NULL DEFAULT '',
  doc_type TEXT NOT NULL DEFAULT '',
  citizen_id TEXT DEFAULT '',
  citizen_name TEXT DEFAULT '',
  requested_at TEXT DEFAULT '',
  status TEXT DEFAULT 'PENDING',
  app_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on doc_requests (allow all for now — demo)
ALTER TABLE doc_requests ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'doc_requests' AND policyname = 'Allow all for doc_requests'
  ) THEN
    CREATE POLICY "Allow all for doc_requests" ON doc_requests FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6. ENABLE REALTIME on all tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE applications;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'consents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE consents;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'journeys'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE journeys;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'doc_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE doc_requests;
  END IF;
END $$;

-- VERIFICATION QUERIES
SELECT 'applications' AS tbl, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' ORDER BY ordinal_position;
SELECT 'notifications' AS tbl, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' ORDER BY ordinal_position;
SELECT 'consents' AS tbl, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='consents' ORDER BY ordinal_position;
SELECT 'journeys' AS tbl, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='journeys' ORDER BY ordinal_position;
SELECT 'doc_requests' AS tbl, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='doc_requests' ORDER BY ordinal_position;
