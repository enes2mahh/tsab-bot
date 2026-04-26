'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Zap, Bot, Megaphone, Clock, Plug, Pointer, BarChart3,
  Check, ChevronDown, ChevronUp, Globe, Menu, X
} from 'lucide-react'
import { useLang, type Lang } from '@/lib/lang'

// ===== TRANSLATIONS =====
const T = {
  ar: {
    nav: ['الميزات', 'الأسعار', 'مركز المساعدة', 'تواصل'],
    navIds: ['features', 'pricing', 'help', 'contact'],
    login: 'تسجيل الدخول', register: 'ابدأ مجاناً',
    badge: 'مدعوم بـ Google Gemini 2.0 Flash',
    heroTitle1: 'أتمتة واتساب بقوة ', heroTitle2: 'الذكاء الاصطناعي',
    heroDesc: 'منصة متكاملة لإدارة بوتات الواتساب مع ردود ذكية فورية، حملات جماعية، وتحليلات مفصلة',
    heroCTA: 'ابدأ مجاناً - 7 أيام', heroSub: 'شاهد الميزات',
    stats: [{ value: '+10K', label: 'عميل نشط' }, { value: '+50M', label: 'رسالة مرسلة' }, { value: '99.9%', label: 'وقت التشغيل' }],
    featuresTitle: 'كل ما تحتاجه في مكان واحد',
    featuresDesc: 'أدوات احترافية لتنمية أعمالك عبر واتساب',
    pricingTitle: 'خطط بسيطة وشفافة',
    pricingDesc: 'ابدأ مجاناً، ادفع فقط عند الاستمرار',
    faqTitle: 'أسئلة شائعة',
    ctaTitle: 'ابدأ تجربتك المجانية اليوم',
    ctaDesc: 'لا تحتاج لبطاقة ائتمانية. 7 أيام مجاناً بالكامل.',
    ctaBtn: 'ابدأ مجاناً الآن',
    footerDesc: 'منصة متكاملة لأتمتة واتساب بقوة الذكاء الاصطناعي',
    footerCols: [
      { title: 'المنصة', links: [{ label: 'الأجهزة', href: '/login' }, { label: 'الحملات', href: '/login' }, { label: 'الرد التلقائي', href: '/login' }, { label: 'API', href: '/login' }] },
      { title: 'الشركة', links: [{ label: 'من نحن', href: '/about' }, { label: 'المدونة', href: '#' }, { label: 'الشركاء', href: '#' }, { label: 'التوظيف', href: '#' }] },
      { title: 'الدعم', links: [{ label: 'مركز المساعدة', href: '#' }, { label: 'تواصل معنا', href: '#contact' }, { label: 'سياسة الخصوصية', href: '/privacy' }, { label: 'شروط الخدمة', href: '/terms' }] },
    ],
    footerCopy: '© 2026 Tsab Bot. جميع الحقوق محفوظة.',
    footerSub: 'صُنع بـ ❤️ للسوق العربي',
    month: 'ريال / شهر', freeTrialDays: 'أيام مجاناً', device: 'جهاز', msg: 'رسالة/شهر',
    subscribe: 'اشترك الآن', freeTrial: 'ابدأ مجاناً',
    popular: '⭐ الأكثر شيوعاً',
    dir: 'rtl',
  },
  en: {
    nav: ['Features', 'Pricing', 'Help', 'Contact'],
    navIds: ['features', 'pricing', 'help', 'contact'],
    login: 'Login', register: 'Start Free',
    badge: 'Powered by Google Gemini 2.0 Flash',
    heroTitle1: 'WhatsApp Automation with ', heroTitle2: 'AI Power',
    heroDesc: 'A complete platform for managing WhatsApp bots with instant smart replies, bulk campaigns, and detailed analytics.',
    heroCTA: 'Start Free – 7 Days', heroSub: 'See Features',
    stats: [{ value: '10K+', label: 'Active Clients' }, { value: '50M+', label: 'Messages Sent' }, { value: '99.9%', label: 'Uptime' }],
    featuresTitle: 'Everything You Need in One Place',
    featuresDesc: 'Professional tools to grow your business on WhatsApp',
    pricingTitle: 'Simple & Transparent Pricing',
    pricingDesc: 'Start free, pay only when you continue',
    faqTitle: 'Frequently Asked Questions',
    ctaTitle: 'Start Your Free Trial Today',
    ctaDesc: 'No credit card required. Completely free for 7 days.',
    ctaBtn: 'Start Free Now',
    footerDesc: 'Complete WhatsApp automation platform powered by AI',
    footerCols: [
      { title: 'Platform', links: [{ label: 'Devices', href: '/login' }, { label: 'Campaigns', href: '/login' }, { label: 'Auto Reply', href: '/login' }, { label: 'API', href: '/login' }] },
      { title: 'Company', links: [{ label: 'About Us', href: '/about' }, { label: 'Blog', href: '#' }, { label: 'Partners', href: '#' }, { label: 'Careers', href: '#' }] },
      { title: 'Support', links: [{ label: 'Help Center', href: '#' }, { label: 'Contact Us', href: '#contact' }, { label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }] },
    ],
    footerCopy: '© 2026 Tsab Bot. All rights reserved.',
    footerSub: 'Made with ❤️ for the Arab market',
    month: 'SAR / month', freeTrialDays: 'days free', device: 'device', msg: 'msg/month',
    subscribe: 'Subscribe Now', freeTrial: 'Start Free',
    popular: '⭐ Most Popular',
    dir: 'ltr',
  },
}

