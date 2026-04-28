# Phase 6: Campaigns + Bulk Sending

# Phase 7: Auto Reply + Chat Flow Builder

# Phase 8: AI Integration (Gemini)

# Phase 9: Plans + Activation Codes (Admin)

# Phase 10: Referral System

# Phase 11: Admin Panel (Master Admin)

# Phase 12: Reports + Analytics

# Phase 13: Number Filter + WA Warmer

# Phase 14: File Manager + Phone Book + Settings

# Phase 15: Deploy (Vercel + Railway)

---

## Phase 6: Campaigns + Bulk Sending

```
أنشئ نظام الحملات والإرسال الجماعي:

## src/app/[locale]/(dashboard)/campaigns/page.tsx

### القائمة الرئيسية:
- جدول الحملات: الاسم، الجهاز، الحالة، التقدم (progress bar)، الإحصائيات، التاريخ
- فلاتر: الحالة، الجهاز، التاريخ
- زر "+ حملة جديدة"

### Campaign Builder (Multi-step):

**الخطوة 1: المعلومات الأساسية**
- اسم الحملة
- اختيار الجهاز
- التأخير بين الرسائل:
  * Slider: من X إلى Y ثانية
  * الافتراضي: 3-7 ثواني
  * التوصية: ⚠️ "نوصي بـ 5-10 ثواني لتجنب الحظر"
  * تحذير أحمر إن كان أقل من 2

**الخطوة 2: المستلمون**
- نوع المستلمين (Tabs):
  * أرقام يدوية (textarea - رقم لكل سطر)
  * دليل الهاتف (اختيار من الجهاز)
  * رفع ملف CSV
- عرض عداد الأرقام
- تحذير إن كان العدد يتجاوز الرسائل المتبقية

**الخطوة 3: محتوى الرسالة**
- اختيار نوع الرسالة (tabs مع أيقونات):
  📝 نص | 🖼 صورة | 🎬 فيديو | 📄 مستند | 📍 موقع | 📊 استطلاع | 🔘 أزرار | 📋 قائمة
- لكل نوع: محرر مخصص
- دعم المتغيرات: {{اسم}} {{رقم_الهاتف}} {{تاريخ}}
- Preview فوري للرسالة (محاكاة واتساب)

**الخطوة 4: الجدولة**
- إرسال فوري
- جدولة (date/time picker)

**ملخص + زر إرسال**

### Real-time Progress:
- Progress bar تتحدث لحظياً
- عداد: مرسلة / فاشلة / منتظرة
- Socket.IO event: 'campaign:update'
- زر إيقاف مؤقت / استئناف / إلغاء

### API Routes:
POST /api/campaigns          ← إنشاء
POST /api/campaigns/[id]/start
POST /api/campaigns/[id]/pause
POST /api/campaigns/[id]/resume
POST /api/campaigns/[id]/stop
GET  /api/campaigns/[id]/messages
```

---

## Phase 7: Auto Reply + Chat Flow Builder

```
## Auto Reply (src/app/[locale]/(dashboard)/autoreply/page.tsx):

### قائمة القواعد:
- جدول: الاسم، الجهاز، نوع التشغيل، الكلمة المفتاحية، الحالة، الاستخدامات
- Toggle لتفعيل/تعطيل كل قاعدة
- Drag to reorder (الأولوية)

### Form إنشاء قاعدة:
1. اختيار الجهاز
2. نوع التشغيل:
   - تطابق كلمة مفتاحية
   - يحتوي على
   - يبدأ بـ
   - أول رسالة
   - خارج أوقات العمل
   - كل الرسائل
3. الكلمة المفتاحية (إن طُلبت)
4. نوع الرد + محتواه
5. ساعات العمل (if خارج الأوقات)
6. أيام العمل (checkboxes)

## Chat Flow Builder (src/app/[locale]/(dashboard)/chatflow/page.tsx):

### الواجهة:
- React Flow كانفاس (كامل الشاشة)
- Toolbar يسار: أنواع العقد للسحب (Drag)
- Panel يمين: تعديل العقدة المحددة
- Topbar: اسم التدفق + حفظ + اختبار + رجوع

### أنواع العقد:
- StartNode: بنفسجي - الكلمة المفتاحية
- MessageNode: أزرق - إرسال رسالة
- QuestionNode: أخضر - سؤال مع خيارات
- ConditionNode: برتقالي - شرط
- AINode: ذهبي - ذكاء اصطناعي
- DelayNode: رمادي - انتظار
- EndNode: أحمر - نهاية

### حفظ/تحميل:
- Auto-save كل 30 ثانية
- تصدير JSON
- استيراد JSON
```

