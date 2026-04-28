# 🏗️ هيكل المشروع الكامل

```
wa-platform/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── redis.js
│   │   │   └── env.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Device.js
│   │   │   ├── Message.js
│   │   │   ├── Campaign.js
│   │   │   ├── Contact.js
│   │   │   ├── Plan.js
│   │   │   ├── Subscription.js
│   │   │   ├── Template.js
│   │   │   ├── AutoReply.js
│   │   │   ├── ChatFlow.js
│   │   │   ├── Ticket.js
│   │   │   ├── Referral.js
│   │   │   ├── File.js
│   │   │   └── WebhookLog.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── devices.routes.js
│   │   │   ├── messages.routes.js
│   │   │   ├── campaigns.routes.js
│   │   │   ├── contacts.routes.js
│   │   │   ├── files.routes.js
│   │   │   ├── plans.routes.js
│   │   │   ├── autoreply.routes.js
│   │   │   ├── templates.routes.js
│   │   │   ├── chatflow.routes.js
│   │   │   ├── tickets.routes.js
│   │   │   ├── referrals.routes.js
│   │   │   ├── warmer.routes.js
│   │   │   ├── filter.routes.js
│   │   │   ├── webhook.routes.js
│   │   │   ├── reports.routes.js
│   │   │   ├── instagram.routes.js
│   │   │   ├── admin.routes.js
│   │   │   └── developer.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── devices.controller.js
│   │   │   ├── messages.controller.js
│   │   │   ├── campaigns.controller.js
│   │   │   ├── contacts.controller.js
│   │   │   ├── files.controller.js
│   │   │   ├── plans.controller.js
│   │   │   ├── autoreply.controller.js
│   │   │   ├── chatflow.controller.js
│   │   │   ├── ai.controller.js
│   │   │   ├── warmer.controller.js
│   │   │   ├── filter.controller.js
│   │   │   ├── webhook.controller.js
│   │   │   ├── reports.controller.js
│   │   │   └── admin.controller.js
│   │   ├── services/
│   │   │   ├── whatsapp.service.js
│   │   │   ├── ai.service.js
│   │   │   ├── queue.service.js
│   │   │   ├── storage.service.js
│   │   │   ├── sms.service.js
│   │   │   ├── payment.service.js
│   │   │   ├── email.service.js
│   │   │   ├── referral.service.js
│   │   │   └── webhook.service.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── plan.middleware.js
│   │   │   ├── rateLimit.middleware.js
│   │   │   ├── upload.middleware.js
│   │   │   └── admin.middleware.js
│   │   ├── jobs/
│   │   │   ├── sendMessage.job.js
│   │   │   ├── campaign.job.js
│   │   │   ├── warmer.job.js
│   │   │   ├── scheduler.job.js
│   │   │   └── webhook.job.js
│   │   ├── websocket/
│   │   │   ├── qr.socket.js
│   │   │   ├── message.socket.js
│   │   │   └── device.socket.js
│   │   └── app.js
│   ├── migrations/
│   ├── seeders/
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── dashboard/
│   │   │       ├── Home.jsx
│   │   │       ├── Devices.jsx
│   │   │       ├── FileManager.jsx
│   │   │       ├── PhoneBook.jsx
│   │   │       ├── Campaigns.jsx
│   │   │       ├── MessageLog.jsx
│   │   │       ├── AutoReply.jsx
│   │   │       ├── ChatFlow.jsx
│   │   │       ├── Templates.jsx
│   │   │       ├── Plans.jsx
│   │   │       ├── NumberFilter.jsx
│   │   │       ├── WAWarmer.jsx
│   │   │       ├── LiveChat.jsx
│   │   │       ├── Instagram.jsx
│   │   │       ├── InstagramChat.jsx
│   │   │       ├── Tickets.jsx
│   │   │       ├── ReferralCenter.jsx
│   │   │       ├── Settings.jsx
│   │   │       └── ApiDocs.jsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Devices.jsx
│   │   │   ├── Plans.jsx
│   │   │   ├── Subscriptions.jsx
│   │   │   ├── Messages.jsx
│   │   │   ├── Campaigns.jsx
│   │   │   ├── Tickets.jsx
│   │   │   ├── Referrals.jsx
│   │   │   ├── Withdrawals.jsx
│   │   │   ├── Revenue.jsx
│   │   │   ├── SystemSettings.jsx
│   │   │   └── AiSettings.jsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── ui/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Table.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Dropdown.jsx
│   │   │   │   └── Toast.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── DeviceCard.jsx
│   │   │   ├── QRCodeModal.jsx
│   │   │   ├── MessageComposer.jsx
│   │   │   ├── CampaignBuilder.jsx
│   │   │   ├── ChatFlowBuilder.jsx
│   │   │   ├── PlanCard.jsx
│   │   │   └── Charts/
│   │   │       ├── LineChart.jsx
│   │   │       ├── BarChart.jsx
│   │   │       └── DonutChart.jsx
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   ├── deviceStore.js
│   │   │   └── uiStore.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useSocket.js
│   │   │   └── useDevices.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── auth.service.js
│   │   │   ├── device.service.js
│   │   │   └── message.service.js
│   │   ├── utils/
│   │   │   ├── helpers.js
│   │   │   └── constants.js
│   │   ├── i18n/
│   │   │   ├── ar.json
│   │   │   └── en.json
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   └── schema.sql
├── docs/
│   ├── API.md
│   └── SETUP.md
├── docker-compose.yml
└── README.md
```

