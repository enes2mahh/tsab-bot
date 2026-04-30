'use client'

import { useEffect, useState } from 'react'
import { LogOut, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ImpersonateBanner() {
  const [originEmail, setOriginEmail] = useState<string | null>(null)
  const [originName,  setOriginName]  = useState<string | null>(null)
  const [currentEmail, setCurrentEmail] = useState<string | null>(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Read impersonation context from server (httpOnly cookies)
    fetch('/api/admin/impersonate')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.impersonating) {
          setOriginEmail(data.originEmail)
          setOriginName(data.originName)
        }
      })
      .catch(() => {})

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentEmail(data.user.email || null)
    })
  }, [])

  if (!originEmail || !currentEmail) return null
  // Already back to admin account — clear server cookies silently
  if (originEmail === currentEmail) {
    fetch('/api/admin/impersonate', { method: 'DELETE' }).catch(() => {})
    return null
  }

  const handleExit = async () => {
    setExiting(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    await fetch('/api/admin/impersonate', { method: 'DELETE' }).catch(() => {})
    window.location.href = `/login?email=${encodeURIComponent(originEmail)}`
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 200,
      background: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(239,68,68,0.95))',
      color: 'white',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '13px',
      fontWeight: 600,
      borderBottom: '2px solid rgba(0,0,0,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Eye size={16} />
        <span>وضع المراقبة (Impersonate) — أنت تتصفّح كمستخدم</span>
        <span style={{ background: 'rgba(0,0,0,0.25)', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>
          {currentEmail}
        </span>
      </div>
      <button
        onClick={handleExit}
        disabled={exiting}
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white',
          padding: '6px 14px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: 'Tajawal, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <LogOut size={13} />
        {exiting ? 'جاري الخروج...' : `العودة لـ ${originName || 'الأدمن'}`}
      </button>
    </div>
  )
}
