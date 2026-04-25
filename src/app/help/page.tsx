'use client'

import { useState } from 'react'
import { Search, ChevronDown, BookOpen, Smartphone, Megaphone, Bot, CreditCard, Shield, HelpCircle } from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import { useLang } from '@/lib/lang'
import Link from 'next/link'

const T = {
  ar: {
    title: 'مركز المساعدة',
    subtitle: 'كل اللي تحتاج تعرفه عن استخدام Tsab Bot',
    search: 'ابحث في الأسئلة الشائعة...',
    contactCta: 'لم تجد إجابتك؟',
    contactBtn: 'تواصل معنا',
    cats: [
      { id: 'getting-started', icon: <BookOpen size={20} />, title: 'البدء', color: '#7C3AED', items: [
        { q: 'كيف أبدأ مع Tsab Bot؟', a: 'سجّل حساب جديد من /register، فعّل التجربة المجانية (3-7 أيام حسب الخطة)، اربط جهاز واتساب من صفحة الأجهزة بمسح QR، وابدأ.' },
        { q: 'هل أحتاج بطاقة ائتمان للتجربة؟', a: 'لا، التجربة مجانية بالكامل بدون بطاقة. تستطيع الدفع لاحقاً عبر كود تفعيل أو رابط دفع.' },
        { q: 'كم جهاز يمكنني ربط؟', a: 'يعتمد على خطتك: الأساسية 1 جهاز، الاحترافية 3 أجهزة، الأعمال 10 أجهزة.' },
      ]},
      { id: 'devices', icon: <Smartphone size={20} />, title: 'الأجهزة', color: '#10B981', items: [
        { q: 'كيف أربط جهاز واتساب؟', a: '1) اذهب لصفحة الأجهزة 2) اضغط "إضافة جهاز" 3) امسح QR من واتساب → الأجهزة المرتبطة. الجلسة تبقى نشطة طالما الهاتف يفتح أحياناً.' },
        { q: 'هل واتساب يحظر رقمي؟', a: 'نستخدم تأخير ذكي وأدوات WA Warmer لتقليل خطر الحظر. ننصح بعدم إرسال أكثر من 100 رسالة جماعية/يوم في البداية.' },
        { q: 'الجهاز يصير منقطع، ليش؟', a: 'لو الهاتف فُصل عن الإنترنت أكثر من 14 يوم، WhatsApp يلغي الربط. أيضاً قد يحدث conflict إذا فتحت WhatsApp Web من جهاز آخر.' },
      ]},
      { id: 'campaigns', icon: <Megaphone size={20} />, title: 'الحملات', color: '#F59E0B', items: [
        { q: 'كيف أرسل حملة جماعية؟', a: 'من /campaigns → "إنشاء حملة" → اختار الجهاز + الرسالة + قائمة الأرقام (يمكن رفع CSV) → جدول البدء.' },
        { q: 'ما هو التأخير الأمثل بين الرسائل؟', a: 'بين 5-10 ثوانٍ كحد أدنى. كل ما زاد التأخير، قلّ خطر الحظر.' },
        { q: 'كيف أعرف معدّل التسليم؟', a: 'من تفاصيل الحملة، تشاهد كم رسالة تم تسليمها، فشلها، وقراءتها.' },
      ]},
      { id: 'ai', icon: <Bot size={20} />, title: 'الذكاء الاصطناعي', color: '#A78BFA', items: [
        { q: 'كيف أفعّل الردود الذكية؟', a: 'من صفحة الأجهزة، اضغط زر 🤖 على الجهاز، فعّل التبديل، واكتب "System Prompt" يحدد شخصية البوت.' },
        { q: 'هل الذكاء الاصطناعي مجاني؟', a: 'نستخدم Google Gemini الذي له طبقة مجانية كبيرة. للاستخدام المكثف قد تحتاج ترقية.' },
        { q: 'هل البوت يتعلّم من المحادثات؟', a: 'نعم، يقرأ آخر 20 رسالة من نفس العميل ليفهم السياق ويرد بشكل طبيعي.' },
      ]},
      { id: 'billing', icon: <CreditCard size={20} />, title: 'الفواتير والاشتراك', color: '#2563EB', items: [
        { q: 'كيف أشترك في خطة مدفوعة؟', a: 'من صفحة /plans، اختار الخطة → ادفع عبر كود تفعيل (يصلك من فريق الدعم) أو بطاقة ائتمانية.' },
        { q: 'متى يتم تجديد الاشتراك؟', a: 'الاشتراكات شهرية ومتجدّدة تلقائياً. تستطيع الإلغاء في أي وقت من الإعدادات.' },
        { q: 'هل في استرداد؟', a: 'لا يوجد استرداد بعد بدء فترة الاشتراك المدفوع. لكن يمكنك إلغاء التجديد في أي وقت.' },
      ]},
      { id: 'security', icon: <Shield size={20} />, title: 'الأمان والخصوصية', color: '#EF4444', items: [
        { q: 'هل بياناتي آمنة؟', a: 'نعم، نشفّر البيانات خلال النقل (SSL/TLS) ونستخدم Row Level Security على قاعدة البيانات. راجع سياسة الخصوصية.' },
        { q: 'هل تقرؤون رسائلي؟', a: 'لا، الرسائل تمر عبر أنظمتنا للمعالجة الآلية فقط. لا أحد من الفريق يقرأها.' },
        { q: 'كيف أحذف حسابي؟', a: 'تواصل معنا عبر صفحة /contact وسنحذف حسابك وكل بياناتك خلال 24 ساعة.' },
      ]},
    ],
  },
  en: {
    title: 'Help Center',
    subtitle: 'Everything you need to know about Tsab Bot',
    search: 'Search frequently asked questions...',
    contactCta: "Didn't find your answer?",
    contactBtn: 'Contact Us',
    cats: [
      { id: 'getting-started', icon: <BookOpen size={20} />, title: 'Getting Started', color: '#7C3AED', items: [
        { q: 'How do I get started?', a: 'Sign up at /register, activate the free trial (3-7 days), link a WhatsApp device by scanning the QR, and start.' },
        { q: 'Do I need a credit card for the trial?', a: 'No, the trial is completely free with no card. You can pay later via activation code or payment link.' },
        { q: 'How many devices can I link?', a: 'Depends on your plan: Basic 1 device, Professional 3 devices, Business 10 devices.' },
      ]},
      { id: 'devices', icon: <Smartphone size={20} />, title: 'Devices', color: '#10B981', items: [
        { q: 'How do I link a WhatsApp device?', a: '1) Go to /devices 2) Click "Add Device" 3) Scan the QR from WhatsApp → Linked Devices. Session stays active as long as your phone connects occasionally.' },
        { q: 'Will WhatsApp ban my number?', a: 'We use smart delays and WA Warmer to minimize ban risk. We recommend not sending more than 100 bulk messages/day initially.' },
        { q: 'Why does the device disconnect?', a: 'If your phone is offline for 14+ days, WhatsApp unlinks the device. Conflicts can also happen if you open WhatsApp Web elsewhere.' },
      ]},
      { id: 'campaigns', icon: <Megaphone size={20} />, title: 'Campaigns', color: '#F59E0B', items: [
        { q: 'How do I send a bulk campaign?', a: 'Go to /campaigns → "Create Campaign" → choose device + message + numbers list (CSV upload supported) → schedule start.' },
        { q: 'What\'s the optimal delay between messages?', a: 'Between 5-10 seconds minimum. Higher delay = lower ban risk.' },
        { q: 'How do I track delivery rate?', a: 'From campaign details, you see delivered, failed, and read counts.' },
      ]},
      { id: 'ai', icon: <Bot size={20} />, title: 'AI', color: '#A78BFA', items: [
        { q: 'How do I enable smart replies?', a: 'From /devices, click the 🤖 button on a device, toggle on, and write a "System Prompt" defining the bot\'s personality.' },
        { q: 'Is AI free?', a: 'We use Google Gemini which has a generous free tier. Heavy usage may require an upgrade.' },
        { q: 'Does the bot learn from conversations?', a: 'Yes, it reads the last 20 messages from the same customer to understand context and reply naturally.' },
      ]},
      { id: 'billing', icon: <CreditCard size={20} />, title: 'Billing', color: '#2563EB', items: [
        { q: 'How do I subscribe to a paid plan?', a: 'From /plans, choose a plan → pay via activation code (from support) or credit card.' },
        { q: 'When does my subscription renew?', a: 'Subscriptions are monthly and auto-renew. You can cancel anytime from settings.' },
        { q: 'Do you offer refunds?', a: 'No refunds after the paid period starts. But you can cancel renewal anytime.' },
      ]},
      { id: 'security', icon: <Shield size={20} />, title: 'Security & Privacy', color: '#EF4444', items: [
        { q: 'Is my data safe?', a: 'Yes, we encrypt data in transit (SSL/TLS) and use Row Level Security on the database. See our privacy policy.' },
        { q: 'Do you read my messages?', a: 'No, messages go through our systems for automated processing only. No team member reads them.' },
        { q: 'How do I delete my account?', a: 'Contact us via /contact and we\'ll delete your account and all data within 24 hours.' },
      ]},
    ],
  },
}

