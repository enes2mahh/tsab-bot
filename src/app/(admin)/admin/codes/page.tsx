'use client'

import { useState, useEffect } from 'react'
import { Plus, Copy, Trash2, X, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ActivationCode {
  id: string; code: string; plan_id: string; plans: any; uses_count: number; max_uses: number
  duration_days: number | null; expires_at: string | null; is_active: boolean; notes: string | null; created_at: string
}

function CodeForm({ plans, onClose, onSaved }: any) {
  const [form, setForm] = useState({ plan_id: '', max_uses: 1, duration_days: 30, expires_at: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    const supabase = createClient()
    const code = 'TSAB' + Math.random().toString(36).slice(2, 8).toUpperCase()
    await supabase.from('activation_codes').insert({
      code, ...form, expires_at: form.expires_at || null,
      duration_days: form.duration_days || null, uses_count: 0, is_active: true,
    })
    setLoading(false); onSaved(); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '420px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>إنشاء كود تفعيل</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الخطة</label>
            <select className="input-cosmic" value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })}>
              <option value="">اختر خطة...</option>
              {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name_ar} - {p.price} ريال</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>عدد الاستخدامات</label>
            <input type="number" className="input-cosmic" value={form.max_uses} min={1} onChange={e => setForm({ ...form, max_uses: +e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>مدة الاشتراك (يوم)</label>
            <input type="number" className="input-cosmic" value={form.duration_days} min={1} onChange={e => setForm({ ...form, duration_days: +e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>تاريخ انتهاء الكود (اختياري)</label>
            <input type="date" className="input-cosmic" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>ملاحظات (لمن أُعطي)</label>
            <input className="input-cosmic" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="مثال: عميل محمد - دفع 79 ريال" />
          </div>
          <button onClick={handleCreate} disabled={loading || !form.plan_id} className="btn-primary" style={{ justifyContent: 'center' }}>
            {loading ? 'جاري الإنشاء...' : '✨ إنشاء الكود'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<ActivationCode[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchData = async () => {
    const supabase = createClient()
    const [c, p] = await Promise.all([
      supabase.from('activation_codes').select('*, plans(name_ar, price)').order('created_at', { ascending: false }),
      supabase.from('plans').select('id, name_ar, price').eq('is_active', true),
    ])
    setCodes(c.data || [])
    setPlans(p.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const deactivate = async (id: string) => {
    await createClient().from('activation_codes').update({ is_active: false }).eq('id', id)
    fetchData()
  }

  const deleteCode = async (id: string) => {
    if (!confirm('حذف هذا الكود؟')) return
    await createClient().from('activation_codes').delete().eq('id', id)
    fetchData()
  }

  return (
    <div>
      <div className="page-flex-header">
        <div><h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>أكواد التفعيل</h2><p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{codes.length} كود</p></div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> كود جديد</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="responsive-table-wrap">
        <table className="table-cosmic">
          <thead><tr><th>الكود</th><th>الخطة</th><th>الاستخدام</th><th>المدة</th><th>انتهاء الكود</th><th>الحالة</th><th>ملاحظات</th><th>الإجراءات</th></tr></thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={8}><div className="skeleton" style={{ height: '36px', borderRadius: '8px' }} /></td></tr>)
            ) : codes.map(code => (
              <tr key={code.id}>
                <td>
                  <code style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '2px', color: 'var(--accent-violet-light)', background: 'rgba(124,58,237,0.1)', padding: '3px 8px', borderRadius: '6px' }}>{code.code}</code>
                </td>
                <td style={{ fontSize: '13px' }}>{code.plans?.name_ar || '—'}</td>
                <td style={{ fontSize: '13px' }}>{code.uses_count}/{code.max_uses}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{code.duration_days ? `${code.duration_days} يوم` : 'من الخطة'}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{code.expires_at ? new Date(code.expires_at).toLocaleDateString('ar-SA') : '—'}</td>
                <td>
                  <span className={`badge badge-${code.is_active ? 'emerald' : 'red'}`}>{code.is_active ? 'نشط' : 'معطّل'}</span>
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{code.notes || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => copyCode(code.code, code.id)} style={{ padding: '5px 8px', background: copied === code.id ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: copied === code.id ? '#10B981' : '#A78BFA' }}>
                      {copied === code.id ? <CheckCircle size={13} /> : <Copy size={13} />}
                    </button>
                    {code.is_active && <button onClick={() => deactivate(code.id)} style={{ padding: '5px 8px', background: 'rgba(245,158,11,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#F59E0B', fontSize: '11px' }}>تعطيل</button>}
                    <button onClick={() => deleteCode(code.id)} style={{ padding: '5px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {codes.length === 0 && !loading && <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>لا توجد أكواد بعد</div>}
      </div>

      {showForm && <CodeForm plans={plans} onClose={() => setShowForm(false)} onSaved={fetchData} />}
    </div>
  )
}
