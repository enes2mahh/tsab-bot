# Tsab Bot — منصة أتمتة واتساب بالذكاء الاصطناعي

منصة SaaS متكاملة لإدارة بوتات واتساب مع ردود ذكية فورية بقوة Google Gemini AI.

> **آخر تحديث:** v8 Mobile + Fixes — راجع [قسم التحديثات](#-ما-تم-إنجازه-v8-mobile--fixes) للتفاصيل الكاملة.

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

---

## 🚀 ما تم إنجازه (v8 Mobile + Fixes)

### Mobile Responsiveness — شامل لكل الصفحات

**الاستراتيجية:** بما أن الكود يعتمد على inline styles، أُضيفت CSS classes جديدة في `globals.css` + `useIsMobile` hook.

**CSS Classes الجديدة (في globals.css):**

```css
/* Grid classes — تنهار لعمود واحد على < 768px */
.grid-2          → repeat(2,1fr) | mobile: 1fr
.grid-3          → repeat(3,1fr) | mobile: 1fr
.grid-4          → repeat(4,1fr) | mobile: repeat(2,1fr) → 1fr على < 480px
.grid-auto       → auto-fill minmax(280px,1fr)

/* Layout helpers */
.page-flex-header      → header row | mobile: column + زر عرض كامل
.responsive-table-wrap → overflow-x: auto + touch scrolling
.settings-grid         → sidebar + content | mobile: عمود واحد
.footer-grid           → 4 أعمدة | mobile: 2 ثم 1
.auth-card             → padding تصغير على < 480px

/* Sidebar */
.dashboard-mobile-toggle → زر ثابت لفتح الـ sidebar على الموبايل
.mobile-overlay         → backdrop خلف الـ sidebar
```

**`src/lib/useIsMobile.ts`** — hook جديد:
```ts
import { useIsMobile } from '@/lib/useIsMobile'
const isMobile = useIsMobile() // true إذا < 768px
```

**الصفحات المُحدَّثة (كلها):**
- `globals.css` — base utilities
- كل صفحات الـ dashboard: home, devices, campaigns, messages, autoreply, chatflow, templates, contacts, files, reports, tickets, plans, settings, referrals, filter, warmer, api-docs, messenger, stories, business, faqs
- كل صفحات الـ admin: admin/page, analytics, users, plans, codes, tickets, referrals, settings, all-contacts, jobs, inquiries
- صفحات Auth: login, register
- Landing Page: hamburger menu على الموبايل + تحسين كل الأقسام

**إصلاح `.glass` max-height:** كان يطبّق على كل العناصر فيجعل الكاردات قابلة للتمرير — صُحِّح ليعمل فقط داخل `position: fixed` overlays.

---

### إصلاح Messenger — خطأ "device_id, phone, content مطلوبة"

**المشكلة:** صفحة `/messenger` كانت ترسل:
```js
{ deviceId: ..., text: ... }  // ❌ خاطئ
```
**الإصلاح:** في `src/app/(dashboard)/messenger/page.tsx`:
```js
{ device_id: ..., content: ... }  // ✅ يطابق API
```
الـ API في `src/app/api/messages/send/route.ts` يتوقع: `{ device_id, phone, type, content }`.

---

### تحسين جهات الاتصال — normalizePhone + استيراد دليل الهاتف

**`src/app/(dashboard)/contacts/page.tsx`:**

**1. دالة `normalizePhone()` لاستيراد CSV:**
```ts
function normalizePhone(raw: string): string {
  let phone = raw.replace(/\D/g, '')
  if (phone.startsWith('00')) phone = phone.slice(2)   // 00966 → 966
  if (phone.startsWith('0') && phone.length <= 10)
    phone = '966' + phone.slice(1)                      // 0501 → 966501
  return phone
}
```
قبل: `cols[phoneIdx]?.replace(/\D/g, '')` — يحذف الأحرف فقط بدون تطبيع.
بعد: `normalizePhone(cols[phoneIdx] || '')` — تطبيع كامل للصيغة.

**2. زر "استيراد دليل الهاتف":**
- زر جديد بجانب "استيراد المحادثات"
- يرسل `source: 'phonebook'` بدلاً من `source: 'chats'`
- يستورد **كامل جهات الاتصال المحفوظة** على الهاتف (مش بس المحادثات النشطة)
- يستورد الأسماء إذا كانت محفوظة

**`src/app/api/contacts/import/route.ts`:**
- إذا رجع السيرفر الخارجي `contacts[]` → يحفظها في Supabase مع الأسماء
- `name: c.name || c.pushname || c.notify || null`
- `ignoreDuplicates: false` → يحدّث الاسم إذا تغيّر

---

### إعادة تعيين كلمة المرور — Supabase + قالب مخصص

**المسار الحالي:**
1. زر "نسيت كلمة المرور؟" في `/login`
2. `supabase.auth.resetPasswordForEmail()` → Supabase يرسل الإيميل
3. المستخدم يضغط الرابط → `/auth/reset` → `supabase.auth.updateUser({ password })`

**ملاحظة Resend:** جُرِّب توجيه الإرسال عبر Resend (`/api/auth/forgot-password`) لكن `onboarding@resend.dev` يسمح بالإرسال لبريد حساب Resend فقط — الملف موجود في `src/app/api/auth/forgot-password/route.ts` جاهز للاستخدام عند توفر دومين موثّق.

**قالب Supabase المخصص** — في Supabase → Authentication → Email Templates → Reset Password:
- تصميم بألوان Tsab Bot الكوزمية
- زر CTA واضح + تحذير الساعة + رابط نصي
- متغير: `{{ .ConfirmationURL }}`

---

## 🚀 ما تم إنجازه (v7 Dashboard Overhaul)

### Phase 1 — إصلاحات حرجة
- **`/messages`**: إصلاح schema (to_number/from_number + JSONB content) + source badges (AI/FAQ/Greeting) + mobile cards
- **`/tickets`**: إصلاح الحفظ (ticket + ticket_messages) + modal محادثة كاملة + realtime
- **`/devices`**: AI Settings modal → toggle + رابط للـ business profile
- **Responsive Base**: إضافة CSS utilities في `globals.css` + sidebar drawer على موبايل

### Phase 2 — Campaigns Smart System
- `normalizeRecipients()`: يقبل أرقام مفصولة بأي طريقة، ينظّف رموز الدول، يزيل المكررات
- 3 طرق إدخال: يدوي / CSV / من جهات الاتصال / من جروبات واتساب
- رفع صور متعددة (حتى 5) + مستند + فيديو عبر Supabase Storage
- Stats Modal: donut chart + bar chart + جدول تفصيلي لكل رقم
- WA Server: إضافة `GET /devices/:id/groups` + `getGroups()` بـ Baileys

### Phase 3 — Settings Professional
- بادج تأكيد البريد (✓/✗) + زر إعادة إرسال
- تغيير كلمة المرور مع التحقق من الحالية + strength bar
- `ForgotPasswordModal`: reset بالإيميل أو OTP
- API جديد: `POST /api/auth/reset-password-with-otp`
- Webhook test button + timezone live preview

### Phase 4a — Dashboard Pages
- **`/home`**: إحصاءات حقيقية (count server-side، successRate من campaigns)
- **`/faqs`**: توفير tokens = `hits × 30` + export
- **`/autoreply`**: export CSV/Excel بـ `exportData()`
- **`/templates`**: ربط DB + 20 قالب افتراضي + variable insertion + live preview

### Phase 4b — Dashboard Pages (تكملة)
- **`/contacts`**: استيراد CSV ذكي (EN/AR headers) + قالب فارغ للتنزيل
- **`/files`**: مكتبة ملفات كاملة (grid/list + type filter + storage bar)
- **`/reports`**: period selector (7/30/90) + charts responsive
- **`/api-docs`**: 4 endpoints مع curl+JS + webhook payload + error codes

### Phase 5 — Mobile Responsiveness
- `grid-mobile-1` على كل الـ grids متعددة الأعمدة
- `responsive-table-wrap` على كل الجداول
- `stack-mobile` على flex rows في الـ headers
- pages: home, devices, contacts, reports, warmer, referrals

### Phase 6 — SQL Migrations
ملف `supabase/v7_misc_fixes.sql`:
- `messages.metadata JSONB` — لحفظ source + campaign_id
- `faq_suggestions` view من `faq_learning_queue` مع security_invoker
- 3 indexes (metadata source, created_at, user+date)

### Extras — صفحات متبقية
- **`/chatflow`**: device selector + is_active toggle + delete flows
- **`/warmer`**: sessions log من `warmer_sessions` table
- **`/referrals`**: responsive grids + tables
- **`/login`**: "نسيت كلمة المرور؟" modal فعّال

---

## 📧 Resend Email Integration

```
src/lib/resend.ts           ← sendEmail() + 4 templates
src/app/auth/callback/      ← يستقبل email confirmation redirect
src/app/auth/reset/         ← صفحة تعيين كلمة مرور جديدة
```

**القوالب الجاهزة:**
- `emailWelcome({ name })` — ترحيب بعد التسجيل
- `emailCampaignCompleted({ name, sent, failed, total })` — اكتمال حملة
- `emailSubscriptionExpiring({ name, daysLeft, planName })` — تحذير انتهاء اشتراك
- `emailPasswordReset({ resetLink })` — إعادة تعيين كلمة المرور

**إعداد Supabase SMTP:**
```
Host: smtp.resend.com | Port: 465
Username: resend | Password: RESEND_API_KEY
```

---

## 🔑 متغيرات البيئة الكاملة

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI
GEMINI_API_KEY=AIzaSy...

# WA Server (Railway)
NEXT_PUBLIC_WA_SERVER_URL=https://tsab-bot-production.up.railway.app
WA_SERVER_SECRET=your-secret-key

# App
NEXT_PUBLIC_APP_URL=https://tsab-bot.vercel.app
NEXT_PUBLIC_APP_NAME=Tsab Bot

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Tsab Bot <noreply@yourdomain.com>
RESEND_DOMAIN=yourdomain.com
```

---

## 🗄️ تسلسل ملفات SQL

شغّل بالترتيب في Supabase SQL Editor:

```
1. schema.sql                          ← الأساس الكامل (21 جدول)
2. v2_wa_features.sql                  ← ميزات واتساب
3. v3_public_pages.sql                 ← صفحات عامة
4. v4_smart_bot_jobs.sql               ← bot_faqs + faq_learning_queue
5. v5_notifications_otp_messenger.sql  ← OTP + إشعارات
6. v6_storage_setup.sql                ← media bucket
7. v7_misc_fixes.sql                   ← messages.metadata + indexes ← الجديد
```

---

## 🛠️ المكتبات المشتركة

| الملف | الاستخدام |
|-------|----------|
| `src/lib/export.ts` | `exportData<T>(rows, columns, filename, format)` → CSV/Excel |
| `src/lib/datetime.ts` | `formatDate(date, timezone)` بـ Intl.DateTimeFormat عربي |
| `src/lib/resend.ts` | `sendEmail()` + email templates |
| `src/lib/supabase/client.ts` | browser client |
| `src/lib/supabase/server.ts` | server client + admin client (service_role) |

---

## 📱 نظام Mobile Responsive

```css
/* في globals.css — يعمل على < 768px */
.grid-2                → 1fr (عمود واحد)
.grid-3                → 1fr
.grid-4                → repeat(2,1fr) ثم 1fr على < 480px
.grid-auto             → 1fr
.page-flex-header      → column + زر عرض 100%
.responsive-table-wrap → overflow-x: auto; -webkit-overflow-scrolling: touch
.settings-grid         → عمود واحد
.footer-grid           → 2 أعمدة ثم 1 على < 480px
.auth-card             → padding: 20px
```

الـ sidebar يصير drawer على الموبايل بـ CSS transform + `.mobile-overlay` backdrop.

**`src/lib/useIsMobile.ts`** — لمعالجة inline styles المتجاوبة:
```ts
const isMobile = useIsMobile() // true إذا < 768px
// مثال:
gridTemplateColumns: isMobile ? '1fr' : 'repeat(4,1fr)'
```

---

## 📁 ملفات التوثيق

موجودة في `docs/phases/`:
- `00_START_HERE.md` — نقطة البداية
- `01_PROJECT_OVERVIEW.md` — نظرة عامة
- `PHASE_01_FOUNDATION.md` إلى `PHASE_06_TO_15_REMAINING.md` — خطط التطوير

---

## 🐛 مشاكل شائعة وحلولها

### 1. خطأ "device_id, phone, content مطلوبة" في Messenger
**السبب:** الكليينت يرسل أسماء خاطئة.
**الحل:** في `messenger/page.tsx` تأكد من:
```js
body: JSON.stringify({ device_id: ..., phone: ..., content: ... })
// ❌ ليس: deviceId / text
```

### 2. إيميل إعادة كلمة المرور لا يصل
**السبب:** Supabase Email قد يكون في Spam.
**الحل:** خصّص القالب من Supabase → Authentication → Email Templates → Reset Password.
**للمستقبل:** عند توفر دومين موثّق في Resend، فعّل `/api/auth/forgot-password/route.ts`.

### 3. أرقام هواتف CSV مستوردة بصيغة خاطئة
**الحل:** `normalizePhone()` في `contacts/page.tsx` تعالج تلقائياً: `05xx` → `96605xx`، `009665xx` → `9665xx`.

### 4. استيراد جهات الاتصال من واتساب
- **"استيراد المحادثات"** → `source: 'chats'` — فقط أرقام المحادثات النشطة
- **"استيراد دليل الهاتف"** → `source: 'phonebook'` — كامل جهات الاتصال المحفوظة مع الأسماء

### 5. `.glass` يجعل الكاردات تتمرر داخلياً
**السبب:** `max-height: 92vh` كانت تطبّق على كل العناصر.
**الحل الحالي:** في `globals.css` القاعدة تعمل فقط داخل `[style*="position: fixed"]`.

### 6. Resend يعطي 403 عند الإرسال
**السبب:** `onboarding@resend.dev` يرسل فقط لبريد حساب Resend نفسه.
**الحل:** أضف دومين موثّق في Resend أو استخدم Supabase Email مع SMTP مخصص.

### 7. صفحة Admin لا تفتح — تحويل لـ /home
**السبب:** حساب المستخدم ليس `role = 'admin'` في جدول profiles.
**الحل:** في Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 8. messages.content يعطي بيانات غريبة
**السبب:** `content` هو JSONB مش string.
**الصح:** `content->>'text'` في SQL، وفي الكود: `message.content?.text` أو `message.content?.caption`.

---

## 🔗 روابط مهمة

| الخدمة | الرابط |
|--------|--------|
| الموقع المباشر | https://tsab-bot.vercel.app |
| GitHub | https://github.com/enes2mahh/tsab-bot |
| Supabase | https://supabase.com/dashboard |
| Vercel | https://vercel.com/dashboard |
| Railway (WA Server) | https://tsab-bot-production.up.railway.app |
| Resend | https://resend.com/emails |
| اختبار Resend | https://tsab-bot.vercel.app/api/test/resend |