export default function HelpPage() {
  const { lang } = useLang()
  const t = T[lang]
  const [search, setSearch] = useState('')
  const [openCat, setOpenCat] = useState<string | null>(t.cats[0]?.id || null)
  const [openItem, setOpenItem] = useState<string | null>(null)

  const filteredCats = t.cats.map(c => ({
    ...c,
    items: c.items.filter(i =>
      !search ||
      i.q.toLowerCase().includes(search.toLowerCase()) ||
      i.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(c => c.items.length > 0)

  return (
    <PublicShell>
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <HelpCircle size={48} color="var(--accent-violet-light)" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>{t.title}</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{t.subtitle}</p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '40px' }}>
          <input className="input-cosmic" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search} style={{ paddingRight: '44px', paddingLeft: '44px', fontSize: '15px' }} />
          <Search size={18} style={{ position: 'absolute', [lang === 'ar' ? 'right' : 'left']: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredCats.map(cat => (
            <div key={cat.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)} style={{ width: '100%', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-primary)', fontFamily: 'Tajawal, sans-serif' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color }}>{cat.icon}</div>
                <div style={{ flex: 1, textAlign: lang === 'ar' ? 'right' : 'left' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{cat.title}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cat.items.length} {lang === 'ar' ? 'سؤال' : 'questions'}</span>
                </div>
                <ChevronDown size={18} style={{ color: 'var(--text-muted)', transform: openCat === cat.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {openCat === cat.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '8px' }}>
                  {cat.items.map((item, i) => {
                    const id = `${cat.id}-${i}`
                    return (
                      <div key={id} style={{ borderBottom: i < cat.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <button onClick={() => setOpenItem(openItem === id ? null : id)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', color: 'var(--text-primary)', fontFamily: 'Tajawal, sans-serif', fontSize: '14px', fontWeight: 500, textAlign: lang === 'ar' ? 'right' : 'left' }}>
                          <span style={{ flex: 1 }}>{item.q}</span>
                          <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: openItem === id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                        {openItem === id && (
                          <div style={{ padding: '0 16px 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{item.a}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredCats.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            {lang === 'ar' ? 'لا توجد نتائج لبحثك' : 'No results found'}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '60px', textAlign: 'center', padding: '32px', background: 'var(--bg-card)', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{t.contactCta}</h3>
          <Link href="/contact" className="btn-primary" style={{ marginTop: '8px', display: 'inline-flex' }}>{t.contactBtn}</Link>
        </div>
      </section>
    </PublicShell>
  )
}
