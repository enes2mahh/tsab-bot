# Sends Bot — دليل Claude الشامل

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
- **Auth**: Supabase Auth (email + OTP واتساب)
- **DB**: Supabase PostgreSQL مع RLS كامل
- **WA Server**: Express + Baileys في `wa-server/` — deployed على Railway
- **AI**: Google Gemini 2.0 Flash عبر REST API مباشرة
- **Email إرسال**: Resend API (`src/lib/resend.ts`) — دومين موثّق `sendsbot.com` → يرسل من `noreply@sendsbot.com` لأي بريد ✅
- **Email استقبال**: ImprovMX — يحوّل `support@sendsbot.com` و `privacy@sendsbot.com` لـ `sendsbot@gmail.com` ✅
- **Export**: CSV + Excel عبر `src/lib/export.ts`

---

## متغيرات البيئة (`.env.local` + Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL=https://bvhsqmlohxcjxcxbssdp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # للعمليات الإدارية فقط (server-side)
GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_WA_SERVER_URL=https://tsab-bot-production.up.railway.app
WA_SERVER_SECRET=tsab-bot-super-secret-key-2024-railway
NEXT_PUBLIC_APP_URL=https://sendsbot.com
NEXT_PUBLIC_APP_NAME=Sends Bot
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Sends Bot <noreply@sendsbot.com>   # ✅ دومين حقيقي موثّق
RESEND_DOMAIN=sendsbot.com
OTP_JWT_SECRET=<64-char-hex>              # ✅ لتوقيع OTP tokens — Sensitive في Vercel
```

> ✅ **Resend مع `sendsbot.com`**: يرسل لأي بريد إلكتروني. الدومين موثّق في Resend Dashboard.
> ℹ️ **WA_SERVER_SECRET**: لم يتغير في Railway — لا تغيّره في Vercel إلا إذا غيّرته في Railway أيضاً.
> ⚠️ **OTP_JWT_SECRET**: يجب أن يكون Sensitive في Vercel. يُستخدم فقط في `src/lib/jwt-utils.ts`.

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
| `/contacts` | `contacts/page.tsx` | دليل هاتف + استيراد CSV مع normalizePhone + استيراد واتساب (chats + phonebook) |
| `/files` | `files/page.tsx` | مكتبة ملفات (Supabase Storage media bucket) |
| `/reports` | `reports/page.tsx` | تقارير + line chart + pie chart + فلاتر |
| `/tickets` | `tickets/page.tsx` | تذاكر دعم مع محادثة كاملة + realtime |
| `/settings` | `settings/page.tsx` | تأكيد بريد + password strength + forgot + webhook test |
| `/referrals` | `referrals/page.tsx` | نظام إحالة + سحب عمولة IBAN |
| `/warmer` | `warmer/page.tsx` | WA Warmer: تبادل رسائل بين أجهزة + sessions log |
| `/faqs` | `faqs/page.tsx` | FAQ مع bot_faqs + hits counter + token savings |
| `/api-docs` | `api-docs/page.tsx` | توثيق API مع curl + JS examples + webhook payload |
| `/messenger` | `messenger/page.tsx` | محادثة مباشرة مع العملاء — يرسل عبر `/api/messages/send` |
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

- `/login` — مع forgot password modal يستخدم `supabase.auth.resetPasswordForEmail()`
- `/register` — مع OTP phone verification + referral code
- `/auth/callback` — يستقبل email confirmation redirect من Supabase
- `/auth/reset` — صفحة تعيين كلمة مرور جديدة (يقرأ token من URL hash أو PKCE)

---

## API Routes المهمة (`src/app/api/`)

```
/devices                        GET/POST devices
/devices/qr                     POST → WA server QR
/devices/[id]/disconnect        POST
/devices/[id]/groups            GET → WhatsApp groups
/campaigns                      GET/POST
/campaigns/[id]/stats           GET → per-recipient status
/messages/send                  POST { device_id, phone, type?, content } → إرسال رسالة
/contacts/import                POST { deviceId, source: 'chats'|'phonebook' } → استيراد
/auth/send-otp                  POST { phone, purpose } → OTP لرقم هاتف
/auth/verify-otp                POST { phone, code }
/auth/reset-password-with-otp   POST { phone, otp, newPassword }
/auth/forgot-password           POST { email } → جاهز للاستخدام مع Resend عند توفر دومين
/settings/test-webhook          POST → اختبار webhook URL
/admin/update-user              POST (service role)
/admin/impersonate              GET  → يرجع { impersonating, originEmail, originName } من httpOnly cookie
/admin/impersonate              POST → ينشئ magic link + يضبط httpOnly cookies + يسجّل في admin_audit_logs
/admin/impersonate              DELETE → يمحو httpOnly impersonation cookies
/test/resend                    GET → اختبار إرسال Resend
```

### تفاصيل مهمة عن API Routes

**`/api/messages/send`** — الـ body الصحيح:
```ts
{ device_id: string, phone: string, type?: 'text'|'image'|'document', content: any }
// ⚠️ ليس deviceId أو text — هذا كان bug تم إصلاحه في messenger/page.tsx
```

**`/api/contacts/import`** — الـ body:
```ts
{ deviceId: string, source: 'chats' | 'phonebook' }
// 'chats'     → أرقام المحادثات النشطة فقط
// 'phonebook' → كامل جهات الاتصال المحفوظة مع الأسماء
```
إذا رجع WA server بـ `contacts[]` → يحفظها في Supabase مع `name`/`pushname`.

---

## المكتبات المشتركة (`src/lib/`)

| الملف | الوظيفة |
|-------|---------|
| `export.ts` | `exportData<T>(rows, columns, filename, format)` → CSV/Excel |
| `datetime.ts` | `formatDate(date, timezone)` بـ Intl.DateTimeFormat |
| `resend.ts` | `sendEmail()` + templates: welcome, campaign, subscription, passwordReset |
| `useIsMobile.ts` | `useIsMobile(breakpoint?)` hook — يرجع `true` إذا `< 768px` |
| `supabase/client.ts` | browser Supabase client |
| `supabase/server.ts` | server Supabase client + admin client (service_role) |
| `ai/gemini.ts` | Gemini REST integration |
| `jwt-utils.ts` | `generateOTPToken(phone, otpId)` + `verifyOTPToken(token)` — HMAC-SHA256، لا deps |
| `rate-limit.ts` | `checkRateLimit(key, max, windowMs)` — in-memory، يُستخدم في API routes |

## مكتبات WA Server (`wa-server/src/lib/`)

| الملف | الوظيفة |
|-------|---------|
| `cache.js` | `get/set/del/delByPrefix` — in-memory TTL cache (بدون Redis) |
| `queues.js` | `messageQueue / campaignQueue` — in-memory job queue مع retry + backoff |

---

## قاعدة البيانات — تسلسل الـ Migrations

```
schema.sql                          ← الأساس (21 جدول)
v2_wa_features.sql                  ← ميزات واتساب
v3_public_pages.sql                 ← صفحات عامة
v4_smart_bot_jobs.sql               ← bot_faqs + faq_learning_queue + jobs
v5_notifications_otp_messenger.sql  ← OTP + إشعارات + phone_otps
v6_storage_setup.sql                ← media bucket
v7_misc_fixes.sql                   ← messages.metadata + faq_suggestions view + indexes
v9_security_fixes.sql               ← admin_audit_logs + activate_code_safe() function ✅ (مطبّق)
```

---

## الجداول الرئيسية — ملاحظات حرجة

| الجدول | الملاحظة المهمة |
|--------|----------------|
| `messages` | `content` هو **JSONB** (مش string) — في SQL: `content->>'text'`، في JS: `msg.content?.text` |
| `messages` | `metadata` JSONB يحتوي `{source: 'ai'/'faq'/'greeting', campaign_id?}` |
| `campaigns` | `recipients` JSONB array مع `{phone, status, sent_at, error}` |
| `contacts` | `UNIQUE(user_id, phone)` — upsert آمن. `name` موجود لحفظ اسم واتساب |
| `bot_faqs` | `question_normalized` = lowercased trimmed — المطابقة عليها |
| `faq_learning_queue` | يُعبّأ تلقائياً من البوت — مصدر `faq_suggestions` view |
| `ticket_messages` | sender_id + is_staff — ⚠️ ليس `message` على جدول `tickets` |
| `warmer_config` | upsert دائماً (user واحد = config واحد) |
| `phone_otps` | OTP واتساب: `phone, code, purpose, expires_at, used, attempts` |
| `admin_audit_logs` | سجل عمليات الأدمن: impersonate + reset_password + code_activation — يُكتب server-side فقط |

---

## RLS والصلاحيات

- كل مستخدم يرى بياناته فقط عبر `auth.uid() = user_id`
- الأدمن يمر من `is_admin()` function
- `service_role` key للعمليات الإدارية (reset password, impersonate) — server-side فقط
- لتعيين أدمن: `UPDATE profiles SET role = 'admin' WHERE email = '...';`

---

## WA Server (`wa-server/`)

```
wa-server/
├── src/
│   ├── app.js              ← Express entry point
│   ├── routes/
│   │   ├── devices.js      ← /devices/:id/qr, /disconnect, /groups
│   │   └── messages.js     ← /messages/text, /messages/image, /messages/document
│   └── services/
│       └── whatsapp.js     ← WhatsAppService class (Baileys sessions)
```

- يتواصل مع Next.js عبر `Authorization: Bearer WA_SERVER_SECRET`
- يحدّث Supabase مباشرة عند تغيير حالة الجهاز
- `getGroups(deviceId)` → `sock.groupFetchAllParticipating()`
- **`/devices/import-contacts`** → يقبل `{ deviceId, source: 'chats'|'phonebook' }` ويرجع contacts[]

---

## Mobile Responsive System (`globals.css`)

**Breakpoints:** `< 768px` للهاتف، `< 480px` للهاتف الصغير.

```css
/* Grid Classes */
.grid-2      → repeat(2,1fr)  | < 768px: 1fr
.grid-3      → repeat(3,1fr)  | < 768px: 1fr
.grid-4      → repeat(4,1fr)  | < 768px: repeat(2,1fr) | < 480px: 1fr
.grid-auto   → auto-fill minmax(280px,1fr) | < 768px: 1fr