---

## 🗄️ مخطط قاعدة البيانات الكامل

```sql
-- ===========================
-- الجداول الأساسية
-- ===========================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- المستخدمون
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  api_key VARCHAR(64) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'support')),
  referral_code VARCHAR(20) UNIQUE,
  referred_by UUID REFERENCES users(id),
  otp_enabled BOOLEAN DEFAULT false,
  otp_phone VARCHAR(20),
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  language VARCHAR(5) DEFAULT 'ar',
  data_retention_days INT DEFAULT 90,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- الخطط
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INT NOT NULL DEFAULT 30,
  trial_days INT DEFAULT 0,
  message_limit INT NOT NULL,
  device_limit INT NOT NULL,
  features JSONB DEFAULT '{}',
  addons JSONB DEFAULT '[]',
  is_recommended BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- الاشتراكات
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('trial','active','expired','cancelled','suspended')),
  messages_used INT DEFAULT 0,
  messages_limit INT NOT NULL,
  starts_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  trial_ends_at TIMESTAMP,
  payment_ref VARCHAR(100),
  payment_method VARCHAR(50),
  amount_paid DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'SAR',
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- الأجهزة (حسابات الواتساب)
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(100) DEFAULT 'جهازي',
  status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('connected','disconnected','expired','banned','connecting')),
  session_data TEXT,
  webhook_url VARCHAR(500),
  messages_sent INT DEFAULT 0,
  messages_received INT DEFAULT 0,
  ai_enabled BOOLEAN DEFAULT false,
  ai_prompt TEXT DEFAULT 'أنت مساعد ذكي لخدمة العملاء. أجب بشكل ودي ومهني.',
  ai_model VARCHAR(50) DEFAULT 'gemini-2.0-flash',
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- الرسائل
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  campaign_id UUID,
  chatflow_id UUID,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('outgoing','incoming')),
  to_number VARCHAR(20),
  from_number VARCHAR(20),
  type VARCHAR(20) NOT NULL CHECK (type IN (
    'text','image','video','document','location',
    'product','list','button','poll','sticker',
    'contact','audio','reaction','channel_text'
  )),
  content JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','read','failed')),
  wa_message_id VARCHAR(200),
  error_message TEXT,
  is_scheduled BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- الحملات
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','scheduled','running','paused','completed','failed','cancelled')),
  message_type VARCHAR(20) NOT NULL,
  message_content JSONB NOT NULL,
  recipient_type VARCHAR(20) DEFAULT 'numbers' CHECK (recipient_type IN ('contacts','numbers','file','phonebook')),
  recipients JSONB,
  recipient_file_url VARCHAR(500),
  delay_min INT DEFAULT 3,
  delay_max INT DEFAULT 7,
  total_count INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  pending_count INT DEFAULT 0,
  is_scheduled BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- جهات الاتصال
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  email VARCHAR(150),
  tags JSONB DEFAULT '[]',
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  is_blocked BOOLEAN DEFAULT false,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, phone)
);

-- الردود التلقائية
CREATE TABLE auto_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  trigger_type VARCHAR(30) NOT NULL CHECK (trigger_type IN (
    'keyword','first_message','all','outside_hours',
    'contains','starts_with','ends_with','regex'
  )),
  trigger_value VARCHAR(500),
  trigger_keywords JSONB DEFAULT '[]',
  response_type VARCHAR(20) NOT NULL CHECK (response_type IN (
    'text','image','video','document','list',
    'button','location','chatflow','template'
  )),
  response_content JSONB NOT NULL,
  working_hours_start TIME,
  working_hours_end TIME,
  working_days JSONB DEFAULT '[1,2,3,4,5]',
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  uses_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- تدفقات المحادثة (ChatBot)
CREATE TABLE chat_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(20) DEFAULT 'keyword',
  trigger_keyword VARCHAR(200),
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  uses_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- حالة المستخدم في تدفق المحادثة
CREATE TABLE chatflow_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id),
  contact_phone VARCHAR(20) NOT NULL,
  chatflow_id UUID REFERENCES chat_flows(id),
  current_node_id VARCHAR(100),
  context JSONB DEFAULT '{}',
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT false
);

-- القوالب
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL,
  content JSONB NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  uses_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- تذاكر الدعم
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(500) NOT NULL,
  department VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting','closed')),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  is_staff BOOLEAN DEFAULT false,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- الإحالات
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id),
  referee_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  commission_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','available','withdrawn','expired')),
  available_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- طلبات سحب الأرباح
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) DEFAULT 'bank_transfer',
  bank_details JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
  admin_note TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- WA Warmer جلسات
CREATE TABLE warmer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) DEFAULT 'جلسة التدفئة',
  device_ids JSONB NOT NULL DEFAULT '[]',
  daily_target INT DEFAULT 5,
  current_day INT DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  messages_today INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  started_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- سجل الـ Webhook
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id),
  url VARCHAR(500),
  event_type VARCHAR(50),
  payload JSONB,
  response_status INT,
  response_body TEXT,
  attempts INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- الملفات
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  path VARCHAR(500) NOT NULL,
  url VARCHAR(500),
  size BIGINT,
  mime_type VARCHAR(100),
  folder VARCHAR(255) DEFAULT '/',
  created_at TIMESTAMP DEFAULT NOW()
);

-- سجل استخدام الذكاء الاصطناعي
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  device_id UUID REFERENCES devices(id),
  model VARCHAR(50),
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  cost_usd DECIMAL(10,6),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- Indexes للأداء
-- ===========================
CREATE INDEX idx_messages_device_id ON messages(device_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);

-- ===========================
-- الخطط الافتراضية
-- ===========================
INSERT INTO plans (name, name_ar, slug, price, duration_days, trial_days, message_limit, device_limit, features, is_recommended, sort_order) VALUES
('Basic', 'الأساسية', 'basic', 39.00, 30, 3, 1000, 1,
  '{"auto_reply":true,"send_message":true,"send_media":true,"send_product":true,"send_list":true,"send_button":true,"send_location":true,"send_poll":true,"send_sticker":true,"api":true,"webhook":true,"ai":false,"bulk_send":false,"scheduling":false,"channel_text":false}',
  false, 1),
('Professional', 'الاحترافية', 'professional', 79.00, 30, 7, 10000, 3,
  '{"auto_reply":true,"send_message":true,"send_media":true,"send_product":true,"send_list":true,"send_button":true,"send_location":true,"send_poll":true,"send_sticker":true,"api":true,"webhook":true,"ai":true,"bulk_send":true,"scheduling":true,"channel_text":true}',
  true, 2),
('Business', 'الأعمال', 'business', 99.00, 30, 0, 100000, 10,
  '{"auto_reply":true,"send_message":true,"send_media":true,"send_product":true,"send_list":true,"send_button":true,"send_location":true,"send_poll":true,"send_sticker":true,"api":true,"webhook":true,"ai":true,"bulk_send":true,"scheduling":true,"channel_text":true,"live_chat":true,"team_members":true,"advanced_analytics":true}',
  false, 3);
```
