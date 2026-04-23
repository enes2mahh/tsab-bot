'use client'

import { useState } from 'react'
import { Bell, Search, User, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  title: string
  userName?: string
  userEmail?: string
  avatarUrl?: string
}

export function Header({ title, userName, userEmail, avatarUrl }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="dashboard-header">
      {/* Title */}
      <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
        {title}
      </h1>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Search */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--text-muted)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <Search size={14} />
          <span>بحث... (Ctrl+K)</span>
        </button>

        {/* Notifications */}
        <button
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Bell size={18} />
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '8px',
              height: '8px',
              background: '#EF4444',
              borderRadius: '50%',
              border: '2px solid var(--bg-secondary)',
            }}
          />
        </button>

        {/* User Avatar */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                color: 'white',
              }}
            >
              {userName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {userName || 'المستخدم'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {userEmail || ''}
              </div>
            </div>
          </button>

          {dropdownOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                onClick={() => setDropdownOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: '0',
                  width: '200px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  zIndex: 20,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                }}
              >
                <a
                  href="/settings"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Settings size={15} />
                  الإعدادات
                </a>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={15} />
                  تسجيل الخروج
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
