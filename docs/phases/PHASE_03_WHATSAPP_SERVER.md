# Phase 3: WhatsApp Server (Baileys) + QR Connection

## المطلوب من Claude Code:

```
أنشئ WhatsApp Server منفصل باستخدام Baileys يُنشر على Railway.app

## هيكل مشروع wa-server/ (داخل مشروع tsab-bot):

wa-server/
├── src/
│   ├── app.js              ← نقطة الدخول
│   ├── config.js           ← الإعدادات
│   ├── services/
│   │   └── whatsapp.js     ← Baileys الرئيسي
│   ├── routes/
│   │   ├── devices.js      ← إدارة الأجهزة
│   │   ├── messages.js     ← إرسال الرسائل
│   │   └── webhook.js      ← Webhook
│   └── middleware/
│       └── auth.js         ← التحقق من المفتاح
└── package.json

## package.json:
{
  "dependencies": {
    "@whiskeysockets/baileys": "latest",
    "express": "^4.18",
    "cors": "^2.8",
    "socket.io": "^4.7",
    "qrcode": "^1.5",
    "@supabase/supabase-js": "^2.39",
    "bull": "^4.12",
    "ioredis": "^5.3",
    "pino": "^8.17",
    "dotenv": "^16"
  }
}

## src/app.js الكامل:
- Express server على PORT 8080
- Socket.IO للـ real-time (QR + device status)
- CORS للـ Next.js frontend
- JWT/Secret authentication لكل طلب
- استعادة كل الجلسات عند بدء التشغيل

## src/services/whatsapp.js - الأهم:

الدوال المطلوبة:

1. initDevice(deviceId, userId):
   - إنشاء جلسة Baileys جديدة
   - توليد QR Code كـ base64
   - إرساله عبر Socket.IO: socket.emit('qr', {deviceId, qr})
   - عند الاتصال: تحديث devices في Supabase status='connected'
   - عند الانقطاع: تحديث status='disconnected'
   - حفظ session credentials في Supabase (عمود session_data)

2. restoreSession(deviceId):
   - جلب session_data من Supabase
   - استعادة الاتصال بدون QR
   - عند الفشل: status='disconnected'

3. disconnectDevice(deviceId):
   - إغلاق الاتصال
   - مسح الجلسة
   - تحديث DB

4. handleIncomingMessage(deviceId, message):
   - حفظ في messages table في Supabase
   - جلب قواعد auto_reply للجهاز
   - فحص التطابق بالأولوية
   - إرسال الرد إذا وجد
   - إرسال للـ Webhook إن وجد
   - emit للـ Socket.IO

5. دوال الإرسال:
   sendText(deviceId, phone, text)
   sendImage(deviceId, phone, url, caption)
   sendVideo(deviceId, phone, url, caption)
   sendDocument(deviceId, phone, url, filename, mimetype)
   sendLocation(deviceId, phone, lat, lng, name)
   sendButtons(deviceId, phone, buttons_data)
   sendList(deviceId, phone, list_data)
   sendPoll(deviceId, phone, poll_data)
   sendSticker(deviceId, phone, url)
   sendContact(deviceId, phone, contact_data)
   sendAudio(deviceId, phone, url)

6. الإرسال الجماعي (Bull Queue):
   - createCampaignJobs(campaignId, contacts, message, delayMin, delayMax)
   - Worker يعالج رسالة واحدة في كل مرة
   - تأخير عشوائي بين delayMin و delayMax ثانية
   - إعادة المحاولة 3 مرات عند الفشل
   - تحديث sent_count/failed_count في Supabase
   - إشعار Socket.IO بكل تحديث

## src/routes/devices.js:
POST /devices/init        ← بدء جلسة + إرسال QR
POST /devices/disconnect  ← قطع الاتصال
GET  /devices/:id/status  ← حالة جهاز
POST /devices/restore-all ← استعادة كل الجلسات

## src/routes/messages.js:
POST /messages/text
POST /messages/image
POST /messages/video
POST /messages/document
POST /messages/location
POST /messages/button
POST /messages/list
POST /messages/poll
POST /messages/sticker
POST /messages/contact

## src/routes/webhook.js:
POST /campaigns/start     ← بدء حملة

## الـ Environment Variables (Railway):
WA_SECRET=your-secret-32-chars
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...
REDIS_URL=redis://xxx (Railway Redis plugin)
PORT=8080
FRONTEND_URL=https://your-vercel-app.vercel.app

## Railway النشر:
1. اذهب لـ https://railway.app
2. New Project → Deploy from GitHub
3. اختر مجلد wa-server
4. أضف Redis plugin من Railway
5. أضف Environment Variables
6. انسخ الـ URL (مثلاً: https://tsab-wa.railway.app)

## Next.js Integration:
في src/app/api/devices/route.ts:
- استقبال طلب ربط جهاز
- إرسال طلب لـ WA Server
- Socket.IO client يستقبل QR ويعرضه

## صفحة QR في Next.js:
src/components/devices/QRModal.tsx:
- تحميل Socket.IO client
- الانضمام لغرفة deviceId
- استقبال QR → عرضه
- استقبال device:connected → إغلاق Modal
- Timer 60 ثانية → refresh QR تلقائياً
- عرض instructions: "افتح واتساب → المزيد → الأجهزة المرتبطة → ربط جهاز"
```

## ✅ Checklist Phase 3:
- [ ] إنشاء مجلد wa-server
- [ ] npm install في wa-server
- [ ] كتابة whatsapp.js كامل
- [ ] كتابة routes كاملة
- [ ] اختبار QR محلياً
- [ ] إنشاء مشروع Railway
- [ ] إضافة Redis plugin
- [ ] رفع wa-server لـ Railway
- [ ] اختبار الاتصال بين Next.js و WA Server
