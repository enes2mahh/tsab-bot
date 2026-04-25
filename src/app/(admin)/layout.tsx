import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StarField } from '@/components/cosmic/StarField'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, email')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/home')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      <StarField />
      <AdminSidebar />
      <div className="admin-main" style={{
        marginRight: 'var(--admin-sidebar-w, 260px)',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        transition: 'margin-right 0.3s ease',
      }}>
        <AdminTopBar name={profile?.name || null} email={profile?.email || ''} />
        <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </main>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .admin-main { margin-right: 0 !important; }
        }
      `}</style>
    </div>
  )
}
