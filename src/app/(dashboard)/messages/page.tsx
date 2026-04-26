'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Search, Download, ChevronDown, ArrowLeft, ArrowRight, Bot, Sparkles, MessageCircle, Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { exportData, type ExportFormat } from '@/lib/export'

interface Message {
  id: string
  device_id: string
  user_id: string
  direction: 'incoming' | 'outgoing'
  to_number: string | null
  from_number: string | null
  contact_name: string | null
  type: string
  content: any
  status: string
  metadata: any
  created_at: string
  devices?: { name: string; phone: string | null }
}

const SOURCE_BADGES: Record<string, { label: string; icon: any; color: string }> = {
  ai: { label: 'AI', icon: <Bot size={10} />, color: '#A78BFA' },
  faq: { label: 'FAQ', icon: <Sparkles size={10} />, color: '#10B981' },
  greeting: { label: 'تحية', icon: <MessageCircle size={10} />, color: '#F59E0B' },
  campaign: { label: 'حملة', icon: <Megaphone size={10} />, color: '#60A5FA' },
}

function getMessageText(content: any): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (typeof content === 'object') return content.text || content.caption || ''
  return ''
}

function getMessageTypeLabel(type: string): string {
  const map: Record<string, string> = {
    text: 'نص', image: 'صورة', video: 'فيديو', document: 'مستند',
    audio: 'صوت', location: 'موقع', contact: 'جهة اتصال', sticker: 'ملصق',
    button: 'أزرار', list: 'قائمة',
  }
  return map[type] || type
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [exportOpen, setExportOpen] = useState(false)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('messages')
        .select('*, devices(name, phone)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      setMessages((data || []) as Message[])
      setLoading(false)
    }
    fetchMessages()
  }, [page])

  const filtered = messages.filter((m) => {
    const text = getMessageText(m.content)
    const phone = m.direction === 'outgoing' ? m.to_number : m.from_number
    const matchSearch = !search || phone?.includes(search) || text.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'incoming' && m.direction === 'incoming') ||
      (filter === 'outgoing' && m.direction === 'outgoing') ||
      (filter === 'sent' && m.status === 'sent') ||
      (filter === 'failed' && m.status === 'failed') ||
      (filter === 'ai' && m.metadata?.source === 'ai') ||
      (filter === 'faq' && m.metadata?.source === 'faq')
    return matchSearch && matchFilter
  })

  const handleExport = (format: ExportFormat) => {
    setExportOpen(false)
    exportData(
      filtered,
      [
        { header: 'Direction', accessor: (m) => m.direction === 'outgoing' ? 'Outgoing' : 'Incoming' },
        { header: 'Phone', accessor: (m) => m.direction === 'outgoing' ? (m.to_number || '') : (m.from_number || '') },
        { header: 'Contact Name', accessor: (m) => m.contact_name || '' },
        { header: 'Device', accessor: (m) => m.devices?.name || '' },
        { header: 'Type', accessor: (m) => m.type },
        { header: 'Content', accessor: (m) => getMessageText(m.content) },
        { header: 'Status', accessor: (m) => m.status },
        { header: 'Source', accessor: (m) => m.metadata?.source || '' },
        { header: 'Date', accessor: (m) => new Date(m.created_at).toISOString() },
      ],
      `tsab-messages-${new Date().toISOString().slice(0, 10)}`,
      format,
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>سجل الرسائل</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{messages.length} رسالة في هذه الصفحة</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
        <div className="filter-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
            <input
              type="text"
              placeholder="بحث برقم أو محتوى..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-cosmic"
              style={{ paddingRight: '40px' }}
            />
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-cosmic" style={{ width: '180px' }}>
            <option value="all">كل الرسائل</option>
            <option value="outgoing">المُرسلة</option>
            <option value="incoming">المستلمة</option>
            <option value="sent">تم الإرسال</option>
            <option value="failed">فشلت</option>
            <option value="ai">رد AI</option>
            <option value="faq">رد FAQ</option>
          </select>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setExportOpen(!exportOpen)} className="btn-secondary">
              <Download size={15} /> تصدير ({filtered.length}) <ChevronDown size={13} />
            </button>
            {exportOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100 }}>
                <button onClick={() => handleExport('csv')} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'Tajawal, sans-serif', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>📄 CSV</button>
                <button onClick={() => handleExport('xlsx')} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'Tajawal, sans-serif', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border)' }}>📊 Excel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages — table on desktop, cards on mobile */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px' }}>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '40px', marginBottom: '8px', borderRadius: '8px' }} />)}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <MessageSquare size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>لا توجد رسائل</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>ستظهر رسائلك هنا بعد إرسال أو استلام أول رسالة</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hide-on-mobile responsive-table-wrap">
              <table className="table-cosmic">
                <thead>
                  <tr><th>الاتجاه</th><th>الرقم</th><th>الاسم</th><th>الجهاز</th><th>النوع</th><th>المحتوى</th><th>المصدر</th><th>الحالة</th><th>الوقت</th></tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const text = getMessageText(m.content)
                    const phone = m.direction === 'outgoing' ? m.to_number : m.from_number
                    const source = m.metadata?.source ? SOURCE_BADGES[m.metadata.source] : null
                    return (
                      <tr key={m.id}>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                            background: m.direction === 'outgoing' ? 'rgba(124,58,237,0.15)' : 'rgba(16,185,129,0.15)',
                            color: m.direction === 'outgoing' ? 'var(--accent-violet-light)' : '#10B981' }}>
                            {m.direction === 'outgoing' ? '↗ صادر' : '↙ وارد'}
                          </span>
                        </td>
                        <td style={{ direction: 'ltr', textAlign: 'right', fontSize: '13px' }}>{phone || '-'}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.contact_name || '-'}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.devices?.name || '-'}</td>
                        <td style={{ fontSize: '12px' }}>{getMessageTypeLabel(m.type)}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={text}>{text || '—'}</td>
                        <td>
                          {source && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, background: `${source.color}20`, color: source.color }}>
                              {source.icon} {source.label}
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                            background: m.status === 'sent' ? 'rgba(16,185,129,0.15)' : m.status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                            color: m.status === 'sent' ? '#10B981' : m.status === 'failed' ? '#EF4444' : '#F59E0B' }}>
                            {m.status === 'sent' ? 'تم' : m.status === 'failed' ? 'فشل' : m.status === 'pending' ? 'معلق' : m.status === 'read' ? 'مقروء' : m.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(m.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="show-on-mobile" style={{ padding: '8px' }}>
              {filtered.map((m) => {
                const text = getMessageText(m.content)
                const phone = m.direction === 'outgoing' ? m.to_number : m.from_number
                const source = m.metadata?.source ? SOURCE_BADGES[m.metadata.source] : null
                return (
                  <div key={m.id} style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700,
                        background: m.direction === 'outgoing' ? 'rgba(124,58,237,0.15)' : 'rgba(16,185,129,0.15)',
                        color: m.direction === 'outgoing' ? 'var(--accent-violet-light)' : '#10B981' }}>
                        {m.direction === 'outgoing' ? '↗ صادر' : '↙ وارد'}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(m.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div style={{ direction: 'ltr', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{phone || '-'}</div>
                    {m.contact_name && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{m.contact_name}</div>}
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{text || '—'}</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>{getMessageTypeLabel(m.type)}</span>
                      {source && (
                        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, background: `${source.color}20`, color: source.color }}>
                          {source.label}
                        </span>
                      )}
                      <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px',
                        background: m.status === 'sent' ? 'rgba(16,185,129,0.15)' : m.status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: m.status === 'sent' ? '#10B981' : m.status === 'failed' ? '#EF4444' : '#F59E0B' }}>
                        {m.status === 'sent' ? '✓' : m.status === 'failed' ? '✗' : m.status === 'pending' ? '⏳' : '✓✓'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {messages.length === PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-secondary"><ArrowRight size={14} /> السابق</button>
          <span style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '13px' }}>صفحة {page + 1}</span>
          <button onClick={() => setPage(page + 1)} className="btn-secondary">التالي <ArrowLeft size={14} /></button>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .show-on-mobile { display: none !important; }
        }
        .responsive-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>
    </div>
  )
}
