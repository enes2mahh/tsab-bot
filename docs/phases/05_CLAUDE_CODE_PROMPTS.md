# 🚀 البرومتات الكاملة لـ Claude Code

## كيفية الاستخدام:
1. افتح Claude Code
2. انسخ البرومت المطلوب
3. أرفق الملفات الأخرى كـ context

---

## 🔴 البرومت الجامع الرئيسي (أرسله أولاً)

```
أريد بناء منصة SaaS كاملة لإدارة بوتات الواتساب.
اسم المنصة: [اسم منصتك]

## Stack المطلوب:
- Backend: Node.js + Express.js + PostgreSQL + Redis + Bull + Baileys + Socket.IO
- Frontend: React.js + Vite + Tailwind CSS + Zustand + React Query + React Flow
- AI: Google Gemini 2.0 Flash
- Storage: MinIO (S3-compatible)
- Payment: Moyasar (Saudi payment gateway)

## الميزات المطلوبة (بالترتيب):
1. نظام مصادقة (JWT + OTP)
2. ربط أجهزة واتساب عبر QR Code (Baileys)
3. إرسال كل أنواع الرسائل (نص/صورة/فيديو/قائمة/أزرار/poll/موقع/منتج/sticker)
4. إرسال جماعي مع Bull Queue وتأخير عشوائي 3-7 ثواني
5. رد تلقائي بالكلمات المفتاحية
6. Chat Flow Builder بصري (Drag & Drop - React Flow)
7. ذكاء اصطناعي (Gemini 2.0 Flash) مع context memory وcache
8. جدولة الرسائل
9. WA Warmer (تدفئة الأرقام)
10. تصفية الأرقام بالدولة
11. مدير الملفات
12. دليل الهاتف
13. Live Chat Panel موحد
14. نظام اشتراكات 3 خطط (39/79/99 SAR)
15. نظام إحالات مع عمولة 10%
16. لوحة أدمن شاملة
17. API للمطورين مع Swagger
18. Webhook system

## الخطط:
- Basic: 39 SAR/30يوم, 1 جهاز, 1000 رسالة, بدون AI وإرسال جماعي
- Professional: 79 SAR/30يوم, 3 أجهزة, 10000 رسالة, مع AI
- Business: 99 SAR/30يوم, 10 أجهزة, 100000 رسالة, كل المميزات

## قاعدة البيانات:
جداول: users, plans, subscriptions, devices, messages, campaigns, contacts, 
auto_replies, chat_flows, chatflow_sessions, templates, tickets, ticket_messages,
referrals, withdrawals, warmer_sessions, webhook_logs, files, ai_usage_logs

## الملفات المرفقة:
- 02_PROJECT_STRUCTURE_AND_DATABASE.md (هيكل المشروع + SQL كامل)
- 03_PAGES_DESCRIPTION.md (وصف كل صفحة)
- 04_API_AND_TECHNICAL.md (API Endpoints + كود تقني)

ابدأ بإنشاء هيكل المشروع الكامل أولاً.
```

---

## 🟡 البرومت 1: Backend الأساسي

```
بناءً على الملفات المرفقة، أنشئ:

1. هيكل مشروع Node.js/Express كامل مع كل المجلدات

2. ملف .env.example:
DATABASE_URL=postgresql://user:pass@localhost:5432/wa_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your-gemini-api-key
MOYASAR_API_KEY=your-moyasar-key
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=wa-platform
SMS_PROVIDER=unifonic
SMS_API_KEY=your-sms-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-password
FRONTEND_URL=http://localhost:5173
PORT=3000
NODE_ENV=development

3. app.js الرئيسي مع:
- CORS
- Rate limiting
- Body parser
- Error handling
- كل الـ routes

4. database.js مع Sequelize + PostgreSQL

5. نظام Migration لكل الجداول الموجودة في ملف SQL

6. auth.controller.js و auth.routes.js كاملين مع:
- Register (مع OTP)
- Login
- Logout
- Me
- Forgot/Reset Password

اكتب الكود الكامل القابل للتشغيل.
```

---

## 🟡 البرومت 2: تكامل Baileys (واتساب)

