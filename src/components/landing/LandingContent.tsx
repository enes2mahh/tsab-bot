'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Zap, Bot, Megaphone, Clock, Plug, Pointer, BarChart3,
  Check, Star, ChevronDown, ChevronUp, Menu, X
} from 'lucide-react'

// ===== NAVBAR =====
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(8,8,18,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Tsab Bot
          </span>
        </div>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {['الميزات', 'الأسعار', 'API', 'تواصل'].map((item) => (
            <a
              key={item}
              href={`#${item}`}
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/login"
            className="btn-secondary"
            style={{ padding: '8px 18px', fontSize: '13px', textDecoration: 'none' }}
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/register"
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '13px', textDecoration: 'none' }}
          >
            ابدأ مجاناً
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ===== HERO =====
function Hero() {
  return (
    <section
      style={{
        textAlign: 'center',
        padding: '100px 24px 80px',
        position: 'relative',
        zIndex: 1,
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      {/* Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          background: 'rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: '30px',
          marginBottom: '28px',
          fontSize: '13px',
          color: '#A78BFA',
        }}
      >
        <Zap size={13} />
        مدعوم بـ Google Gemini 2.0 Flash
      </div>

      <h1
        style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 900,
          lineHeight: 1.2,
          marginBottom: '20px',
          color: 'var(--text-primary)',
        }}
      >
        أتمتة واتساب بقوة{' '}
        <span className="gradient-text">الذكاء الاصطناعي</span>
      </h1>

      <p
        style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          margin: '0 auto 40px',
          lineHeight: 1.7,
        }}
      >
        منصة متكاملة لإدارة بوتات الواتساب مع ردود ذكية فورية، حملات جماعية،
        وتحليلات مفصلة
      </p>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          href="/register"
          className="btn-primary"
          style={{ padding: '14px 32px', fontSize: '16px', textDecoration: 'none' }}
        >
          <Zap size={18} />
          ابدأ مجاناً - 7 أيام
        </Link>
        <a
          href="#الميزات"
          className="btn-secondary"
          style={{ padding: '14px 32px', fontSize: '16px', textDecoration: 'none' }}
        >
          شاهد الميزات
        </a>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '48px',
          marginTop: '60px',
          flexWrap: 'wrap',
        }}
      >
        {[
          { value: '+10K', label: 'عميل نشط' },
          { value: '+50M', label: 'رسالة مرسلة' },
          { value: '99.9%', label: 'وقت التشغيل' },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div
              style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ===== FEATURES =====
const features = [
  {
    icon: <Bot size={24} />,
    title: 'ردود الذكاء الاصطناعي',
    desc: 'Gemini 2.0 Flash يرد على عملائك بذكاء وطبيعية على مدار الساعة',
    color: '#A78BFA',
  },
  {
    icon: <Megaphone size={24} />,
    title: 'حملات جماعية',
    desc: 'أرسل لآلاف العملاء في دقائق مع تأخير ذكي لحماية رقمك',
    color: '#60A5FA',
  },
  {
    icon: <Clock size={24} />,
    title: 'رد تلقائي 24/7',
    desc: 'ضبط ردود تلقائية بناءً على كلمات مفتاحية أو أوقات العمل',
    color: '#10B981',
  },
  {
    icon: <Plug size={24} />,
    title: 'API قوي',
    desc: 'تكامل سهل مع أي نظام خارجي عبر REST API شامل',
    color: '#F59E0B',
  },
  {
    icon: <Pointer size={24} />,
    title: 'أزرار تفاعلية',
    desc: 'إرسال رسائل مع أزرار وقوائم تفاعلية لتجربة احترافية',
    color: '#A78BFA',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'تحليلات مفصلة',
    desc: 'تتبع معدلات الفتح والتسليم وأداء كل حملة بدقة',
    color: '#10B981',
  },
]

function Features() {
  return (
    <section id="الميزات" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          كل ما تحتاجه في مكان واحد
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
          أدوات احترافية لتنمية أعمالك عبر واتساب
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {features.map((f) => (
          <div
            key={f.title}
            className="glass gradient-border"
            style={{ padding: '28px', borderRadius: '16px', transition: 'transform 0.3s' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${f.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: f.color,
                marginBottom: '16px',
              }}
            >
              {f.icon}
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {f.title}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ===== PRICING =====
const plans = [
  {
    name: 'الأساسية',
    price: 39,
    trial: 3,
    devices: 1,
    messages: '1,000',
    features: ['رد تلقائي', 'إرسال رسائل متعددة الأنواع', 'Webhook', 'API', 'مدير الملفات'],
    color: '#60A5FA',
    recommended: false,
  },
  {
    name: 'الاحترافية',
    price: 79,
    trial: 7,
    devices: 3,
    messages: '10,000',
    features: ['كل ميزات الأساسية', 'حملات جماعية', 'جدولة الرسائل', 'ذكاء اصطناعي', 'تدفق المحادثة', 'WA Warmer'],
    color: '#A78BFA',
    recommended: true,
  },
  {
    name: 'الأعمال',
    price: 99,
    trial: 0,
    devices: 10,
    messages: '100,000',
    features: ['كل ميزات الاحترافية', 'Live Chat', 'فريق متعدد', 'تحليلات متقدمة', 'White-label'],
    color: '#F59E0B',
    recommended: false,
  },
]

function Pricing() {
  return (
    <section id="الأسعار" style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          خطط بسيطة وشفافة
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
          ابدأ مجاناً، ادفع فقط عند الاستمرار
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              padding: '28px',
              border: plan.recommended ? `2px solid ${plan.color}` : '1px solid var(--border)',
              position: 'relative',
              transition: 'transform 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {plan.recommended && (
              <div
                style={{
                  position: 'absolute',
                  top: '-14px',
                  right: '50%',
                  transform: 'translateX(50%)',
                  background: plan.color,
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 16px',
                  borderRadius: '20px',
                  whiteSpace: 'nowrap',
                }}
              >
                ⭐ الأكثر شيوعاً
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {plan.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '40px', fontWeight: 900, color: plan.color }}>{plan.price}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>ريال / شهر</span>
              </div>
              {plan.trial > 0 && (
                <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>
                  🎁 {plan.trial} أيام مجاناً
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px', padding: '14px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div>📱 {plan.devices} جهاز</div>
              <div style={{ marginTop: '4px' }}>💬 {plan.messages} رسالة/شهر</div>
            </div>

            <ul style={{ listStyle: 'none', marginBottom: '24px' }}>
              {plan.features.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <Check size={14} color="#10B981" style={{ flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                background: plan.recommended ? `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` : 'transparent',
                color: plan.recommended ? 'white' : plan.color,
                border: `2px solid ${plan.color}`,
                transition: 'all 0.2s',
              }}
            >
              {plan.trial > 0 ? `ابدأ مجاناً ${plan.trial} أيام` : 'اشترك الآن'}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

// ===== FAQ =====
const faqs = [
  { q: 'هل واتساب يحظر الأرقام؟', a: 'نستخدم تأخير عشوائي بين الرسائل وأدوات WA Warmer لتدفئة الرقم وتقليل خطر الحظر. ننصح باتباع أفضل الممارسات.' },
  { q: 'كيف يعمل الذكاء الاصطناعي؟', a: 'نستخدم Google Gemini 2.0 Flash للرد التلقائي على رسائل عملائك بشكل طبيعي وذكي حسب التعليمات التي تضبطها.' },
  { q: 'هل يمكنني إلغاء الاشتراك في أي وقت؟', a: 'نعم، يمكنك الإلغاء في أي وقت بدون أي رسوم إضافية أو التزامات.' },
  { q: 'كم جهاز يمكنني ربط؟', a: 'يعتمد على الخطة: الأساسية (1 جهاز)، الاحترافية (3 أجهزة)، الأعمال (10 أجهزة).' },
  { q: 'هل يدعم المنصة اللغة العربية؟', a: 'نعم، المنصة مصممة بالكامل للغة العربية مع دعم RTL وواجهة عربية أصيلة.' },
  { q: 'ما هي طرق الدفع المتاحة؟', a: 'ندعم الدفع عبر رموز التفعيل التي تحصل عليها من فريق الدعم. قريباً: Moyasar وبطاقات الائتمان.' },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          أسئلة شائعة
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {faqs.map((faq, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              overflow: 'hidden',
              transition: 'border-color 0.2s',
              borderColor: open === i ? 'var(--accent-violet)' : 'var(--border)',
            }}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: '100%',
                padding: '18px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontFamily: 'Tajawal, sans-serif',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              {faq.q}
              {open === i ? <ChevronUp size={16} color="var(--accent-violet-light)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
            </button>
            {open === i && (
              <div style={{ padding: '0 20px 18px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ===== CTA =====
function CTASection() {
  return (
    <section
      style={{
        padding: '80px 24px',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          padding: '60px 40px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(16,185,129,0.1))',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: '24px',
        }}
      >
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
          ابدأ تجربتك المجانية اليوم
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '32px', lineHeight: 1.6 }}>
          لا تحتاج لبطاقة ائتمانية. 7 أيام مجاناً بالكامل.
        </p>
        <Link
          href="/register"
          className="btn-primary"
          style={{ padding: '16px 40px', fontSize: '17px', textDecoration: 'none', display: 'inline-flex' }}
        >
          <Zap size={20} />
          ابدأ مجاناً الآن
        </Link>
      </div>
    </section>
  )
}

// ===== FOOTER =====
function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '48px 24px 32px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '40px',
          marginBottom: '40px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Tsab Bot</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '260px' }}>
            منصة متكاملة لأتمتة واتساب بقوة الذكاء الاصطناعي
          </p>
        </div>

        {[
          { title: 'المنصة', links: ['الأجهزة', 'الحملات', 'الرد التلقائي', 'API'] },
          { title: 'الشركة', links: ['من نحن', 'المدونة', 'الشركاء', 'التوظيف'] },
          { title: 'الدعم', links: ['مركز المساعدة', 'تواصل معنا', 'سياسة الخصوصية', 'شروط الخدمة'] },
        ].map((col) => (
          <div key={col.title}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
              {col.title}
            </h4>
            <ul style={{ listStyle: 'none' }}>
              {col.links.map((link) => (
                <li key={link} style={{ marginBottom: '10px' }}>
                  <a href="#" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-violet-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}
      >
        <span>© 2026 Tsab Bot. جميع الحقوق محفوظة.</span>
        <span>صُنع بـ ❤️ للسوق العربي</span>
      </div>
    </footer>
  )
}

// ===== MAIN EXPORT =====
export function LandingContent() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
      <CTASection />
      <Footer />
    </>
  )
}