/* Layout */
.page-flex-header      → flex row justify-between | < 768px: column + button 100%
.settings-grid         → minmax(160px,200px) + 1fr | < 768px: 1fr
.footer-grid           → 2fr 1fr 1fr 1fr | < 768px: 1fr 1fr | < 480px: 1fr
.auth-card             → padding تصغير على < 480px
.responsive-table-wrap → overflow-x: auto + touch scrolling → .table-cosmic { min-width: 600px }

/* Sidebar */
.dashboard-mobile-toggle → زر ثابت لفتح الـ sidebar
.mobile-overlay          → backdrop خلف الـ sidebar
```

**للـ inline styles المتجاوبة** استخدم `useIsMobile`:
```ts
import { useIsMobile } from '@/lib/useIsMobile'
const isMobile = useIsMobile()
// مثال:
style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(4,1fr)' }}
```

> ⚠️ **`.glass` max-height**: يعمل فقط داخل `position: fixed` overlays — لا تضيفه على كاردات عادية.

---

## تعليمات لـ Claude

### الأولويات
- **لا تستخدم `any`** إلا إذا كان لا بد — استخدم interfaces
- **لا تضيف comments** توضّح الـ what — فقط الـ why غير الواضح
- **لا تنشئ ملفات جديدة** إذا ممكن التعديل على الموجود
- **لا تضيف features** غير مطلوبة

### استخدم الـ utilities الموجودة
- **Export**: `exportData()` من `src/lib/export.ts`
- **Dates**: `formatDate()` من `src/lib/datetime.ts`
- **Email**: `sendEmail()` من `src/lib/resend.ts`
- **Mobile**: `useIsMobile()` من `src/lib/useIsMobile`
- **Phone normalization**: `normalizePhone()` موجودة في `contacts/page.tsx` — انسخها لأي صفحة تحتاجها
- **Supabase (client)**: `createClient()` من `@/lib/supabase/client`
- **Supabase (server)**: `createClient()` من `@/lib/supabase/server`

### أنماط شائعة في المشروع
```ts
// جلب user في server component/route
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

