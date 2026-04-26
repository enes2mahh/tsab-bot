'use client'

import { useState } from 'react'
import { Handshake, Award, TrendingUp, Users, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import { useLang } from '@/lib/lang'

const T = {
  ar: {
    title: 'الشراكة مع Tsab Bot',
    subtitle: 'انضم لشبكة شركائنا واحصل على عمولات مجزية وحلول مخصّصة',
    types: 'أنواع الشراكات',
    typeList: [
      { icon: <Award size={28} />, title: 'شريك معتمد', desc: 'إعادة بيع المنصة بأسعار خاصة وحصرية', color: '#7C3AED' },
      { icon: <TrendingUp size={28} />, title: 'شريك إحالة', desc: 'احصل على عمولة 20% من كل عميل تجلبه', color: '#10B981' },
      { icon: <Users size={28} />, title: 'وكالة تسويق', desc: 'حلول مخصّصة لإدارة حسابات متعدّدة لعملائك', color: '#F59E0B' },
      { icon: <Handshake size={28} />, title: 'تكامل تقني', desc: 'دمج Tsab Bot مع منتجك عبر API', color: '#2563EB' },
    ],
    benefitsTitle: 'مزايا الشراكة',
    benefits: [
      'عمولات تنافسية تصل إلى 30%',
      'دعم فني مخصّص وأولوية في الردود',
      'مواد تسويقية جاهزة بالعربية والإنجليزية',
      'لوحة تحكم خاصة لمتابعة العمولات والعملاء',
      'تدريب مجاني على المنصة لفريقك',
      'White-label متاح للشركاء المعتمدين',
    ],
    formTitle: 'تقدّم لتكون شريكاً',
    name: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'رقم الهاتف',
    company: 'اسم الشركة', website: 'الموقع الإلكتروني', type: 'نوع الشراكة',
    message: 'أخبرنا عن نشاطك وكيف تخطط للشراكة',
    submit: 'إرسال طلب الشراكة', submitting: 'جاري الإرسال...',
    success: '✅ تم استلام طلبك! فريق الشراكات سيتواصل معك خلال 3 أيام عمل.',
    required: 'الرجاء تعبئة الحقول المطلوبة',
    types_options: ['شريك معتمد', 'شريك إحالة', 'وكالة تسويق', 'تكامل تقني', 'أخرى'],
  },
  en: {
    title: 'Partner with Tsab Bot',
    subtitle: 'Join our partner network for great commissions and custom solutions',
    types: 'Partnership Types',
    typeList: [
      { icon: <Award size={28} />, title: 'Certified Partner', desc: 'Resell the platform at exclusive special prices', color: '#7C3AED' },
      { icon: <TrendingUp size={28} />, title: 'Referral Partner', desc: 'Earn 20% commission on every customer you bring', color: '#10B981' },
      { icon: <Users size={28} />, title: 'Marketing Agency', desc: 'Custom solutions for managing multiple client accounts', color: '#F59E0B' },
      { icon: <Handshake size={28} />, title: 'Technical Integration', desc: 'Integrate Tsab Bot with your product via API', color: '#2563EB' },
    ],
    benefitsTitle: 'Partnership Benefits',
    benefits: [
      'Competitive commissions up to 30%',
      'Dedicated technical support with priority response',
      'Ready marketing materials in Arabic & English',
      'Custom dashboard to track commissions and clients',
      'Free platform training for your team',
      'White-label available for certified partners',
    ],
    formTitle: 'Apply to Partner',
    name: 'Full Name', email: 'Email', phone: 'Phone',
    company: 'Company Name', website: 'Website', type: 'Partnership Type',
    message: 'Tell us about your business and partnership plans',
    submit: 'Submit Application', submitting: 'Submitting...',
    success: '✅ Application received! Our partnership team will reach out within 3 business days.',
    required: 'Please fill required fields',
    types_options: ['Certified Partner', 'Referral Partner', 'Marketing Agency', 'Technical Integration', 'Other'],
  },
}

export default function PartnersPage() {
  const { lang } = useLang()
  const t = T[lang]
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', website: '', type: t.types_options[0], message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.company || !form.message) { setError(t.required); return }
    setLoading(true)
    try {
      const r = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'partner',
          name: form.name,
          email: form.email,
          phone: form.phone,
          subject: `Partnership: ${form.type}`,
          message: form.message,
          metadata: { company: form.company, website: form.website, partnership_type: form.type },
        }),
      })
      const data = await r.json()
      if (!r.ok) setError(data.error || 'Error')
      else { setSuccess(true); setForm({ name: '', email: '', phone: '', company: '', website: '', type: t.types_options[0], message: '' }) }
    } catch { setError(lang === 'ar' ? 'خطأ في الاتصال' : 'Connection error') }
    setLoading(false)
  }

  return (
    <PublicShell>
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Handshake size={48} color="var(--accent-violet-light)" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>{t.title}</h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>{t.subtitle}</p>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', textAlign: 'center' }}>{t.types}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '60px' }}>
          {t.typeList.map(p => (
            <div key={p.title} className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: `${p.color}20`, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{p.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{p.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="glass" style={{ padding: '32px', borderRadius: '20px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>{t.benefitsTitle}</h2>
          <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {t.benefits.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <CheckCircle size={16} color="#10B981" style={{ flexShrink: 0 }} />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass" style={{ padding: '32px', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>{t.formTitle}</h2>
          {success ? (
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <CheckCircle size={56} color="#10B981" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{t.success}</h3>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="grid-2" style={{ marginBottom: '14px' }}>
                <div><label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.name} *</label><input required className="input-cosmic" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.email} *</label><input required type="email" className="input-cosmic" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid-2" style={{ marginBottom: '14px' }}>
                <div><label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.phone}</label><input className="input-cosmic" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.company} *</label><input required className="input-cosmic" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
              </div>
              <div className="grid-2" style={{ marginBottom: '14px' }}>
                <div><label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.website}</label><input type="url" className="input-cosmic" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://" /></div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.type} *</label>
                  <select required className="input-cosmic" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {t.types_options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.message} *</label>
                <textarea required rows={5} className="input-cosmic" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '16px', color: '#EF4444', fontSize: '13px' }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}><Send size={16} /> {loading ? t.submitting : t.submit}</button>
            </form>
          )}
        </div>
      </section>
    </PublicShell>
  )
}
