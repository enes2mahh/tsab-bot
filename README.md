# Tsab Bot — منصة أتمتة واتساب بالذكاء الاصطناعي

منصة SaaS متكاملة لإدارة بوتات واتساب مع ردود ذكية فورية بقوة Google Gemini AI.

---

## التقنيات المستخدمة

| الطبقة | التقنية |
|--------|---------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| CSS | Tailwind CSS v4 |
| قاعدة البيانات | Supabase (PostgreSQL) |
| المصادقة | Supabase Auth |
| الذكاء الاصطناعي | Google Gemini 2.0 Flash |
| الرسوم البيانية | Recharts |
| الأيقونات | Lucide React |
| واتساب | Baileys (WA Server منفصل) |

---

## هيكل المشروع

```
tsab-bot/
├── src/
│   ├── app/
│   │   ├── (admin)/          # لوحة الإدارة (admin فقط)
│   │   │   └── admin/
│   │   │       ├── page.tsx           # الرئيسية - إحصاءات عامة
│   │   │       ├── analytics/page.tsx # تحليلات متقدمة
│   │   │       ├── users/page.tsx     # إدارة المستخدمين
│   │   │       ├── plans/page.tsx     # إدارة الخطط
│   │   │       ├── codes/page.tsx     # أكواد التفعيل
│   │   │       ├── tickets/page.tsx   # تذاكر الدعم
│   │   │       ├── referrals/page.tsx # الإحالات والسحوبات
│   │   │       └── settings/page.tsx  # إعدادات النظام
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/      # لوحة تحكم المستخدم
│   │   │   ├── home/page.tsx
│   │   │   ├── devices/page.tsx
│   │   │   ├── campaigns/page.tsx
│   │   │   ├── messages/page.tsx
│   │   │   ├── autoreply/page.tsx
│   │   │   ├── chatflow/page.tsx
│   │   │   ├── templates/page.tsx
│   │   │   ├── contacts/page.tsx
│   │   │   ├── files/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── tickets/page.tsx
│   │   │   ├── plans/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── referrals/page.tsx
│   │   │   ├── filter/page.tsx
│   │   │   ├── warmer/page.tsx
│   │   │   └── api-docs/page.tsx
│   │   ├── privacy/page.tsx  # سياسة الخصوصية (EN+AR)
│   │   ├── terms/page.tsx    # شروط الخدمة (EN+AR)
│   │   ├── page.tsx          # الصفحة الرئيسية Landing
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── cosmic/           # مؤثرات بصرية
│   │   ├── landing/          # محتوى الصفحة الرئيسية (ثنائي اللغة)
│   │   └── layout/           # Sidebar + Header
│   ├── lib/
│   │   ├── supabase/         # client + server
│   │   ├── ai/               # Gemini integration
│   │   └── payments/         # Moyasar + Stripe + HyperPay
│   └── middleware.ts          # حماية المسارات + فحص الأدمن
├── supabase/
│   ├── complete_setup.sql    # ← الملف الرئيسي للإعداد الكامل
│   └── schema.sql
└── wa-server/                # خادم واتساب (Baileys) منفصل
```

---

## الإعداد من الصفر

### 1. إعداد Supabase

