-- ============================================================
-- TSAB BOT - V3 Public Pages Migration
-- Adds: inquiries (contact/career/partner submissions)
-- Run AFTER complete_setup.sql AND v2_wa_features.sql
-- Safe to re-run.
-- ============================================================

-- 1) Unified inquiries table for all public-form submissions
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('contact', 'career', 'partner', 'help', 'feedback')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- type-specific (position, company, cv_url, etc.)
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
  admin_note TEXT,
  responded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_type ON inquiries(type);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);

-- RLS: anyone can insert (the form submission), only admin can read/update/delete
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiries_public_insert" ON inquiries;
CREATE POLICY "inquiries_public_insert" ON inquiries
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "inquiries_admin_all" ON inquiries;
CREATE POLICY "inquiries_admin_all" ON inquiries
  FOR ALL USING (is_admin());

-- updated_at auto-update
DROP TRIGGER IF EXISTS inquiries_updated_at ON inquiries;
CREATE TRIGGER inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2) Add login tracking on profiles (admin can see last activity)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- 3) Verify
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='inquiries') AS has_inquiries_table,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_login_at') AS has_last_login;