```
أنشئ ملف whatsapp.service.js كامل باستخدام Baileys:

المتطلبات:
1. إدارة جلسات متعددة (Map من deviceId → socket)
2. توليد QR Code وإرساله لـ Socket.IO
3. حفظ الجلسة في PostgreSQL (عمود session_data)
4. استعادة الجلسات عند إعادة تشغيل السيرفر
5. معالجة حالات: connected, disconnected, banned, conflict
6. دوال إرسال لكل الأنواع:
   - sendText(deviceId, phone, text)
   - sendImage(deviceId, phone, imageUrl, caption)
   - sendVideo(deviceId, phone, videoUrl, caption)
   - sendDocument(deviceId, phone, docUrl, filename, mimetype)
   - sendLocation(deviceId, phone, lat, lng, name)
   - sendProduct(deviceId, phone, productId)
   - sendList(deviceId, phone, listData)
   - sendButton(deviceId, phone, buttonData)
   - sendPoll(deviceId, phone, pollData)
   - sendSticker(deviceId, phone, stickerUrl)
   - sendContact(deviceId, phone, contactData)
   - sendAudio(deviceId, phone, audioUrl)
   - sendToChannel(deviceId, channelId, content)

7. معالجة الرسائل الواردة:
   - حفظ في قاعدة البيانات
   - تشغيل Auto Reply rules
   - تشغيل ChatFlow إن وجد
   - AI reply إن مفعّل
   - إرسال للـ Webhook
   - تحديث عبر Socket.IO

8. تتبع حالة الرسائل (sent/delivered/read)

اكتب الكود الكامل مع معالجة الأخطاء.
```

---

## 🟡 البرومت 3: Campaigns + Queue

```
أنشئ نظام الإرسال الجماعي:

1. campaigns.controller.js:
   - createCampaign: إنشاء حملة مع validation
   - startCampaign: إضافة للـ Queue
   - pauseCampaign: إيقاف مؤقت
   - resumeCampaign: استئناف
   - stopCampaign: إيقاف نهائي
   - getCampaignMessages: رسائل الحملة مع pagination

2. campaign.job.js (Bull Queue Worker):
   - معالجة كل رسالة بشكل منفصل
   - تأخير عشوائي بين delayMin و delayMax
   - استبدال المتغيرات {{اسم}}، {{رقم_الهاتف}}، {{تاريخ}}
   - إعادة المحاولة 3 مرات عند الفشل
   - تحديث إحصائيات الحملة في الوقت الحقيقي
   - إشعار عبر Socket.IO بكل تحديث

3. دعم أنواع المستلمين:
   - numbers: أرقام مدخلة يدوياً
   - contacts: من دليل الهاتف (مع فلترة بـ tags)
   - file: رفع ملف CSV
   - phonebook: من جهاز واتساب

4. التحقق من حد الرسائل:
   - فحص subscription قبل بدء الحملة
   - خصم الرسائل من الرصيد
   - إيقاف الحملة إذا نفد الرصيد

اكتب الكود الكامل.
```

---

## 🟡 البرومت 4: AI + Auto Reply + Chat Flow

```
أنشئ الأنظمة الذكية:

1. ai.service.js (Gemini 2.0 Flash):
   - generateReply(userMessage, history, systemPrompt, deviceId)
   - cache بـ Redis (30 دقيقة)
   - تسجيل التكلفة في ai_usage_logs
   - max 200 tokens للإخراج
   - معالجة الأخطاء وإعادة المحاولة

2. autoreply.service.js:
   - processIncomingMessage(deviceId, from, message, type)
   - فحص قواعد الـ Auto Reply بالأولوية
   - أنواع التشغيل: keyword, contains, starts_with, first_message, all, outside_hours
   - دعم ساعات العمل وأيام العمل
   - إن لم يوجد تطابق → AI (إن مفعّل)

3. chatflow.service.js:
   - processFlowMessage(deviceId, from, message)
   - تحميل حالة المستخدم من chatflow_sessions
   - معالجة كل نوع عقدة:
     * message: إرسال رسالة
     * question: عرض خيارات وانتظار رد
     * condition: تقييم شرط
     * ai: إرسال للـ AI
     * delay: انتظار ثم المتابعة
     * http: طلب HTTP خارجي
     * end: إنهاء الجلسة
   - حفظ السياق (variables) بين العقد
   - Timeout تلقائي بعد 24 ساعة

4. autoreply.routes.js + autoreply.controller.js كاملين

اكتب الكود الكامل مع tests بسيطة.
```

