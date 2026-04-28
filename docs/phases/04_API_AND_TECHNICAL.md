# 🔌 API Endpoints الكاملة + آلية العمل التقنية

## Base URL
```
https://yourdomain.com/api/v1
```

## المصادقة
```
Authorization: Bearer {api_key}    ← للمطورين الخارجيين
Authorization: Bearer {jwt_token}  ← للـ Frontend
```

---

## 📋 كل الـ API Endpoints

### Auth - المصادقة
```
POST   /auth/register              إنشاء حساب جديد
POST   /auth/login                 تسجيل دخول
POST   /auth/logout                تسجيل خروج
POST   /auth/otp/send              إرسال OTP
POST   /auth/otp/verify            التحقق من OTP
POST   /auth/forgot-password       نسيت كلمة المرور
POST   /auth/reset-password        إعادة تعيين كلمة المرور
GET    /auth/me                    بيانات المستخدم الحالي
PUT    /auth/profile               تحديث الملف الشخصي
POST   /auth/api-key/regenerate    إعادة توليد API Key
```

### Devices - الأجهزة
```
GET    /devices                    قائمة أجهزتي
POST   /devices                    إضافة جهاز جديد
GET    /devices/:id                بيانات جهاز محدد
PUT    /devices/:id                تحديث إعدادات جهاز
DELETE /devices/:id                حذف جهاز
GET    /devices/:id/qr             الحصول على QR Code (base64)
POST   /devices/:id/disconnect     فصل الجهاز
POST   /devices/:id/reconnect      إعادة الاتصال
GET    /devices/:id/status         حالة الجهاز الآنية
POST   /devices/:id/ai/toggle      تفعيل/تعطيل AI
PUT    /devices/:id/ai/prompt      تحديث System Prompt للـ AI
```

### Messages - الرسائل
```
POST   /messages/text              إرسال نص
POST   /messages/image             إرسال صورة
POST   /messages/video             إرسال فيديو
POST   /messages/document          إرسال مستند
POST   /messages/location          إرسال موقع
POST   /messages/product           إرسال منتج
POST   /messages/list              إرسال قائمة
POST   /messages/button            إرسال أزرار
POST   /messages/poll              إرسال استطلاع
POST   /messages/sticker           إرسال ملصق
POST   /messages/contact           إرسال جهة اتصال
POST   /messages/audio             إرسال صوت
POST   /messages/channel           إرسال للقناة
GET    /messages                   سجل الرسائل
GET    /messages/:id               رسالة محددة
```

### Campaigns - الحملات
```
GET    /campaigns                  قائمة حملاتي
POST   /campaigns                  إنشاء حملة
GET    /campaigns/:id              تفاصيل حملة
PUT    /campaigns/:id              تحديث حملة
DELETE /campaigns/:id              حذف حملة
POST   /campaigns/:id/start        بدء الحملة
POST   /campaigns/:id/pause        إيقاف مؤقت
POST   /campaigns/:id/resume       استئناف
POST   /campaigns/:id/stop         إيقاف نهائي
GET    /campaigns/:id/messages     رسائل الحملة
```

### Contacts - جهات الاتصال
```
GET    /contacts                   قائمة جهات الاتصال
POST   /contacts                   إضافة جهة اتصال
GET    /contacts/:id               جهة اتصال محددة
PUT    /contacts/:id               تحديث
DELETE /contacts/:id               حذف
POST   /contacts/import            استيراد CSV
GET    /contacts/export            تصدير CSV
POST   /contacts/import/device     استيراد من الجهاز
DELETE /contacts/bulk              حذف مجموعة
```

### Auto Reply - الرد التلقائي
```
GET    /autoreply                  قائمة القواعد
POST   /autoreply                  إنشاء قاعدة
GET    /autoreply/:id              قاعدة محددة
PUT    /autoreply/:id              تحديث قاعدة
DELETE /autoreply/:id              حذف قاعدة
POST   /autoreply/:id/toggle       تفعيل/تعطيل
```

