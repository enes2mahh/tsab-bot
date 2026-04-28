# Phase 1: Foundation - تأسيس المشروع

## Stack النهائي
- **Frontend + Backend:** Next.js 14 (App Router) على Vercel
- **Database + Auth + Storage + Realtime:** Supabase (مجاني)
- **WhatsApp Server:** Baileys على Railway (مجاني)
- **AI:** Google Gemini 2.0 Flash (مجاني 15 req/min)
- **UI:** Tailwind CSS + shadcn/ui + Framer Motion

## التصميم - نظام الألوان (Tsab Bot)
```css
/* الألوان الرئيسية */
--bg-primary: #080812        /* أسود كوني عميق */
--bg-secondary: #0E0E1A      /* خلفية ثانوية */
--bg-card: #12121F           /* بطاقات */
--accent-violet: #7C3AED     /* بنفسجي أساسي */
--accent-violet-light: #A78BFA
--accent-gold: #F59E0B       /* ذهبي للـ premium */
--accent-emerald: #10B981    /* أخضر واتساب */
--text-primary: #F8FAFC
--text-secondary: #94A3B8
--border: #1E1E35
--gradient: linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #10B981 100%)

/* الخطوط */
font-arabic: 'Tajawal', sans-serif
font-english: 'Inter', sans-serif
```

## خطوات Phase 1

### الخطوة 1: إنشاء مشروع Next.js
```bash
npx create-next-app@latest tsab-bot --typescript --tailwind --app --src-dir
cd tsab-bot
```

### الخطوة 2: تثبيت الحزم
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install framer-motion
npm install lucide-react
npm install clsx tailwind-merge
npm install class-variance-authority
npm install next-themes
npm install react-hook-form @hookform/resolvers zod
npm install recharts
npm install socket.io-client
npm install @tanstack/react-query
npm install sonner
npm install next-intl
npx shadcn@latest init
```

### الخطوة 3: إعداد Supabase
1. اذهب لـ https://supabase.com
2. أنشئ مشروع جديد اسمه: `tsab-bot`
3. انتظر حتى يكتمل الإعداد
4. من **Settings > API** انسخ:
   - Project URL
   - anon/public key
   - service_role key (سري!)

### الخطوة 4: متغيرات البيئة
أنشئ ملف `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_WA_SERVER_URL=https://your-railway-app.railway.app
WA_SERVER_SECRET=your-secret-key-min-32-chars
GEMINI_API_KEY=your-gemini-key
NEXT_PUBLIC_APP_NAME=Tsab Bot
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### الخطوة 5: قاعدة البيانات - Supabase SQL
اذهب لـ **Supabase > SQL Editor** وشغّل:

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (امتداد لـ auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'support')),
  api_key TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  referral_code TEXT UNIQUE DEFAULT upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  referred_by UUID REFERENCES profiles(id),
  timezone TEXT DEFAULT 'Asia/Riyadh',
  language TEXT DEFAULT 'ar',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_ar TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  trial_days INTEGER DEFAULT 0,
  message_limit INTEGER NOT NULL,
  device_limit INTEGER NOT NULL,
  features JSONB DEFAULT '{}',
  is_recommended BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) NOT NULL,
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial','active','expired','cancelled','suspended')),
  messages_used INTEGER DEFAULT 0,
  messages_limit INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  activation_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation Codes (بدلاً من بوابة الدفع)
CREATE TABLE activation_codes (
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
CREATE TABLE devices (
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
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  campaign_id UUID,
  direction TEXT NOT NULL CHECK (direction IN ('outgoing','incoming')),
  to_number TEXT,
  from_number TEXT,
  contact_name TEXT,
  type TEXT NOT NULL DEFAULT 'text',
  content JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','read','failed')),
  wa_message_id TEXT,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','running','paused','completed','failed','cancelled')),
  message_type TEXT NOT NULL DEFAULT 'text',
  message_content JSONB NOT NULL,
  recipient_type TEXT DEFAULT 'numbers' CHECK (recipient_type IN ('numbers','contacts','file')),
  recipients JSONB,
  delay_min INTEGER DEFAULT 3,
  delay_max INTEGER DEFAULT 7,
  total_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  tags JSONB DEFAULT '[]',
  notes TEXT,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phone)
);