---

## 🟡 البرومت 5: Frontend الكامل

```
أنشئ مشروع React + Vite + Tailwind CSS:

1. إعداد المشروع:
npm create vite@latest frontend -- --template react
مع: Tailwind CSS, React Router v6, Zustand, React Query, Axios, Socket.IO client, i18next

2. نظام التصميم:
- Dark mode بالافتراضي
- الألوان الأساسية: بنفسجي #7C3AED, رمادي داكن #0F0F1A, خلفية #1A1A2E
- خط Tajawal للعربية
- RTL كافتراضي
- Responsive لكل الأشكال

3. المكونات الأساسية:
- Sidebar (مع كل الروابط، قابل للطي)
- Header (بحث CTRL+K، إشعارات، مستخدم)
- StatsCard (مع animation عند التحميل)
- DataTable (مع فلاتر، ترقيم، export)
- Modal/Dialog (animate)
- Toast notifications
- Loading skeletons

4. الصفحات (بالترتيب):
أ) Login + Register (مع validation)
ب) Home Dashboard (6 بطاقات + charts)
ج) Devices (مع QRCodeModal يعرض QR حي عبر Socket.IO)
د) Campaigns (مع CampaignBuilder كامل)
هـ) Message Log (مع فلاتر)
و) Auto Reply (قائمة + إنشاء/تعديل)
ز) Plans (3 بطاقات مع مقارنة)
ح) Settings (4 أقسام)
ط) Referral Center (إحصائيات + جداول)

5. إدارة الحالة (Zustand):
- authStore: المستخدم، التوكن، الخطة
- deviceStore: الأجهزة، الجهاز المحدد
- uiStore: السايدبار، اللغة، الثيم

اكتب الكود الكامل مع TypeScript.
```

---

## 🟡 البرومت 6: Chat Flow Builder

```
أنشئ Chat Flow Builder بصري باستخدام React Flow:

1. ChatFlow.jsx - الصفحة الرئيسية:
   - كانفاس React Flow
   - Toolbar يسار (أنواع العقد للسحب)
   - Panel يمين (تعديل العقدة المحددة)
   - أزرار: حفظ، تصدير JSON، استيراد، معاينة

2. أنواع العقد المخصصة:
   - StartNode: كلمة مفتاحية البداية
   - MessageNode: إرسال رسالة (محرر متكامل)
   - QuestionNode: سؤال مع خيارات (يولّد edges تلقائياً)
   - ConditionNode: شرط if/else
   - AINode: إرسال للذكاء الاصطناعي مع prompt
   - DelayNode: انتظار (ثواني/دقائق/ساعات)
   - SetVariableNode: تعيين متغير
   - HttpNode: طلب HTTP خارجي
   - EndNode: إنهاء

3. Panel التعديل:
   - يظهر عند اختيار عقدة
   - حقول مختلفة حسب نوع العقدة
   - معاينة الرسالة فورية

4. حفظ وتحميل:
   - حفظ nodes + edges + metadata كـ JSON في DB
   - تحميل التدفق عند الفتح
   - Auto-save كل تغيير

اكتب كود React Flow كامل مع TypeScript.
```

---

## 🟡 البرومت 7: لوحة الأدمن

```
أنشئ لوحة أدمن كاملة على /admin:

1. AdminDashboard: إحصائيات المنصة الكاملة مع Charts
   - Line Chart: نمو المستخدمين 30 يوم
   - Bar Chart: الإيرادات 12 شهر
   - Donut: توزيع الخطط
   - Stats: مستخدمين، أجهزة، رسائل، إيرادات

2. Users Management:
   - جدول مع فلاتر وبحث
   - Impersonate (تسجيل دخول كمستخدم)
   - تغيير خطة يدوياً
   - تمديد اشتراك
   - حظر/رفع حظر

3. Plans Management:
   - إنشاء/تعديل/حذف خطط
   - تفعيل/تعطيل
   - ضبط الخطة الموصى بها

4. Referrals & Withdrawals:
   - مراجعة طلبات السحب
   - قبول/رفض مع ملاحظة
   - ضبط نسبة العمولة

5. System Settings:
   - إعدادات AI (مفتاح Gemini، النموذج، Prompt)
   - إعدادات الدفع
   - إعدادات البريد
   - وضع الصيانة

6. Middleware:
   - التحقق من role === 'admin'
   - إعادة توجيه للـ login إن لم يكن أدمن

اكتب الكود الكامل.
```