const featuresData = {
  ar: [
    { icon: <Bot size={24} />, title: 'ردود الذكاء الاصطناعي', desc: 'Gemini 2.0 Flash يرد على عملائك بذكاء وطبيعية على مدار الساعة', color: '#A78BFA' },
    { icon: <Megaphone size={24} />, title: 'حملات جماعية', desc: 'أرسل لآلاف العملاء في دقائق مع تأخير ذكي لحماية رقمك', color: '#60A5FA' },
    { icon: <Clock size={24} />, title: 'رد تلقائي 24/7', desc: 'ضبط ردود تلقائية بناءً على كلمات مفتاحية أو أوقات العمل', color: '#10B981' },
    { icon: <Plug size={24} />, title: 'API قوي', desc: 'تكامل سهل مع أي نظام خارجي عبر REST API شامل', color: '#F59E0B' },
    { icon: <Pointer size={24} />, title: 'أزرار تفاعلية', desc: 'إرسال رسائل مع أزرار وقوائم تفاعلية لتجربة احترافية', color: '#A78BFA' },
    { icon: <BarChart3 size={24} />, title: 'تحليلات مفصلة', desc: 'تتبع معدلات الفتح والتسليم وأداء كل حملة بدقة', color: '#10B981' },
  ],
  en: [
    { icon: <Bot size={24} />, title: 'AI Smart Replies', desc: 'Gemini 2.0 Flash replies to your customers intelligently around the clock', color: '#A78BFA' },
    { icon: <Megaphone size={24} />, title: 'Bulk Campaigns', desc: 'Send to thousands of customers in minutes with smart delay to protect your number', color: '#60A5FA' },
    { icon: <Clock size={24} />, title: 'Auto Reply 24/7', desc: 'Set automated replies based on keywords or business hours', color: '#10B981' },
    { icon: <Plug size={24} />, title: 'Powerful API', desc: 'Easy integration with any external system via comprehensive REST API', color: '#F59E0B' },
    { icon: <Pointer size={24} />, title: 'Interactive Buttons', desc: 'Send messages with interactive buttons and lists for a professional experience', color: '#A78BFA' },
    { icon: <BarChart3 size={24} />, title: 'Detailed Analytics', desc: 'Track open rates, delivery rates and performance of every campaign', color: '#10B981' },
  ],
}

