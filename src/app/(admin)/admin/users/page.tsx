'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Filter, Shield, Crown, Ban, Eye, ChevronDown, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [extendDays, setExtendDays] = useState(30)
  const [addMessages, setAddMessages] = useState(1000)

  const fetchUsers = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*, subscriptions(status, expires_at, plans(name_ar))')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleBan = async (userId: string, isBanned: boolean) => {
    await createClient().from('profiles').update({ is_banned: !isBanned }).eq('id', userId)
    fetchUsers()
    setSelectedUser(null)
  }

  const handleChangePlan = async (userId: string, planId: string) => {
    const supabase = createClient()
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId)
    const expires = new Date(); expires.setDate(expires.getDate() + 30)
    const { data: plan } = await supabase.from('plans').select('message_limit').eq('id', planId).single()
    await supabase.from('subscriptions').insert({ user_id: userId, plan_id: planId, status: 'active', messages_used: 0, messages_limit: (plan as any)?.message_limit || 1000, starts_at: new Date().toISOString(), expires_at: expires.toISOString() })
    fetchUsers()
    alert('تم تغيير الخطة')
  }

  const handleExtend = async (userId: string) => {
    const supabase = createClient()
    const { data: sub } = await supabase.from('subscriptions').select('expires_at').eq('user_id', userId).in('status', ['active', 'trial']).order('created_at', { ascending: false }).limit(1).single()
    if (!sub) return alert('لا توجد اشتراك نشط')
    const newExpiry = new Date(sub.expires_at); newExpiry.setDate(newExpiry.getDate() + extendDays)
    await supabase.from('subscriptions').update({ expires_at: newExpiry.toISOString() }).eq('user_id', userId)
    fetchUsers()
    alert(`تم تمديد الاشتراك ${extendDays} يوم`)
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div><h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>إدارة المستخدمين</h2><p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{users.length} مستخدم</p></div>
      </div>

      <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '400px' }}>
        <input className="input-cosmic" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..." style={{ paddingRight: '40px' }} />
        <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table-cosmic">
          <thead><tr><th>المستخدم</th><th>الخطة</th><th>حالة الاشتراك</th><th>تاريخ الانضمام</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6}><div className="skeleton" style={{ height: '36px', borderRadius: '8px' }} /></td></tr>
              ))
            ) : filtered.map(u => {
              const activeSub = (u.subscriptions || []).find((s: any) => s.status === 'active' || s.status === 'trial')
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#A78BFA' }}>
                        {(u.name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{u.name || '—'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '13px' }}>{activeSub?.plans?.name_ar || 'بلا خطة'}</td>
                  <td>
                    {activeSub ? (
                      <span className={`badge badge-${activeSub.status === 'active' ? 'emerald' : 'yellow'}`}>{activeSub.status === 'trial' ? 'تجريبي' : 'نشط'}</span>
                    ) : (
                      <span className="badge badge-red">منتهي</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('ar-SA')}</td>
                  <td>
                    {u.is_banned ? <span className="badge badge-red">محظور</span> : u.role === 'admin' ? <span className="badge badge-violet">أدمن</span> : <span className="badge badge-emerald">نشط</span>}
                  </td>
                  <td>
                    <button onClick={() => setSelectedUser(u)} style={{ padding: '6px 10px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#A78BFA', fontSize: '12px' }}>
                      <Eye size={13} style={{ display: 'inline', marginLeft: '4px' }} />تفاصيل
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '520px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedUser.name || selectedUser.email}</h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div>📧 {selectedUser.email}</div>
                <div style={{ marginTop: '6px' }}>📱 {selectedUser.phone || '—'}</div>
                <div style={{ marginTop: '6px' }}>🔗 كود الإحالة: {selectedUser.referral_code || '—'}</div>
                <div style={{ marginTop: '6px' }}>📅 انضم: {new Date(selectedUser.created_at).toLocaleDateString('ar-SA')}</div>
              </div>

              {/* Impersonate */}
              <button onClick={() => { window.open(`/home?impersonate=${selectedUser.id}`, '_blank') }} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(124,58,237,0.3)', cursor: 'pointer', background: 'rgba(124,58,237,0.1)', color: '#A78BFA', fontWeight: 600, fontSize: '14px', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Eye size={16} /> الدخول كمستخدم (Impersonate)
              </button>

              {/* Extend subscription */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>تمديد الاشتراك (أيام)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" className="input-cosmic" value={extendDays} onChange={e => setExtendDays(+e.target.value)} min={1} style={{ flex: 1 }} />
                  <button onClick={() => handleExtend(selectedUser.id)} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>تمديد</button>
                </div>
              </div>

              {/* Add messages */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>إضافة رسائل إضافية</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" className="input-cosmic" value={addMessages} onChange={e => setAddMessages(+e.target.value)} min={100} step={100} style={{ flex: 1 }} />
                  <button onClick={async () => {
                    const supabase = createClient()
                    const { data: sub } = await supabase.from('subscriptions').select('messages_limit').eq('user_id', selectedUser.id).in('status', ['active', 'trial']).order('created_at', { ascending: false }).limit(1).single()
                    if (!sub) return alert('لا يوجد اشتراك نشط')
                    await supabase.from('subscriptions').update({ messages_limit: (sub.messages_limit || 0) + addMessages }).eq('user_id', selectedUser.id)
                    alert(`تم إضافة ${addMessages} رسالة`)
                    fetchUsers()
                  }} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>إضافة</button>
                </div>
              </div>

              {/* Ban/Unban */}
              <button onClick={() => handleBan(selectedUser.id, selectedUser.is_banned)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: selectedUser.is_banned ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: selectedUser.is_banned ? '#10B981' : '#EF4444', fontWeight: 600, fontSize: '14px', fontFamily: 'Tajawal, sans-serif' }}>
                {selectedUser.is_banned ? '✅ إلغاء الحظر' : '🚫 حظر المستخدم'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
