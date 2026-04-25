-- ============================================================
-- TSAB BOT - V4 Smart Bot + Jobs Migration
-- Run AFTER complete_setup.sql + v2 + v3
-- ============================================================

-- 1) JOBS: Admin manages open positions
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  location_ar TEXT DEFAULT 'عن بُعد',
  location_en TEXT DEFAULT 'Remote',
  type_ar TEXT DEFAULT 'دوام كامل',
  type_en TEXT DEFAULT 'Full-time',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jobs_public_read" ON jobs;
CREATE POLICY "jobs_public_read" ON jobs FOR SELECT USING (is_active = true OR is_admin());
DROP POLICY IF EXISTS "jobs_admin_all" ON jobs;
CREATE POLICY "jobs_admin_all" ON jobs FOR ALL USING (is_admin());

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed default jobs
INSERT INTO jobs (slug, title_ar, title_en, description_ar, description_en, sort_order) VALUES
  ('fullstack', 'مطوّر Full-Stack', 'Full-Stack Developer', 'Next.js + Supabase + TypeScript', 'Next.js + Supabase + TypeScript', 1),
  ('wa-eng', 'مهندس WhatsApp Integration', 'WhatsApp Integration Engineer', 'Node.js + Baileys + Real-time', 'Node.js + Baileys + Real-time', 2),
  ('ai', 'مهندس AI/ML', 'AI/ML Engineer', 'Gemini + LLMs + Prompt Engineering', 'Gemini + LLMs + Prompt Engineering', 3)
ON CONFLICT (slug) DO NOTHING;


-- 2) BOT_FAQS: Smart replies without AI
-- When same question repeats X times, save the answer here for direct use
CREATE TABLE IF NOT EXISTS bot_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_normalized TEXT NOT NULL,  -- lowercased + trimmed for matching
  question_original TEXT NOT NULL,
  answer TEXT NOT NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'auto_learned', 'greeting')),
  hits_count INTEGER DEFAULT 0,       -- how many times this Q matched
  is_active BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, question_normalized)
);

CREATE INDEX IF NOT EXISTS idx_bot_faqs_device ON bot_faqs(device_id);
CREATE INDEX IF NOT EXISTS idx_bot_faqs_active ON bot_faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_bot_faqs_normalized ON bot_faqs(device_id, question_normalized);

ALTER TABLE bot_faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bot_faqs_own" ON bot_faqs;
CREATE POLICY "bot_faqs_own" ON bot_faqs FOR ALL USING (auth.uid() = user_id OR is_admin());

DROP TRIGGER IF EXISTS bot_faqs_updated_at ON bot_faqs;
CREATE TRIGGER bot_faqs_updated_at BEFORE UPDATE ON bot_faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 3) FAQ_LEARNING_QUEUE: Tracks repeated questions for auto-learning
-- When count >= threshold (default 3), promote to bot_faqs
CREATE TABLE IF NOT EXISTS faq_learning_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  question_normalized TEXT NOT NULL,
  last_question TEXT,
  last_ai_answer TEXT,
  count INTEGER DEFAULT 1,
  promoted BOOLEAN DEFAULT false,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, question_normalized)
);

CREATE INDEX IF NOT EXISTS idx_learning_device ON faq_learning_queue(device_id);
CREATE INDEX IF NOT EXISTS idx_learning_count ON faq_learning_queue(count DESC);

ALTER TABLE faq_learning_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "faq_learning_own" ON faq_learning_queue;
CREATE POLICY "faq_learning_own" ON faq_learning_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM devices WHERE devices.id = faq_learning_queue.device_id AND (devices.user_id = auth.uid() OR is_admin()))
);


-- 4) BUSINESS_PROFILE: Per-user store/business info that AI uses for context
CREATE TABLE IF NOT EXISTS business_profile (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT,
  business_type TEXT, -- e.g. 'متجر إلكتروني', 'خدمات تسويق', 'مطعم'
  description TEXT,
  bot_personality TEXT DEFAULT 'ودود ومحترف', -- friendly | formal | casual | etc
  greeting_message TEXT,
  off_topic_response TEXT, -- what to say when question is off-topic
  handoff_message TEXT, -- when to hand off to human
  payment_info TEXT, -- payment methods/instructions
  working_hours TEXT,
  contact_info TEXT,
  services JSONB DEFAULT '[]', -- [{name, description, price, link, category}]
  custom_rules TEXT, -- additional AI instructions
  language TEXT DEFAULT 'ar',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE business_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_profile_own" ON business_profile;
CREATE POLICY "business_profile_own" ON business_profile FOR ALL USING (auth.uid() = user_id OR is_admin());

DROP TRIGGER IF EXISTS business_profile_updated_at ON business_profile;
CREATE TRIGGER business_profile_updated_at BEFORE UPDATE ON business_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 5) CONTACTS: add country_code column for filtering/grouping
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
  CHECK (source IN ('manual', 'wa_phonebook', 'wa_chats', 'imported_csv', 'campaign'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_contacts_country ON contacts(country_code);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);


-- 6) Greeting patterns (per language) — seed common greetings as global templates
-- These are stored as global FAQs that any device can use as fallback
CREATE TABLE IF NOT EXISTS global_greetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern TEXT NOT NULL,
  language TEXT DEFAULT 'ar',
  default_response TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE global_greetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "greetings_read" ON global_greetings;
CREATE POLICY "greetings_read" ON global_greetings FOR SELECT USING (true);
DROP POLICY IF EXISTS "greetings_admin" ON global_greetings;
CREATE POLICY "greetings_admin" ON global_greetings FOR ALL USING (is_admin());

INSERT INTO global_greetings (pattern, language, default_response) VALUES
  ('السلام عليكم', 'ar', 'وعليكم السلام ورحمة الله وبركاته 👋 كيف أقدر أساعدك اليوم؟'),
  ('سلام', 'ar', 'وعليكم السلام 👋 كيف أقدر أساعدك؟'),
  ('مرحبا', 'ar', 'مرحباً بك 👋 كيف أقدر أساعدك اليوم؟'),
  ('اهلا', 'ar', 'أهلاً وسهلاً بك 👋 كيف أقدر أخدمك؟'),
  ('هلا', 'ar', 'هلا والله 👋 تفضّل، كيف أقدر أساعدك؟'),
  ('صباح الخير', 'ar', 'صباح النور 🌞 كيف أقدر أخدمك؟'),
  ('مساء الخير', 'ar', 'مساء النور 🌙 تفضّل، كيف أساعدك؟'),
  ('السلام', 'ar', 'وعليكم السلام 👋 كيف أساعدك؟'),
  ('hi', 'en', 'Hi there! 👋 How can I help you today?'),
  ('hello', 'en', 'Hello! 👋 How can I help you?'),
  ('hey', 'en', 'Hey! 👋 What can I do for you?'),
  ('good morning', 'en', 'Good morning! ☀️ How can I help?'),
  ('good evening', 'en', 'Good evening! 🌙 How can I help?')
ON CONFLICT DO NOTHING;


-- 7) Verify
SELECT
  (SELECT COUNT(*) FROM jobs) AS jobs_count,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='bot_faqs') AS has_bot_faqs,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='business_profile') AS has_business_profile,
  (SELECT COUNT(*) FROM global_greetings) AS greetings_count,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='contacts' AND column_name='country_code') AS has_country_code;
