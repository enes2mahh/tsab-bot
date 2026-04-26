'use client'

import { useState, useEffect } from 'react'
import { Ticket, Plus, Clock, CheckCircle, AlertCircle, XCircle, X, Send, Paperclip, Image as ImageIcon, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FileUpload } from '@/components/FileUpload'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  open: { label: 'مفتوح', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', icon: AlertCircle },
  in_progress: { label: 'قيد المعالجة', color: '#7C3AED', bg: 'rgba(124,58,237,0.15)', icon: Clock },
  waiting: { label: 'بانتظار ردك', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)', icon: Clock },
  closed: { label: 'مغلق', color: '#10B981', bg: 'rgba(16,185,129,0.15)', icon: CheckCircle },
}

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: '#6B7280' },
  medium: { label: 'متوسطة', color: '#7C3AED' },
  high: { label: 'عالية', color: '#F59E0B' },
  urgent: { label: 'عاجل', color: '#EF4444' },
}

interface Ticket {
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
  attachments: any[]
  created_at: string
  profiles?: { name: string | null; email: string }
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  // New ticket form
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [department, setDepartment] = useState('general')
  const [priority, setPriority] = useState('medium')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    setTickets((data || []) as Ticket[])
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [])

  const submitTicket = async () => {
    if (!title.trim() || !body.trim()) return alert('املأ الموضوع والتفاصيل')
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    // 1) Create ticket row
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

    // 2) Create first ticket_message with the body
    const attachments = attachmentUrl ? [{ url: attachmentUrl, type: 'file' }] : []
    await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      is_staff: false,
      content: body,
      attachments,
    })

    setTickets((t) => [ticket, ...t])
    setTitle(''); setBody(''); setAttachmentUrl(''); setShowNew(false)
    setSubmitting(false)
  }

  const openTicket = async (ticket: Ticket) => {
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

  // Realtime subscription for replies
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
    // Update ticket status to 'open' if user is replying (admin will see it)
    await supabase.from('tickets').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', selected.id)

    setReply(''); setReplyAttachment('')
    setSendingReply(false)
    openTicket(selected)
    fetchTickets()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>تذاكر الدعم</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{tickets.length} تذكرة — {tickets.filter(t => t.status !== 'closed').length} نشطة</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus size={16} /> تذكرة جديدة
        </button>
      </div>

      {/* New ticket modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
          <div className="glass" style={{ borderRadius: '20px', padding: '28px', width: '560px', maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>تذكرة دعم جديدة</h3>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الموضوع *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: مشكلة في الاتصال بالواتساب" className="input-cosmic" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>القسم</label>
                  <select className="input-cosmic" value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="general">عام</option>
                    <option value="technical">تقني</option>
                    <option value="billing">فواتير</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الأولوية</label>
                  <select className="input-cosmic" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجل</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>التفاصيل *</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="اشرح مشكلتك بالتفصيل..." className="input-cosmic" style={{ minHeight: '120px', resize: 'vertical' }} />
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
                <button onClick={submitTicket} disabled={submitting || !title.trim() || !body.trim()} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {submitting ? 'جاري الإرسال...' : '📨 إرسال التذكرة'}
                </button>
                <button onClick={() => setShowNew(false)} className="btn-secondary">إلغاء</button>
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
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{selected.subject}</h3>
                  <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', background: STATUS_MAP[selected.status]?.bg, color: STATUS_MAP[selected.status]?.color, fontWeight: 600 }}>
                    {STATUS_MAP[selected.status]?.label}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', background: `${PRIORITY_MAP[selected.priority]?.color}20`, color: PRIORITY_MAP[selected.priority]?.color, fontWeight: 600 }}>
                    {PRIORITY_MAP[selected.priority]?.label}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  افتُحت {new Date(selected.created_at).toLocaleString('ar-SA')}
                </div>
              </div>
              <button onClick={() => { setSelected(null); setMessages([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري التحميل...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد رسائل</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.is_staff ? 'flex-start' : 'flex-end' }}>
                    <div style={{
                      maxWidth: '75%',
                      padding: '12px 14px',
                      borderRadius: m.is_staff ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
                      background: m.is_staff ? 'rgba(124,58,237,0.1)' : 'var(--bg-card)',
                      border: m.is_staff ? '1px solid rgba(124,58,237,0.3)' : '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: '11px', color: m.is_staff ? '#A78BFA' : 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                        {m.is_staff ? '🛟 فريق الدعم' : `👤 أنت`}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{m.content}</div>
                      {m.attachments && Array.isArray(m.attachments) && m.attachments.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {m.attachments.map((att: any, i: number) => {
                            const isImage = /\.(png|jpe?g|gif|webp)$/i.test(att.url || '')
                            return isImage ? (
                              <a key={i} href={att.url} target="_blank" rel="noopener" style={{ display: 'block' }}>
                                <img src={att.url} alt="مرفق" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                              </a>
                            ) : (
                              <a key={i} href={att.url} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--accent-violet-light)', fontSize: '12px', textDecoration: 'none' }}>
                                <FileText size={14} /> فتح المرفق
                              </a>
                            )
                          })}
                        </div>
                      )}
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'left' }}>
                        {new Date(m.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply box */}
            {selected.status !== 'closed' && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                {replyAttachment && (
                  <div style={{ marginBottom: '8px', padding: '8px 10px', background: 'var(--bg-card)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Paperclip size={12} /> ملف مرفق
                    </span>
                    <button onClick={() => setReplyAttachment('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><X size={14} /></button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="اكتب ردّك هنا..."
                    rows={2}
                    className="input-cosmic"
                    style={{ flex: 1, resize: 'none' }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                  />
                  <label style={{ padding: '10px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', cursor: 'pointer', color: '#A78BFA' }} title="إرفاق ملف">
                    <Paperclip size={16} />
                    <input type="file" hidden accept="image/*,application/pdf" onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
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
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
            {selected.status === 'closed' && (
              <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', borderTop: '1px solid var(--border)' }}>
                هذه التذكرة مغلقة. افتح تذكرة جديدة للمتابعة.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tickets list */}
      {loading ? (
        <div className="card">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '70px', marginBottom: '8px', borderRadius: '8px' }} />)}</div>
      ) : tickets.length === 0 ? (
        <div className="card" style={{ borderRadius: '14px', padding: '60px 20px', textAlign: 'center' }}>
          <Ticket size={48} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '4px' }}>لا توجد تذاكر</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>افتح تذكرة دعم إذا واجهت أي مشكلة</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tickets.map((t) => {
            const s = STATUS_MAP[t.status] || STATUS_MAP.open
            const Icon = s.icon
            const p = PRIORITY_MAP[t.priority] || PRIORITY_MAP.medium
            return (
              <div key={t.id} onClick={() => openTicket(t)} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-violet)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={s.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.subject}</span>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', background: s.bg, color: s.color }}>{s.label}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', background: `${p.color}20`, color: p.color, fontWeight: 600 }}>{p.label}</span>
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
    </div>
  )
}
