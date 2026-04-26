'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Download, Filter, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

export default function ReportsPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const [typeData, setTypeData] = useState<any[]>([])
  const [filter, setFilter] = useState({ direction: '', status: '', device_id: '' })
  const [devices, setDevices] = useState<any[]>([])
  const [period, setPeriod] = useState<7 | 30 | 90>(7)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('devices').select('id, name'),
    ]).then(([m, d]) => {
      const msgs = m.data || []
      setMessages(msgs)
      setDevices(d.data || [])

      // Build 7-day chart
      const days: Record<string, { day: string; sent: number; received: number }> = {}
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('ar-SA', { weekday: 'short' })
        days[d.toDateString()] = { day: key, sent: 0, received: 0 }
      }
      msgs.forEach(msg => {
        const key = new Date(msg.created_at).toDateString()
        if (days[key]) {
          if (msg.direction === 'outgoing') days[key].sent++
          else days[key].received++
        }
      })
      setChartData(Object.values(days))

      // Type distribution
      const types: Record<string, number> = {}
      msgs.forEach(msg => { types[msg.type] = (types[msg.type] || 0) + 1 })
      setTypeData(Object.entries(types).map(([name, value]) => ({ name: name === 'text' ? 'نص' : name === 'image' ? 'صورة' : name === 'video' ? 'فيديو' : name, value })))
      setLoading(false)
    })
  }, [])

  const COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#2563EB', '#EF4444']

  const filtered = messages.filter(m => {
    if (filter.direction && m.direction !== filter.direction) return false
    if (filter.status && m.status !== filter.status) return false
    if (filter.device_id && m.device_id !== filter.device_id) return false
    return true
  })

  const exportCSV = () => {
    const csv = ['الرقم,الاتجاه,النوع,الحالة,التاريخ',
      ...filtered.map(m => `${m.to_number || m.from_number || '-'},${m.direction},${m.type},${m.status},${new Date(m.created_at).toLocaleDateString('ar-SA')}`)
    ].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'messages.csv'; a.click()
  }

  const sent = messages.filter(m => m.direction === 'outgoing').length
  const received = messages.filter(m => m.direction === 'incoming').length
  const failed = messages.filter(m => m.status === 'failed').length
  const successRate = sent > 0 ? Math.round(((sent - failed) / sent) * 100) : 100

  return (
    <div>
      <div className="page-flex-header">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>التقارير والتحليلات</h2>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            {([7, 30, 90] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: '4px 12px', borderRadius: '8px', border: `1px solid ${period === p ? 'var(--accent-violet)' : 'var(--border)'}`, background: period === p ? 'rgba(124,58,237,0.15)' : 'transparent', color: period === p ? '#A78BFA' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
                {p} يوم
              </button>
            ))}
          </div>
        </div>
        <button onClick={exportCSV} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Download size={16} /> تصدير CSV</button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {[
          { label: 'مرسلة', value: sent, color: '#2563EB', icon: <MessageSquare size={18} /> },
          { label: 'واردة', value: received, color: '#10B981', icon: <MessageSquare size={18} /> },
          { label: 'فشلت', value: failed, color: '#EF4444', icon: <XCircle size={18} /> },
          { label: 'نسبة النجاح', value: `${successRate}%`, color: '#10B981', icon: <CheckCircle size={18} /> },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTopColor: s.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>نشاط الرسائل ({period} يوم)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
              <Line type="monotone" dataKey="sent" stroke="#7C3AED" name="مرسلة" strokeWidth={2} dot={{ fill: '#7C3AED', r: 4 }} />
              <Line type="monotone" dataKey="received" stroke="#10B981" name="واردة" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>أنواع الرسائل</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* Messages table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>سجل الرسائل</span>
          <select className="input-cosmic" value={filter.direction} onChange={e => setFilter({ ...filter, direction: e.target.value })} style={{ width: '120px', padding: '6px 10px', fontSize: '12px' }}>
            <option value="">الكل</option>
            <option value="outgoing">صادرة</option>
            <option value="incoming">واردة</option>
          </select>
          <select className="input-cosmic" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} style={{ width: '120px', padding: '6px 10px', fontSize: '12px' }}>
            <option value="">كل الحالات</option>
            <option value="sent">مرسل</option>
            <option value="failed">فشل</option>
            <option value="pending">معلق</option>
          </select>
          <select className="input-cosmic" value={filter.device_id} onChange={e => setFilter({ ...filter, device_id: e.target.value })} style={{ width: '150px', padding: '6px 10px', fontSize: '12px' }}>
            <option value="">كل الأجهزة</option>
            {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="responsive-table-wrap">
        <table className="table-cosmic">
          <thead><tr><th>الرقم</th><th>الاتجاه</th><th>النوع</th><th>المحتوى</th><th>الحالة</th><th>التاريخ</th></tr></thead>
          <tbody>
            {filtered.slice(0, 50).map(msg => (
              <tr key={msg.id}>
                <td style={{ fontSize: '13px', direction: 'ltr' }}>{msg.to_number || msg.from_number || '-'}</td>
                <td><span className={`badge badge-${msg.direction === 'outgoing' ? 'blue' : 'emerald'}`}>{msg.direction === 'outgoing' ? 'صادر' : 'وارد'}</span></td>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{msg.type}</td>
                <td style={{ fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {typeof msg.content === 'object' ? (msg.content?.text || '-') : msg.content}
                </td>
                <td><span className={`badge badge-${msg.status === 'sent' || msg.status === 'delivered' || msg.status === 'read' ? 'emerald' : msg.status === 'failed' ? 'red' : 'yellow'}`}>{msg.status === 'sent' ? 'مرسل' : msg.status === 'failed' ? 'فشل' : msg.status === 'delivered' ? 'وصل' : msg.status === 'read' ? 'مقروء' : 'معلق'}</span></td>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(msg.created_at).toLocaleDateString('ar-SA')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>لا توجد رسائل</div>}
      </div>
    </div>
  )
}
