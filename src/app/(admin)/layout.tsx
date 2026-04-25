import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StarField } from '@/components/cosmic/StarField'
import { NotificationBell } from '@/components/admin/NotificationBell'

const adminNav = [
  { href: '/admin', label: 'الرئيسية', icon: '📊', exact: true },
  { href: '/admin/analytics', label: 'التحليلات', icon: '📈' },
  { href: '/admin/users', label: 'المستخدمون', icon: '👥' },
  { href: '/admin/all-contacts', label: 'كل جهات الاتصال', icon: '📞' },
  { href: '/admin/jobs', label: 'الوظائف', icon: '💼' },
  { href: '/admin/plans', label: 'الخطط', icon: '📦' },
  { href: '/admin/codes', label: 'أكواد التفعيل', icon: '🔑' },
  { href: '/admin/tickets', label: 'تذاكر الدعم', icon: '🎫' },
  { href: '/admin/inquiries', label: 'صندوق الوارد', icon: '📥' },
  { href: '/admin/referrals', label: 'الإحالات', icon: '💰' },
  { href: '/admin/settings', label: 'إعدادات النظام', icon: '⚙️' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, name, email').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/home')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <StarField />

      {/* Top Admin Bar */}
      <div style={{
        background: 'rgba(239,68,68,0.1)',
        borderBottom: '1px solid rgba(239,68,68,0.25)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🔒</div>
          <div>
            <div style={{ fontSize: '13px', color: '#EF4444', fontWeight: 700 }}>لوحة الإدارة</div>
            <div style={{ fontSize: '11px', color: 'rgba(239,68,68,0.6)' }}>Tsab Bot Admin</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginRight: 'auto', overflowX: 'auto' }}>
          {adminNav.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '10px',
              textDecoration: 'none', fontSize: '13px',
              color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationBell />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{profile?.name || profile?.email}</div>
            <div style={{ fontSize: '11px', color: '#EF4444' }}>Super Admin</div>
          </div>
          <Link href="/home" style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '12px', whiteSpace: 'nowrap' }}>
            ← لوحة المستخدم
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '28px', maxWidth: '1400px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