1. اذهب إلى [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً
2. افتح **SQL Editor**
3. انسخ محتوى `supabase/complete_setup.sql` كاملاً والصقه وشغّله
4. انتظر حتى ينتهي التنفيذ — لا يجب أن يكون هناك أخطاء

### 2. إنشاء حساب الماستر أدمن

1. في Supabase Dashboard: **Authentication → Users → Add User**
2. أدخل:
   - Email: `admin@your-domain.com`
   - Password: كلمة مرور قوية
3. بعد الإنشاء، افتح **SQL Editor** وشغّل:
```sql
UPDATE profiles
SET role = 'admin', name = 'Super Admin'
WHERE email = 'admin@your-domain.com';
```

### 3. متغيرات البيئة

أنشئ ملف `.env.local` في مجلد `tsab-bot`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# اختياري:
GEMINI_API_KEY=AIzaSy...
MOYASAR_PUBLISHABLE_KEY=pk_...
MOYASAR_SECRET_KEY=sk_...
```

### 4. تشغيل المشروع

```bash
cd tsab-bot
npm install
npm run dev
# الموقع على: http://localhost:3000
```

---

## إعداد Storage (رفع الملفات)

في Supabase SQL Editor:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "owner_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## جداول قاعدة البيانات

| الجدول | الوصف |
|--------|-------|
| `profiles` | بيانات المستخدمين (يمتد auth.users) |
| `plans` | خطط الاشتراك |
| `subscriptions` | اشتراكات المستخدمين |
| `activation_codes` | أكواد التفعيل |
| `devices` | أجهزة واتساب المربوطة |
| `messages` | سجل الرسائل |
| `campaigns` | الحملات الجماعية |
| `auto_replies` | قواعد الرد التلقائي |
| `chat_flows` | تدفقات المحادثة |
| `chatflow_sessions` | جلسات تدفق المحادثة النشطة |
| `contacts` | دليل الهاتف |
| `templates` | قوالب الرسائل |
| `files` | ملفات المستخدمين |
| `tickets` | تذاكر الدعم |
| `ticket_messages` | رسائل التذاكر |
| `referrals` | نظام الإحالات |
| `withdrawals` | طلبات سحب العمولات |
| `warmer_sessions` | جلسات WA Warmer |
| `webhook_logs` | سجلات الـ Webhook |
| `ai_usage_logs` | سجلات استخدام AI |
| `system_settings` | إعدادات النظام |

---

## صلاحيات المستخدمين

| الدور | الوصول |
|-------|-------|
| `user` | لوحة التحكم فقط `/home` ... |
| `support` | قريباً |
| `admin` | لوحة الإدارة الكاملة `/admin` |

---

## لوحة الإدارة `/admin`

| الصفحة | الوظيفة |
|--------|---------|
| `/admin` | إحصاءات عامة + روابط سريعة |
| `/admin/analytics` | تحليلات متقدمة + رسوم بيانية + فلترة (7/30/90 يوم) |
| `/admin/users` | قائمة + بحث + تفاصيل + حظر + تمديد + تغيير خطة |
| `/admin/plans` | إضافة/تعديل/حذف الخطط + إدارة الميزات بالكامل |
| `/admin/codes` | إنشاء أكواد تفعيل + نسخ + تعطيل + حذف |
| `/admin/tickets` | عرض التذاكر + الرد + تغيير الحالة |
| `/admin/referrals` | طلبات السحب + قبول/رفض + إعدادات العمولة |
| `/admin/settings` | Gemini API + System Prompt + إعلانات + وضع الصيانة |

---

## الصفحات القانونية

- `/privacy` — سياسة الخصوصية (عربي + إنجليزي)
- `/terms` — شروط الخدمة (عربي + إنجليزي)

---

## دعم اللغتين

الصفحة الرئيسية (Landing) تدعم العربية والإنجليزية بزر تبديل في navbar.
لوحة التحكم حالياً بالعربية. لتوسيعها بالإنجليزية استخدم `next-intl` المثبت.

---

## سياسات RLS

- كل مستخدم يصل لبياناته فقط
- الأدمن يتحكم في كل شيء عبر `is_admin()`
- الخطط النشطة قابلة للقراءة للجميع
- الإعدادات للأدمن فقط

---

## الـ Triggers التلقائية

| الـ Trigger | الوظيفة |
|------------|---------|
| `on_auth_user_created` | ينشئ profile تلقائياً عند التسجيل |
| `on_auth_user_created_referral` | يربط كود الإحالة |
| `on_profile_created` | ينشئ اشتراك تجريبي تلقائياً |
| `on_message_created` | يحدّث عداد الرسائل والاشتراك |
| `profiles_updated_at` | يحدّث updated_at |
| `tickets_updated_at` | يحدّث updated_at للتذاكر |

---

## النشر (Deployment)

### Vercel
```bash
# 1. ارفع المشروع على GitHub
# 2. اربطه بـ Vercel
# 3. أضف ENV variables في Vercel Dashboard
# 4. Deploy تلقائي
```

---

## تكاليف البداية

| البند | التكلفة |
|-------|---------|
| Vercel Hobby | مجاناً |
| Supabase Free Tier | مجاناً |
| Gemini Free Tier | مجاناً (15 req/min) |
| Domain | ~50 SAR/سنة |
| **الإجمالي** | **~0 SAR/شهر** |

---

## ملاحظات

> ⚠️ **Baileys** مكتبة غير رسمية. استخدم WA Warmer وتأخير عشوائي لحماية الأرقام.

> 🔑 احصل على **Gemini API Key** مجاناً من [aistudio.google.com](https://aistudio.google.com)

> 🚀 ابدأ مجاناً بـ Supabase Free + Vercel Hobby
