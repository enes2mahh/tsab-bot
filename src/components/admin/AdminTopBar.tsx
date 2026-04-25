'use client'

import { NotificationBell } from './NotificationBell'

export function AdminTopBar({ name, email }: { name: string | null; email: string }) {
  return (
    <header style={{
      height: '60px',
      background: 'rgba(8,8,18,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)', color: '#EF4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700,
        }}>
          {(name || email)[0]?.toUpperCase() || 'A'}
        </div>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{name || email}</div>
          <div style={{ fontSize: '11px', color: '#EF4444' }}>Super Admin</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <NotificationBell />
      </div>
    </header>
  )
}