// upsert contacts (phone unique per user)
await supabase.from('contacts').upsert(rows, { onConflict: 'user_id,phone' })

// WA server call
await fetch(`${process.env.NEXT_PUBLIC_WA_SERVER_URL}/messages/text`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.WA_SERVER_SECRET}` },
  body: JSON.stringify({ deviceId, phone, text }),
})

// admin service role client (server-side فقط)
import { createClient as createSupaClient } from '@supabase/supabase-js'
const supabase = createSupaClient(url, serviceKey, { auth: { persistSession: false } })
```

### بعد كل تعديل
- شغّل `npx next build` للتأكد من TypeScript errors

---

## أخطاء شائعة — لا تكررها

| الخطأ | الصحيح |
|-------|--------|
| `{ deviceId, text }` في messages/send | `{ device_id, content }` |
| `ticket.message` | `ticket_messages` جدول منفصل |
| `message.content` كـ string | `message.content` هو JSONB → `?.text` أو `?.caption` |
| `createClient()` على الـ server | استخدم `@/lib/supabase/server` مش client |
| `.glass` على كاردات صفحات عادية | `.glass` للـ modals فقط (fixed position) |
| `grid-mobile-1` | مش موجود — استخدم `.grid-2` أو `useIsMobile` |
| قراءة `impersonate_origin_email` من `document.cookie` | استخدم `GET /api/admin/impersonate` — الكوكيز httpOnly |
| إرسال `verifiedToken: otp.id` (UUID خام) | استخدم `generateOTPToken()` من `src/lib/jwt-utils.ts` |
| التحقق من subscription بدون `.gt('expires_at', ...)` | لازم تضيف expiry check وإلا الاشتراكات المنتهية تمر |
| تفعيل الكود بـ queries منفصلة | استخدم `rpc('activate_code_safe')` لتجنب race condition |