const plansData = {
  ar: [
    { name: 'الأساسية', price: 39, trial: 3, devices: 1, messages: '1,000', features: ['رد تلقائي', 'إرسال رسائل متعددة الأنواع', 'Webhook', 'API', 'مدير الملفات'], color: '#60A5FA', recommended: false },
    { name: 'الاحترافية', price: 79, trial: 7, devices: 3, messages: '10,000', features: ['كل ميزات الأساسية', 'حملات جماعية', 'جدولة الرسائل', 'ذكاء اصطناعي', 'تدفق المحادثة', 'WA Warmer'], color: '#A78BFA', recommended: true },
    { name: 'الأعمال', price: 99, trial: 0, devices: 10, messages: '100,000', features: ['كل ميزات الاحترافية', 'Live Chat', 'فريق متعدد', 'تحليلات متقدمة', 'White-label'], color: '#F59E0B', recommended: false },
  ],
  en: [
    { name: 'Basic', price: 39, trial: 3, devices: 1, messages: '1,000', features: ['Auto Reply', 'Multi-type messages', 'Webhook', 'API', 'File Manager'], color: '#60A5FA', recommended: false },
    { name: 'Professional', price: 79, trial: 7, devices: 3, messages: '10,000', features: ['All Basic features', 'Bulk campaigns', 'Message scheduling', 'AI replies', 'Chat Flow', 'WA Warmer'], color: '#A78BFA', recommended: true },
    { name: 'Business', price: 99, trial: 0, devices: 10, messages: '100,000', features: ['All Pro features', 'Live Chat', 'Multi-user team', 'Advanced analytics', 'White-label'], color: '#F59E0B', recommended: false },
  ],
}

const faqsData = {
  ar: [
    { q: 'هل واتساب يحظر الأرقام؟', a: 'نستخدم تأخير عشوائي بين الرسائل وأدوات WA Warmer لتدفئة الرقم وتقليل خطر الحظر. ننصح باتباع أفضل الممارسات.' },
    { q: 'كيف يعمل الذكاء الاصطناعي؟', a: 'نستخدم Google Gemini 2.0 Flash للرد التلقائي على رسائل عملائك بشكل طبيعي وذكي حسب التعليمات التي تضبطها.' },
    { q: 'هل يمكنني إلغاء الاشتراك في أي وقت؟', a: 'نعم، يمكنك الإلغاء في أي وقت بدون أي رسوم إضافية أو التزامات.' },
    { q: 'كم جهاز يمكنني ربط؟', a: 'يعتمد على الخطة: الأساسية (1 جهاز)، الاحترافية (3 أجهزة)، الأعمال (10 أجهزة).' },
    { q: 'هل تدعم المنصة اللغة العربية؟', a: 'نعم، المنصة مصممة بالكامل للغة العربية مع دعم RTL وواجهة عربية أصيلة.' },
    { q: 'ما هي طرق الدفع المتاحة؟', a: 'ندعم الدفع عبر رموز التفعيل التي تحصل عليها من فريق الدعم. قريباً: Moyasar وبطاقات الائتمان.' },
  ],
  en: [
    { q: 'Will WhatsApp ban my number?', a: 'We use random delays and WA Warmer tools to warm up the number and reduce ban risk. We recommend following best practices.' },
    { q: 'How does the AI work?', a: 'We use Google Gemini 2.0 Flash to automatically reply to your customers naturally and intelligently based on your configured instructions.' },
    { q: 'Can I cancel anytime?', a: 'Yes, you can cancel at any time with no additional fees or commitments.' },
    { q: 'How many devices can I connect?', a: 'Depends on your plan: Basic (1 device), Professional (3 devices), Business (10 devices).' },
    { q: 'Is the platform available in English?', a: 'Yes! The platform supports both Arabic and English. You can switch languages from the navigation bar.' },
    { q: 'What payment methods are available?', a: 'We support payment via activation codes from our support team. Coming soon: Moyasar and credit cards.' },
  ],
}

