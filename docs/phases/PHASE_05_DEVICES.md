# Phase 5: Devices Page + QR Connection

## المطلوب من Claude Code:

```
أنشئ صفحة الأجهزة الكاملة مع ربط واتساب عبر QR Code.

## src/app/[locale]/(dashboard)/devices/page.tsx

### الواجهة الكاملة:

#### Header الصفحة:
- العنوان: "أجهزة الواتساب"
- عداد: "2/3 أجهزة مستخدمة"
- زر "+ إضافة جهاز" (gradient, disabled إن وصل للحد)

#### جدول الأجهزة:
الأعمدة:
| الجهاز | رقم الهاتف | الحالة | الرسائل | Webhook | تاريخ الإضافة | الإجراءات |

- حالة متصل: 🟢 badge أخضر
- حالة منقطع: 🔴 badge رمادي
- حالة جاري الاتصال: 🟡 spinner متحرك
- حالة محظور: 🚫 badge أحمر

الإجراءات لكل جهاز (Dropdown):
- ⚙️ الإعدادات
- 🔄 إعادة الاتصال
- 📊 الإحصائيات
- ❌ قطع الاتصال
- 🗑️ حذف الجهاز

#### Empty State:
- أيقونة هاتف كبيرة + رسالة + زر إضافة

### Modal إضافة جهاز:
- اسم الجهاز (اختياري)
- رابط Webhook (اختياري) مع زر Test
- زر "إنشاء وعرض QR"

### QR Code Modal (الأهم):
```typescript
// src/components/devices/QRModal.tsx
- عرض QR Code بحجم 256x256
- نص توضيحي:
  "1. افتح واتساب على هاتفك"
  "2. اضغط المزيد (⋮) أو الإعدادات"
  "3. اختر الأجهزة المرتبطة"
  "4. اضغط ربط جهاز"
  "5. امسح رمز QR"
- Timer: 60 ثانية مع progress bar
- عند انتهاء الوقت: زر "تحديث QR"
- عند الاتصال: ✅ "تم الاتصال!" + إغلاق تلقائي

Socket.IO events:
socket.on('qr', ({deviceId, qr}) => setQR(qr))
socket.on('device:connected', ({deviceId}) => handleSuccess())
socket.on('device:disconnected', ({deviceId}) => handleDisconnect())
```

### Settings Drawer لكل جهاز:
- تعديل الاسم
- تعديل Webhook URL
- Toggle: تفعيل الذكاء الاصطناعي
- System Prompt للـ AI (textarea)
- تأخير الرسائل (slider: من X إلى Y ثانية)
  * التوصية: بين 3-10 ثواني
  * تحذير عند أقل من 2 ثانية
- زر حفظ

### API Routes:
src/app/api/devices/route.ts:
- GET: جلب أجهزة المستخدم
- POST: إنشاء جهاز جديد + إرسال طلب لـ WA Server

src/app/api/devices/[id]/route.ts:
- PUT: تحديث إعدادات الجهاز
- DELETE: حذف الجهاز + قطع الاتصال

src/app/api/devices/[id]/disconnect/route.ts:
- POST: قطع الاتصال

src/app/api/devices/[id]/reconnect/route.ts:
- POST: إعادة الاتصال

### Supabase Realtime:
```typescript
// الاشتراك في تغييرات حالة الأجهزة
supabase
  .channel('devices')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'devices',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    updateDeviceStatus(payload.new)
  })
  .subscribe()
```

### التحقق من حد الأجهزة:
- جلب subscription الحالية
- مقارنة devices.length مع plan.device_limit
- تعطيل زر الإضافة + رسالة "لقد وصلت للحد الأقصى"
- عرض بطاقة "ترقية خطتك لمزيد من الأجهزة"

### Animations:
- Framer Motion لدخول الصفوف
- Pulse animation على الجهاز المتصل
- Shake animation عند الخطأ

## ✅ Checklist Phase 5:
- [ ] صفحة الأجهزة الكاملة
- [ ] Modal إضافة جهاز
- [ ] QR Code Modal مع Socket.IO
- [ ] Settings Drawer
- [ ] API Routes كاملة
- [ ] Realtime updates
- [ ] فحص حد الأجهزة
- [ ] اختبار ربط جهاز حقيقي
```
