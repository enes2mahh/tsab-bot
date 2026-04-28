# Tsab Bot — دليل Claude الشامل

منصة SaaS لأتمتة واتساب بالذكاء الاصطناعي. Next.js 16 + Supabase + Baileys (WA server على Railway).

---

## المعمارية العامة

```
[المتصفح] → [Next.js على Vercel] → [Supabase PostgreSQL]
                    ↕
            [WA Server على Railway]  ← Baileys (WhatsApp)
                    ↕
              [Supabase Realtime]
```

- **Frontend**: Next.js 16 App Router, RTL عربي، dark cosmic theme
- **Auth**: Supabase Auth (email + OTP)
- **DB**: Supabase PostgreSQL مع RLS كامل
- **WA Server**: Express + Baileys في `wa-server/` — deployed على Railway
- **AI**: Google Gemini 2.0 Flash عبر REST API مباشرة
- **Email**: Resend API (`src/lib/resend.ts`)
- **Export**: CSV + Excel عبر `src/lib/export.ts`

---

## متغيرات البيئة (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_WA_SERVER_URL=        # Railway URL
WA_SERVER_SECRET=                  # shared secret مع wa-server
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=Tsab Bot
RESEND_API_KEY=                    # من resend.com
RESEND_FROM_EMAIL=                 # Tsab Bot <noreply@domain.com>
RESEND_DOMAIN=                     # domain.com
```

---

## صفحات لوحة تحكم المستخدم (`/dashboard`)

| الصفحة | الملف | الوظيفة |
|--------|-------|---------|
| `/home` | `home/page.tsx` | إحصاءات حقيقية من DB (أجهزة، رسائل، حملات، خطة) |
| `/devices` | `devices/page.tsx` | ربط واتساب بـ QR + AI toggle + delete |
| `/campaigns` | `campaigns/page.tsx` | حملات جماعية: normalizeRecipients + CSV + groups + stats |
| `/messages` | `messages/page.tsx` | سجل رسائل مع source badges (AI/FAQ) + mobile cards |
| `/autoreply` | `autoreply/page.tsx` | قواعد الرد التلقائي CRUD + export |
| `/chatflow` | `chatflow/page.tsx` | visual flow builder بالسحب والإفلات |
| `/templates` | `templates/page.tsx` | قوالب رسائل من DB + 20 قالب افتراضي |
| `/contacts` | `contacts/page.tsx` | دليل هاتف + استيراد CSV ذكي + WhatsApp import |
| `/files` | `files/page.tsx` | مكتبة ملفات (Supabase Storage media bucket) |
| `/reports` | `reports/page.tsx` | تقارير + line chart + pie chart + فلاتر |
| `/tickets` | `tickets/page.tsx` | تذاكر دعم مع محادثة كاملة + realtime |
| `/settings` | `settings/page.tsx` | تأكيد بريد + password strength + forgot + webhook test |
| `/referrals` | `referrals/page.tsx` | نظام إحالة + سحب عمولة IBAN |
| `/warmer` | `warmer/page.tsx` | WA Warmer: تبادل رسائل بين أجهزة + sessions log |
| `/faqs` | `faqs/page.tsx` | FAQ مع bot_faqs + hits counter + token savings |
| `/api-docs` | `api-docs/page.tsx` | توثيق API مع curl + JS examples + webhook payload |
| `/messenger` | `messenger/page.tsx` | محادثة مباشرة مع العملاء |
| `/business` | `business/page.tsx` | الملف التجاري للـ AI bot |
| `/plans` | `plans/page.tsx` | عرض الخطط + تفعيل بكود |

---

## صفحات الإدارة (`/admin`)

| الصفحة | الوظيفة |
|--------|---------|
| `/admin` | إحصاءات عامة + روابط سريعة |
| `/admin/users` | إدارة مستخدمين + impersonate + حظر + تمديد |
| `/admin/plans` | إضافة/تعديل/حذف خطط |
| `/admin/codes` | أكواد تفعيل |
| `/admin/tickets` | رد على تذاكر الدعم |
| `/admin/referrals` | قبول/رفض طلبات سحب |
| `/admin/analytics` | تحليلات متقدمة |
| `/admin/settings` | Gemini key + system prompt + maintenance mode |

---

## صفحات Auth

- `/login` — مع forgot password modal (Supabase resetPasswordForEmail)
- `/register` — مع OTP phone verification + referral code
- `/auth/callback` — يستقبل email confirmation redirect من Supabase
- `/auth/reset` — صفحة تعيين كلمة مرور جديدة (token من URL)

---

## API Routes المهمة (`src/app/api/`)

```
/devices                    GET/POST devices
/devices/qr                 POST → WA server QR
/devices/[id]/disconnect    POST
/devices/[id]/groups        GET → WhatsApp groups
/campaigns                  GET/POST
/campaigns/[id]/stats       GET → per-recipient status
/messages/send              POST → إرسال رسالة
/auth/send-otp              POST → OTP لرقم هاتف
/auth/verify-otp            POST
/auth/reset-password-with-otp POST
/settings/test-webhook      POST → اختبار webhook URL
/contacts/import            POST → استيراد من WhatsApp chats
/admin/update-user          POST (service role)
/admin/impersonate          POST
```

---

## المكتبات المشتركة (`src/lib/`)

| الملف | الوظيفة |
|-------|---------|
| `export.ts` | `exportData<T>(rows, columns, filename, format)` → CSV/Excel |
| `datetime.ts` | `formatDate(date, timezone)` بـ Intl.DateTimeFormat |
| `resend.ts` | `sendEmail()` + templates: welcome, campaign, subscription, reset |
| `supabase/client.ts` | browser Supabase client |
| `supabase/server.ts` | server Supabase client + admin client |
| `ai/` | Gemini REST integration |

---

## قاعدة البيانات — تسلسل الـ Migrations

```
schema.sql                          ← الأساس (21 جدول)
v2_wa_features.sql                  ← ميزات واتساب
v3_public_pages.sql                 ← صفحات عامة
v4_smart_bot_jobs.sql               ← bot_faqs + faq_learning_queue + jobs
v5_notifications_otp_messenger.sql  ← OTP + إشعارات
v6_storage_setup.sql                ← media bucket
v7_misc_fixes.sql                   ← messages.metadata + faq_suggestions view + indexes
```

---

## الجداول الرئيسية

| الجدول | الملاحظة المهمة |
|--------|----------------|
| `messages` | `content` هو JSONB (مش string) — استخدم `content->>'text'` |
| `messages` | `metadata` JSONB يحتوي `{source: 'ai'/'faq'/'greeting'}` |
| `campaigns` | `recipients` JSONB array مع `{phone, status, sent_at, error}` |
| `bot_faqs` | `question_normalized` = lowercased trimmed — المطابقة عليها |
| `faq_learning_queue` | يُعبّأ تلقائياً من البوت — مصدر `faq_suggestions` view |
| `ticket_messages` | sender_id + is_staff — ما في عمود message على tickets |
| `warmer_config` | upsert دائماً (user واحد = config واحد) |

---

## RLS والصلاحيات

- كل مستخدم يرى بياناته فقط عبر `auth.uid() = user_id`
- الأدمن يمر من `is_admin()` function
- `service_role` key للعمليات الإدارية (reset password, impersonate)

---

## WA Server (`wa-server/`)

```
wa-server/
├── src/
│   ├── app.js              ← Express entry point
│   ├── routes/
│   │   ├── devices.js      ← /devices/:id/qr, /disconnect, /groups
│   │   └── messages.js     ← /send
│   └── services/
│       └── whatsapp.js     ← WhatsAppService class (Baileys sessions)
```

- يتواصل مع Next.js عبر `WA_SERVER_SECRET` header
- يحدّث Supabase مباشرة عند تغيير حالة الجهاز
- `getGroups(deviceId)` → `sock.groupFetchAllParticipating()`

---

## Mobile Responsive System (`globals.css`)

```css
.grid-mobile-1        → grid-template-columns: 1fr !important  (< 768px)
.responsive-table-wrap → overflow-x: auto
.stack-mobile         → flex-direction: column !important
.hide-mobile          → display: none !important
.show-mobile          → display: none !important (> 769px)
.dashboard-mobile-toggle → الزر الثابت لفتح الـ sidebar
.mobile-overlay       → backdrop خلف الـ sidebar
```

---

## تعليمات لـ Claude

- **لا تستخدم `any`** إلا إذا كان لا بد — استخدم interfaces
- **لا تضيف comments** توضّح الـ what — فقط الـ why غير الواضح
- **لا تنشئ ملفات جديدة** إذا ممكن التعديل على الموجود
- **الـ export**: دائماً استخدم `exportData()` من `src/lib/export.ts`
- **الـ dates**: استخدم `formatDate()` من `src/lib/datetime.ts`
- **الـ emails**: استخدم `sendEmail()` من `src/lib/resend.ts`
- **Supabase client side**: `createClient()` من `@/lib/supabase/client`
- **Supabase server side**: `createClient()` من `@/lib/supabase/server`
- **بعد كل تعديل**: شغّل `npx next build` للتأكد من عدم وجود TypeScript errors
- **ملفات التوثيق**: في `docs/phases/` — لا تعدّل عليها

---

## النشر

| الخدمة | الاستخدام |
|--------|----------|
| Vercel | Next.js frontend |
| Railway | WA Server (Baileys) |
| Supabase | DB + Auth + Storage |
| Resend | Email delivery |
| GitHub | `enes2mahh/tsab-bot` |
