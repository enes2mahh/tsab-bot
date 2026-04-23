import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/home')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Admin top bar */}
      <div style={{ background: 'rgba(239,68,68,0.15)', borderBottom: '1px solid rgba(239,68,68,0.3)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: '#EF4444', fontWeight: 600 }}>🔒 لوحة الإدارة</span>
        <div style={{ marginRight: 'auto', display: 'flex', gap: '20px' }}>
          {[
            { href: '/admin', label: 'الرئيسية' },
            { href: '/admin/users', label: 'المستخدمون' },
            { href: '/admin/codes', label: 'الأكواد' },
            { href: '/admin/referrals', label: 'الإحالات' },
            { href: '/admin/settings', label: 'الإعدادات' },
          ].map(link => (
            <a key={link.href} href={link.href} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', transition: 'color 0.2s' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--text-primary)')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--text-secondary)')}>
              {link.label}
            </a>
          ))}
        </div>
        <a href="/home" style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '12px' }}>
          ← لوحة المستخدم
        </a>
      </div>
      <div style={{ padding: '24px' }}>{children}</div>
    </div>
  )
}
