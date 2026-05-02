'use client'

import { useState, useEffect } from 'react'
import { Ticket, Plus, Clock, CheckCircle, AlertCircle, X, Send, Paperclip, FileText, Filter, ChevronDown, CheckSquare, Square } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FileUpload } from '@/components/FileUpload'
import { WorkflowStates } from '@/components/Tickets/WorkflowStates'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  open:        { label: 'مفتوح',          color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',   icon: AlertCircle },
  in_progress: { label: 'قيد المعالجة',  color: '#7C3AED', bg: 'rgba(124,58,237,0.15)',  icon: Clock },
  waiting:     { label: 'بانتظار ردك',   color: '#60A5FA', bg: 'rgba(96,165,250,0.15)',  icon: Clock },
  closed:      { label: 'مغلق',          color: '#10B981', bg: 'rgba(16,185,129,0.15)', icon: CheckCircle },
}

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low:    { label: 'منخفضة', color: '#6B7280' },
  medium: { label: 'متوسطة', color: '#7C3AED' },
  high:   { label: 'عالية',  color: '#F59E0B' },
  urgent: { label: 'عاجل',   color: '#EF4444' },
}

interface TicketRow {
  id: string
  subject: string
  department: string
  priority: string
  status: string
  created_at: string
  updated_at: string
}

interface TicketMessage {
  id: string
  ticket_id: string
  sender_id: string
  is_staff: boolean
  content: string
  attachments: { url: string; type: string }[]
  created_at: string
  profiles?: { name: string | null; email: string }
}