### Chat Flows
```
GET    /chatflows                  قائمة التدفقات
POST   /chatflows                  إنشاء تدفق
GET    /chatflows/:id              تدفق محدد
PUT    /chatflows/:id              تحديث تدفق
DELETE /chatflows/:id              حذف تدفق
POST   /chatflows/:id/toggle       تفعيل/تعطيل
POST   /chatflows/:id/test         اختبار التدفق
```

### Templates - القوالب
```
GET    /templates                  قائمة القوالب
POST   /templates                  إنشاء قالب
GET    /templates/:id              قالب محدد
PUT    /templates/:id              تحديث
DELETE /templates/:id              حذف
```

### Files - الملفات
```
GET    /files                      قائمة الملفات
POST   /files/upload               رفع ملف
DELETE /files/:id                  حذف ملف
POST   /files/folder               إنشاء مجلد
```

### Plans - الخطط
```
GET    /plans                      قائمة الخطط المتاحة
POST   /plans/:id/subscribe        اشتراك في خطة
GET    /subscription/current       اشتراكي الحالي
```

### Reports - التقارير
```
GET    /reports/overview           نظرة عامة
GET    /reports/messages           تقرير الرسائل
GET    /reports/campaigns          تقرير الحملات
GET    /reports/devices            تقرير الأجهزة
GET    /reports/ai-usage           استخدام الذكاء الاصطناعي
```

### Tickets - التذاكر
```
GET    /tickets                    تذاكري
POST   /tickets                    إنشاء تذكرة
GET    /tickets/:id                تذكرة محددة
POST   /tickets/:id/messages       إرسال رد
PUT    /tickets/:id/close          إغلاق التذكرة
```

### Referrals - الإحالات
```
GET    /referrals/stats            إحصائياتي
GET    /referrals/users            المستخدمون المُحالون
GET    /referrals/commissions      جدول العمولات
GET    /referrals/withdrawals      سجل السحوبات
POST   /referrals/withdraw         طلب سحب
```

### WA Warmer
```
GET    /warmer/sessions            جلساتي
POST   /warmer/sessions            إنشاء جلسة
PUT    /warmer/sessions/:id        تحديث جلسة
POST   /warmer/sessions/:id/start  بدء التدفئة
POST   /warmer/sessions/:id/stop   إيقاف
DELETE /warmer/sessions/:id        حذف
```

### Number Filter
```
POST   /filter/numbers             تصفية أرقام
GET    /filter/countries           قائمة الدول
```

### Settings
```
GET    /settings                   كل الإعدادات
PUT    /settings/profile           تحديث الملف
PUT    /settings/security          إعدادات الأمان
PUT    /settings/notifications     إعدادات الإشعارات
GET    /settings/api-key           مفتاح API
POST   /settings/api-key/regen     إعادة توليد
```

---

## 📥 أمثلة على الطلبات (Request Examples)

### إرسال رسالة نصية
```javascript
POST /api/v1/messages/text
{
  "deviceId": "uuid-of-device",
  "phone": "966501234567",
  "message": "مرحباً! كيف يمكنني مساعدتك؟ 😊"
}
```

### إرسال صورة
```javascript
POST /api/v1/messages/image
{
  "deviceId": "uuid",
  "phone": "966501234567",
  "imageUrl": "https://example.com/image.jpg",
  "caption": "شاهد منتجاتنا الجديدة!"
}
```

### إرسال قائمة (List Message)
```javascript
POST /api/v1/messages/list
{
  "deviceId": "uuid",
  "phone": "966501234567",
  "title": "اختر خدمتنا",
  "body": "يرجى اختيار الخدمة المناسبة",
  "buttonText": "عرض الخيارات",
  "sections": [
    {
      "title": "الخدمات الرئيسية",
      "rows": [
        {"id": "1", "title": "الدعم التقني", "description": "مشاكل تقنية"},
        {"id": "2", "title": "الفوترة", "description": "استفسارات الفواتير"},
        {"id": "3", "title": "الشكاوى", "description": "تقديم شكوى"}
      ]
    }
  ]
}
```

### إرسال أزرار (Button Message)
```javascript
POST /api/v1/messages/button
{
  "deviceId": "uuid",
  "phone": "966501234567",
  "body": "هل أنت مهتم بعروضنا؟",
  "buttons": [
    {"id": "yes", "text": "نعم، أريد العروض"},
    {"id": "no", "text": "لا شكراً"},
    {"id": "later", "text": "لاحقاً"}
  ]
}
```

