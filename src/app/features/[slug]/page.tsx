'use client'

import { useState, use } from 'react'
import { Smartphone, Megaphone, MessageSquare, Code, Check, Zap, ArrowLeft, ArrowRight } from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Lang = 'ar' | 'en'

const FEATURES: Record<string, {
  ar: { title: string; subtitle: string; icon: any; color: string; bullets: string[]; useCases: { title: string; desc: string }[] }
  en: { title: string; subtitle: string; icon: any; color: string; bullets: string[]; useCases: { title: string; desc: string }[] }
}> = {
  devices: {
    ar: {
      title: 'الأجهزة',
      subtitle: 'اربط أجهزة واتساب متعدّدة وأدِرها من مكان واحد',
      icon: <Smartphone size={48} />,
      color: '#10B981',
      bullets: [
        'ربط لحظي عبر QR Code',
        'حالة الاتصال الحيّة (متصل/منقطع)',
        'إعادة اتصال تلقائية',
        'دعم متعدّد الأجهزة (حتى 10)',
        'شاشة QR احترافية مع مؤقّت',
        'إدارة شاملة (حذف، تعطيل، إعادة)',
      ],
      useCases: [
        { title: 'متجر إلكتروني', desc: 'اربط رقم خدمة العملاء + رقم المبيعات في حسابات منفصلة' },
        { title: 'وكالة تسويق', desc: 'أدِر أجهزة عملائك المتعدّدين من لوحة واحدة' },
        { title: 'فريق دعم', desc: 'وزّع المحادثات على أجهزة الموظفين' },
      ],
    },
    en: {
      title: 'Devices',
      subtitle: 'Link multiple WhatsApp devices and manage them from one place',
      icon: <Smartphone size={48} />,
      color: '#10B981',
      bullets: [
        'Instant QR code linking',
        'Live connection status',
        'Automatic reconnection',
        'Multi-device support (up to 10)',
        'Professional QR display with timer',
        'Full management (delete, disable, restore)',
      ],
      useCases: [
        { title: 'E-commerce', desc: 'Link separate accounts for customer service and sales numbers' },
        { title: 'Marketing Agency', desc: 'Manage multiple client devices from one dashboard' },
        { title: 'Support Team', desc: 'Distribute conversations across team member devices' },
      ],
    },
  },
  campaigns: {
    ar: {
      title: 'الحملات الجماعية',
      subtitle: 'أرسل آلاف الرسائل لقاعدة عملائك بأمان وذكاء',
      icon: <Megaphone size={48} />,
      color: '#F59E0B',
      bullets: [
        'استهداف من جهات الاتصال أو ملف CSV',
        'تأخير عشوائي ذكي بين الرسائل',
        'دعم النصوص + الصور + المستندات',
        'تتبع التسليم والقراءة لحظياً',
        'جدولة الحملات لوقت لاحق',
        'متغيّرات مخصّصة (الاسم، إلخ)',
        'إيقاف/استئناف الحملة في أي وقت',
      ],
      useCases: [
        { title: 'إعلانات العروض', desc: 'أرسل عروض الجمعة البيضاء لـ 10,000 عميل في ساعة' },
        { title: 'إشعار شحنات', desc: 'أبلغ العملاء بحالة طلباتهم تلقائياً' },
        { title: 'استطلاعات الرأي', desc: 'اجمع تقييمات العملاء بعد الشراء' },
      ],
    },
    en: {
      title: 'Bulk Campaigns',
      subtitle: 'Send thousands of messages to your customer base safely and smartly',
      icon: <Megaphone size={48} />,
      color: '#F59E0B',
      bullets: [
        'Target from contacts or CSV file',
        'Smart random delay between messages',
        'Text + images + documents support',
        'Live delivery and read tracking',
        'Schedule campaigns for later',
        'Custom variables (name, etc)',
        'Pause/resume any time',
      ],
      useCases: [
        { title: 'Promotional Offers', desc: 'Send Black Friday deals to 10,000 customers in an hour' },
        { title: 'Shipment Notifications', desc: 'Notify customers about order status automatically' },
        { title: 'Surveys', desc: 'Collect customer feedback after purchase' },
      ],
    },
  },
  autoreply: {
    ar: {
      title: 'الرد التلقائي',
      subtitle: 'ردّ على عملائك 24/7 بكلمات مفتاحية أو ذكاء اصطناعي',
      icon: <MessageSquare size={48} />,
      color: '#7C3AED',
      bullets: [
        'محفّزات متعدّدة (كلمات، احتواء، أوقات عمل)',
        'ردود نصية، صور، أزرار، قوائم',
        'ذكاء اصطناعي Gemini لردود طبيعية',
        'يقرأ آخر 20 رسالة لفهم السياق',
        'يبدأ بـ "تم القراءة" + "جاري الكتابة"',
        'تخصيص شخصية البوت بـ System Prompt',
        'تدفّق محادثات (Chat Flow) متشعّب',
      ],
      useCases: [
        { title: 'متجر إلكتروني', desc: 'بوت يرد على أسعار المنتجات والشحن تلقائياً' },
        { title: 'مطعم', desc: 'يعرض القائمة، يقبل الطلبات، ويرسل العنوان' },
        { title: 'حجوزات', desc: 'بوت يدير الحجوزات حسب التوفر بدون موظف' },
      ],
    },
    en: {
      title: 'Auto Reply',
      subtitle: 'Reply to customers 24/7 with keywords or AI',
      icon: <MessageSquare size={48} />,
      color: '#7C3AED',
      bullets: [
        'Multiple triggers (keywords, contains, business hours)',
        'Text, image, button, list responses',
        'Gemini AI for natural replies',
        'Reads last 20 messages for context',
        'Starts with "read" + "typing" indicators',
        'Custom bot personality via System Prompt',
        'Branched Chat Flow conversations',
      ],
      useCases: [
        { title: 'E-commerce', desc: 'Bot answers about product prices and shipping automatically' },
        { title: 'Restaurant', desc: 'Shows menu, takes orders, and sends location' },
        { title: 'Bookings', desc: 'Bot manages reservations based on availability' },
      ],
    },
  },
  api: {
    ar: {
      title: 'REST API',
      subtitle: 'ادمج Tsab Bot مع أي نظام لديك عبر API قوي',
      icon: <Code size={48} />,
      color: '#2563EB',
      bullets: [
        'مفتاح API لكل حساب (آمن وقابل للتجديد)',
        'إرسال رسائل: نص، صورة، فيديو، مستند',
        'استلام Webhook لكل رسالة واردة',
        'إدارة جهات الاتصال والمحادثات',
        'إنشاء حملات برمجياً',
        'استعلام الحالة وسجلات الإرسال',
        'توثيق كامل + أمثلة بالعربية',
      ],
      useCases: [
        { title: 'CRM Integration', desc: 'أرسل رسائل من نظام CRM عند تغيّر حالة العميل' },
        { title: 'متجر Shopify', desc: 'إرسال تأكيد الطلب + رقم التتبع لواتساب' },
        { title: 'تطبيق ذاتي', desc: 'استخدم تطبيقك لإرسال إشعارات للمستخدمين عبر واتساب' },
      ],
    },
    en: {
      title: 'REST API',
      subtitle: 'Integrate Tsab Bot with any system via a powerful API',
      icon: <Code size={48} />,
      color: '#2563EB',
      bullets: [
        'API key per account (secure and rotatable)',
        'Send messages: text, image, video, document',
        'Webhook for every incoming message',
        'Manage contacts and conversations',
        'Create campaigns programmatically',
        'Query status and message logs',
        'Full docs + Arabic examples',
      ],
      useCases: [
        { title: 'CRM Integration', desc: 'Send messages from CRM when customer status changes' },
        { title: 'Shopify Store', desc: 'Send order confirmation + tracking via WhatsApp' },
        { title: 'Custom App', desc: 'Use your app to send WhatsApp notifications to users' },
      ],
    },
  },
}