---

## 🟡 البرومت 8: نظام الدفع

```
أنشئ نظام دفع كامل مع Moyasar:

1. payment.service.js:
   - createPayment(amount, planId, userId)
   - verifyPayment(paymentId)
   - handleWebhook(payload, signature)
   - refundPayment(paymentId)

2. subscription.service.js:
   - activateSubscription(userId, planId, paymentRef)
   - renewSubscription(subscriptionId)
   - cancelSubscription(subscriptionId)
   - checkExpiry() - cron job يومي
   - sendExpiryWarning() - إشعار قبل 3 أيام

3. نظام الإحالة:
   - calculateCommission(referrerId, subscriptionAmount)
   - makeCommissionAvailable(referralId) - بعد 14 يوم
   - processWithdrawal(withdrawalId)

4. Webhooks من Moyasar:
   - paid: تفعيل الاشتراك
   - failed: إشعار المستخدم
   - refunded: إلغاء الاشتراك

5. الإشعارات:
   - بريد إلكتروني: فاتورة، تأكيد، تحذير انتهاء
   - Template HTML جميل للفواتير

اكتب الكود الكامل مع Moyasar SDK.
```

---

## 🟡 البرومت 9: Landing Page

```
أنشئ Landing Page احترافية للمنصة:

التصميم:
- Dark mode
- الألوان: بنفسجي داكن #0D0520 كخلفية، بنفسجي #7C3AED كـ accent، أخضر #25D366
- خط: Tajawal للعربية
- RTL كافتراضي
- Animated gradients في الخلفية

الأقسام (بالترتيب):
1. Navbar: لوغو + روابط (ميزات، أسعار، API، تواصل) + دخول + تسجيل مجاني
2. Hero: 
   - عنوان كبير ومتحرك
   - وصف قصير مقنع
   - زر "ابدأ مجاناً - 7 أيام"
   - صورة Dashboard (screenshot)
   - إحصائيات صغيرة تحت: 10K+ عميل، 50M+ رسالة، 99.9% uptime
3. Features (6 بطاقات):
   - متصل دائماً (ردود AI)
   - الحملات (قوالب رسائل)
   - السرعة (رد تلقائي)
   - التكامل (API)
   - تفاعلي (أزرار)
   - جاهز للمطورين (توثيق)
4. How It Works: 3 خطوات بصرية
5. Pricing: 3 بطاقات مع تبديل شهري/سنوي
6. Testimonials: آراء عملاء
7. FAQ: أسئلة شائعة
8. CTA نهائي
9. Footer

Animations:
- Scroll animations (Intersection Observer)
- Particle background
- Counter animation للأرقام
- Hover effects على البطاقات
- Typewriter effect للعنوان

استخدم HTML + CSS + Vanilla JS.
اجعله مذهلاً بصرياً!
```

---

## 🟡 البرومت 10: النشر على السيرفر

```
أنشئ كل ملفات النشر:

1. Nginx config (/etc/nginx/sites-available/wa-platform):
   - Reverse proxy للـ backend (port 3000)
   - Serve frontend build
   - WebSocket proxy
   - SSL
   - Gzip compression
   - Security headers

2. PM2 ecosystem.config.js:
   - app: Backend API
   - worker: Campaign Queue Worker (3 instances)
   - scheduler: Cron jobs
   - socket: Socket.IO server

3. docker-compose.yml:
   services: api, worker, postgres, redis, minio, nginx

4. سكريبت النشر (deploy.sh):
   git pull
   npm install
   npm run build:frontend
   npm run migrate
   pm2 restart all

5. GitHub Actions (.github/workflows/deploy.yml):
   - على push لـ main: auto deploy للسيرفر

6. إعداد السيرفر (setup.sh):
   - تثبيت Node.js 20
   - تثبيت PostgreSQL 16
   - تثبيت Redis 7
   - تثبيت Nginx
   - تثبيت PM2
   - Let's Encrypt SSL
   - UFW Firewall rules

اكتب كل الملفات جاهزة للاستخدام الفوري.
```