function getSLAUrgency(createdAt: string, status: string): boolean {
  if (status === 'closed') return false
  return (Date.now() - new Date(createdAt).getTime()) > 24 * 3600000
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<TicketRow | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  // New ticket form
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [department, setDepartment] = useState('general')
  const [priority, setPriority] = useState('medium')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Reply form
  const [reply, setReply] = useState('')
  const [replyAttachment, setReplyAttachment] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const fetchTickets = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    setTickets((data || []) as TicketRow[])
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [])

  // Validate form
  const validate = () => {
    const errs: Record<string, string> = {}
    if (!title.trim() || title.length < 5) errs.title = 'الموضوع يجب أن يكون 5 أحرف على الأقل'
    if (!body.trim() || body.length < 10) errs.body = 'الوصف يجب أن يكون 10 أحرف على الأقل'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submitTicket = async () => {
    if (!validate()) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const { data: ticket, error: tErr } = await supabase
      .from('tickets')
      .insert({ user_id: user.id, subject: title, department, priority, status: 'open' })
      .select()
      .single()

    if (tErr || !ticket) {
      alert(`فشل إنشاء التذكرة: ${tErr?.message || ''}`)
      setSubmitting(false)
      return
    }

    const attachments = attachmentUrl ? [{ url: attachmentUrl, type: 'file' }] : []
    await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      is_staff: false,
      content: body,
      attachments,
    })

    setTickets(t => [ticket as TicketRow, ...t])
    setTitle(''); setBody(''); setAttachmentUrl(''); setShowNew(false); setFormErrors({})
    setSubmitting(false)
  }

  const openTicket = async (ticket: TicketRow) => {
    setSelected(ticket)
    setMessages([])
    setLoadingMessages(true)
    const { data } = await createClient()
      .from('ticket_messages')
      .select('*, profiles(name, email)')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true })
    setMessages((data || []) as TicketMessage[])
    setLoadingMessages(false)
  }

  useEffect(() => {
    if (!selected) return
    const supabase = createClient()
    const channel = supabase
      .channel(`ticket-${selected.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${selected.id}` }, () => {
        openTicket(selected)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id])

  const sendReply = async () => {
    if (!reply.trim() || !selected) return
    setSendingReply(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSendingReply(false); return }

    const attachments = replyAttachment ? [{ url: replyAttachment, type: 'file' }] : []
    await supabase.from('ticket_messages').insert({
      ticket_id: selected.id,
      sender_id: user.id,
      is_staff: false,
      content: reply,
      attachments,
    })
    await supabase.from('tickets').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', selected.id)

    setReply(''); setReplyAttachment('')
    setSendingReply(false)
    openTicket(selected)
    fetchTickets()
  }

  // ── Bulk close ──
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const bulkClose = async () => {
    const supabase = createClient()
    await supabase.from('tickets').update({ status: 'closed' }).in('id', [...selectedIds])
    setTickets(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, status: 'closed' } : t))
    setSelectedIds(new Set())
    setBulkConfirm(false)
  }

  // ── Filtered list ──
  const filtered = tickets.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  const activeCount = tickets.filter(t => t.status !== 'closed').length

  return (
    <div>
      {/* Header */}
      <div className="page-flex-header">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>تذاكر الدعم</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {tickets.length} تذكرة — {activeCount} نشطة
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedIds.size > 0 && (
            <button onClick={() => setBulkConfirm(true)} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Tajawal, sans-serif' }}>
              إغلاق {selectedIds.size} تذكرة
            </button>
          )}
          <button onClick={() => setShowFilters(f => !f)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Filter size={14} /> فلتر <ChevronDown size={12} style={{ transform: showFilters ? 'rotate(180deg)' : 'none' }} />
          </button>
          <button onClick={() => setShowNew(true)} className="btn-primary"><Plus size={16} /> تذكرة جديدة</button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', padding: '12px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <select className="input-cosmic" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '160px', padding: '7px 10px', fontSize: '13px' }}>
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="input-cosmic" value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width: '160px', padding: '7px 10px', fontSize: '13px' }}>
            <option value="">كل الأولويات</option>
            {Object.entries(PRIORITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {(filterStatus || filterPriority) && (
            <button onClick={() => { setFilterStatus(''); setFilterPriority('') }} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontFamily: 'Tajawal, sans-serif' }}>
              مسح الفلاتر
            </button>
          )}
        </div>
      )}

      {/* New ticket modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
          <div className="glass" style={{ borderRadius: '20px', padding: '28px', width: '560px', maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>تذكرة دعم جديدة</h3>
              <button onClick={() => { setShowNew(false); setFormErrors({}) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الموضوع *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: مشكلة في الاتصال بالواتساب" className="input-cosmic" style={{ borderColor: formErrors.title ? '#EF4444' : '' }} />
                {formErrors.title && <p style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px' }}>{formErrors.title}</p>}
              </div>

              <div className="grid-2" style={{ marginBottom: '0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>القسم</label>
                  <select className="input-cosmic" value={department} onChange={e => setDepartment(e.target.value)}>
                    <option value="general">عام</option>
                    <option value="technical">تقني</option>
                    <option value="billing">فواتير</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الأولوية</label>
                  <select className="input-cosmic" value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجل</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>التفاصيل *</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="اشرح مشكلتك بالتفصيل..." className="input-cosmic" style={{ minHeight: '120px', resize: 'vertical', borderColor: formErrors.body ? '#EF4444' : '' }} />
                {formErrors.body && <p style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px' }}>{formErrors.body}</p>}
              </div>

              <FileUpload
                label="إرفاق ملف أو صورة (اختياري)"
                value={attachmentUrl}
                onChange={setAttachmentUrl}
                folder="tickets"
                accept="image/*,application/pdf"
                maxSizeMB={5}
                hint="صور للمشكلة أو PDF — حد أقصى 5MB"
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button onClick={submitTicket} disabled={submitting} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {submitting ? 'جاري الإرسال...' : '📨 إرسال التذكرة'}
                </button>
                <button onClick={() => { setShowNew(false); setFormErrors({}) }} className="btn-secondary">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversation modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
          <div className="glass" style={{ borderRadius: '20px', padding: 0, width: '720px', maxWidth: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{selected.subject}</h3>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', background: STATUS_MAP[selected.status]?.bg, color: STATUS_MAP[selected.status]?.color, fontWeight: 600 }}>
                      {STATUS_MAP[selected.status]?.label}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', background: `${PRIORITY_MAP[selected.priority]?.color}20`, color: PRIORITY_MAP[selected.priority]?.color, fontWeight: 600 }}>
                      {PRIORITY_MAP[selected.priority]?.label}
                    </span>
                  </div>
                </div>
                <button onClick={() => { setSelected(null); setMessages([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}><X size={20} /></button>
              </div>

              {/* Workflow states */}
              <WorkflowStates
                currentStatus={selected.status}
                createdAt={selected.created_at}
                updatedAt={selected.updated_at}
              />
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري التحميل...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد رسائل</div>
              ) : (
                messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.is_staff ? 'flex-start' : 'flex-end' }}>
                    <div style={{
                      maxWidth: '75%',
                      padding: '11px 14px',
                      borderRadius: m.is_staff ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
                      background: m.is_staff ? 'rgba(124,58,237,0.1)' : 'var(--bg-card)',
                      border: m.is_staff ? '1px solid rgba(124,58,237,0.3)' : '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: '11px', color: m.is_staff ? '#A78BFA' : 'var(--text-muted)', marginBottom: '5px', fontWeight: 600 }}>
                        {m.is_staff ? '🛟 فريق الدعم' : '👤 أنت'}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{m.content}</div>
                      {m.attachments?.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {m.attachments.map((att, i) => {
                            const isImage = /\.(png|jpe?g|gif|webp)$/i.test(att.url || '')
                            return isImage ? (
                              <a key={i} href={att.url} target="_blank" rel="noopener">
                                <img src={att.url} alt="مرفق" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                              </a>
                            ) : (
                              <a key={i} href={att.url} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--accent-violet-light)', fontSize: '12px', textDecoration: 'none' }}>
                                <FileText size={13} /> فتح المرفق
                              </a>
                            )
                          })}
                        </div>
                      )}
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '5px', textAlign: 'left' }}>
                        {new Date(m.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply box */}
            {selected.status !== 'closed' ? (
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                {replyAttachment && (
                  <div style={{ marginBottom: '8px', padding: '7px 10px', background: 'var(--bg-card)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}><Paperclip size={11} /> ملف مرفق</span>
                    <button onClick={() => setReplyAttachment('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><X size={13} /></button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="اكتب ردّك هنا..."
                    rows={2}
                    className="input-cosmic"
                    style={{ flex: 1, resize: 'none' }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                  />
                  <label style={{ padding: '10px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', cursor: 'pointer', color: '#A78BFA' }} title="إرفاق ملف">
                    <Paperclip size={15} />
                    <input type="file" hidden accept="image/*,application/pdf" onChange={async e => {
                      const file = e.target.files?.[0]; if (!file) return
                      if (file.size > 5 * 1024 * 1024) return alert('الملف أكبر من 5MB')
                      const supabase = createClient()
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) return
                      const path = `${user.id}/tickets/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
                      const { error } = await supabase.storage.from('media').upload(path, file)
                      if (!error) {
                        const { data } = supabase.storage.from('media').getPublicUrl(path)
                        setReplyAttachment(data.publicUrl)
                      }
                    }} />
                  </label>
                  <button onClick={sendReply} disabled={sendingReply || !reply.trim()} className="btn-primary" style={{ padding: '10px 14px' }}>
                    <Send size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', borderTop: '1px solid var(--border)' }}>
                هذه التذكرة مغلقة. افتح تذكرة جديدة للمتابعة.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tickets list */}
      {loading ? (
        <div className="card">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '70px', marginBottom: '8px', borderRadius: '8px' }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ borderRadius: '14px', padding: '60px 20px', textAlign: 'center' }}>
          <Ticket size={48} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '4px' }}>
            {tickets.length === 0 ? 'لا توجد تذاكر' : 'لا توجد نتائج بهذه الفلاتر'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(t => {
            const s = STATUS_MAP[t.status] || STATUS_MAP.open
            const Icon = s.icon
            const p = PRIORITY_MAP[t.priority] || PRIORITY_MAP.medium
            const isUrgent = getSLAUrgency(t.created_at, t.status)
            const isChecked = selectedIds.has(t.id)

            return (
              <div
                key={t.id}
                className="card"
                style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', transition: 'all 0.15s', borderColor: isChecked ? 'var(--accent-violet)' : isUrgent ? 'rgba(239,68,68,0.4)' : 'var(--border)' }}
                onMouseEnter={e => { if (!isChecked) e.currentTarget.style.borderColor = 'var(--accent-violet)' }}
                onMouseLeave={e => { if (!isChecked) e.currentTarget.style.borderColor = isUrgent ? 'rgba(239,68,68,0.4)' : 'var(--border)' }}
              >
                {/* Checkbox */}
                <button
                  onClick={e => { e.stopPropagation(); toggleSelect(t.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isChecked ? 'var(--accent-violet)' : 'var(--text-muted)', padding: '2px', marginTop: '2px', flexShrink: 0 }}
                >
                  {isChecked ? <CheckSquare size={18} color="var(--accent-violet)" /> : <Square size={18} />}
                </button>

                {/* Status icon */}
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color={s.color} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => openTicket(t)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.subject}</span>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', background: s.bg, color: s.color }}>{s.label}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', background: `${p.color}20`, color: p.color, fontWeight: 600 }}>{p.label}</span>
                    {isUrgent && <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600 }}>⚠ تجاوز 24 ساعة</span>}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    آخر تحديث: {new Date(t.updated_at).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bulk close confirm */}
      <ConfirmDialog
        open={bulkConfirm}
        title={`إغلاق ${selectedIds.size} تذكرة`}
        description="سيتم إغلاق جميع التذاكر المحددة. هل أنت متأكد؟"
        confirmLabel="إغلاق الكل"
        variant="warning"
        onConfirm={bulkClose}
        onCancel={() => setBulkConfirm(false)}
      />
    </div>
  )
}
