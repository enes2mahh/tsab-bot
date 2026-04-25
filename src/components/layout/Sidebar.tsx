'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Smartphone, Megaphone, MessageSquare, Bot,
  GitBranch, FileText, BookOpen, FolderOpen, BarChart3,
  Ticket, Crown, Settings, TrendingUp, Plug, LogOut,
  ChevronLeft, Zap, Filter, Flame, Store, Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/home', icon: Home, label: 'الرئيسية', color: '#A78BFA' },
  { href: '/devices', icon: Smartphone, label: 'الأجهزة', color: '#10B981' },
  { href: '/business', icon: Store, label: 'الملف التجاري', color: '#F472B6' },
  { href: '/faqs', icon: Sparkles, label: 'الأسئلة المتكررة', color: '#A78BFA' },
  { href: '/campaigns', icon: Megaphone, label: 'الحملات', color: '#60A5FA' },
  { href: '/messages', icon: MessageSquare, label: 'سجل الرسائل', color: '#A78BFA' },
  { href: '/autoreply', icon: Bot, label: 'الرد التلقائي', color: '#F59E0B' },
  { href: '/chatflow', icon: GitBranch, label: 'تدفق المحادثة', color: '#10B981' },
  { href: '/templates', icon: FileText, label: 'القوالب', color: '#60A5FA' },
  { href: '/contacts', icon: BookOpen, label: 'دليل الهاتف', color: '#A78BFA' },
  { href: '/files', icon: FolderOpen, label: 'مدير الملفات', color: '#F59E0B' },
  { href: '/reports', icon: BarChart3, label: 'التقارير', color: '#10B981' },
  { href: '/warmer', icon: Flame, label: 'WA Warmer', color: '#F97316' },
  { href: '/tickets', icon: Ticket, label: 'التذاكر', color: '#60A5FA' },
  { href: '/plans', icon: Crown, label: 'الخطط', color: '#F59E0B' },
]

const bottomItems = [
  { href: '/settings', icon: Settings, label: 'الإعدادات', color: '#94A3B8' },
  { href: '/referrals', icon: TrendingUp, label: 'الإحالات', color: '#10B981' },
  { href: '/filter', icon: Filter, label: 'فلتر الأرقام', color: '#A78BFA' },
  { href: '/api-docs', icon: Plug, label: 'API', color: '#60A5FA' },
]

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void
}

export function Sidebar({ onCollapse }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const handleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    onCollapse?.(next)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside
      className="sidebar"
      style={{ width: collapsed ? '70px' : 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Zap size={20} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
              Tsab Bot
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-violet-light)' }}>
              WhatsApp Platform
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflow: 'hidden auto' }}>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '2px',
                textDecoration: 'none',
                color: active ? item.color : 'var(--text-secondary)',
                background: active
                  ? `${item.color}15`
                  : 'transparent',
                borderRight: active ? `2px solid ${item.color}` : '2px solid transparent',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              <item.icon size={18} style={{ flexShrink: 0, color: active ? item.color : undefined }} />
              {!collapsed && (
                <span style={{ fontSize: '14px', fontWeight: active ? 600 : 400 }}>
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}

        <div style={{ height: '1px', background: 'var(--border)', margin: '12px 4px' }} />

        {bottomItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '2px',
                textDecoration: 'none',
                color: active ? item.color : 'var(--text-secondary)',
                background: active ? `${item.color}15` : 'transparent',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              <item.icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ fontSize: '14px' }}>{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: logout + collapse */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '10px',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#EF4444',
            cursor: 'pointer',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title={collapsed ? 'تسجيل الخروج' : undefined}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: '14px' }}>تسجيل الخروج</span>}
        </button>

        <button
          onClick={handleCollapse}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '8px',
            marginTop: '4px',
            borderRadius: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <ChevronLeft
            size={16}
            style={{
              transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          />
        </button>
      </div>
    </aside>
  )
}