## أنماط الأمان المضافة (v9)

```ts
// OTP Token — generate (في verify-otp)
import { generateOTPToken } from '@/lib/jwt-utils'
const verifiedToken = generateOTPToken(phone, otp.id)

// OTP Token — verify (في register)
import { verifyOTPToken } from '@/lib/jwt-utils'
const tokenData = verifyOTPToken(verifiedToken)
if (!tokenData || tokenData.phone !== phone) return error(401)

// Subscription check صحيح (لازم expiry + block if null)
const { data: sub } = await supabase.from('subscriptions')
  .select('id, messages_used, messages_limit')
  .eq('user_id', user.id).in('status', ['trial', 'active'])
  .gt('expires_at', new Date().toISOString())
  .order('expires_at', { ascending: false }).limit(1).single()
if (!sub) return NextResponse.json({ error: '...', code: 'NO_ACTIVE_SUBSCRIPTION' }, { status: 402 })

// Audit log (server-side فقط عبر adminClient)
await adminClient.from('admin_audit_logs').insert({
  admin_id, admin_email, action, target_user_id, target_email,
  ip_address, user_agent, timestamp: new Date().toISOString()
})

// WA Server cache (في whatsapp.js)
const cache = require('../lib/cache')
const faqs = cache.get(`faqs:${deviceId}`) || (await fetchAndCache())
```

---

## النشر

| الخدمة | الاستخدام | الرابط |
|--------|----------|--------|
| Vercel | Next.js frontend | sendsbot.com / sendsbot.vercel.app |
| Railway | WA Server (Baileys) | tsab-bot-production.up.railway.app |
| Supabase | DB + Auth + Storage | bvhsqmlohxcjxcxbssdp.supabase.co |
| Resend | Email إرسال | resend.com — دومين sendsbot.com موثّق |
| ImprovMX | Email استقبال | improvmx.com — forward لـ sendsbot@gmail.com |
| GitHub | Source code | github.com/enes2mahh/sendsbot |
| Spaceship | Domain registrar | sendsbot.com (يتجدد Apr 2027) |

## الإيميلات

| البريد | الوظيفة | الوجهة |
|--------|---------|--------|
| `noreply@sendsbot.com` | إرسال تلقائي (Resend) | — |
| `support@sendsbot.com` | دعم المستخدمين | sendsbot@gmail.com |
| `privacy@sendsbot.com` | استفسارات الخصوصية | sendsbot@gmail.com |
