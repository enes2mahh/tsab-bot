-- ============================================
-- TSAB BOT - Complete Database Schema
-- All Phases 1-15 Combined
-- Run this in Supabase SQL Editor
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PHASE 1: CORE TABLES
-- ============================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'support')),
  api_key TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  webhook_url TEXT,
  referral_code TEXT UNIQUE DEFAULT upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  referred_by UUID REFERENCES profiles(id),
  timezone TEXT DEFAULT 'Asia/Riyadh',
  language TEXT DEFAULT 'ar',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_banned BOOLEAN DEFAULT false,
  notification_settings JSONB DEFAULT '{"email":true,"device_connected":true,"device_disconnected":true,"campaign_completed":true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_ar TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 30,
  trial_days INTEGER DEFAULT 0,
  message_limit INTEGER NOT NULL DEFAULT 1000,
  device_limit INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '{}',
  is_recommended BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) NOT NULL,
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial','active','expired','cancelled','suspended')),
  messages_used INTEGER DEFAULT 0,
  messages_limit INTEGER NOT NULL DEFAULT 1000,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  activation_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation Codes
CREATE TABLE IF NOT EXISTS activation_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  plan_id UUID REFERENCES plans(id) NOT NULL,
  duration_days INTEGER,
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  phone TEXT,
  name TEXT DEFAULT 'جهازي',
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected','disconnected','banned','connecting','expired')),
  webhook_url TEXT,
  session_id TEXT UNIQUE,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  ai_enabled BOOLEAN DEFAULT false,
  ai_prompt TEXT DEFAULT 'أنت مساعد ذكي لخدمة العملاء. أجب بشكل ودي ومهني.',
  ai_model TEXT DEFAULT 'gemini-2.0-flash',
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  campaign_id UUID,
  chatflow_id UUID,
  direction TEXT NOT NULL CHECK (direction IN ('outgoing','incoming')),
  to_number TEXT,
  from_number TEXT,
  contact_name TEXT,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN (
    'text','image','video','document','location',
    'product','list','button','poll','sticker',
    'contact','audio','reaction'
  )),
  content JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','read','failed')),
  wa_message_id TEXT,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHASE 6: CAMPAIGNS
-- ============================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','running','paused','completed','failed','cancelled')),
  message_type TEXT NOT NULL DEFAULT 'text',
  message_content JSONB NOT NULL DEFAULT '{}',
  recipient_type TEXT DEFAULT 'numbers' CHECK (recipient_type IN ('numbers','contacts','file')),
  recipients JSONB DEFAULT '[]',
  delay_min INTEGER DEFAULT 5,
  delay_max INTEGER DEFAULT 10,
  total_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHASE 7: AUTO REPLY + CHAT FLOW
-- ============================================

CREATE TABLE IF NOT EXISTS auto_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'keyword','contains','starts_with','ends_with',
    'first_message','all','outside_hours','regex'
  )),
  trigger_value TEXT,
  trigger_keywords JSONB DEFAULT '[]',
  response_type TEXT NOT NULL DEFAULT 'text' CHECK (response_type IN (
    'text','image','video','document','list','button','location','chatflow','template'
  )),
  response_content JSONB NOT NULL DEFAULT '{"text":""}',
  working_hours_start TIME,
  working_hours_end TIME,
  working_days JSONB DEFAULT '[0,1,2,3,4,5,6]',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT DEFAULT 'keyword',
  trigger_keyword TEXT,
  nodes JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chatflow_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  chatflow_id UUID REFERENCES chat_flows(id) ON DELETE CASCADE,
  current_node_id TEXT,
  context JSONB DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHASE 9: REFERRALS & WITHDRAWALS
-- ============================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','available','withdrawn','expired')),
  available_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referee_id)
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 25),
  method TEXT DEFAULT 'bank_transfer',
  bank_details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','rejected')),
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHASE 11: TICKETS (SUPPORT)
-- ============================================

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  department TEXT DEFAULT 'general' CHECK (department IN ('general','technical','billing','other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting','closed')),
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_staff BOOLEAN DEFAULT false,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHASE 13: WARMER
-- ============================================

CREATE TABLE IF NOT EXISTS warmer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'جلسة التدفئة',
  device_ids JSONB DEFAULT '[]',
  daily_target INTEGER DEFAULT 5,
  current_day INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  messages_today INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHASE 14: FILES, CONTACTS, TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  original_name TEXT,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  size BIGINT DEFAULT 0,
  mime_type TEXT,
  folder TEXT DEFAULT '/',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  tags JSONB DEFAULT '[]',
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  is_blocked BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phone)
);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  content JSONB NOT NULL DEFAULT '{}',
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SYSTEM TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  url TEXT,
  event_type TEXT,
  payload JSONB DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  model TEXT DEFAULT 'gemini-2.0-flash',
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  settings JSONB DEFAULT '{}'
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_messages_device_id ON messages(device_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_device_id ON campaigns(device_id);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_session_id ON devices(session_id);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);