### إنشاء حملة جماعية
```javascript
POST /api/v1/campaigns
{
  "name": "حملة العيد 2025",
  "deviceId": "uuid",
  "messageType": "image",
  "messageContent": {
    "imageUrl": "https://example.com/eid-offer.jpg",
    "caption": "عروض العيد الخاصة! خصم 30% على كل المنتجات\nكود الخصم: EID2025"
  },
  "recipientType": "numbers",
  "recipients": ["966501234567", "966509876543", "966551234567"],
  "delayMin": 3,
  "delayMax": 7,
  "scheduledAt": "2025-03-30T09:00:00Z"
}
```

---

## 🔔 Webhook Events

عندما المستخدم يضبط Webhook URL، يتلقى هذه الأحداث:

### رسالة واردة
```json
{
  "event": "message.received",
  "deviceId": "uuid",
  "timestamp": "2025-01-01T10:00:00Z",
  "data": {
    "from": "966501234567",
    "fromName": "أحمد محمد",
    "messageId": "wa-message-id",
    "type": "text",
    "content": {
      "text": "مرحبا، كيف حالك؟"
    }
  }
}
```

### تغيير حالة رسالة
```json
{
  "event": "message.status",
  "data": {
    "messageId": "uuid",
    "waMessageId": "wa-id",
    "status": "delivered",
    "timestamp": "2025-01-01T10:00:05Z"
  }
}
```

### تغيير حالة جهاز
```json
{
  "event": "device.status",
  "data": {
    "deviceId": "uuid",
    "phone": "966501234567",
    "status": "connected",
    "timestamp": "2025-01-01T10:00:00Z"
  }
}
```

---

## 🔄 Socket.IO Events

### من السيرفر للـ Client:
```javascript
// QR Code جديد للمسح
socket.on('qr', (data) => {
  // data.qr = base64 QR image
  // data.deviceId = uuid
})

// تغيير حالة الجهاز
socket.on('device:status', (data) => {
  // data.deviceId, data.status
})

// رسالة واردة جديدة
socket.on('message:incoming', (data) => {
  // data.from, data.content, data.type
})

// تحديث حالة حملة
socket.on('campaign:update', (data) => {
  // data.campaignId, data.sent, data.failed, data.total
})

// إشعار عام
socket.on('notification', (data) => {
  // data.type, data.title, data.message
})
```

### من الـ Client للسيرفر:
```javascript
// الانضمام لغرفة الجهاز
socket.emit('device:join', { deviceId: 'uuid' })

// الخروج من غرفة
socket.emit('device:leave', { deviceId: 'uuid' })
```

---

## 🧠 آلية عمل الذكاء الاصطناعي (Gemini)

