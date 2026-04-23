'use client'

import { useState, useEffect } from 'react'
import { Plus, Bot, Trash2, GripVertical, X, Clock, Hash, MessageSquare, AlignLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AutoReply {
  id: string
  name: string
  device_id: string
  trigger_type: string
  trigger_value: string | null
  response_type: string
  response_content: any
  is_active: boolean
  priority: number
  uses_count: number
}

const triggerLabels: Record<string, string> = {
  keyword: 'كلمة مفتاحية', contains: 'يحتوي على', starts_with: 'يبدأ بـ',
  first_message: 'أول رسالة', all: 'كل الرسائل', outside_hours: 'خارج أوقات العمل',
}

function AutoReplyForm({ devices, onClose, onSaved, existing }: any) {
  const [form, setForm] = useState({
    name: existing?.name || '', device_id: existing?.device_id || '',
    trigger_type: existing?.trigger_type || 'keyword', trigger_value: existing?.trigger_value || '',
    response_type: existing?.response_type || 'text', response_content: existing?.response_content || { text: '' },
    working_hours_start: existing?.working_hours_start || '09:00', working_hours_end: existing?.working_hours_end || '17:00',
    working_days: existing?.working_days || [0, 1, 2, 3, 4], priority: existing?.priority || 0, is_active: existing?.is_active ?? true,
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (existing) {
      await supabase.from('auto_replies').update(form).eq('id', existing.id)
    } else {
      await supabase.from('auto_replies').insert({ ...form, user_id: user.id })
    }
    setLoading(false)
    onSaved()
    onClose()
  }

  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '540px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{existing ? 'تعديل قاعدة' : 'قاعدة رد جديدة'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الاسم</label>
            <input className="input-cosmic" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: رد على مرحبا" /></div>

          <div><label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الجهاز</label>
            <select className="input-cosmic" value={form.device_id} onChange={e => setForm({ ...form, device_id: e.target.value })}>
              <option value="">اختر جهازاً...</option>
              {devices.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>

          <div><label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>نوع التشغيل</label>
            <select className="input-cosmic" value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })}>
              {Object.entries(triggerLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>

          {['keyword', 'contains', 'starts_with'].includes(form.trigger_type) && (
            <div><label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الكلمة المفتاحية</label>
              <input className="input-cosmic" value={form.trigger_value} onChange={e => setForm({ ...form, trigger_value: e.target.value })} placeholder="مثال: مرحبا، أهلاً، سلام" /></div>
          )}

          {form.trigger_type === 'outside_hours' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>ساعات العمل</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="time" className="input-cosmic" value={form.working_hours_start} onChange={e => setForm({ ...form, working_hours_start: e.target.value })} />
                <input type="time" className="input-cosmic" value={form.working_hours_end} onChange={e => setForm({ ...form, working_hours_end: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                {days.map((d, i) => (
                  <button key={i} type="button" onClick={() => {
                    const wd = form.working_days.includes(i) ? form.working_days.filter((x: number) => x !== i) : [...form.working_days, i]
                    setForm({ ...form, working_days: wd })
                  }} style={{ padding: '4px 10px', borderRadius: '8px', border: `1px solid ${form.working_days.includes(i) ? 'var(--accent-violet)' : 'var(--border)'}`, background: form.working_days.includes(i) ? 'rgba(124,58,237,0.15)' : 'transparent', color: form.working_days.includes(i) ? '#A78BFA' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div><label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>نص الرد</label>
            <textarea className="input-cosmic" rows={4} value={form.response_content?.text || ''} onChange={e => setForm({ ...form, response_content: { ...form.response_content, text: e.target.value } })} placeholder="اكتب الرد هنا..." style={{ resize: 'vertical' }} /></div>

          <div><label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الأولوية</label>
            <input type="number" className="input-cosmic" value={form.priority} min={0} max={100} onChange={e => setForm({ ...form, priority: +e.target.value })} /></div>

          <button onClick={handleSave} disabled={loading || !form.name || !form.device_id} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'جاري الحفظ...' : 'حفظ القاعدة'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AutoReplyPage() {
  const [replies, setReplies] = useState<AutoReply[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<AutoReply | null>(null)

  const fetchData = async () => {
    const supabase = createClient()
    const [r, d] = await Promise.all([
      supabase.from('auto_replies').select('*').order('priority', { ascending: false }),
      supabase.from('devices').select('id, name'),
    ])
    setReplies(r.data || [])
    setDevices(d.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const toggleActive = async (id: string, current: boolean) => {
    await createClient().from('auto_replies').update({ is_active: !current }).eq('id', id)
    fetchData()
  }

  const deleteReply = async (id: string) => {
    if (!confirm('حذف هذه القاعدة؟')) return
    await createClient().from('auto_replies').delete().eq('id', id)
    fetchData()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>الرد التلقائي</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{replies.length} قاعدة</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true) }} className="btn-primary"><Plus size={16} /> قاعدة جديدة</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px' }}>{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '8px', borderRadius: '8px' }} />)}</div>
        ) : replies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Bot size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>لا توجد قواعد بعد</h3>
            <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> أضف قاعدة</button>
          </div>
        ) : (
          <table className="table-cosmic">
            <thead><tr><th>الاسم</th><th>الجهاز</th><th>التشغيل</th><th>الكلمة</th><th>الاستخدامات</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>
              {replies.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px' }}>{r.name}</td>
                  <td style={{ fontSize: '13px' }}>{devices.find(d => d.id === r.device_id)?.name || '-'}</td>
                  <td><span className="badge badge-violet" style={{ fontSize: '11px' }}>{triggerLabels[r.trigger_type]}</span></td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.trigger_value || '—'}</td>
                  <td style={{ fontSize: '13px' }}>{r.uses_count}</td>
                  <td>
                    <button onClick={() => toggleActive(r.id, r.is_active)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', border: 'none', background: r.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: r.is_active ? '#10B981' : '#64748B', cursor: 'pointer', fontSize: '12px' }}>
                      {r.is_active ? '● مفعّل' : '○ معطّل'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => { setEditItem(r); setShowForm(true) }} style={{ padding: '6px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#A78BFA' }}>✏️</button>
                      <button onClick={() => deleteReply(r.id)} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && <AutoReplyForm devices={devices} onClose={() => setShowForm(false)} onSaved={fetchData} existing={editItem} />}
    </div>
  )
}
