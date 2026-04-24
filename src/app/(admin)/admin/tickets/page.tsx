'use client'

import { useState, useEffect } from 'react'
import { Ticket, Search, Send, CheckCircle, Clock, AlertCircle, XCircle, X, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'مفتوح', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  in_progress: { label: 'قيد المعالجة', color: '#7C3AED', bg: 'rgba(124,58,237,0.15)' },
  waiting: { label: 'في الانتظار', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  closed: { label: 'مغلق', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [reply, setReply] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [sending, setSending] = useState(false)

  const fetchTickets = async () => {
    const { data } = await createClient()
      .from('tickets')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false })
    setTickets(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [])

  const openTicket = async (ticket: any) => {
    setSelected(ticket)
    const { data } = await createClient()
      .from('ticket_messages')
      .select('*, profiles(name, email, role)')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const sendReply = async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('ticket_messages').insert({
      ticket_id: selected.id,
      sender_id: user.id,
      content: reply.trim(),
      is_staff: true,
    })
    if (selected.status === 'open') {
      await supabase.from('tickets').update({ status: 'in_progress' }).eq('id', selected.id)
      setSelected({ ...selected, status: 'in_progress' })
    }
    setReply('')
    setSending(false)
    openTicket(selected)
    fetchTickets()
  }

  const changeStatus = async (status: string) => {
    if (!selected) return
    await createClient().from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', selected.id)
    setSelected({ ...selected, status })
    fetchTickets()
  }

  const filtered = tickets.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false
    if (search && !t.subject?.includes(search) && !t.profiles?.name?.includes(search) && !t.profiles?.email?.includes(search)) return false
    return true
  })

  const openCount = tickets.filter(t => t.status === 'open').length
  const progressCount = tickets.filter(t => t.status === 'in_progress').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>تذاكر الدعم</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {tickets.length} تذكرة — <span style={{ color: '#F59E0B' }}>{openCount} مفتوحة</span> — <span style={{ color: '#7C3AED' }}>{progressCount} قيد المعالجة</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'مفتوحة', value: openCount, color: '#F59E0B', icon: <AlertCircle size={18} /> },
          { label: 'قيد المعالجة', value: progressCount, color: '#7C3AED', icon: <Clock size={18} /> },
          { label: 'في الانتظار', value: tickets.filter(t => t.status === 'waiting').length, color: '#60A5FA', icon: <CheckCircle size={18} /> },
          { label: 'مغلقة', value: tickets.filter(t => t.status === 'closed').length, color: '#6B7280', icon: <XCircle size={18} /> },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTopColor: s.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</span>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <input className="input-cosmic" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالموضوع أو المستخدم..." style={{ paddingRight: '40px' }} />
          <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
        <select className="input-cosmic" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '160px' }}>
          <option value="">كل الحالات</option>
          <option value="open">مفتوح</option>
          <option value="in_progress">قيد المعالجة</option>
          <option value="waiting">في الانتظار</option>
          <option value="closed">مغلق</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px' }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '50px', marginBottom: '8px', borderRadius: '8px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Ticket size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>لا توجد تذاكر</p>
          </div>
        ) : (
          <table className="table-cosmic">
            <thead>
              <tr><th>المستخدم</th><th>الموضوع</th><th>القسم</th><th>الأولوية</th><th>الحالة</th><th>التاريخ</th><th>الإجراءات</th></tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const s = STATUS_MAP[t.status] || STATUS_MAP.open
                const priorityColors: Record<string, string> = { urgent: '#EF4444', high: '#F59E0B', medium: '#7C3AED', low: '#6B7280' }
                const priorityLabels: Record<string, string> = { urgent: 'عاجل', high: 'عالية', medium: 'متوسطة', low: 'منخفضة' }
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px' }}>{t.profiles?.name || '—'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.profiles?.email}</div>
                    </td>
                    <td style={{ fontSize: '14px', color: 'var(--text-primary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.department === 'technical' ? 'تقني' : t.department === 'billing' ? 'فواتير' : 'عام'}</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: priorityColors[t.priority] || '#6B7280', background: `${priorityColors[t.priority]}20` }}>
                        {priorityLabels[t.priority] || t.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString('ar-SA')}</td>
                    <td>
                      <button onClick={() => openTicket(t)} style={{ padding: '6px 12px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#A78BFA', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={13} /> فتح
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '620px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{selected.subject}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {selected.profiles?.name} — {new Date(selected.created_at).toLocaleString('ar-SA')}
                </div>
              </div>
              <button onClick={() => { setSelected(null); setMessages([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Status change */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <button key={key} onClick={() => changeStatus(key)} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: selected.status === key ? `1px solid ${val.color}` : '1px solid var(--border)', background: selected.status === key ? val.bg : 'transparent', color: selected.status === key ? val.color : 'var(--text-muted)', transition: 'all 0.2s' }}>
                  {val.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '340px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>لا توجد رسائل بعد</div>
              ) : (
                messages.map(m => (
                  <div key={m.id} style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: m.is_staff ? 'rgba(124,58,237,0.1)' : 'var(--bg-secondary)',
                    borderRight: m.is_staff ? '3px solid var(--accent-violet)' : '3px solid var(--border)',
                    maxWidth: '90%',
                    alignSelf: m.is_staff ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {m.is_staff ? '🔒 أدمن' : `👤 ${m.profiles?.name || 'مستخدم'}`} — {new Date(m.created_at).toLocaleString('ar-SA')}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{m.content}</div>
                  </div>
                ))
              )}
            </div>

            {/* Reply input */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <textarea
                className="input-cosmic"
                rows={2}
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="اكتب ردك هنا..."
                style={{ flex: 1, resize: 'none', fontSize: '14px' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
              />
              <button onClick={sendReply} disabled={sending || !reply.trim()} className="btn-primary" style={{ alignSelf: 'flex-end', padding: '10px 16px' }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
