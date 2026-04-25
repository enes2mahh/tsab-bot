'use client'

import { useState } from 'react'
import { Target, Heart, Users, Zap, TrendingUp, Globe } from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import Link from 'next/link'

const T = {
  ar: {
    title: 'من نحن',
    subtitle: 'قصتنا، رسالتنا، والقيم اللي تقودنا',
    storyTitle: 'قصّتنا',
    story: `بدأت Tsab Bot من ملاحظة بسيطة: كل صاحب عمل صغير في العالم العربي يستخدم واتساب لخدمة عملائه، لكن الأدوات الموجودة إما باهظة الثمن، أو معقّدة، أو غير مدعومة بالعربية.

قرّرنا نبني الحل اللي كنا نحتاجه نحن. منصّة كاملة، عربية، ذكية، وبسعر يقدر عليه أي صاحب مشروع.`,
    missionTitle: 'رسالتنا',
    mission: 'تمكين كل صاحب عمل عربي من تقديم خدمة عملاء استثنائية على واتساب — بدون تعقيدات تقنية وبتكلفة معقولة.',
    visionTitle: 'رؤيتنا',
    vision: 'أن نصبح المنصّة الأولى لأتمتة واتساب في العالم العربي، ونساعد مليون صاحب عمل على تنمية أعمالهم.',
    valuesTitle: 'قيمنا',
    values: [
      { icon: <Target size={24} />, title: 'التركيز على العميل', desc: 'كل قرار نتّخذه يبدأ بسؤال: "هل هذا يفيد عملاءنا؟"', color: '#7C3AED' },
      { icon: <Heart size={24} />, title: 'الشغف بالجودة', desc: 'لا نُطلق ميزة إلا بعد ما نكون فخورين فيها', color: '#EF4444' },
      { icon: <Zap size={24} />, title: 'السرعة', desc: 'الأسواق تتحرّك بسرعة. نحن أسرع', color: '#F59E0B' },
      { icon: <Globe size={24} />, title: 'العربية أولاً', desc: 'نُصمّم للعربية من البداية، مش ترجمة عابرة', color: '#10B981' },
      { icon: <Users size={24} />, title: 'الشفافية', desc: 'أسعار واضحة، شروط واضحة، تواصل صادق', color: '#2563EB' },
      { icon: <TrendingUp size={24} />, title: 'النموّ المشترك', desc: 'نجاح عملائنا = نجاحنا', color: '#A78BFA' },
    ],
    statsTitle: 'بالأرقام',
    stats: [
      { v: '+10K', l: 'عميل نشط' },
      { v: '+50M', l: 'رسالة مرسلة' },
      { v: '99.9%', l: 'وقت التشغيل' },
      { v: '24/7', l: 'دعم فني' },
    ],
    ctaTitle: 'انضم إلى رحلتنا',
    ctaDesc: 'سواء كنت عميلاً، شريكاً، أو مرشّحاً للعمل — نريد أن نسمع منك.',
    cta1: 'ابدأ مجاناً',
    cta2: 'تواصل معنا',
  },
  en: {
    title: 'About Us',
    subtitle: 'Our story, mission, and values',
    storyTitle: 'Our Story',
    story: `Tsab Bot started from a simple observation: every small business in the Arab world uses WhatsApp to serve customers, but the available tools were either expensive, complex, or didn't properly support Arabic.

So we decided to build the solution we needed ourselves. A complete, Arabic-first, intelligent platform at a price every business can afford.`,
    missionTitle: 'Our Mission',
    mission: 'Empower every Arab business to deliver exceptional WhatsApp customer service — without technical complexity and at a reasonable cost.',
    visionTitle: 'Our Vision',
    vision: 'To become the #1 WhatsApp automation platform in the Arab world, helping one million businesses grow.',
    valuesTitle: 'Our Values',
    values: [
      { icon: <Target size={24} />, title: 'Customer Focus', desc: 'Every decision starts with: "Does this help our customers?"', color: '#7C3AED' },
      { icon: <Heart size={24} />, title: 'Quality Passion', desc: "We don't ship a feature unless we're proud of it", color: '#EF4444' },
      { icon: <Zap size={24} />, title: 'Speed', desc: 'Markets move fast. We move faster.', color: '#F59E0B' },
      { icon: <Globe size={24} />, title: 'Arabic-First', desc: "We design for Arabic from day one — not as a translation afterthought", color: '#10B981' },
      { icon: <Users size={24} />, title: 'Transparency', desc: 'Clear pricing, clear terms, honest communication', color: '#2563EB' },
      { icon: <TrendingUp size={24} />, title: 'Shared Growth', desc: "Our customers' success is our success", color: '#A78BFA' },
    ],
    statsTitle: 'By The Numbers',
    stats: [
      { v: '10K+', l: 'Active customers' },
      { v: '50M+', l: 'Messages sent' },
      { v: '99.9%', l: 'Uptime' },
      { v: '24/7', l: 'Support' },
    ],
    ctaTitle: 'Join Our Journey',
    ctaDesc: "Whether you're a customer, partner, or job applicant — we'd love to hear from you.",
    cta1: 'Start Free',
    cta2: 'Contact Us',
  },
}

export default function AboutPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar')
  const t = T[lang]

  return (
    <PublicShell lang={lang} setLang={setLang}>
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>{t.title}</h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)' }}>{t.subtitle}</p>
        </div>

        {/* Story */}
        <div className="glass" style={{ padding: '40px', borderRadius: '20px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>{t.storyTitle}</h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 2, whiteSpace: 'pre-line' }}>{t.story}</p>
        </div>

        {/* Mission + Vision */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
          <div className="glass" style={{ padding: '28px', borderRadius: '16px' }}>
            <Target size={32} color="#7C3AED" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>{t.missionTitle}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{t.mission}</p>
          </div>
          <div className="glass" style={{ padding: '28px', borderRadius: '16px' }}>
            <TrendingUp size={32} color="#10B981" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>{t.visionTitle}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{t.vision}</p>
          </div>
        </div>

        {/* Values */}
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', textAlign: 'center' }}>{t.valuesTitle}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '60px' }}>
          {t.values.map(v => (
            <div key={v.title} className="card" style={{ padding: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${v.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.color, marginBottom: '14px' }}>
                {v.icon}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{v.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(16,185,129,0.05))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px', padding: '40px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', textAlign: 'center' }}>{t.statsTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px' }}>
            {t.stats.map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div className="gradient-text" style={{ fontSize: '36px', fontWeight: 900, marginBottom: '4px' }}>{s.v}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>{t.ctaTitle}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px' }}>{t.ctaDesc}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn-primary">{t.cta1}</Link>
            <Link href="/contact" className="btn-secondary">{t.cta2}</Link>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