const COMMON = {
  ar: { back: 'العودة', cta: 'ابدأ مجاناً', features: 'الميزات', useCases: 'حالات الاستخدام', try: 'جرّب الآن' },
  en: { back: 'Back', cta: 'Start Free', features: 'Features', useCases: 'Use Cases', try: 'Try Now' },
}

export default function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [lang, setLang] = useState<Lang>('ar')

  const data = FEATURES[slug]
  if (!data) notFound()

  const f = data[lang]
  const c = COMMON[lang]

  return (
    <PublicShell lang={lang} setLang={setLang}>
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', marginBottom: '32px' }}>
          {lang === 'ar' ? <ArrowRight size={14} /> : <ArrowLeft size={14} />} {c.back}
        </Link>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: `${f.color}20`, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            {f.icon}
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>{f.title}</h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 32px' }}>{f.subtitle}</p>
          <Link href="/register" className="btn-primary" style={{ padding: '14px 32px', fontSize: '15px' }}>
            <Zap size={18} /> {c.try}
          </Link>
        </div>

        {/* Features list */}
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>{c.features}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '60px' }}>
          {f.bullets.map(b => (
            <div key={b} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px' }}>
              <Check size={18} color={f.color} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{b}</span>
            </div>
          ))}
        </div>

        {/* Use Cases */}
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>{c.useCases}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '60px' }}>
          {f.useCases.map(uc => (
            <div key={uc.title} className="glass" style={{ padding: '24px', borderRadius: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{uc.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{uc.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(16,185,129,0.1))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>{lang === 'ar' ? 'جاهز للبدء؟' : 'Ready to start?'}</h2>
          <Link href="/register" className="btn-primary" style={{ padding: '14px 32px', fontSize: '15px' }}>
            <Zap size={18} /> {c.cta}
          </Link>
        </div>
      </section>
    </PublicShell>
  )
}
