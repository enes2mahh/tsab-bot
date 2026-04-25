'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, TrendingUp, Users, Phone, Briefcase, Package,
  Key, Ticket, Inbox, DollarSign, Settings, Shield, ChevronRight,
  ChevronLeft, LogOut, Menu, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navGroups = [
  {
    title: 'نظرة عامة',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'لوحة التحكم', exact: true },
      { href: '/admin/analytics', icon: TrendingUp, label: 'التحليلات' },
    ],
  },
  {
    title: 'إدارة المستخدمين',
    items: [
      { href: '/admin/users', icon: Users, label: 'المستخدمون' },
      { href: '/admin/all-contacts', icon: Phone, label: 'كل جهات الاتصال' },
    ],
  },
  {
    title: 'العمليات التجارية',
    items: [
      { href: '/admin/plans', icon: Package, label: 'الخطط' },
      { href: '/admin/codes', icon: Key, label: 'أكواد التفعيل' },
      { href: '/admin/referrals', icon: DollarSign, label: 'الإحالات والسحوبات' },
      { href: '/admin/jobs', icon: Briefcase, label: 'الوظائف' },
    ],
  },
  {
    title: 'الدعم والاتصال',
    items: [
      { href: '/admin/tickets', icon: Ticket, label: 'تذاكر الدعم' },
      { href: '/admin/inquiries', icon: Inbox, label: 'صندوق الوارد' },
    ],
  },
  {
    title: 'النظام',
    items: [
      { href: '/admin/settings', icon: Settings, label: 'الإعدادات' },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Apply collapsed width as CSS variable on root for layout to consume
  useEffect(() => {
    document.documentElement.style.setProperty('--admin-sidebar-w', collapsed ? '70px' : '260px')
  }, [collapsed])

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname?.startsWith(href + '/')
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button onClick={() => setMobileOpen(!mobileOpen)} className="admin-mobile-toggle" style={{
        position: 'fixed', top: '14px', right: '14px', zIndex: 200,
        width: '40px', height: '40px', borderRadius: '10px',
        background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
        color: '#EF4444', cursor: 'pointer', display: 'none',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`} style={{
        width: collapsed ? '70px' : '260px',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid rgba(239,68,68,0.2)',
        height: '100vh',
        position: 'fixed',
        right: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 150,
        transition: 'width 0.3s ease, transform 0.3s ease',
        overflow: 'hidden',
      }}>
        {/* Brand */}
        <div style={{
          padding: collapsed ? '20px 12px' : '20px 18px',
          borderBottom: '1px solid rgba(239,68,68,0.15)',
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(239,68,68,0.05)',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Shield size={20} color="white" />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap' }}>لوحة الإدارة</div>
              <div style={{ fontSize: '11px', color: 'rgba(239,68,68,0.6)', whiteSpace: 'nowrap' }}>Tsab Bot Admin</div>
            </div>
          )}
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0', overflowX: 'hidden' }}>
          {navGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: '14px' }}>
              {!collapsed && (
                <div style={{
                  padding: '6px 18px', fontSize: '10px', fontWeight: 700,
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href, (item as any).exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : ''}
                    style={{
                      display: 'flex', alignItems: 'center',
                      gap: '12px', padding: collapsed ? '10px' : '10px 18px',
                      margin: '2px 8px', borderRadius: '8px',
                      textDecoration: 'none',
                      background: active ? 'rgba(239,68,68,0.15)' : 'transparent',
                      color: active ? '#EF4444' : 'var(--text-secondary)',
                      transition: 'all 0.15s',
                      borderRight: active ? '3px solid #EF4444' : '3px solid transparent',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span style={{ fontSize: '13px', fontWeight: active ? 600 : 500, whiteSpace: 'nowrap' }}>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px' }}>
          <Link
            href="/home"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px',
              background: 'rgba(124,58,237,0.1)',
              color: '#A78BFA', textDecoration: 'none',
              marginBottom: '8px', fontSize: '13px', fontWeight: 600,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            title={collapsed ? 'لوحة المستخدم' : ''}
          >
            <ChevronRight size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>لوحة المستخدم</span>}
          </Link>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '8px', width: '100%',
            background: 'transparent', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: '13px', fontFamily: 'Tajawal, sans-serif',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
            title={collapsed ? 'تسجيل خروج' : ''}>
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>تسجيل خروج</span>}
          </button>

          {/* Collapse toggle (desktop only) */}
          <button onClick={() => setCollapsed(!collapsed)} className="admin-collapse-btn" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', borderRadius: '8px', width: '100%',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer', marginTop: '8px',
            fontSize: '12px', fontFamily: 'Tajawal, sans-serif',
            justifyContent: 'center',
          }}>
            {collapsed ? <ChevronLeft size={14} /> : <><ChevronRight size={14} /> طيّ</>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 140 }}
        />
      )}

      <style jsx global>{`
        @media (max-width: 900px) {
          .admin-sidebar {
            transform: translateX(100%);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-mobile-toggle {
            display: flex !important;
          }
          .admin-collapse-btn {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
