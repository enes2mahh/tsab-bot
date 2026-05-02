'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface Notif {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  metadata: any
  is_read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  new_user: '👤',
  new_subscription: '💰',
  new_inquiry: '📥',
  new_ticket: '🎫',
  new_withdrawal: '💸',
  system: '⚙️',
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [dismissAllConfirm, setDismissAllConfirm] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const seenIds = useRef<Set<string>>(new Set())

  const fetchNotifs = async () => {
    const { data } = await createClient()
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    setNotifs((data || []) as any)
    // Track current IDs as "seen" to avoid re-popping browser notifications
    ;(data || []).forEach((n: any) => seenIds.current.add(n.id))
  }

  useEffect(() => {
    fetchNotifs()

    // Browser notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }

    // Realtime subscription
    const supabase = createClient()
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, (payload) => {
        const n = payload.new as Notif
        setNotifs((prev) => [n, ...prev].slice(0, 30))

        // Browser notification (if granted and not seen yet)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && !seenIds.current.has(n.id)) {
          seenIds.current.add(n.id)
          try {
            const browserNotif = new Notification(`${TYPE_ICONS[n.type] || '🔔'} ${n.title}`, {
              body: n.body || '',
              icon: '/favicon.ico',
              tag: n.id,
            })
            browserNotif.onclick = () => {
              window.focus()
              if (n.link) window.location.href = n.link
              browserNotif.close()
            }
          } catch {}

          // Audio ping
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=')
            audio.volume = 0.3
            audio.play().catch(() => {})
          } catch {}
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const askPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
    }
  }

  const markRead = async (id: string) => {
    await createClient().from('admin_notifications').update({ is_read: true }).eq('id', id)
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  const markAllRead = async () => {
    await createClient().from('admin_notifications').update({ is_read: true }).eq('is_read', false)
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const dismissAll = () => setDismissAllConfirm(true)

  const confirmDismissAll = async () => {
    await createClient().from('admin_notifications').delete().lte('created_at', new Date().toISOString())
    setNotifs([])
    setDismissAllConfirm(false)
  }

  const unreadCount = notifs.filter((n) => !n.is_read).length

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'الآن'
    if (min < 60) return `قبل ${min}د`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `قبل ${hr}س`
    const d = Math.floor(hr / 24)
    return `قبل ${d}ي`
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
        cursor: 'pointer', color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#EF4444', color: 'white',
            fontSize: '10px', fontWeight: 700,
            minWidth: '16px', height: '16px',
            borderRadius: '8px', padding: '0 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '8px',
          width: '380px', maxWidth: '92vw',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '14px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          zIndex: 1000, maxHeight: '500px', display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>الإشعارات</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ padding: '4px 10px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', color: '#A78BFA', fontSize: '11px', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  تعليم الكل كمقروء
                </button>
              )}
              {notifs.length > 0 && (
                <button onClick={dismissAll} style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', color: '#EF4444', fontSize: '11px', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  مسح
                </button>
              )}
            </div>
          </div>

          {/* Permission prompt */}
          {permission !== 'granted' && (
            <div style={{ padding: '12px 16px', background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-secondary)' }}>
              💡 فعّل الإشعارات لتصلك popups في النظام عند أي حدث جديد
              <button onClick={askPermission} className="btn-primary" style={{ marginTop: '8px', padding: '6px 12px', fontSize: '12px', width: '100%', justifyContent: 'center' }}>
                تفعيل الإشعارات
              </button>
            </div>
          )}

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Bell size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <div>لا توجد إشعارات</div>
              </div>
            ) : (
              notifs.map((n) => (
                <div key={n.id} style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  background: n.is_read ? 'transparent' : 'rgba(124,58,237,0.05)',
                  transition: 'background 0.2s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px' }}>{TYPE_ICONS[n.type] || '🔔'}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</span>
                        {!n.is_read && <span style={{ width: '6px', height: '6px', background: '#7C3AED', borderRadius: '50%' }} />}
                      </div>
                      {n.body && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.body}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>{timeAgo(n.created_at)}</span>
                        {n.link && (
                          <Link href={n.link} onClick={() => { markRead(n.id); setOpen(false) }} style={{ color: 'var(--accent-violet-light)', textDecoration: 'none' }}>
                            عرض ←
                          </Link>
                        )}
                      </div>
                    </div>
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} style={{ padding: '4px', background: 'rgba(16,185,129,0.1)', border: 'none', borderRadius: '4px', color: '#10B981', cursor: 'pointer' }} title="تعليم كمقروء">
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={dismissAllConfirm}
        title="حذف كل الإشعارات"
        description="هل أنت متأكد من حذف جميع الإشعارات؟"
        confirmLabel="حذف الكل"
        variant="danger"
        onConfirm={confirmDismissAll}
        onCancel={() => setDismissAllConfirm(false)}
      />
    </div>
  )
}
