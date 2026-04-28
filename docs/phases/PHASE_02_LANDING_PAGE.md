# Phase 2: Landing Page - Cosmic Design

## المطلوب من Claude Code:

```
أنشئ Landing Page احترافية لمنصة "Tsab Bot" لإدارة بوتات الواتساب.

## التصميم - Cosmic Theme:
الألوان:
- خلفية: #080812 (أسود كوني)
- بطاقات: #12121F
- بنفسجي: #7C3AED
- ذهبي: #F59E0B  
- أخضر: #10B981
- نص: #F8FAFC

الخطوط:
- عربي: Tajawal (Google Fonts)
- إنجليزي: Inter (Google Fonts)

## ملف: src/app/[locale]/page.tsx

الأقسام بالترتيب:

1. NAVBAR:
- لوغو (أيقونة + Tsab Bot)
- روابط: الميزات، الأسعار، API، تواصل
- زر "تسجيل الدخول" (outline)
- زر "ابدأ مجاناً" (gradient بنفسجي)
- تبديل لغة AR/EN
- Sticky + blur backdrop

2. HERO SECTION - Cosmic Animation:
- خلفية: جسيمات نجوم متحركة (canvas animation)
- كرات ضوئية floating (بنفسجي + أزرق + أخضر)
- العنوان: "أتمتة واتساب بقوة الذكاء الاصطناعي" (Typewriter effect)
- وصف: "منصة متكاملة لإدارة بوتات الواتساب مع ردود ذكية فورية"
- زر "ابدأ مجاناً - 7 أيام" (animated gradient border)
- زر "شاهد العرض" (outline)
- صورة Dashboard mockup مع glow effect
- إحصائيات: 10K+ عميل | 50M+ رسالة | 99.9% وقت تشغيل

3. FEATURES (6 بطاقات):
- Glassmorphism cards مع hover animation
- أيقونات Lucide ملوّنة
- البطاقات:
  * 🤖 ردود الذكاء الاصطناعي - Gemini 2.0 Flash
  * 📢 حملات جماعية - إرسال لآلاف في دقائق
  * ⚡ رد تلقائي - متاح 24/7
  * 🔌 API قوي - تكامل سهل
  * 🔘 أزرار تفاعلية - تجربة مستخدم احترافية
  * 📊 تحليلات مفصلة - تتبع كل شيء

4. HOW IT WORKS (3 خطوات):
- خطوط متصلة متحركة بين الخطوات
- 1: اربط جهاز واتساب عبر QR
- 2: بنّ بوتك واضبط ردودك
- 3: أرسل وتابع النتائج

5. PRICING (3 بطاقات):
- Basic: 39 SAR/شهر (3 أيام مجاناً)
- Professional: 79 SAR/شهر (7 أيام مجاناً) - RECOMMENDED badge ذهبي
- Business: 99 SAR/شهر
- مقارنة مميزات كاملة تحت البطاقات
- كل بطاقة لها gradient border عند hover

6. TESTIMONIALS:
- 3 بطاقات آراء عملاء
- نجوم تقييم
- Glassmorphism

7. FAQ (Accordion):
- 6 أسئلة شائعة
- Smooth animation

8. CTA النهائي:
- خلفية gradient كاملة
- "ابدأ تجربتك المجانية اليوم"
- زر كبير

9. FOOTER:
- لوغو + وصف قصير
- روابط: المنصة، الشركة، الدعم
- سوشيال ميديا
- حقوق النشر

## Cosmic Background Animation (Canvas):
```javascript
// نجوم صغيرة متحركة
// كرات ضوئية كبيرة floating
// خطوط متصلة بين النجوم القريبة
// ألوان: #7C3AED, #2563EB, #10B981
```

## تفاصيل تقنية:
- استخدم Framer Motion لكل الـ animations
- Intersection Observer للـ scroll animations
- useEffect للـ canvas animation
- RTL كافتراضي
- Responsive كامل (mobile first)
- next/image لتحسين الصور
- TypeScript كامل

## ملفات إضافية:
- src/components/cosmic/StarField.tsx (كانفاس النجوم)
- src/components/cosmic/FloatingOrbs.tsx (الكرات الضوئية)
- src/components/landing/Navbar.tsx
- src/components/landing/Hero.tsx
- src/components/landing/Features.tsx
- src/components/landing/Pricing.tsx
- src/components/landing/Footer.tsx
```