// ===== NAVBAR =====
function Navbar() {
  const { lang, toggleLang } = useLang()
  const t = T[lang]
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,18,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: t.dir as any, padding: '0 16px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Tsab Bot</span>
        </div>

        {/* Desktop nav links */}
        <div className="nav-links-desktop">
          {t.nav.map((item, i) => {
            const id = t.navIds[i]
            const href = id === 'features' || id === 'pricing' ? `#${id}` : `/${id}`
            const Element = href.startsWith('#') ? 'a' : Link
            return (
              <Element key={item} href={href} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}
                onMouseEnter={(e: any) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e: any) => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                {item}
              </Element>
            )
          })}
        </div>

        {/* Desktop actions + hamburger */}
        <div className="nav-actions">
          <button onClick={toggleLang} className="nav-hamburger" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontFamily: 'Tajawal, sans-serif' }}>
            <Globe size={14} />
            {lang === 'ar' ? 'EN' : 'عر'}
          </button>
          <Link href="/login" className="btn-secondary" style={{ padding: '8px 18px', fontSize: '13px', textDecoration: 'none' }}>{t.login}</Link>
          <Link href="/register" className="btn-primary" style={{ padding: '8px 18px', fontSize: '13px', textDecoration: 'none' }}>{t.register}</Link>
          {/* Hamburger — visible only on mobile via CSS */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="القائمة"
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.06)' }}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="nav-menu-mobile" style={{ display: 'flex' }}>
          {t.nav.map((item, i) => {
            const id = t.navIds[i]
            const href = id === 'features' || id === 'pricing' ? `#${id}` : `/${id}`
            const Element = href.startsWith('#') ? 'a' : Link
            return (
              <Element key={item} href={href} onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 16px', borderRadius: '10px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '15px', fontFamily: 'Tajawal, sans-serif', display: 'block', transition: 'all 0.2s' }}>
                {item}
              </Element>
            )
          })}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-secondary" style={{ textAlign: 'center', padding: '12px', fontSize: '15px', textDecoration: 'none' }}>{t.login}</Link>
            <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ textAlign: 'center', padding: '12px', fontSize: '15px', textDecoration: 'none', justifyContent: 'center' }}>{t.register}</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ===== HERO =====
