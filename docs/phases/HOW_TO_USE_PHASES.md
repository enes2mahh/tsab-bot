# 📖 دليل استخدام الـ Phases مع Claude Code

## الملفات الموجودة:
```
PHASE_01_FOUNDATION.md          ← قاعدة البيانات + إعداد المشروع
PHASE_02_LANDING_PAGE.md        ← صفحة الهبوط (Cosmic Design)
PHASE_03_WHATSAPP_SERVER.md     ← سيرفر Baileys على Railway
PHASE_04_AUTH_DASHBOARD.md      ← المصادقة + لوحة التحكم
PHASE_05_DEVICES.md             ← صفحة الأجهزة + QR Code
PHASE_06_TO_15_REMAINING.md     ← Phases 6-15 كاملة
```

## كيفية الاستخدام:

### الخطوة 1: افتح Claude Code (claude.ai/code)

### الخطوة 2: أنشئ مشروع جديد
```bash
npx create-next-app@latest tsab-bot --typescript --tailwind --app --src-dir
cd tsab-bot
```

### الخطوة 3: أرسل Phase 1
انسخ محتوى PHASE_01_FOUNDATION.md وأرسله لـ Claude Code مع هذه الرسالة:
"أنشئ كل ما هو مطلوب في هذا الـ Phase بالكامل"

### الخطوة 4: اتبع الـ Checklist
بعد كل Phase، تحقق من كل ✅ قبل الانتقال للتالي

### الخطوة 5: تدخل يدوي مطلوب منك:

**في Phase 1:**
1. إنشاء حساب Supabase على https://supabase.com
2. إنشاء مشروع جديد
3. تشغيل SQL من Phase 1 في SQL Editor
4. نسخ المفاتيح لـ .env.local

**في Phase 3:**
1. إنشاء حساب Railway على https://railway.app
2. رفع wa-server كـ GitHub repo
3. إضافة Redis plugin
4. نسخ الـ URL

**في Phase 15:**
1. رفع Next.js لـ Vercel
2. إضافة Environment Variables
3. اختبار الإنتاج

### جعل نفسك Admin:
بعد تسجيل أول حساب في المنصة، شغّل هذا في Supabase SQL Editor:
```sql
UPDATE profiles SET role='admin' WHERE email='your-email@example.com';
```

## تسلسل التطوير الموصى به:
Phase 1 → Phase 4 → Phase 5 → Phase 3 → Phase 2 → Phase 6 → ...

يعني: أسس المشروع أولاً، ثم Auth، ثم الأجهزة، ثم WA Server، ثم Landing Page

## الـ Stack المجاني تماماً:
- Vercel: مجاني (100GB bandwidth/شهر)
- Supabase: مجاني (500MB DB, 1GB Storage)
- Railway: مجاني ($5 credit/شهر)
- Gemini: مجاني (15 req/دقيقة)
- الإجمالي: $0/شهر للـ MVP! 🎉
