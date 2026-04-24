-- ============================================================
-- TSAB BOT - V2 WhatsApp Features Migration
-- Run this in Supabase SQL Editor AFTER complete_setup.sql
-- Safe to re-run.
-- ============================================================

-- 1) Make sure devices table has the right AI columns
ALTER TABLE devices ADD COLUMN IF NOT EXISTS ai_prompt TEXT
  DEFAULT 'أنت مساعد ذكي ومحترف لخدمة العملاء. أجب باللغة التي يكتب بها العميل، بشكل ودود ومختصر.';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini-2.0-flash';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false;

-- 2) Drop the old stale ai_system_prompt if present (legacy)
ALTER TABLE devices DROP COLUMN IF EXISTS ai_system_prompt;

-- 3) WA Warmer config table (used by wa-server/routes/warmer.js)
CREATE TABLE IF NOT EXISTS warmer_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'جلسة التدفئة',
  device_ids JSONB DEFAULT '[]',
  daily_target INTEGER DEFAULT 5,
  start_hour INTEGER DEFAULT 8,
  end_hour INTEGER DEFAULT 22,
  is_active BOOLEAN DEFAULT false,
  messages_today INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  days_running INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE warmer_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warmer_config_own" ON warmer_config;
CREATE POLICY "warmer_config_own" ON warmer_config
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- 4) RPC for warmer days increment
CREATE OR REPLACE FUNCTION increment_warmer_days()
RETURNS VOID AS $$
BEGIN
  UPDATE warmer_config SET days_running = days_running + 1 WHERE is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5) Tighten messages metadata
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 6) Indexes for WA features
CREATE INDEX IF NOT EXISTS idx_messages_from_number ON messages(from_number);
CREATE INDEX IF NOT EXISTS idx_messages_to_number ON messages(to_number);
CREATE INDEX IF NOT EXISTS idx_messages_device_phone ON messages(device_id, from_number, to_number);

-- 7) Verify
SELECT
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='devices' AND column_name='ai_prompt') AS has_ai_prompt,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='warmer_config') AS has_warmer_config,
  (SELECT COUNT(*) FROM pg_proc WHERE proname='increment_warmer_days') AS has_warmer_rpc;
