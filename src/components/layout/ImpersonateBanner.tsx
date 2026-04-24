'use client'

import { useEffect, useState } from 'react'
import { LogOut, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
}

export function ImpersonateBanner() {
  const [originEmail, setOriginEmail] = useState<string | null>(null)
  const [originName, setOriginName] = useState<string | null>(null)
  const [currentEmail, setCurrentEmail] = useState<string | null>(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const email = getCookie('impersonate_origin_email')
    const name = getCookie('impersonate_origin_name')
    if (email) {
      setOriginEmail(email)
      setOriginName(name)
    }

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentEmail(data.user.email || null)
    })
  }, [])

  // Don't show if cookies are missing OR if we're already back to admin
  if (!originEmail || !currentEmail) return null
  if (originEmail === currentEmail) {
    // Already back to admin — clean cookies
    deleteCookie('impersonate_origin_email')
    deleteCookie('impersonate_origin_name')
    return null
  }

  const handleExit = async () => {
    setExiting(true)
    // Sign out current (impersonated) session and clear cookies
    const supabase = createClient()
    await supabase.auth.signOut()
    deleteCookie('impersonate_origin_email')
    deleteCookie('impersonate_origin_name')
    // Redirect to login (admin will sign back in)
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
