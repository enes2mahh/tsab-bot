'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ImpersonateBanner } from '@/components/layout/ImpersonateBanner'
import { createClient } from '@/lib/supabase/client'

const pageTitles: Record<string, string> = {
  '/home': 'لوحة التحكم',
  '/devices': 'أجهزة الواتساب',
  '/campaigns': 'الحملات الإعلانية',
  '/messages': 'سجل الرسائل',
  '/autoreply': 'الرد التلقائي',
  '/chatflow': 'تدفق المحادثة',
  '/templates': 'القوالب',
  '/contacts': 'دليل الهاتف',
  '/files': 'مدير الملفات',
  '/reports': 'التقارير',
  '/tickets': 'تذاكر الدعم',
  '/plans': 'خطط الاشتراك',
  '/settings': 'الإعدادات',
  '/referrals': 'مركز الإحالات',
  '/filter': 'فلتر الأرقام',
  '/api-docs': 'توثيق API',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)

  const title = pageTitles[pathname] || 'لوحة التحكم'

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('profiles')
          .select('name, email')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            setUser({ name: profile?.name, email: profile?.email || data.user?.email })
          })
      }
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <ImpersonateBanner />

      {/* Mobile toggle button */}
      <button onClick={() => setMobileOpen(!mobileOpen)} className="dashboard-mobile-toggle" aria-label="القائمة">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay backdrop */}
      <div className={`mobile-overlay ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* Sidebar — receives mobileOpen for drawer behavior */}
      <div className={mobileOpen ? 'mobile-open-wrapper' : ''}>
        <Sidebar onCollapse={setCollapsed} mobileOpen={mobileOpen} />
      </div>

      <div
        className="main-content"
        style={{
          marginRight: collapsed ? '70px' : 'var(--sidebar-width)',
          transition: 'margin-right 0.3s ease',
        }}
      >
        <Header
          title={title}
          userName={user?.name}
          userEmail={user?.email}
        />
        <main style={{ padding: '24px' }}>{children}</main>
      </div>
    </div>
  )
}