function Hero() {
  const { lang } = useLang()
  const t = T[lang]
  return (
    <section className="hero-section" style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', direction: t.dir as any }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '30px', marginBottom: '28px', fontSize: '13px', color: '#A78BFA' }}>
        <Zap size={13} /> {t.badge}
      </div>
      <h1 style={{ fontSize: 'clamp(28px, 6vw, 64px)', fontWeight: 900, lineHeight: 1.2, marginBottom: '20px', color: 'var(--text-primary)' }}>
        {t.heroTitle1}<span className="gradient-text">{t.heroTitle2}</span>
      </h1>
      <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 36px', lineHeight: 1.7 }}>{t.heroDesc}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', padding: '0 8px' }}>
        <Link href="/register" className="btn-primary" style={{ padding: '13px 28px', fontSize: '15px', textDecoration: 'none' }}>
          <Zap size={18} /> {t.heroCTA}
        </Link>
        <a href="#features" className="btn-secondary" style={{ padding: '13px 28px', fontSize: '15px', textDecoration: 'none' }}>{t.heroSub}</a>
      </div>
      <div className="stats-row" style={{ marginTop: '52px' }}>
        {t.stats.map(stat => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ===== FEATURES =====
function Features() {
  const { lang } = useLang()
  const t = T[lang]
  const features = featuresData[lang]
  return (
    <section id="features" className="landing-section" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, direction: t.dir as any }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>{t.featuresTitle}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>{t.featuresDesc}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
        {features.map(f => (
          <div key={f.title} className="glass gradient-border" style={{ padding: '24px', borderRadius: '16px', transition: 'transform 0.3s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: '14px' }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{f.title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ===== PRICING =====
function Pricing() {
  const { lang } = useLang()
  const t = T[lang]
  const plans = plansData[lang]
  return (
    <section id="pricing" className="landing-section" style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1, direction: t.dir as any }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>{t.pricingTitle}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>{t.pricingDesc}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {plans.map(plan => (
          <div key={plan.name} style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '24px', border: plan.recommended ? `2px solid ${plan.color}` : '1px solid var(--border)', position: 'relative', transition: 'transform 0.3s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-6px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
            {plan.recommended && (
              <div style={{ position: 'absolute', top: '-14px', right: '50%', transform: 'translateX(50%)', background: plan.color, color: 'white', fontSize: '12px', fontWeight: 700, padding: '4px 16px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                {t.popular}
              </div>
            )}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '38px', fontWeight: 900, color: plan.color }}>{plan.price}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t.month}</span>
              </div>
              {plan.trial > 0 && <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>🎁 {plan.trial} {t.freeTrialDays}</div>}
            </div>
            <div style={{ marginBottom: '20px', padding: '14px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div>📱 {plan.devices} {t.device}</div>
              <div style={{ marginTop: '4px' }}>💬 {plan.messages} {t.msg}</div>
            </div>
            <ul style={{ listStyle: 'none', marginBottom: '24px' }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <Check size={14} color="#10B981" style={{ flexShrink: 0 }} /> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', background: plan.recommended ? `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` : 'transparent', color: plan.recommended ? 'white' : plan.color, border: `2px solid ${plan.color}`, transition: 'all 0.2s' }}>
              {plan.trial > 0 ? `${t.freeTrial} ${plan.trial} ${t.freeTrialDays}` : t.subscribe}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

// ===== FAQ =====
function FAQ() {
  const { lang } = useLang()
  const t = T[lang]
  const faqs = faqsData[lang]
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section className="landing-section" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1, direction: t.dir as any }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>{t.faqTitle}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {faqs.map((faq, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: `1px solid ${open === i ? 'var(--accent-violet)' : 'var(--border)'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontFamily: 'Tajawal, sans-serif', fontSize: '15px', fontWeight: 600, textAlign: lang === 'ar' ? 'right' : 'left', gap: '12px' }}>
              <span style={{ flex: 1 }}>{faq.q}</span>
              {open === i ? <ChevronUp size={16} color="var(--accent-violet-light)" style={{ flexShrink: 0 }} /> : <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
            </button>
            {open === i && <div style={{ padding: '0 18px 16px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{faq.a}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

// ===== CTA =====
function CTASection() {
  const { lang } = useLang()
  const t = T[lang]
  return (
    <section className="landing-section" style={{ position: 'relative', zIndex: 1, textAlign: 'center', direction: t.dir as any }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }} className="cta-box" >
        <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(16,185,129,0.1))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '24px', padding: 'inherit' }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>{t.ctaTitle}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '28px', lineHeight: 1.6 }}>{t.ctaDesc}</p>
          <Link href="/register" className="btn-primary" style={{ padding: '14px 36px', fontSize: '16px', textDecoration: 'none', display: 'inline-flex' }}>
            <Zap size={20} /> {t.ctaBtn}
          </Link>
        </div>
      </div>
    </section>
  )
}

// ===== FOOTER =====
function Footer() {
  const { lang } = useLang()
  const t = T[lang]
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '48px 16px 28px', position: 'relative', zIndex: 1, direction: t.dir as any }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="footer-grid" style={{ marginBottom: '36px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} color="white" />
              </div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Tsab Bot</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '260px' }}>{t.footerDesc}</p>
          </div>
          {t.footerCols.map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>{col.title}</h4>
              <ul style={{ listStyle: 'none' }}>
                {col.links.map(link => (
                  <li key={link.label} style={{ marginBottom: '10px' }}>
                    <Link href={link.href} style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-violet-light)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>{t.footerCopy}</span>
          <span>{t.footerSub}</span>
        </div>
      </div>
    </footer>
  )
}

// ===== MAIN EXPORT =====
export function LandingContent() {
  const { lang } = useLang()
  return (
    <div dir={T[lang].dir}>
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  )
}
