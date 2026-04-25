'use client'

import { useState } from 'react'
import { Briefcase, MapPin, Clock, Send, CheckCircle, AlertCircle, Star } from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'

const T = {
  ar: {
    title: 'انضم لفريقنا',
    subtitle: 'نحن نبني مستقبل أتمتة واتساب في العالم العربي. كن جزءاً من القصة.',
    perksTitle: 'لماذا Tsab Bot؟',
    perks: [
      { icon: '🚀', title: 'بيئة عمل ديناميكية', desc: 'فريق صغير، قرارات سريعة، تعلّم مستمر' },
      { icon: '🌍', title: 'عمل عن بُعد', desc: 'اشتغل من أي مكان في العالم بساعات مرنة' },
      { icon: '💰', title: 'رواتب تنافسية', desc: 'حوافز + أسهم + مزايا صحية شاملة' },
      { icon: '🎓', title: 'ميزانية تعلّم', desc: 'كورسات، مؤتمرات، وأدوات احترافية' },
    ],
    openings: 'الوظائف المفتوحة',
    apply: 'تقدّم الآن',
    applyTitle: 'استمارة التقديم',
    name: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'رقم الهاتف',
    position: 'الوظيفة المطلوبة', linkedin: 'رابط LinkedIn (اختياري)', portfolio: 'رابط Portfolio/CV',
    cover: 'لماذا تريد الانضمام لـ Tsab Bot؟',
    submit: 'إرسال الطلب', submitting: 'جاري الإرسال...',
    success: '✅ تم استلام طلبك! سنراجعه ونتواصل معك خلال 7 أيام.',
    required: 'الرجاء تعبئة الحقول المطلوبة',
    jobs: [
      { id: 'fullstack', title: 'مطوّر Full-Stack', loc: 'عن بُعد', type: 'دوام كامل', desc: 'Next.js + Supabase + TypeScript' },
      { id: 'wa-eng', title: 'مهندس WhatsApp Integration', loc: 'عن بُعد', type: 'دوام كامل', desc: 'Node.js + Baileys + Real-time' },
      { id: 'ai', title: 'مهندس AI/ML', loc: 'عن بُعد', type: 'دوام كامل', desc: 'Gemini + LLMs + Prompt Engineering' },
      { id: 'support', title: 'موظّف دعم فني', loc: 'عن بُعد', type: 'دوام كامل/جزئي', desc: 'تواصل مع العملاء بالعربية والإنجليزية' },
      { id: 'marketing', title: 'مسوّق رقمي', loc: 'عن بُعد', type: 'دوام كامل', desc: 'محتوى + إعلانات + تحليلات' },
    ],
  },
  en: {
    title: 'Join Our Team',
    subtitle: "We're building the future of WhatsApp automation in the Arab world. Be part of the story.",
    perksTitle: 'Why Tsab Bot?',
    perks: [
      { icon: '🚀', title: 'Dynamic Environment', desc: 'Small team, fast decisions, continuous learning' },
      { icon: '🌍', title: 'Remote Work', desc: 'Work from anywhere with flexible hours' },
      { icon: '💰', title: 'Competitive Pay', desc: 'Bonuses + equity + comprehensive health benefits' },
      { icon: '🎓', title: 'Learning Budget', desc: 'Courses, conferences, and professional tools' },
    ],
    openings: 'Open Positions',
    apply: 'Apply Now',
    applyTitle: 'Application Form',
    name: 'Full Name', email: 'Email', phone: 'Phone',
    position: 'Position', linkedin: 'LinkedIn URL (optional)', portfolio: 'Portfolio/CV URL',
    cover: 'Why do you want to join Tsab Bot?',
    submit: 'Submit Application', submitting: 'Submitting...',
    success: '✅ Application received! We will review and reply within 7 days.',
    required: 'Please fill required fields',
    jobs: [
      { id: 'fullstack', title: 'Full-Stack Developer', loc: 'Remote', type: 'Full-time', desc: 'Next.js + Supabase + TypeScript' },
      { id: 'wa-eng', title: 'WhatsApp Integration Engineer', loc: 'Remote', type: 'Full-time', desc: 'Node.js + Baileys + Real-time' },
      { id: 'ai', title: 'AI/ML Engineer', loc: 'Remote', type: 'Full-time', desc: 'Gemini + LLMs + Prompt Engineering' },
      { id: 'support', title: 'Support Specialist', loc: 'Remote', type: 'Full/Part-time', desc: 'Customer communication in Arabic & English' },
      { id: 'marketing', title: 'Digital Marketer', loc: 'Remote', type: 'Full-time', desc: 'Content + Ads + Analytics' },
    ],
  },
}

export default function CareersPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar')
  const t = T[lang]

  const [showForm, setShowForm] = useState(false)
  const [selectedJob, setSelectedJob] = useState<string>('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', linkedin: '', portfolio: '', cover: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const openApply = (jobId: string) => {
    setSelectedJob(jobId)
    setShowForm(true)
    setSuccess(false)
    setError('')
    setTimeout(() => document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.cover) { setError(t.required); return }
    setLoading(true)
    try {
      const r = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'career',
          name: form.name,
          email: form.email,
          phone: form.phone,
          subject: t.jobs.find(j => j.id === selectedJob)?.title || 'Career Application',
          message: form.cover,
          metadata: { position: selectedJob, linkedin: form.linkedin, portfolio: form.portfolio },
        }),
      })
      const data = await r.json()
      if (!r.ok) setError(data.error || 'Error')
      else { setSuccess(true); setForm({ name: '', email: '', phone: '', linkedin: '', portfolio: '', cover: '' }) }
    } catch { setError(lang === 'ar' ? 'خطأ في الاتصال' : 'Connection error') }
    setLoading(false)
  }

  return (
    <PublicShell lang={lang} setLang={setLang}>
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>{t.title}</h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>{t.subtitle}</p>
        </div>

        {/* Perks */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', textAlign: 'center' }}>{t.perksTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {t.perks.map(p => (
              <div key={p.title} className="glass" style={{ padding: '24px', borderRadius: '14px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{p.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{p.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Openings */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>{t.openings}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {t.jobs.map(job => (
              <div key={job.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <Briefcase size={18} color="var(--accent-violet-light)" />
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{job.title}</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{job.desc}</p>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {job.loc}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {job.type}</span>
                  </div>
                </div>
                <button onClick={() => openApply(job.id)} className="btn-primary">
                  {t.apply}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Application Form */}
        {showForm && (
          <div id="apply-form" className="glass" style={{ padding: '32px', borderRadius: '20px', marginTop: '40px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t.applyTitle}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              {t.jobs.find(j => j.id === selectedJob)?.title}
            </p>
            {success ? (
              <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                <CheckCircle size={56} color="#10B981" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{t.success}</h3>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.name} *</label>
                    <input required className="input-cosmic" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.email} *</label>
                    <input required type="email" className="input-cosmic" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.phone}</label>
                    <input className="input-cosmic" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.linkedin}</label>
                    <input type="url" className="input-cosmic" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.portfolio}</label>
                  <input type="url" className="input-cosmic" value={form.portfolio} onChange={e => setForm({ ...form, portfolio: e.target.value })} placeholder="https://..." />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{t.cover} *</label>
                  <textarea required rows={5} className="input-cosmic" value={form.cover} onChange={e => setForm({ ...form, cover: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '16px', color: '#EF4444', fontSize: '13px' }}>
                    <AlertCircle size={15} /> {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <Send size={16} /> {loading ? t.submitting : t.submit}
                </button>
              </form>
            )}
          </div>
        )}
      </section>
    </PublicShell>
  )
}
