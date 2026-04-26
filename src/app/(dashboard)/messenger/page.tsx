'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Search, MessageSquare, Smartphone, Phone, ChevronRight, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Device { id: string; name: string; phone: string | null; status: string }
interface Conversation {
  contactPhone: string
  contactName: string | null
  lastMessage: string
  lastTimestamp: string
  unreadCount: number
  deviceId: string
  deviceName: string
}
interface Message {
  id: string
  device_id: string
  direction: 'incoming' | 'outgoing'
  from_number: string | null
  to_number: string | null
  content: any
  status: string
  created_at: string
  metadata?: any
}

export default function MessengerPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedContact, setSelectedContact] = useState<{ phone: string; name: string | null; deviceId: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const [draftText, setDraftText] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userIdRef = useRef<string | null>(null)

  // Load devices
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      userIdRef.current = user.id
      supabase.from('devices').select('id, name, phone, status').eq('user_id', user.id).then(({ data }) => {
        const list = (data || []) as Device[]
        setDevices(list)
        if (list.length && !selectedDeviceId) setSelectedDeviceId(list[0].id)
      })
    })
  }, [])

  // Load conversations for selected device(s)
  const fetchConversations = async () => {
    if (!userIdRef.current) return
    const supabase = createClient()
    setLoading(true)

    // Get last 1000 messages for the user across all their devices
    let query = supabase
      .from('messages')
      .select('*, devices!inner(id, name, user_id)')
      .order('created_at', { ascending: false })
      .limit(2000)

    if (selectedDeviceId) {
      query = query.eq('device_id', selectedDeviceId)
    } else {
      query = query.eq('devices.user_id', userIdRef.current)
    }

    const { data: messages } = await query

    // Group by contact phone (the OTHER party — from_number for incoming, to_number for outgoing)
    const map = new Map<string, Conversation>()
    for (const m of messages || []) {
      const otherPhone = m.direction === 'incoming' ? m.from_number : m.to_number
      if (!otherPhone) continue
      const key = `${m.device_id}|${otherPhone}`
      const text = typeof m.content === 'object' ? (m.content?.text || '') : String(m.content || '')
      if (!map.has(key)) {
        map.set(key, {
          contactPhone: otherPhone,
          contactName: (m as any).contact_name || null,
          lastMessage: text || '(رسالة وسائط)',
          lastTimestamp: m.created_at,
          unreadCount: 0,
          deviceId: m.device_id,
          deviceName: (m as any).devices?.name || 'جهاز',
        })
      }
    }

    setConversations(Array.from(map.values()).sort((a, b) =>
      new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    ))
    setLoading(false)
  }

  useEffect(() => {
    fetchConversations()

    // Realtime: refresh on new messages
    const supabase = createClient()
    const channel = supabase
      .channel('messenger-conversations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations()
        // Also refresh open conversation
        if (selectedContact) loadMessages(selectedContact.deviceId, selectedContact.phone)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId])

  const loadMessages = async (deviceId: string, phone: string) => {
    setLoadingMessages(true)
    const { data } = await createClient()
      .from('messages')
      .select('*')
      .eq('device_id', deviceId)
      .or(`from_number.eq.${phone},to_number.eq.${phone}`)
      .order('created_at', { ascending: true })
      .limit(500)
    setMessages((data || []) as Message[])
    setLoadingMessages(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const openConversation = (conv: Conversation) => {
    setSelectedContact({ phone: conv.contactPhone, name: conv.contactName, deviceId: conv.deviceId })
    loadMessages(conv.deviceId, conv.contactPhone)
    setShowSidebar(false) // mobile
  }

  const sendMessage = async () => {
    if (!draftText.trim() || !selectedContact) return
    setSending(true)
    try {
      const r = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: selectedContact.deviceId,
          phone: selectedContact.phone,
          content: draftText.trim(),
        }),
      })
      if (r.ok) {
        setDraftText('')
        // Reload messages
        loadMessages(selectedContact.deviceId, selectedContact.phone)
      } else {
        const err = await r.json()
        alert(err.error || 'فشل الإرسال')
      }
    } catch {
      alert('تعذر الإرسال')
    }
    setSending(false)
  }

  const filtered = conversations.filter((c) =>
    !search ||
    c.contactPhone.includes(search) ||
    c.contactName?.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  )

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const oneDay = 24 * 60 * 60 * 1000
    if (diffMs < oneDay && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    }
    if (diffMs < 7 * oneDay) {
      return d.toLocaleDateString('ar-SA', { weekday: 'short' })
    }
    return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })
  }

  if (devices.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <MessageSquare size={56} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>لا يوجد جهاز مربوط</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>اربط جهاز واتساب لتظهر محادثاتك هنا</p>
        <a href="/devices" className="btn-primary">
          <Smartphone size={16} /> ربط جهاز
        </a>
      </div>
    )
  }

  return (
    <div style={{
      height: 'calc(100vh - 90px)',
      display: 'flex',
      borderRadius: '14px',
      overflow: 'hidden',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      direction: 'rtl',
    }}>
      {/* === Sidebar: conversations list === */}
      <div style={{
        width: '340px',
        flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-secondary)',
      }} className={!showSidebar ? 'mobile-hide' : ''}>

        {/* Device filter */}
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
          <select className="input-cosmic" value={selectedDeviceId} onChange={(e) => { setSelectedDeviceId(e.target.value); setSelectedContact(null) }} style={{ fontSize: '13px' }}>
            <option value="">كل الأجهزة</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.name}{d.phone ? ` (${d.phone})` : ''} {d.status === 'connected' ? '✅' : '❌'}</option>
            ))}
          </select>
          <div style={{ position: 'relative', marginTop: '8px' }}>
            <input className="input-cosmic" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." style={{ paddingRight: '36px', fontSize: '13px' }} />
            <Search size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Conversations */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '60px', margin: '8px 12px', borderRadius: '8px' }} />)
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              لا توجد محادثات بعد
            </div>
          ) : (
            filtered.map((c) => {
              const isActive = selectedContact?.phone === c.contactPhone && selectedContact?.deviceId === c.deviceId
              return (
                <div
                  key={`${c.deviceId}-${c.contactPhone}`}
                  onClick={() => openConversation(c)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#A78BFA', fontWeight: 700, fontSize: '14px' }}>
                        {(c.contactName || c.contactPhone)[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'right' }}>
                          {c.contactName || c.contactPhone}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.lastMessage}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {formatTime(c.lastTimestamp)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* === Chat thread === */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className={showSidebar ? 'mobile-hide-thread' : ''}>
        {selectedContact ? (
          <>
            {/* Thread header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)' }}>
              <button onClick={() => setShowSidebar(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }} className="show-on-mobile">
                <ArrowLeft size={18} />
              </button>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA', fontWeight: 700, fontSize: '14px' }}>
                {(selectedContact.name || selectedContact.phone)[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', direction: 'ltr', textAlign: 'right' }}>
                  {selectedContact.name || selectedContact.phone}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', direction: 'ltr', textAlign: 'right' }}>
                  +{selectedContact.phone}
                </div>
              </div>
              <a href={`https://wa.me/${selectedContact.phone}`} target="_blank" style={{ padding: '6px 12px', background: 'rgba(37,211,102,0.15)', color: '#25D366', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={12} /> WA
              </a>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري التحميل...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد رسائل</div>
              ) : (
                messages.map((m) => {
                  const text = typeof m.content === 'object' ? (m.content?.text || '') : String(m.content || '')
                  const isOut = m.direction === 'outgoing'
                  const sourceLabel = m.metadata?.source === 'ai' ? '🤖 AI' : m.metadata?.source === 'faq' ? '⚡ FAQ' : m.metadata?.source === 'greeting' ? '👋 ' : ''
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: isOut ? 'flex-start' : 'flex-end', flexDirection: 'row' }}>
                      <div style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: isOut ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                        background: isOut ? 'rgba(124,58,237,0.18)' : 'var(--bg-card)',
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordWrap: 'break-word', lineHeight: 1.5 }}>{text}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <span>{sourceLabel}</span>
                          <span>{new Date(m.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', background: 'var(--bg-secondary)' }}>
              <textarea
                className="input-cosmic"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="اكتب رسالة..."
                rows={1}
                style={{ flex: 1, resize: 'none', maxHeight: '120px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
              <button onClick={sendMessage} disabled={sending || !draftText.trim()} className="btn-primary" style={{ padding: '0 16px' }}>
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '40px' }}>
            <MessageSquare size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>اختر محادثة لعرضها</h3>
            <p style={{ fontSize: '13px' }}>كل محادثاتك على واتساب من المنصة مباشرةً</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media (max-width: 720px) {
          .mobile-hide { display: none !important; }
          .mobile-hide-thread { display: none !important; }
        }
        @media (min-width: 721px) {
          .show-on-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}