---

## Phase 8: AI Integration

```
## src/lib/ai/gemini.ts:
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateReply({
  message, history, systemPrompt, maxTokens = 200
}) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt || 'أنت مساعد ذكي ودود. أجب باللغة التي يكتب بها المستخدم.',
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
  })
  const chat = model.startChat({ history })
  const result = await chat.sendMessage(message)
  return result.response.text()
}

## في WA Server (whatsapp.js):
- عند رسالة واردة + ai_enabled=true + لا يوجد auto_reply:
  * جلب آخر 10 رسائل للسياق
  * إرسال للـ Gemini
  * إرسال الرد

## في Dashboard:
- صفحة إعدادات AI لكل جهاز
- System Prompt editor مع templates جاهزة
- إحصائيات الاستخدام
- تكلفة تقريبية شهرية
```

---

## Phase 9: Plans + Activation Codes

```
## صفحة الخطط (src/app/[locale]/(dashboard)/plans/page.tsx):
- عرض الخطط الثلاثة
- مقارنة المميزات
- خطتي الحالية مميزة
- بطاقة "كيف أشترك؟":
  "1. تواصل معنا عبر واتساب
   2. أتم عملية الدفع
   3. ستصلك كود التفعيل
   4. أدخله هنا"
- حقل إدخال كود التفعيل
- زر "تفعيل الكود"

## API: POST /api/subscription/activate:
- التحقق من الكود في activation_codes
- التحقق من صلاحيته (is_active, max_uses, expires_at)
- إنشاء subscription جديد
- زيادة uses_count
- تعطيل الكود إن وصل للحد

## Admin - Activation Codes (src/app/[locale]/(admin)/admin/codes/page.tsx):
- جدول الأكواد: الكود، الخطة، الاستخدام، الصلاحية، الحالة
- زر "+ إنشاء كود"
- Form:
  * الخطة
  * مدة الاشتراك (بالأيام) أو يرث من الخطة
  * عدد الاستخدامات (1 = لمستخدم واحد)
  * تاريخ انتهاء الكود (اختياري)
  * ملاحظات (لمن أُعطي)
- نسخ الكود بنقرة
- تعطيل كود نشط

## تجهيز بوابات الدفع (للمستقبل):
src/lib/payments/:
- moyasar.ts (جاهز بدون activation)
- stripe.ts (جاهز بدون activation)
- paytabs.ts (جاهز بدون activation)
- hyperpay.ts (جاهز بدون activation)
كل ملف: الكود كامل، معطّل بـ comment // TODO: تفعيل عند الجاهزية
```

---

## Phase 10: Referral System

```
## صفحة مركز الإحالات:

### بطاقات الأرباح:
- أرباح متاحة (أخضر)
- أرباح محجوزة 14 يوم (برتقالي)
- إجمالي الأرباح (بنفسجي)

### أدوات المشاركة:
- الكود مع زر نسخ + animation
- الرابط مع أزرار مشاركة (واتساب، تويتر)

### السحب:
- حقل المبلغ (min: 25 SAR)
- IBAN + اسم البنك
- زر طلب السحب

### الجداول: المحالون، العمولات، السحوبات

## Trigger في Supabase:
عند إنشاء subscription جديد → إن كان للمستخدم referrer → إنشاء referral record
```

---

## Phase 11: Admin Panel (Master Admin)

