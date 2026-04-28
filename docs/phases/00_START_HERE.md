# 📖 دليل القراءة - ابدأ من هنا

## ترتيب قراءة الملفات:

```
1. 01_PROJECT_OVERVIEW.md       ← نظرة عامة على المشروع والأسعار
2. 02_PROJECT_STRUCTURE_AND_DATABASE.md  ← هيكل الملفات + SQL كامل
3. 03_PAGES_DESCRIPTION.md      ← وصف كل صفحة بالتفصيل
4. 04_API_AND_TECHNICAL.md      ← API Endpoints + كود تقني
5. 05_CLAUDE_CODE_PROMPTS.md    ← البرومتات الجاهزة لـ Claude Code
```

---

## كيفية استخدام هذه الملفات مع Claude Code:

### الخطوة 1:
أرسل لـ Claude Code الملف `05_CLAUDE_CODE_PROMPTS.md`
واختر **البرومت الجامع الرئيسي** أولاً.

### الخطوة 2:
أرفق معه الملفات كـ context:
- `02_PROJECT_STRUCTURE_AND_DATABASE.md`
- `03_PAGES_DESCRIPTION.md`
- `04_API_AND_TECHNICAL.md`

### الخطوة 3:
اتبع البرومتات بالترتيب (1 → 10)

---

## التقنيات المستخدمة:

| الطبقة | التقنية | السبب |
|--------|---------|-------|
| Backend API | Node.js + Express | سريع، مجتمع كبير، مناسب للـ real-time |
| واتساب | Baileys | الوحيد المجاني والمفتوح المصدر |
| قاعدة بيانات | PostgreSQL | قوي، مجاني، JSONB support |
| Cache/Queue | Redis + Bull | الأفضل للإرسال الجماعي |
| Frontend | React + Vite | الأسرع في البناء |
| CSS | Tailwind | سريع التطوير |
| AI | Gemini 2.0 Flash | **الأرخص** (~$0.04/1000 رسالة) |
| الدفع | Moyasar | الأفضل للسوق السعودي |

---

## تكلفة التشغيل الشهرية (تقدير):

| البند | التكلفة |
|-------|---------|
| VPS سيرفر (4GB RAM) | ~60 SAR |
| Domain + SSL | ~50 SAR/سنة |
| Gemini AI (1000 مستخدم) | ~40 SAR |
| SMS OTP | ~20 SAR |
| **الإجمالي** | **~130 SAR/شهر** |

---

## الإيرادات المتوقعة:

| المستخدمون | الإيراد الشهري | صافي الربح |
|-----------|---------------|-----------|
| 50 | ~3,850 SAR | ~3,720 SAR |
| 100 | ~7,700 SAR | ~7,570 SAR |
| 500 | ~38,500 SAR | ~38,370 SAR |
| 1000 | ~77,000 SAR | ~76,870 SAR |

---

## ما يميّزنا عن CAF Bot:

✅ **Live Chat Panel** موحد لكل الأجهزة  
✅ **Chat Flow Builder** بصري متقدم  
✅ **تحليلات متقدمة** + تصدير PDF  
✅ **A/B Testing** للرسائل  
✅ **إدارة فريق** متعدد المستخدمين  
✅ **Zapier Integration**  
✅ **White-label** قابل للتخصيص  
✅ **تكامل CRM** خارجي  

---

## ملاحظات مهمة:

> ⚠️ Baileys مكتبة غير رسمية. واتساب قد تحظر الأرقام.
> استخدم WA Warmer وتأخير عشوائي للحماية.

> 💡 ابدأ بـ Gemini Free Tier مجاناً (15 طلب/دقيقة)
> ثم انتقل للـ Paid عند نمو المستخدمين.

> 🚀 للنشر السريع: استخدم Railway.app أو Render.com
> بدلاً من VPS في البداية.
