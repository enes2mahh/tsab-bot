'use client'

import { useState, useEffect } from 'react'
import { Briefcase, Plus, Edit2, Trash2, X, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Job {
  id: string
  slug: string
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  location_ar: string
  location_en: string
  type_ar: string
  type_en: string
  is_active: boolean
  sort_order: number
}

const empty: Omit<Job, 'id'> = {
  slug: '',
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  location_ar: 'عن بُعد',
  location_en: 'Remote',
  type_ar: 'دوام كامل',
  type_en: 'Full-time',
  is_active: true,
  sort_order: 0,
}

function JobForm({ job, onClose, onSaved }: { job?: Job | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!job
  const [form, setForm] = useState<Omit<Job, 'id'>>({
    slug: job?.slug || '',
    title_ar: job?.title_ar || '',
    title_en: job?.title_en || '',
    description_ar: job?.description_ar || '',
    description_en: job?.description_en || '',
    location_ar: job?.location_ar || 'عن بُعد',
    location_en: job?.location_en || 'Remote',
    type_ar: job?.type_ar || 'دوام كامل',
    type_en: job?.type_en || 'Full-time',
    is_active: job?.is_active ?? true,
    sort_order: job?.sort_order || 0,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title_ar || !form.title_en || !form.slug) return alert('الحقول المطلوبة: slug، الاسم بالعربي، الاسم بالإنجليزي')
    setSaving(true)
    const supabase = createClient()
    if (isEdit && job) {
      await supabase.from('jobs').update(form).eq('id', job.id)
    } else {
      await supabase.from('jobs').insert(form)
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '720px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isEdit ? 'تعديل الوظيفة' : 'إضافة وظيفة جديدة'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div className="grid-2" style={{ gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Slug (فريد) *</label>
            <input className="input-cosmic" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })} placeholder="frontend-dev" style={{ direction: 'ltr', fontFamily: 'monospace' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>ترتيب العرض</label>
            <input type="number" className="input-cosmic" value={form.sort_order} min={0} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الاسم (عربي) *</label>
            <input className="input-cosmic" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} placeholder="مطوّر واجهات" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الاسم (إنجليزي) *</label>
            <input className="input-cosmic" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} placeholder="Frontend Developer" style={{ direction: 'ltr' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الوصف (عربي)</label>
            <input className="input-cosmic" value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} placeholder="React + Next.js + TypeScript" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الوصف (إنجليزي)</label>
            <input className="input-cosmic" value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} placeholder="React + Next.js + TypeScript" style={{ direction: 'ltr' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الموقع (عربي)</label>
            <input className="input-cosmic" value={form.location_ar} onChange={(e) => setForm({ ...form, location_ar: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الموقع (إنجليزي)</label>
            <input className="input-cosmic" value={form.location_en} onChange={(e) => setForm({ ...form, location_en: e.target.value })} style={{ direction: 'ltr' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>نوع الدوام (عربي)</label>
            <input className="input-cosmic" value={form.type_ar} onChange={(e) => setForm({ ...form, type_ar: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>نوع الدوام (إنجليزي)</label>
            <input className="input-cosmic" value={form.type_en} onChange={(e) => setForm({ ...form, type_en: e.target.value })} style={{ direction: 'ltr' }} />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} style={{ accentColor: '#10B981', width: '16px', height: '16px' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>✅ ظاهرة للعموم في صفحة /careers</span>
        </label>

        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}>
          <Save size={16} /> {saving ? 'جاري الحفظ...' : 'حفظ الوظيفة'}
        </button>
      </div>
    </div>
  )
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editJob, setEditJob] = useState<Job | null>(null)

  const fetchJobs = async () => {
    const { data } = await createClient().from('jobs').select('*').order('sort_order', { ascending: true })
    setJobs(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchJobs() }, [])

  const toggleActive = async (id: string, current: boolean) => {
    await createClient().from('jobs').update({ is_active: !current }).eq('id', id)
    fetchJobs()
  }

  const deleteJob = async (id: string) => {
    if (!confirm('حذف هذه الوظيفة نهائياً؟')) return
    await createClient().from('jobs').delete().eq('id', id)
    fetchJobs()
  }

  const activeCount = jobs.filter((j) => j.is_active).length

  return (
    <div>
      <div className="page-flex-header">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>إدارة الوظائف</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{jobs.length} وظيفة — {activeCount} نشطة</p>
        </div>
        <button onClick={() => { setEditJob(null); setShowForm(true) }} className="btn-primary">
          <Plus size={16} /> وظيفة جديدة
        </button>
      </div>

      {/* Hint */}
      <div style={{ padding: '14px 16px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', color: '#60A5FA' }}>
        💡 الوظائف النشطة تظهر تلقائياً في صفحة <strong>/careers</strong>. لو ما في وظائف نشطة، ستظهر رسالة "لا توجد وظائف شاغرة حالياً".
      </div>

      {loading ? (
        <div className="card">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '8px', borderRadius: '8px' }} />)}</div>
      ) : jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <Briefcase size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>لا توجد وظائف بعد</p>
          <button onClick={() => { setEditJob(null); setShowForm(true) }} className="btn-primary">
            <Plus size={16} /> أضف أول وظيفة
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {jobs.map((job) => (
            <div key={job.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', opacity: job.is_active ? 1 : 0.5 }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Briefcase size={18} color={job.is_active ? '#10B981' : '#6B7280'} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{job.title_ar}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', direction: 'ltr' }}>· {job.title_en}</span>
                  {!job.is_active && <span className="badge badge-red" style={{ fontSize: '10px' }}>معطّلة</span>}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{job.description_ar}</p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>📍 {job.location_ar}</span>
                  <span>⏱️ {job.type_ar}</span>
                  <span>🔢 {job.sort_order}</span>
                  <code style={{ fontFamily: 'monospace' }}>{job.slug}</code>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => { setEditJob(job); setShowForm(true) }} style={{ padding: '8px 12px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '8px', cursor: 'pointer', color: '#A78BFA', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Tajawal, sans-serif' }}>
                  <Edit2 size={13} /> تعديل
                </button>
                <button onClick={() => toggleActive(job.id, job.is_active)} style={{ padding: '8px 12px', background: job.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${job.is_active ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`, borderRadius: '8px', cursor: 'pointer', color: job.is_active ? '#F59E0B' : '#10B981', fontSize: '12px', fontFamily: 'Tajawal, sans-serif' }}>
                  {job.is_active ? 'تعطيل' : 'تفعيل'}
                </button>
                <button onClick={() => deleteJob(job.id)} style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#EF4444' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <JobForm job={editJob} onClose={() => { setShowForm(false); setEditJob(null) }} onSaved={fetchJobs} />}
    </div>
  )
}
