# Phase 4: Auth + Dashboard Layout + Home

## المطلوب من Claude Code:

```
أنشئ نظام المصادقة ولوحة التحكم الرئيسية لمنصة Tsab Bot.

## 1. نظام المصادقة (Supabase Auth)

### src/lib/supabase/client.ts:
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () => createBrowserClient(url, key)

### src/lib/supabase/server.ts:
import { createServerClient } from '@supabase/ssr'
(للـ Server Components)

### src/middleware.ts:
- حماية كل routes تحت (dashboard) و (admin)
- redirect للـ /login إن لم يكن مسجلاً
- redirect للـ /admin فقط إن role === 'admin'

### صفحة Login: src/app/[locale]/(auth)/login/page.tsx
التصميم:
- خلفية Cosmic (نجوم + كرات ضوئية)
- بطاقة Glassmorphism في المنتصف
- لوغو Tsab Bot أعلاها
- حقول: البريد الإلكتروني + كلمة المرور
- زر تسجيل الدخول (gradient)
- رابط "نسيت كلمة المرور؟"
- رابط "ليس لديك حساب؟ سجّل الآن"
- Social login: تسجيل بـ Google (اختياري)
- خطأ واضح عند فشل الدخول

### صفحة Register: src/app/[locale]/(auth)/register/page.tsx
الحقول:
- الاسم الكامل
- البريد الإلكتروني
- كلمة المرور (مع strength indicator)
- تأكيد كلمة المرور
- كود الإحالة (اختياري، يُملأ من ?ref=)
- موافقة على الشروط
- زر "إنشاء حساب"

بعد التسجيل:
- Supabase ينشئ المستخدم في auth.users
- Trigger ينشئ profile تلقائياً
- بدء trial تلقائياً (Professional 7 أيام)
- redirect للـ /home

## 2. Dashboard Layout

### src/app/[locale]/(dashboard)/layout.tsx:
- Sidebar (270px عرض)
- Header (60px ارتفاع)
- Main content area
- دعم RTL/LTR

### Sidebar (src/components/layout/Sidebar.tsx):
التصميم:
- خلفية: #0E0E1A
- لوغو + اسم المنصة أعلى
- قائمة التنقل مع أيقونات Lucide
- حالة الاشتراك (خطة + أيام متبقية) أسفل
- زر تسجيل الخروج
- Collapse button (يصبح icon-only)
- Active link مع gradient highlight
- Smooth transitions

روابط القائمة:
🏠 الرئيسية
📱 الأجهزة
📢 الحملات
💬 سجل الرسائل
🤖 الرد التلقائي
🔀 تدفق المحادثة
📋 القوالب
📒 دليل الهاتف
📁 مدير الملفات
📊 التقارير
🎫 التذاكر
👑 الخطط
───────────
⚙️ الإعدادات
📈 مركز الإحالات
🔌 API

### Header (src/components/layout/Header.tsx):
- زر toggle للـ sidebar
- اسم الصفحة الحالية
- Search bar (CTRL+K)
- بيل الإشعارات
- صورة المستخدم + dropdown:
  * اسم المستخدم + البريد
  * الإعدادات
  * تسجيل الخروج

## 3. Home Dashboard: src/app/[locale]/(dashboard)/home/page.tsx

### البطاقات الإحصائية (6 بطاقات):
كل بطاقة: أيقونة + رقم + وصف + trend indicator

1. 📱 الأجهزة: متصل / إجمالي (أخضر)
2. 💬 الرسائل: مرسلة اليوم (أزرق)
3. 📢 الحملات: نشطة / إجمالي (بنفسجي)
4. ✅ نسبة النجاح: % الرسائل الناجحة (أخضر)
5. 👑 الخطة: اسمها + أيام متبقية (ذهبي)
6. 📩 رسائل متبقية: من الحد الشهري (رمادي)

### الرسوم البيانية:
- Line Chart: نشاط الرسائل (7 أيام) - Recharts
- Donut Chart: توزيع أنواع الرسائل

### الجداول:
- آخر 5 رسائل مرسلة
- آخر 5 حملات

### Cosmic Stats Animation:
- الأرقام تعدّ من 0 عند تحميل الصفحة
- micro-animations على البطاقات
- skeleton loading أثناء جلب البيانات

## 4. التصميم العام للـ Dashboard:

```css
/* Dashboard Colors */
--sidebar-bg: #0E0E1A
--header-bg: #080812/80 backdrop-blur
--card-bg: #12121F
--card-border: #1E1E35
--card-hover: #1A1A2E

/* Active nav item */
background: linear-gradient(135deg, #7C3AED20, #2563EB20)
border-left: 2px solid #7C3AED
color: #A78BFA

/* Stats Cards */
بنفسجي: border-top: 2px solid #7C3AED
أخضر: border-top: 2px solid #10B981
أزرق: border-top: 2px solid #2563EB
ذهبي: border-top: 2px solid #F59E0B
```

## ✅ Checklist Phase 4:
- [ ] Supabase client/server setup
- [ ] Middleware للحماية
- [ ] صفحة Login (Cosmic design)
- [ ] صفحة Register
- [ ] Dashboard Layout (Sidebar + Header)
- [ ] Home Dashboard مع البطاقات والرسوم البيانية
- [ ] جلب البيانات من Supabase
- [ ] Skeleton loading
- [ ] اختبار التسجيل والدخول
```