-- Auto Replies
CREATE TABLE auto_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword','contains','starts_with','first_message','all','outside_hours')),
  trigger_value TEXT,
  response_type TEXT NOT NULL CHECK (response_type IN ('text','image','video','document','list','button','template')),
  response_content JSONB NOT NULL,
  working_hours_start TIME,
  working_hours_end TIME,
  working_days JSONB DEFAULT '[0,1,2,3,4,5,6]',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Flows
CREATE TABLE chat_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger_keyword TEXT,
  nodes JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chatflow Sessions
CREATE TABLE chatflow_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id),
  contact_phone TEXT NOT NULL,
  chatflow_id UUID REFERENCES chat_flows(id) ON DELETE CASCADE,
  current_node_id TEXT,
  context JSONB DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  original_name TEXT,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  size BIGINT,
  mime_type TEXT,
  folder TEXT DEFAULT '/',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  department TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting','closed')),
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  is_staff BOOLEAN DEFAULT false,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES profiles(id) NOT NULL,
  referee_id UUID REFERENCES profiles(id) NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','available','withdrawn')),
  available_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawals
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT DEFAULT 'bank_transfer',
  bank_details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WA Warmer Sessions
CREATE TABLE warmer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'جلسة التدفئة',
  device_ids JSONB DEFAULT '[]',
  daily_target INTEGER DEFAULT 5,
  current_day INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  messages_today INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Logs
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id),
  url TEXT,
  event_type TEXT,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Usage Logs
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  device_id UUID REFERENCES devices(id),
  model TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- RLS Policies (Row Level Security)
-- ================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- profiles: كل مستخدم يرى بياناته فقط
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Admin يرى كل شيء
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- devices
CREATE POLICY "users_own_devices" ON devices
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_all_devices" ON devices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- messages
CREATE POLICY "users_own_messages" ON messages
  FOR ALL USING (auth.uid() = user_id);

-- campaigns
CREATE POLICY "users_own_campaigns" ON campaigns
  FOR ALL USING (auth.uid() = user_id);

-- contacts
CREATE POLICY "users_own_contacts" ON contacts
  FOR ALL USING (auth.uid() = user_id);

-- auto_replies
CREATE POLICY "users_own_replies" ON auto_replies
  FOR ALL USING (auth.uid() = user_id);

-- chat_flows
CREATE POLICY "users_own_flows" ON chat_flows
  FOR ALL USING (auth.uid() = user_id);

-- templates
CREATE POLICY "users_own_templates" ON templates
  FOR ALL USING (auth.uid() = user_id);

-- files
CREATE POLICY "users_own_files" ON files
  FOR ALL USING (auth.uid() = user_id);

-- tickets
CREATE POLICY "users_own_tickets" ON tickets
  FOR ALL USING (auth.uid() = user_id);

-- subscriptions
CREATE POLICY "users_own_subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- referrals
CREATE POLICY "users_own_referrals" ON referrals
  FOR ALL USING (auth.uid() = referrer_id);

-- withdrawals
CREATE POLICY "users_own_withdrawals" ON withdrawals
  FOR ALL USING (auth.uid() = user_id);

