'use client'

import { useState, useEffect } from 'react'
import { Inbox, Search, X, Mail, Phone, Briefcase, Handshake, MessageSquare, Star, Trash2, Save, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Inquiry {
  id: string
  type: 'contact' | 'career' | 'partner' | 'help' | 'feedback'
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  metadata: any
  status: 'new' | 'in_progress' | 'resolved' | 'spam'
  admin_note: string | null
  created_at: string
}

const TYPE_META: Record<string, { label: string; color: string; icon: any }> = {
  contact: { label: 'تواصل', color: '#7C3AED', icon: <MessageSquare size={14} /> },
  career: { label: 'توظيف', color: '#10B981', icon: <Briefcase size={14} /> },
  partner: { label: 'شراكة', color: '#F59E0B', icon: <Handshake size={14} /> },
  help: { label: 'مساعدة', color: '#2563EB', icon: <Star size={14} /> },
  feedback: { label: 'ملاحظات', color: '#A78BFA', icon: <Inbox size={14} /> },
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  new: { label: 'جديد', color: '#F59E0B' },
  in_progress: { label: 'قيد المعالجة', color: '#7C3AED' },
  resolved: { label: 'تم', color: '#10B981' },
  spam: { label: 'سبام', color: '#6B7280' },
}

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<Inquiry | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchAll = async () => {
    const { data } = await createClient()
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const updateStatus = async (id: string, status: string) => {
    await createClient().from('inquiries').update({ status }).eq('id', id)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: status as any } : i)))
    if (selected?.id === id) setSelected((s) => (s ? { ...s, status: status as any } : null))
  }

  const saveNote = async () => {
    if (!selected) return
    setSaving(true)
    await createClient().from('inquiries').update({ admin_note: adminNote }).eq('id', selected.id)
    setItems((prev) => prev.map((i) => (i.id === selected.id ? { ...i, admin_note: adminNote } : i)))
    setSaving(false)
  }

  const deleteInquiry = async (id: string) => {
    if (!confirm('حذف هذا الطلب نهائياً؟')) return
    await createClient().from('inquiries').delete().eq('id', id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const filtered = items.filter((i) => {
    if (filterType && i.type !== filterType) return false
    if (filterStatus && i.status !== filterStatus) return false
    if (search) {
      const s = search.toLowerCase()
      return i.name?.toLowerCase().includes(s) || i.email?.toLowerCase().includes(s) || i.subject?.toLowerCase().includes(s) || i.message?.toLowerCase().includes(s)
    }
    return true
  })

  const counts = {
    new: items.filter((i) => i.status === 'new').length,
    contact: items.filter((i) => i.type === 'contact' && i.status === 'new').length,
    career: items.filter((i) => i.type === 'career' && i.status === 'new').length,
    partner: items.filter((i) => i.type === 'partner' && i.status === 'new').length,
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>صندوق الوارد العام</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{items.length} طلب — {counts.new} جديد</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        {[
          { label: 'تواصل جديد', value: counts.contact, color: '#7C3AED', icon: <MessageSquare size={18} /> },
          { label: 'توظيف جديد', value: counts.career, color: '#10B981', icon: <Briefcase size={18} /> },
          { label: 'شراكات جديدة', value: counts.partner, color: '#F59E0B', icon: <Handshake size={18} /> },
          { label: 'إجمالي الجديد', value: counts.new, color: '#EF4444', icon: <Inbox size={18} /> },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ borderTopColor: s.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</span>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${s.color}20`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <input className="input-cosmic" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم/البريد/الموضوع..." style={{ paddingRight: '40px' }} />
          <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        <select className="input-cosmic" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: '160px' }}>
          <option value="">كل الأنواع</option>
          {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="input-cosmic" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '160px' }}>
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px' }}>{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '50px', marginBottom: '8px', borderRadius: '8px' }} />)}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Inbox size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>لا توجد طلبات</p>
          </div>
        ) : (
          <div className="responsive-table-wrap">
          <table className="table-cosmic">
            <thead><tr><th>النوع</th><th>المرسل</th><th>الموضوع</th><th>الحالة</th><th>التاريخ</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {filtered.map((i) => {
                const typeM = TYPE_META[i.type]
                const statusM = STATUS_META[i.status]
                return (
                  <tr key={i.id}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: `${typeM.color}20`, color: typeM.color }}>
                        {typeM.icon} {typeM.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{i.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{i.email}</div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.subject || i.message.substring(0, 50)}</td>
                    <td><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', background: `${statusM.color}20`, color: statusM.color, fontWeight: 600 }}>{statusM.label}</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(i.created_at).toLocaleDateString('ar-SA')}</td>
                    <td>
                      <button onClick={() => { setSelected(i); setAdminNote(i.admin_note || '') }} style={{ padding: '6px 12px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#A78BFA', fontSize: '12px' }}>
                        فتح
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
          <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: `${TYPE_META[selected.type].color}20`, color: TYPE_META[selected.type].color, marginBottom: '8px' }}>
                  {TYPE_META[selected.type].icon} {TYPE_META[selected.type].label}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{selected.subject || 'بدون موضوع'}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(selected.created_at).toLocaleString('ar-SA')}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            {/* Sender */}
            <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><strong>👤</strong> {selected.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={13} />
                <a href={`mailto:${selected.email}`} style={{ color: 'var(--accent-violet-light)' }}>{selected.email}</a>
              </div>
              {selected.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={13} />
                  <a href={`tel:${selected.phone}`} style={{ color: 'var(--accent-violet-light)' }}>{selected.phone}</a>
                </div>
              )}
              {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  {Object.entries(selected.metadata).map(([k, v]) => (
                    <div key={k} style={{ fontSize: '12px' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{k}:</strong> {String(v)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message */}
            <div style={{ padding: '16px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {selected.message}
            </div>

            {/* Status */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>الحالة</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <button key={k} onClick={() => updateStatus(selected.id, k)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: selected.status === k ? `1px solid ${v.color}` : '1px solid var(--border)', background: selected.status === k ? `${v.color}20` : 'transparent', color: selected.status === k ? v.color : 'var(--text-muted)' }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Note */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>ملاحظة الأدمن (داخلية)</label>
              <textarea className="input-cosmic" rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="ملاحظات داخلية لا تُرى من قبل المرسل..." style={{ resize: 'vertical' }} />
              <button onClick={saveNote} disabled={saving} className="btn-secondary" style={{ marginTop: '8px' }}>
                <Save size={14} /> {saving ? 'جاري الحفظ...' : 'حفظ الملاحظة'}
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a href={`mailto:${selected.email}?subject=${encodeURIComponent('رد على: ' + (selected.subject || ''))}`} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                <Mail size={15} /> الرد عبر البريد
              </a>
              <button onClick={() => deleteInquiry(selected.id)} style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#EF4444', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '13px', fontWeight: 600 }}>
                <Trash2 size={14} style={{ display: 'inline', marginLeft: '4px' }} /> حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
