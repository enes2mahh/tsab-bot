'use client'

import { useState } from 'react'
import { Mail, Phone, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import { useLang } from '@/lib/lang'

const T = {
  ar: {
    title: 'تواصل معنا',
    subtitle: 'نحن هنا لمساعدتك. أرسل رسالتك وسنرد خلال 24 ساعة',
    name: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'رقم الهاتف (اختياري)',
    subject: 'الموضوع', message: 'رسالتك', send: 'إرسال الرسالة', sending: 'جاري الإرسال...',
    success: '✅ تم استلام رسالتك! سنتواصل معك قريباً.',
    cards: [
      { icon: '📧', title: 'البريد الإلكتروني', value: 'support@tsab-bot.com' },
      { icon: '⏱️', title: 'وقت الرد', value: 'خلال 24 ساعة عمل' },
      { icon: '🌍', title: 'اللغات', value: 'العربية والإنجليزية' },
    ],
    placeholders: { name: 'محمد أحمد', email: 'name@example.com', phone: '+966 5x xxx xxxx', subject: 'مثلاً: استفسار عن الأسعار', message: 'اكتب رسالتك هنا...' },
    required: 'هذا الحقل مطلوب',
  },
  en: {
    title: 'Contact Us',
    subtitle: "We're here to help. Send us a message and we'll reply within 24 hours.",
    name: 'Full Name', email: 'Email', phone: 'Phone (optional)',
    subject: 'Subject', message: 'Your Message', send: 'Send Message', sending: 'Sending...',
    success: '✅ Message received! We will contact you shortly.',
    cards: [
      { icon: '📧', title: 'Email', value: 'support@tsab-bot.com' },
      { icon: '⏱️', title: 'Response Time', value: 'Within 24 business hours' },
      { icon: '🌍', title: 'Languages', value: 'Arabic & English' },
    ],
    placeholders: { name: 'John Doe', email: 'name@example.com', phone: '+966 5x xxx xxxx', subject: 'e.g. Pricing inquiry', message: 'Write your message here...' },
    required: 'Required field',
  },
}

export default function ContactPage() {
  const { lang } = useLang()
  const t = T[lang]

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.message) {
      setError(t.required)
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contact', ...form }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'حدث خطأ')
      } else {
        setSuccess(true)
        setForm({ name: '', email: '', phone: '', subject: '', message: '' })
      }
    } catch {
      setError(lang === 'ar' ? 'تعذر الاتصال بالخادم' : 'Connection error')
    }
    setLoading(false)
  }

  return (
    <PublicShell>
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>{t.title}</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{t.subtitle}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {t.cards.map(c => (
            <div key={c.title} className="glass" style={{ padding: '20px', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{c.icon}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{c.title}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{c.value}</div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="glass" style={{ padding: '32px', borderRadius: '20px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <CheckCircle size={56} color="#10B981" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{t.success}</h3>
              <button type="button" onClick={() => setSuccess(false)} style={{ marginTop: '20px' }} className="btn-secondary">
                {lang === 'ar' ? 'إرسال رسالة أخرى' : 'Send another'}
              </button>
            </div>
          ) : (
            <>
              <div className="grid-2" style={{ marginBottom: '16px' }}>
                <Field label={t.name} required value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder={t.placeholders.name} />
                <Field label={t.email} required type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder={t.placeholders.email} />
              </div>
              <div className="grid-2" style={{ marginBottom: '16px' }}>
                <Field label={t.phone} value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder={t.placeholders.phone} />
                <Field label={t.subject} value={form.subject} onChange={v => setForm({ ...form, subject: v })} placeholder={t.placeholders.subject} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.message} *</label>
                <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder={t.placeholders.message} className="input-cosmic" style={{ resize: 'vertical' }} />
              </div>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '16px', color: '#EF4444', fontSize: '13px' }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <Send size={16} /> {loading ? t.sending : t.send}
              </button>
            </>
          )}
        </form>
      </section>
    </PublicShell>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}{required && ' *'}</label>
      <input type={type} required={required} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input-cosmic" />
    </div>
  )
}
