'use client'

import { useState } from 'react'
import { Sparkles, Mail } from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import Link from 'next/link'

const T = {
  ar: {
    title: 'المدونة',
    soonBadge: 'قريباً',
    headline: 'محتوى عميق قادم',
    desc: 'نعمل على مدونة مليئة بالنصائح حول أتمتة واتساب، التسويق الرقمي، وقصص نجاح عملائنا. اشترك ليصلك أول مقال.',
    placeholder: 'بريدك الإلكتروني',
    notify: 'أعلمني عند الإطلاق',
    sent: '✅ تم! سنخبرك أول من يصدر مقال.',
    or: 'أو',
    backHome: 'العودة للصفحة الرئيسية',
  },
  en: {
    title: 'Blog',
    soonBadge: 'Coming Soon',
    headline: 'Deep content coming',
    desc: "We're building a blog with WhatsApp automation tips, digital marketing insights, and customer success stories. Subscribe to get the first article.",
    placeholder: 'Your email',
    notify: 'Notify me on launch',
    sent: '✅ Done! We will let you know when the first post is live.',
    or: 'or',
    backHome: 'Back to Home',
  },
}

export default function BlogPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar')
  const t = T[lang]
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'feedback',
        name: 'Blog Subscriber',
        email,
        message: 'Wants to be notified when blog launches',
        metadata: { source: 'blog_subscribe' },
      }),
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <PublicShell lang={lang} setLang={setLang}>
      <section style={{ maxWidth: '700px', margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '30px', marginBottom: '24px', fontSize: '13px', color: '#A78BFA' }}>
          <Sparkles size={14} /> {t.soonBadge}
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '20px' }}>
          {t.title}: <span className="gradient-text">{t.headline}</span>
        </h1>
        <p style={{ fontSize: '17px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '40px' }}>{t.desc}</p>

        <form onSubmit={subscribe} className="glass" style={{ padding: '24px', borderRadius: '16px', maxWidth: '480px', margin: '0 auto' }}>
          {sent ? (
            <div style={{ color: '#10B981', fontSize: '15px', fontWeight: 600 }}>{t.sent}</div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t.placeholder} className="input-cosmic" style={{ paddingRight: '40px' }} />
                <Mail size={16} style={{ position: 'absolute', [lang === 'ar' ? 'right' : 'left']: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? '...' : t.notify}</button>
            </div>
          )}
        </form>

        <div style={{ marginTop: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
          {t.or} <Link href="/" style={{ color: 'var(--accent-violet-light)' }}>{t.backHome}</Link>
        </div>
      </section>
    </PublicShell>
  )
}