### الكود الكامل لـ ai.service.js:
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const redis = require('../config/redis');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateReply(options) {
  const {
    userMessage,
    conversationHistory = [],
    systemPrompt = 'أنت مساعد ذكي لخدمة العملاء. أجب بشكل ودي ومهني.',
    maxTokens = 200,
    deviceId,
    contactPhone
  } = options;

  // 1. فحص الـ Cache أولاً
  const cacheKey = `ai:${deviceId}:${Buffer.from(userMessage).toString('base64')}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // 2. تجهيز تاريخ المحادثة
  const history = conversationHistory.slice(-10).map(msg => ({
    role: msg.direction === 'incoming' ? 'user' : 'model',
    parts: [{ text: typeof msg.content === 'string' ? msg.content : msg.content.text || '' }]
  }));

  // 3. إنشاء النموذج
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
      topP: 0.8
    }
  });

  // 4. إرسال الرسالة
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(userMessage);
  const reply = result.response.text();

  // 5. حساب التكلفة وتسجيلها
  const usage = result.response.usageMetadata;
  const costUSD = (usage.promptTokenCount * 0.0000001) + (usage.candidatesTokenCount * 0.0000004);
  
  await logAIUsage({ deviceId, contactPhone, usage, costUSD });

  // 6. Cache للرد (30 دقيقة)
  await redis.setex(cacheKey, 1800, JSON.stringify(reply));

  return reply;
}

// التحقق من الرسائل المشابهة
async function shouldUseCache(message) {
  const simple = message.toLowerCase().trim();
  const cached = await redis.get(`ai:simple:${simple}`);
  return cached;
}
```

### استراتيجية تقليل التكلفة:
```
1. Cache: ردود الكلمات المتشابهة تُحفظ 30 دقيقة
2. Max Tokens: 200 توكن للإخراج فقط
3. فحص Auto Reply أولاً قبل الـ AI
4. إيقاف AI خارج ساعات العمل (إن أراد المستخدم)
5. حد يومي: X طلب/يوم حسب الخطة
6. Groq API مجاني للنماذج مفتوحة المصدر (Llama)
```

---

## ⚙️ آلية عمل الإرسال الجماعي (Bull Queue)

```javascript
// campaign.job.js
const Queue = require('bull');
const campaignQueue = new Queue('campaign', {
  redis: { host: process.env.REDIS_HOST, port: 6379 }
});

// إضافة الحملة للـ Queue
async function scheduleCampaign(campaign) {
  const contacts = await getRecipients(campaign);
  
  const jobs = contacts.map((contact, index) => ({
    name: 'send-message',
    data: {
      campaignId: campaign.id,
      deviceId: campaign.deviceId,
      contact,
      message: campaign.messageContent,
      messageType: campaign.messageType
    },
    opts: {
      // تأخير عشوائي لكل رسالة
      delay: index * getRandomDelay(campaign.delayMin, campaign.delayMax) * 1000,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    }
  }));

  await campaignQueue.addBulk(jobs);
  await Campaign.update({ status: 'running', totalCount: contacts.length }, { where: { id: campaign.id } });
}

// معالجة كل رسالة
campaignQueue.process('send-message', 5, async (job) => {
  const { campaignId, deviceId, contact, message, messageType } = job.data;
  
  try {
    // استبدال المتغيرات
    const personalizedContent = replaceVariables(message, contact);
    
    // إرسال الرسالة
    await whatsappService.sendMessage(deviceId, contact.phone, personalizedContent, messageType);
    
    // تحديث الإحصائيات
    await Campaign.increment('sentCount', { where: { id: campaignId } });
    await Message.create({ campaignId, status: 'sent', ... });
    
    // إشعار Socket.IO
    io.to(`user:${userId}`).emit('campaign:update', { campaignId, ... });
    
  } catch (error) {
    await Campaign.increment('failedCount', { where: { id: campaignId } });
    await Message.create({ campaignId, status: 'failed', errorMessage: error.message });
    throw error; // سيُعيد المحاولة تلقائياً
  }
});

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

---

## 🔥 آلية عمل WA Warmer

```javascript
// warmer.job.js
const warmingMessages = {
  ar: [
    'مرحبا', 'كيف حالك؟', 'أهلا', 'صباح الخير', 'مساء النور',
    'إن شاء الله بخير', 'الحمد لله', 'شكرا', 'تمام', 'ماشي'
  ],
  emojis: ['👋', '😊', '🌟', '✨', '🙏', '💪', '👍', '❤️']
};

async function executeWarmingSession(session) {
  const devices = await Device.findAll({ where: { id: session.deviceIds } });
  if (devices.length < 2) return;

  const targetToday = getTargetForDay(session.currentDay);
  
  for (let i = 0; i < targetToday; i++) {
    // اختر جهازين عشوائيين
    const [sender, receiver] = getRandomPair(devices);
    
    // اختر رسالة عشوائية
    const message = getRandomMessage();
    
    // أرسل الرسالة
    await whatsappService.sendText(sender.id, receiver.phone, message);
    
    // انتظر بين 30 ثانية و 3 دقائق
    await sleep(getRandomDelay(30, 180) * 1000);
  }
  
  // تحديث السجل
  await WarmerSession.update({
    messagesToday: targetToday,
    totalMessages: session.totalMessages + targetToday,
    currentDay: session.currentDay + 1
  }, { where: { id: session.id } });
}

function getTargetForDay(day) {
  if (day <= 3) return 5;
  if (day <= 7) return 10;
  if (day <= 14) return 20;
  return 50;
}
```
