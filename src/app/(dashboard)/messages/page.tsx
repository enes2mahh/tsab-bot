'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send, Download, Search, Filter, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchMessages = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('messages')
        .select('*, devices(name, phone)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      setMessages(data || [])
      setLoading(false)
    }
    fetchMessages()
  }, [])

  const filtered = messages.filter(m => {
    const matchSearch = !search || m.to?.includes(search) || m.content?.includes(search)
    const matchFilter = filter === 'all' || m.status === filter || m.direction === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={24} color="var(--accent-violet)" /> سجل الرسائل
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>تتبع كل الرسائل المُرسلة والمستلمة</p>
      </div>

      {/* Filters */}
      <div className="glass" style={{ borderRadius: '16px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="ابحث برقم أو محتوى..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-cosmic"
            style={{ paddingRight: '40px', width: '100%' }}
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input-cosmic"
          style={{ minWidth: '140px' }}
        >
          <option value="all">كل الرسائل</option>
          <option value="outgoing">المُرسلة</option>
          <option value="incoming">المستلمة</option>
          <option value="sent">تم الإرسال</option>
          <option value="failed">فشل</option>
        </select>
        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={16} /> تصدير
        </button>
      </div>

      {/* Messages Table */}
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <MessageSquare size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>لا توجد رسائل بعد</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>ستظهر رسائلك هنا بعد إرسال أول رسالة</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['الرقم', 'الجهاز', 'النوع', 'المحتوى', 'الحالة', 'الوقت'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(msg => (
                <tr key={msg.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-primary)', direction: 'ltr' }}>
                    {msg.direction === 'outgoing' ? msg.to : msg.from_number}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{msg.devices?.name || '-'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: msg.direction === 'outgoing' ? 'rgba(124,58,237,0.15)' : 'rgba(16,185,129,0.15)',
                      color: msg.direction === 'outgoing' ? 'var(--accent-violet-light)' : '#10B981' }}>
                      {msg.direction === 'outgoing' ? 'صادر' : 'وارد'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.content || '-'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                      background: msg.status === 'sent' ? 'rgba(16,185,129,0.15)' : msg.status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                      color: msg.status === 'sent' ? '#10B981' : msg.status === 'failed' ? '#EF4444' : '#F59E0B' }}>
                      {msg.status === 'sent' ? 'تم' : msg.status === 'failed' ? 'فشل' : msg.status === 'pending' ? 'معلق' : msg.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(msg.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