```
## حماية الـ Admin:
- middleware: تحقق role === 'admin'
- أول مستخدم يُنشأ في DB = admin يدوياً:
  UPDATE profiles SET role='admin' WHERE email='your@email.com';

## الصفحات:

### Dashboard (/admin):
إحصائيات كاملة:
- مستخدمون: إجمالي، الجدد اليوم، نشطون
- أجهزة: متصلة، إجمالي
- رسائل: اليوم، الشهر
- إيرادات: اليوم، الشهر (من subscriptions)
- رسوم بيانية: نمو المستخدمين، توزيع الخطط

### المستخدمون (/admin/users):
- جدول بكل المستخدمين + فلاتر + بحث
- لكل مستخدم:
  * تفاصيل كاملة
  * تغيير الخطة يدوياً
  * تمديد اشتراك (إضافة أيام)
  * إضافة رسائل إضافية
  * حظر/إلغاء حظر
  * Impersonate (دخول كالمستخدم)
  * عرض كل أجهزته ورسائله

### أكواد التفعيل (/admin/codes): كما في Phase 9

### التذاكر (/admin/tickets):
- كل التذاكر مع فلاتر
- داخل التذكرة: محادثة + إرسال رد + تغيير حالة

### الإحالات والسحوبات (/admin/referrals):
- طلبات السحب المعلقة
- قبول/رفض + ملاحظة
- إعدادات: نسبة العمولة %، حد السحب، مدة الانتظار

### إعدادات النظام (/admin/settings):
- مفتاح Gemini API
- System Prompt افتراضي
- وضع الصيانة
- إشعار عام للمنصة
- الاسم واللوغو

## Impersonate:
عند الضغط "دخول كمستخدم":
- إنشاء JWT مؤقت للمستخدم المستهدف
- فتح Dashboard بحساب المستخدم
- شريط أحمر أعلى: "أنت تتصفح كـ [اسم المستخدم] - العودة للأدمن"
```

---

## Phase 12: Reports + Analytics

```
## صفحة التقارير:

### نظرة عامة:
- رسائل اليوم / الأسبوع / الشهر (Line Chart)
- توزيع أنواع الرسائل (Donut)
- معدل النجاح / الفشل
- أكثر الأرقام تفاعلاً

### سجل الرسائل:
- جدول مع فلاتر كاملة
- معاينة الرسالة
- تصدير CSV

### تقرير الحملات:
- إحصائيات كل حملة
- رسم بياني للتقدم
```

---

## Phase 13: Number Filter + WA Warmer

```
## Number Filter:
- textarea لأرقام
- رفع CSV
- خيارات فلترة: دولة، حذف تكرار، فحص صلاحية
- زر فلترة + عرض النتائج
- تصدير الأرقام المفلترة

## WA Warmer:
- يتطلب 2+ أجهزة
- جدول التدفئة التلقائي
- إعدادات: الأجهزة، الهدف اليومي، أوقات الإرسال
- إحصائيات: رسائل اليوم، إجمالي، أيام التشغيل
- تشغيل/إيقاف
```

---

## Phase 14: File Manager + Phone Book + Settings

```
## File Manager:
- عرض شبكي/قائمة
- مجلدات
- رفع drag & drop
- نسخ رابط الملف
- حذف + تنظيم

## Phone Book:
- استيراد من الجهاز
- استيراد CSV
- تصدير
- بحث + tags
- استخدام في الحملات

## Settings:
- الملف الشخصي
- الأمان (كلمة المرور)
- API Key (عرض + تجديد)
- Webhook URL
- المنطقة الزمنية
- إعدادات الإشعارات
```

---

## Phase 15: Deploy to Production

```
## Vercel (Frontend - Next.js):
1. npm run build (تأكد بدون أخطاء)
2. git push للـ main
3. Vercel يعرف Next.js تلقائياً
4. أضف Environment Variables في Vercel Dashboard
5. Custom Domain (اختياري)

## Railway (WA Server):
1. New Project → GitHub repo → مجلد wa-server
2. أضف Redis plugin
3. أضف Environment Variables
4. Deploy تلقائي

## Supabase Production:
- قاعدة البيانات جاهزة
- تأكد من RLS policies
- أضف CORS للـ Vercel URL

## DNS + Domain:
- اشتر domain من Namecheap أو GoDaddy
- وجّه لـ Vercel
- SSL تلقائي

## Checklist قبل الإطلاق:
- [ ] اختبار كل الصفحات
- [ ] اختبار ربط جهاز واتساب حقيقي
- [ ] اختبار إرسال حملة (10 أرقام)
- [ ] اختبار الرد التلقائي
- [ ] اختبار AI
- [ ] اختبار كود التفعيل
- [ ] اختبار لوحة الأدمن
- [ ] اختبار على موبايل
- [ ] تحقق من RTL/LTR
- [ ] تحقق من الأداء (Lighthouse)
```