CREATE INDEX IF NOT EXISTS idx_auto_replies_device_id ON auto_replies(device_id);
CREATE INDEX IF NOT EXISTS idx_auto_replies_is_active ON auto_replies(is_active);

CREATE INDEX IF NOT EXISTS idx_chatflow_sessions_device_phone ON chatflow_sessions(device_id, contact_phone);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_device_id ON webhook_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatflow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE warmer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id OR is_admin());

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "subscriptions_own" ON subscriptions;
CREATE POLICY "subscriptions_own" ON subscriptions
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- ACTIVATION CODES - users can only read active ones (for activation)
DROP POLICY IF EXISTS "codes_admin_manage" ON activation_codes;
CREATE POLICY "codes_admin_manage" ON activation_codes
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "codes_user_read" ON activation_codes;
CREATE POLICY "codes_user_read" ON activation_codes
  FOR SELECT USING (is_active = true);

-- DEVICES
DROP POLICY IF EXISTS "devices_own" ON devices;
CREATE POLICY "devices_own" ON devices
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- MESSAGES
DROP POLICY IF EXISTS "messages_own" ON messages;
CREATE POLICY "messages_own" ON messages
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- CAMPAIGNS
DROP POLICY IF EXISTS "campaigns_own" ON campaigns;
CREATE POLICY "campaigns_own" ON campaigns
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- CONTACTS
DROP POLICY IF EXISTS "contacts_own" ON contacts;
CREATE POLICY "contacts_own" ON contacts
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- AUTO REPLIES
DROP POLICY IF EXISTS "auto_replies_own" ON auto_replies;
CREATE POLICY "auto_replies_own" ON auto_replies
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- CHAT FLOWS
DROP POLICY IF EXISTS "chat_flows_own" ON chat_flows;
CREATE POLICY "chat_flows_own" ON chat_flows
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- CHATFLOW SESSIONS - accessible by device owner
DROP POLICY IF EXISTS "chatflow_sessions_own" ON chatflow_sessions;
CREATE POLICY "chatflow_sessions_own" ON chatflow_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM devices
      WHERE devices.id = chatflow_sessions.device_id
      AND devices.user_id = auth.uid()
    ) OR is_admin()
  );

-- TEMPLATES
DROP POLICY IF EXISTS "templates_own" ON templates;
CREATE POLICY "templates_own" ON templates
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- FILES
DROP POLICY IF EXISTS "files_own" ON files;
CREATE POLICY "files_own" ON files
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- TICKETS
DROP POLICY IF EXISTS "tickets_own" ON tickets;
CREATE POLICY "tickets_own" ON tickets
  FOR ALL USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "ticket_messages_own" ON ticket_messages;
CREATE POLICY "ticket_messages_own" ON ticket_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND (tickets.user_id = auth.uid() OR is_admin())
    )
  );

-- REFERRALS
DROP POLICY IF EXISTS "referrals_own" ON referrals;
CREATE POLICY "referrals_own" ON referrals
  FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referee_id OR is_admin());

-- WITHDRAWALS
DROP POLICY IF EXISTS "withdrawals_own" ON withdrawals;
CREATE POLICY "withdrawals_own" ON withdrawals
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- WARMER SESSIONS
DROP POLICY IF EXISTS "warmer_own" ON warmer_sessions;
CREATE POLICY "warmer_own" ON warmer_sessions
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- AI USAGE LOGS
DROP POLICY IF EXISTS "ai_logs_own" ON ai_usage_logs;
CREATE POLICY "ai_logs_own" ON ai_usage_logs
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- PLANS - everyone can read
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans_read" ON plans;
CREATE POLICY "plans_read" ON plans
  FOR SELECT USING (is_active = true OR is_admin());
DROP POLICY IF EXISTS "plans_admin" ON plans;
CREATE POLICY "plans_admin" ON plans
  FOR ALL USING (is_admin());

-- SYSTEM SETTINGS - only admin
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_admin" ON system_settings;
CREATE POLICY "settings_admin" ON system_settings
  FOR ALL USING (is_admin());

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-create trial subscription on signup
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
  v_referrer_id UUID;