-- ================================
-- الخطط الافتراضية
-- ================================
INSERT INTO plans (name, name_ar, slug, description, description_ar, price, duration_days, trial_days, message_limit, device_limit, features, is_recommended, sort_order)
VALUES
  ('Basic', 'الأساسية', 'basic', 'Perfect for starters', 'مثالية للبداية', 39.00, 30, 3, 1000, 1,
   '{"auto_reply":true,"send_message":true,"send_media":true,"send_product":true,"send_list":true,"send_button":true,"send_location":true,"send_poll":true,"send_sticker":true,"api":true,"webhook":true,"ai":false,"bulk_send":false,"scheduling":false,"channel_text":false,"file_manager":true,"phonebook":true}',
   false, 1),
  ('Professional', 'الاحترافية', 'professional', 'For growing businesses', 'للأعمال المتنامية', 79.00, 30, 7, 10000, 3,
   '{"auto_reply":true,"send_message":true,"send_media":true,"send_product":true,"send_list":true,"send_button":true,"send_location":true,"send_poll":true,"send_sticker":true,"api":true,"webhook":true,"ai":true,"bulk_send":true,"scheduling":true,"channel_text":true,"file_manager":true,"phonebook":true,"chatflow":true,"warmer":true,"number_filter":true}',
   true, 2),
  ('Business', 'الأعمال', 'business', 'Full power for enterprises', 'القوة الكاملة للمؤسسات', 99.00, 30, 0, 100000, 10,
   '{"auto_reply":true,"send_message":true,"send_media":true,"send_product":true,"send_list":true,"send_button":true,"send_location":true,"send_poll":true,"send_sticker":true,"api":true,"webhook":true,"ai":true,"bulk_send":true,"scheduling":true,"channel_text":true,"file_manager":true,"phonebook":true,"chatflow":true,"warmer":true,"number_filter":true,"live_chat":true,"team":true,"advanced_analytics":true}',
   false, 3);

-- Trigger لإنشاء Profile عند التسجيل
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### الخطوة 6: Supabase Storage
في **Supabase > Storage**، أنشئ bucket اسمه `media` واجعله **Public**.

### الخطوة 7: هيكل مشروع Next.js
```
tsab-bot/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── home/page.tsx
│   │   │   │   ├── devices/page.tsx
│   │   │   │   ├── campaigns/page.tsx
│   │   │   │   ├── messages/page.tsx
│   │   │   │   ├── autoreply/page.tsx
│   │   │   │   ├── chatflow/page.tsx
│   │   │   │   ├── contacts/page.tsx
│   │   │   │   ├── files/page.tsx
│   │   │   │   ├── plans/page.tsx
│   │   │   │   ├── warmer/page.tsx
│   │   │   │   ├── filter/page.tsx
│   │   │   │   ├── tickets/page.tsx
│   │   │   │   ├── referrals/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   ├── (admin)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── admin/page.tsx
│   │   │   │   ├── admin/users/page.tsx
│   │   │   │   ├── admin/plans/page.tsx
│   │   │   │   ├── admin/codes/page.tsx
│   │   │   │   ├── admin/tickets/page.tsx
│   │   │   │   ├── admin/referrals/page.tsx
│   │   │   │   └── admin/settings/page.tsx
│   │   │   └── page.tsx (Landing)
│   │   └── api/
│   │       ├── devices/route.ts
│   │       ├── messages/route.ts
│   │       ├── campaigns/route.ts
│   │       └── webhook/route.ts
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── cosmic/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── ai/
│   │   └── utils.ts
│   └── i18n/
├── wa-server/ (Railway)
│   ├── src/
│   │   ├── services/whatsapp.js
│   │   ├── routes/
│   │   └── app.js
│   └── package.json
```

---

## ✅ Checklist Phase 1
- [ ] إنشاء مشروع Next.js
- [ ] تثبيت كل الحزم
- [ ] إنشاء مشروع Supabase
- [ ] نسخ مفاتيح Supabase
- [ ] تشغيل SQL في Supabase
- [ ] إنشاء ملف .env.local
- [ ] إنشاء Supabase Storage bucket
- [ ] تشغيل المشروع محلياً: `npm run dev`

## ▶️ التالي: Phase 2 - Landing Page (Cosmic Design)
