'use client'

import { useState, useEffect } from 'react'
import { Ticket, Plus, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  open:       { label: 'مفتوح',    color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  icon: AlertCircle },
  in_progress:{ label: 'قيد المعالجة', color: '#7C3AED', bg: 'rgba(124,58,237,0.15)', icon: Clock },
  resolved:   { label: 'محلول',   color: '#10B981', bg: 'rgba(16,185,129,0.15)', icon: CheckCircle },
  closed:     { label: 'مغلق',    color: '#6B7280', bg: 'rgba(107,114,128,0.15)', icon: XCircle },
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setTickets(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const submitTicket = async () => {
    if (!title || !body) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('tickets').insert({ user_id: user.id, subject: title, message: body, status: 'open' }).select().single()
    if (data) { setTickets([data, ...tickets]); setTitle(''); setBody(''); setShowNew(false) }
    setSubmitting(false)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Ticket size={24} color="var(--accent-violet)" /> التذاكر
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>تواصل مع فريق الدعم</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> تذكرة جديدة
        </button>
      </div>

      {/* New Ticket Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ borderRadius: '20px', padding: '32px', width: '520px', maxWidth: '90vw' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>تذكرة دعم جديدة</h3>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الموضوع</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مشكلة في الاتصال..." className="input-cosmic" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>التفاصيل</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="اشرح مشكلتك بالتفصيل..." className="input-cosmic" style={{ minHeight: '120px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={submitTicket} disabled={submitting} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                {submitting ? 'جاري الإرسال...' : 'إرسال التذكرة'}
              </button>
              <button onClick={() => setShowNew(false)} className="btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Tickets List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>جاري التحميل...</div>
      ) : tickets.length === 0 ? (
        <div className="glass" style={{ borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
          <Ticket size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>لا توجد تذاكر</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>افتح تذكرة دعم إذا واجهت أي مشكلة</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tickets.map(t => {
            const s = STATUS_MAP[t.status] || STATUS_MAP.open
            const Icon = s.icon
            return (
              <div key={t.id} className="glass" style={{ borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={s.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.subject}</span>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.message}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {new Date(t.created_at).toLocaleString('ar-SA')}
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
