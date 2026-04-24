'use client'

import { useState, useEffect } from 'react'
import { Users, Smartphone, MessageSquare, DollarSign, TrendingUp, Activity, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, newToday: 0, activeDevices: 0, totalDevices: 0, messagesToday: 0, messagesMonth: 0, revenueToday: 0, revenueMonth: 0 })
  const [planDist, setPlanDist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const today = new Date().toISOString().slice(0, 10)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    Promise.all([
      supabase.from('profiles').select('id, created_at', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }).gte('created_at', today),
      supabase.from('devices').select('id, status', { count: 'exact' }),
      supabase.from('devices').select('id', { count: 'exact' }).eq('status', 'connected'),
      supabase.from('messages').select('id', { count: 'exact' }).gte('created_at', today),
      supabase.from('messages').select('id', { count: 'exact' }).gte('created_at', monthStart),
      supabase.from('subscriptions').select('plan_id, plans(name_ar, price)', { count: 'exact' }).in('status', ['trial', 'active']),
      supabase.from('subscriptions').select('plans(price)').in('status', ['active']).gte('created_at', today),
      supabase.from('subscriptions').select('plans(price)').in('status', ['active']).gte('created_at', monthStart),
    ]).then(([users, newUsers, allDevices, connectedDevices, msgsToday, msgsMonth, subs, revenueToday, revenueMonth]) => {
      const revToday = (revenueToday.data || []).reduce((s: number, r: any) => s + (r.plans?.price || 0), 0)
      const revMonth = (revenueMonth.data || []).reduce((s: number, r: any) => s + (r.plans?.price || 0), 0)
      setStats({
        users: users.count || 0,
        newToday: newUsers.count || 0,
        activeDevices: connectedDevices.count || 0,
        totalDevices: allDevices.count || 0,
        messagesToday: msgsToday.count || 0,
        messagesMonth: msgsMonth.count || 0,
        revenueToday: revToday,
        revenueMonth: revMonth,
      })

      const planCounts: Record<string, number> = {}
      ;(subs.data || []).forEach((s: any) => {
        const name = s.plans?.name_ar || 'غير معروف'
        planCounts[name] = (planCounts[name] || 0) + 1
      })
      setPlanDist(Object.entries(planCounts).map(([name, value]) => ({ name, value })))
      setLoading(false)
    })
  }, [])

  const COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#2563EB', '#EF4444']

  const cards = [
    { label: 'إجمالي المستخدمين', value: stats.users, sub: `+${stats.newToday} اليوم`, color: '#7C3AED', icon: <Users size={20} /> },
    { label: 'الأجهزة المتصلة', value: stats.activeDevices, sub: `من ${stats.totalDevices} إجمالي`, color: '#10B981', icon: <Smartphone size={20} /> },
    { label: 'رسائل اليوم', value: stats.messagesToday, sub: `${stats.messagesMonth.toLocaleString('ar')} هذا الشهر`, color: '#2563EB', icon: <MessageSquare size={20} /> },
    { label: 'اشتراكات نشطة', value: planDist.reduce((s, p) => s + p.value, 0), sub: 'trial + active', color: '#F59E0B', icon: <Crown size={20} /> },
    { label: 'إيرادات اليوم', value: `${stats.revenueToday} ريال`, sub: 'من الاشتراكات الجديدة', color: '#10B981', icon: <DollarSign size={20} /> },
    { label: 'إيرادات الشهر', value: `${stats.revenueMonth} ريال`, sub: 'إجمالي الشهر', color: '#7C3AED', icon: <DollarSign size={20} /> },
  ]

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>لوحة الأدمن</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>نظرة عامة شاملة على المنصة</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {cards.map(card => (
          <div key={card.label} className="stat-card" style={{ borderTopColor: card.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{card.label}</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>{card.icon}</div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{loading ? '...' : card.value.toLocaleString('ar')}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>توزيع الخطط</h3>
          {planDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={planDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {planDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>لا توجد اشتراكات بعد</div>
          )}
        </div>
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>روابط سريعة</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            [
              { href: '/admin/analytics', label: '📈 التحليلات المتقدمة', desc: 'إحصاءات شاملة عن المنصة' },
              { href: '/admin/users', label: '👥 إدارة المستخدمين', desc: 'عرض وإدارة كل المستخدمين' },
              { href: '/admin/plans', label: '📦 إدارة الخطط', desc: 'إضافة وتعديل خطط الاشتراك' },
              { href: '/admin/codes', label: '🔑 أكواد التفعيل', desc: 'إنشاء وإدارة الأكواد' },
              { href: '/admin/tickets', label: '🎫 التذاكر والدعم', desc: 'تذاكر المستخدمين' },
              { href: '/admin/referrals', label: '💰 الإحالات والسحوبات', desc: 'طلبات السحب المعلقة' },
              { href: '/admin/settings', label: '⚙️ إعدادات النظام', desc: 'Gemini API، صيانة، إعلانات' },
            ].map(link => (
              <a key={link.href} href={link.href} style={{ display: 'flex', alignItems: 'center', padding: '14px', background: 'var(--bg-secondary)', borderRadius: '12px', textDecoration: 'none', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>{link.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{link.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
