'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Zap, Globe, Menu, X } from 'lucide-react'
import { StarField } from '@/components/cosmic/StarField'

type Lang = 'ar' | 'en'

const NAV = {
  ar: [
    { label: 'من نحن', href: '/about' },
    { label: 'الأسعار', href: '/#pricing' },
    { label: 'مركز المساعدة', href: '/help' },
    { label: 'تواصل معنا', href: '/contact' },
  ],
  en: [
    { label: 'About', href: '/about' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Help Center', href: '/help' },
    { label: 'Contact', href: '/contact' },
  ],
}

const FOOTER = {
  ar: {
    desc: 'منصة متكاملة لأتمتة واتساب بقوة الذكاء الاصطناعي',
    cols: [
      { title: 'المنصة', links: [
        { label: 'الأجهزة', href: '/features/devices' },
        { label: 'الحملات', href: '/features/campaigns' },
        { label: 'الرد التلقائي', href: '/features/autoreply' },
        { label: 'API', href: '/features/api' },
      ]},
      { title: 'الشركة', links: [
        { label: 'من نحن', href: '/about' },
        { label: 'المدونة', href: '/blog' },
        { label: 'الشركاء', href: '/partners' },
        { label: 'التوظيف', href: '/careers' },
      ]},
      { title: 'الدعم', links: [
        { label: 'مركز المساعدة', href: '/help' },
        { label: 'تواصل معنا', href: '/contact' },
        { label: 'سياسة الخصوصية', href: '/privacy' },
        { label: 'شروط الخدمة', href: '/terms' },
      ]},
    ],
    copy: '© 2026 Tsab Bot. جميع الحقوق محفوظة.',
    sub: 'صُنع بـ ❤️ للسوق العربي',
  },
  en: {
    desc: 'Complete WhatsApp automation platform powered by AI',
    cols: [
      { title: 'Platform', links: [
        { label: 'Devices', href: '/features/devices' },
        { label: 'Campaigns', href: '/features/campaigns' },
        { label: 'Auto Reply', href: '/features/autoreply' },
        { label: 'API', href: '/features/api' },
      ]},
      { title: 'Company', links: [
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'Partners', href: '/partners' },
        { label: 'Careers', href: '/careers' },
      ]},
      { title: 'Support', links: [
        { label: 'Help Center', href: '/help' },
        { label: 'Contact', href: '/contact' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ]},
    ],
    copy: '© 2026 Tsab Bot. All rights reserved.',
    sub: 'Made with ❤️ for the Arab market',
  },
}

export function PublicNavbar({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = NAV[lang]

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(8,8,18,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)', padding: '0 24px',
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto', height: '70px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        direction: lang === 'ar' ? 'rtl' : 'ltr',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Tsab Bot</span>
        </Link>

        <div className="hide-mobile" style={{ display: 'flex', gap: '28px' }}>
          {t.map(item => (
            <Link key={item.href} href={item.href} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: '13px', fontFamily: 'Tajawal, sans-serif',
          }}>
            <Globe size={14} />
            {lang === 'ar' ? 'EN' : 'عر'}
          </button>
          <Link href="/login" className="btn-secondary hide-mobile" style={{ padding: '8px 18px', fontSize: '13px', textDecoration: 'none' }}>
            {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </Link>
          <Link href="/register" className="btn-primary" style={{ padding: '8px 18px', fontSize: '13px', textDecoration: 'none' }}>
            {lang === 'ar' ? 'ابدأ مجاناً' : 'Start Free'}
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="show-mobile" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="show-mobile" style={{ borderTop: '1px solid var(--border)', padding: '16px 0' }}>
          {t.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'block', padding: '10px 4px', color: 'var(--text-secondary)',
              textDecoration: 'none', fontSize: '14px',
            }}>{item.label}</Link>
          ))}
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 720px) {
          .hide-mobile { display: none !important; }
        }
        @media (min-width: 721px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  )
}

export function PublicFooter({ lang }: { lang: Lang }) {
  const t = FOOTER[lang]
  return (
    <footer style={{
      borderTop: '1px solid var(--border)', padding: '48px 24px 32px',
      position: 'relative', zIndex: 1, direction: lang === 'ar' ? 'rtl' : 'ltr',
    }}>
      <div style={{
        maxWidth: '1100px', margin: '0 auto', display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '40px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Tsab Bot</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '260px' }}>{t.desc}</p>
        </div>
        {t.cols.map(col => (
          <div key={col.title}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>{col.title}</h4>
            <ul style={{ listStyle: 'none' }}>
              {col.links.map(link => (
                <li key={link.label} style={{ marginBottom: '10px' }}>
                  <Link href={link.href} style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}
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
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '12px' }}>
        <span>{t.copy}</span>
        <span>{t.sub}</span>
      </div>
    </footer>
  )
}

export function PublicShell({ children, lang, setLang }: { children: React.ReactNode; lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <StarField />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <PublicNavbar lang={lang} setLang={setLang} />
        {children}
        <PublicFooter lang={lang} />
      </div>
    </div>
  )
}
