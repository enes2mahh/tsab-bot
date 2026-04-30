'use client'

import { useState, useEffect, useRef } from 'react'
import { Smartphone, MessageSquare, Megaphone, CheckCircle, Crown, Inbox, TrendingUp, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color: string
  trend?: number
  loading?: boolean
}

function StatCard({ icon, label, value, sub, color, trend, loading }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const isNumber = typeof value === 'number'

  useEffect(() => {
    if (!isNumber || loading) return
    let start = 0
    const end = value as number
    const duration = 1200
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [value, isNumber, loading])

  return (
    <div
      className="stat-card"
      style={{ borderTopColor: color }}
    >
      {loading ? (
        <>
          <div className="skeleton" style={{ height: '20px', width: '60%', marginBottom: '12px' }} />
          <div className="skeleton" style={{ height: '36px', width: '40%', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '16px', width: '80%' }} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color,
              }}
            >
              {icon}
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {isNumber ? displayValue.toLocaleString('ar') : value}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {trend !== undefined && (
              <span
                style={{
                  fontSize: '12px',
                  color: trend >= 0 ? '#10B981' : '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(trend)}%
              </span>
            )}
            {sub && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</span>}
          </div>
        </>
      )}
    </div>
  )
}

interface DashboardStats {
  devicesConnected: number
  devicesTotal: number
  messagesToday: number
  campaignsActive: number
  campaignsTotal: number
  successRate: number
  planName: string
  daysRemaining: number
  messagesUsed: number
  messagesLimit: number
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [devicesRes, campaignsRes, subsRes, messagesRes, msgTodayRes] = await Promise.all([
        supabase.from('devices').select('status').eq('user_id', user.id),
        supabase.from('campaigns').select('status, sent_count, failed_count, total_count').eq('user_id', user.id),
        supabase.from('subscriptions').select('*, plans(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('messages').select('id, from_number, content, direction, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', today.toISOString()),
      ])

      const devices = devicesRes.data || []
      const campaigns = campaignsRes.data || []
      const subscription = subsRes.data
      const messages = messagesRes.data || []

      const totalSent = campaigns.reduce((s: number, c: any) => s + (c.sent_count || 0), 0)
      const totalRecipients = campaigns.reduce((s: number, c: any) => s + (c.total_count || 0), 0)
      const successRate = totalRecipients > 0 ? Math.round((totalSent / totalRecipients) * 100) : 0

      const daysRemaining = subscription
        ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86400000))
        : 0

      setStats({
        devicesConnected: devices.filter((d: any) => d.status === 'connected').length,
        devicesTotal: devices.length,
        messagesToday: msgTodayRes.count || 0,
        campaignsActive: campaigns.filter((c: any) => c.status === 'running').length,
        campaignsTotal: campaigns.length,
        successRate,
        planName: (subscription?.plans as any)?.name || 'لا يوجد',
        daysRemaining,
        messagesUsed: subscription?.messages_used || 0,
        messagesLimit: subscription?.messages_limit || 0,
      })

      setRecentMessages(messages)

      const campaignsRes2 = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentCampaigns(campaignsRes2.data || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  const statCards = [
    {
      icon: <Smartphone size={18} />,
      label: 'الأجهزة',
      value: loading ? 0 : stats?.devicesConnected ?? 0,
      sub: `من ${stats?.devicesTotal ?? 0} إجمالي`,
      color: '#10B981',
      trend: 0,
    },
    {
      icon: <MessageSquare size={18} />,
      label: 'الرسائل اليوم',
      value: loading ? 0 : stats?.messagesToday ?? 0,
      sub: 'رسالة اليوم',
      color: '#2563EB',
    },
    {
      icon: <Megaphone size={18} />,
      label: 'الحملات النشطة',
      value: loading ? 0 : stats?.campaignsActive ?? 0,
      sub: `من ${stats?.campaignsTotal ?? 0} إجمالي`,
      color: '#7C3AED',
    },
    {
      icon: <CheckCircle size={18} />,
      label: 'نسبة التسليم',
      value: loading ? '...' : stats?.successRate !== undefined
        ? (stats.successRate > 0 ? `${stats.successRate}%` : '—')
        : '—',
      sub: 'نسبة تسليم الحملات',
      color: '#10B981',
    },
    {
      icon: <Crown size={18} />,
      label: 'الخطة الحالية',
      value: loading ? '...' : stats?.planName ?? '...',
      sub: `${stats?.daysRemaining ?? 0} يوم متبقي`,
      color: '#F59E0B',
    },
    {
      icon: <Inbox size={18} />,
      label: 'الرسائل المتبقية',
      value: loading ? 0 : Math.max(0, (stats?.messagesLimit ?? 0) - (stats?.messagesUsed ?? 0)),
      sub: `من ${stats?.messagesLimit?.toLocaleString('ar') ?? 0}`,
      color: '#64748B',
    },
  ]

  const colorClasses = ['emerald', 'blue', 'violet', 'emerald', 'gold', 'gray']

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          مرحباً 👋
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          هذا ملخص نشاطك اليوم في منصة Sends Bot
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} loading={loading} />
        ))}
      </div>

      {/* Tables */}
      <div className="grid-2">
        {/* Recent Messages */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            آخر الرسائل
          </h3>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '40px', marginBottom: '8px', borderRadius: '8px' }} />
            ))
          ) : recentMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              لا توجد رسائل بعد
            </div>
          ) : (
            <div className="responsive-table-wrap">
              <table className="table-cosmic">
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>المحتوى</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMessages.map((msg) => (
                    <tr key={msg.id}>
                      <td style={{ fontSize: '13px' }}>{msg.to_number || msg.from_number || '-'}</td>
                      <td style={{ fontSize: '13px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {typeof msg.content === 'object' ? (msg.content?.text || '-') : msg.content}
                      </td>
                      <td>
                        <span className={`badge badge-${msg.status === 'sent' ? 'emerald' : msg.status === 'failed' ? 'red' : 'yellow'}`}>
                          {msg.status === 'sent' ? 'مرسل' : msg.status === 'failed' ? 'فشل' : 'معلق'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Campaigns */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            آخر الحملات
          </h3>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '40px', marginBottom: '8px', borderRadius: '8px' }} />
            ))
          ) : recentCampaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              لا توجد حملات بعد
            </div>
          ) : (
            <div className="responsive-table-wrap">
              <table className="table-cosmic">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>المرسل</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCampaigns.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontSize: '13px' }}>{c.name}</td>
                      <td style={{ fontSize: '13px' }}>{c.sent_count}/{c.total_count}</td>
                      <td>
                        <span className={`badge badge-${
                          c.status === 'completed' ? 'emerald' :
                          c.status === 'running' ? 'blue' :
                          c.status === 'failed' ? 'red' : 'yellow'
                        }`}>
                          {c.status === 'completed' ? 'مكتملة' :
                           c.status === 'running' ? 'تعمل' :
                           c.status === 'draft' ? 'مسودة' : c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