BEGIN
  -- Get basic plan
  SELECT id INTO v_plan_id FROM plans WHERE slug = 'basic' AND is_active = true LIMIT 1;

  IF v_plan_id IS NOT NULL THEN
    INSERT INTO subscriptions (
      user_id, plan_id, status,
      messages_used, messages_limit,
      starts_at, expires_at
    ) VALUES (
      NEW.id, v_plan_id, 'trial',
      0, 1000,
      NOW(), NOW() + INTERVAL '3 days'
    );
  END IF;

  -- Handle referral
  IF NEW.referred_by IS NOT NULL THEN
    INSERT INTO referrals (referrer_id, referee_id, status)
    VALUES (NEW.referred_by, NEW.id, 'pending')
    ON CONFLICT (referrer_id, referee_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- Handle referral code on signup
CREATE OR REPLACE FUNCTION resolve_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
  v_referrer_id UUID;
BEGIN
  -- Get referral code from user metadata
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';

  IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
    SELECT id INTO v_referrer_id
    FROM profiles
    WHERE referral_code = upper(v_referral_code)
    AND id != NEW.id
    LIMIT 1;

    IF v_referrer_id IS NOT NULL THEN
      UPDATE profiles
      SET referred_by = v_referrer_id
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_referral ON auth.users;
CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION resolve_referral_code();

-- Update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update ticket updated_at
DROP TRIGGER IF EXISTS tickets_updated_at ON tickets;
CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment device message counter
CREATE OR REPLACE FUNCTION increment_device_messages()
RETURNS TRIGGER AS $$
DECLARE
  v_sub_id UUID;
BEGIN
  IF NEW.direction = 'outgoing' AND NEW.status = 'sent' THEN
    UPDATE devices SET messages_sent = messages_sent + 1 WHERE id = NEW.device_id;
    -- Find the latest active subscription ID first, then update it
    SELECT id INTO v_sub_id
    FROM subscriptions
    WHERE user_id = NEW.user_id AND status IN ('trial','active')
    ORDER BY created_at DESC
    LIMIT 1;
    IF v_sub_id IS NOT NULL THEN
      UPDATE subscriptions SET messages_used = messages_used + 1
      WHERE id = v_sub_id;
    END IF;
  ELSIF NEW.direction = 'incoming' THEN
    UPDATE devices SET messages_received = messages_received + 1 WHERE id = NEW.device_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION increment_device_messages();

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Plans
INSERT INTO plans (name, name_ar, slug, description, description_ar, price, duration_days, trial_days, message_limit, device_limit, features, is_recommended, sort_order)
VALUES
  ('Basic', 'الأساسية', 'basic', 'Perfect for starters', 'مثالية للبداية', 39.00, 30, 3, 1000, 1,
   '{"auto_reply":true,"send_message":true,"send_media":true,"api":true,"webhook":true,"ai":false,"bulk_send":false,"scheduling":false,"chatflow":false,"file_manager":true,"phonebook":true,"number_filter":false}',
   false, 1),
  ('Professional', 'الاحترافية', 'professional', 'For growing businesses', 'للأعمال المتنامية', 79.00, 30, 7, 10000, 3,
   '{"auto_reply":true,"send_message":true,"send_media":true,"api":true,"webhook":true,"ai":true,"bulk_send":true,"scheduling":true,"chatflow":true,"warmer":true,"file_manager":true,"phonebook":true,"number_filter":true}',
   true, 2),
  ('Business', 'الأعمال', 'business', 'Full power for enterprises', 'القوة الكاملة للمؤسسات', 99.00, 30, 0, 100000, 10,
   '{"auto_reply":true,"send_message":true,"send_media":true,"api":true,"webhook":true,"ai":true,"bulk_send":true,"scheduling":true,"chatflow":true,"warmer":true,"live_chat":true,"team":true,"advanced_analytics":true,"file_manager":true,"phonebook":true,"number_filter":true}',
   false, 3)
ON CONFLICT (slug) DO NOTHING;

-- System settings defaults
INSERT INTO system_settings (id, settings)
VALUES ('global', '{
  "platform_name": "Tsab Bot",
  "gemini_api_key": "",
  "default_system_prompt": "أنت مساعد ذكي ومفيد. أجب باللغة التي يكتب بها المستخدم.",
  "maintenance_mode": false,
  "global_announcement": "",
  "commission_rate": 10,
  "min_withdrawal": 25,
  "referral_hold_days": 14
}')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE BUCKET (run separately if needed)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage Policy: authenticated users can upload
-- CREATE POLICY "auth_upload" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Storage Policy: public read
-- CREATE POLICY "public_read" ON storage.objects FOR SELECT
--   USING (bucket_id = 'media');

-- Storage Policy: owners can delete
-- CREATE POLICY "owner_delete" ON storage.objects FOR DELETE
--   USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- END OF SCHEMA
-- ============================================
