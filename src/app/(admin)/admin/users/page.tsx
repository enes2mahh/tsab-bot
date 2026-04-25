'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, X, Smartphone, MessageSquare, Megaphone, DollarSign, Calendar, Mail, Phone, Hash, Crown, Shield, Ban, CheckCircle, RefreshCw, Key } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DetailStats {
  devices: number
  devicesConnected: number
  messages: number
  messagesToday: number
  campaigns: number
  campaignsActive: number
  contacts: number
  referrals: number
  totalSpent: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [details, setDetails] = useState<DetailStats | null>(null)
  const [extendDays, setExtendDays] = useState(30)
  const [addMessages, setAddMessages] = useState(1000)
  const [newPlanId, setNewPlanId] = useState('')

  const fetchUsers = async () => {
    const supabase = createClient()
    const [{ data: u }, { data: p }] = await Promise.all([
      supabase.from('profiles').select('*, subscriptions(id, status, expires_at, messages_used, messages_limit, plan_id, plans(name_ar, price))').order('created_at', { ascending: false }),
      supabase.from('plans').select('id, name_ar, price, message_limit, device_limit').eq('is_active', true).order('sort_order'),
    ])
    setUsers(u || [])
    setPlans(p || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const loadDetails = async (user: any) => {
    setSelectedUser(user)
    setDetails(null)
    const supabase = createClient()
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const [d, dc, m, mt, c, ca, ct, r] = await Promise.all([
      supabase.from('devices').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('devices').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'connected'),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayISO),
      supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'running'),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('referrals').select('commission_amount').eq('referrer_id', user.id).eq('status', 'available'),
    ])

    const totalSpent = (user.subscriptions || []).reduce((s: number, sub: any) => s + (sub.plans?.price || 0), 0)

    setDetails({
      devices: d.count || 0,
      devicesConnected: dc.count || 0,
      messages: m.count || 0,
      messagesToday: mt.count || 0,
      campaigns: c.count || 0,
      campaignsActive: ca.count || 0,
      contacts: ct.count || 0,
      referrals: (r.data || []).reduce((s: number, x: any) => s + (x.commission_amount || 0), 0),
      totalSpent,
    })
  }

  const handleBan = async (userId: string, isBanned: boolean) => {
    await createClient().from('profiles').update({ is_banned: !isBanned }).eq('id', userId)
    fetchUsers()
    setSelectedUser(null)
  }

  const handleChangePlan = async () => {
    if (!selectedUser || !newPlanId) return
    const supabase = createClient()
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', selectedUser.id).in('status', ['trial', 'active'])
    const expires = new Date(); expires.setDate(expires.getDate() + 30)
    const { data: plan } = await supabase.from('plans').select('message_limit').eq('id', newPlanId).single()
    await supabase.from('subscriptions').insert({
      user_id: selectedUser.id, plan_id: newPlanId, status: 'active',
      messages_used: 0, messages_limit: (plan as any)?.message_limit || 1000,
      starts_at: new Date().toISOString(), expires_at: expires.toISOString(),
    })
    fetchUsers()
    alert('✅ تم تغيير الخطة')
    setNewPlanId('')
  }

  const handleExtend = async (userId: string) => {
    const supabase = createClient()
    const { data: sub } = await supabase.from('subscriptions').select('id, expires_at').eq('user_id', userId).in('status', ['active', 'trial']).order('created_at', { ascending: false }).limit(1).single()
    if (!sub) return alert('❌ لا يوجد اشتراك نشط')
    const newExpiry = new Date(sub.expires_at); newExpiry.setDate(newExpiry.getDate() + extendDays)
    await supabase.from('subscriptions').update({ expires_at: newExpiry.toISOString() }).eq('id', sub.id)
    fetchUsers()
    alert(`✅ تم تمديد ${extendDays} يوم`)
  }

  const handleAddMessages = async (userId: string) => {
    const supabase = createClient()
    const { data: sub } = await supabase.from('subscriptions').select('id, messages_limit').eq('user_id', userId).in('status', ['active', 'trial']).order('created_at', { ascending: false }).limit(1).single()
    if (!sub) return alert('❌ لا يوجد اشتراك نشط')
    await supabase.from('subscriptions').update({ messages_limit: (sub.messages_limit || 0) + addMessages }).eq('id', sub.id)
    alert(`✅ تم إضافة ${addMessages} رسالة`)
    fetchUsers()
  }

  const resetMessages = async (userId: string) => {
    if (!confirm('إعادة عداد الرسائل لـ 0؟')) return
    const supabase = createClient()
    await supabase.from('subscriptions').update({ messages_used: 0 }).eq('user_id', userId).in('status', ['active', 'trial'])
    alert('✅ تم إعادة العدّاد')
    fetchUsers()
  }

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    if (!confirm(`تغيير الصلاحية إلى ${newRole}؟`)) return
    await createClient().from('profiles').update({ role: newRole }).eq('id', userId)
    fetchUsers()
    setSelectedUser(null)
  }

  const resetPassword = async (userId: string, email: string) => {
    const newPwd = prompt(`أدخل كلمة المرور الجديدة لـ ${email}\n(8 أحرف على الأقل)`)
    if (!newPwd) return
    if (newPwd.length < 8) return alert('الباسوورد يجب أن يكون 8 أحرف على الأقل')
    try {
      const r = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: newPwd }),
      })
      const data = await r.json()
      if (data.success) alert(`✅ تم تغيير كلمة المرور لـ ${email}\n\nأخبر المستخدم بالباسوورد الجديد:\n${newPwd}`)
      else alert(data.error || '❌ فشل')
    } catch { alert('❌ تعذر الاتصال') }
  }

  const impersonate = async (userId: string) => {
    try {
      const r = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await r.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || '❌ فشل')
    } catch { alert('❌ تعذر الاتصال') }
  }

  const filtered = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false
    if (filterStatus === 'banned' && !u.is_banned) return false
    if (filterStatus === 'active' && u.is_banned) return false
    if (search) {
      const s = search.toLowerCase()
      return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.phone?.includes(s) || u.referral_code?.toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>إدارة المستخدمين</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{users.length} مستخدم — {users.filter((u) => !u.is_banned).length} نشط — {users.filter((u) => u.is_banned).length} محظور</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <input className="input-cosmic" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم/البريد/الهاتف/الكود..." style={{ paddingRight: '40px' }} />
          <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        <select className="input-cosmic" value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ width: '140px' }}>
          <option value="">كل الصلاحيات</option>
          <option value="user">مستخدم</option>
          <option value="admin">أدمن</option>
          <option value="support">دعم</option>
        </select>
        <select className="input-cosmic" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '140px' }}>
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="banned">محظور</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table-cosmic">
          <thead><tr><th>المستخدم</th><th>الهاتف</th><th>الخطة</th><th>الاستهلاك</th><th>الانضمام</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: '36px', borderRadius: '8px' }} /></td></tr>)
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد نتائج</td></tr>
            ) : filtered.map((u) => {
              const activeSub = (u.subscriptions || []).find((s: any) => s.status === 'active' || s.status === 'trial')
              const usagePct = activeSub ? Math.min(100, ((activeSub.messages_used || 0) / (activeSub.messages_limit || 1)) * 100) : 0
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#A78BFA' }}>
                        {(u.name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {u.name || '—'}
                          {u.role === 'admin' && <Crown size={12} color="#F59E0B" />}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', direction: 'ltr', textAlign: 'right' }}>{u.phone || '—'}</td>
                  <td style={{ fontSize: '13px' }}>
                    {activeSub?.plans?.name_ar || <span style={{ color: 'var(--text-muted)' }}>بلا خطة</span>}
                  </td>
                  <td>
                    {activeSub ? (
                      <div style={{ minWidth: '100px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{activeSub.messages_used || 0}/{activeSub.messages_limit || 0}</div>
                        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${usagePct}%`, background: usagePct > 90 ? '#EF4444' : usagePct > 70 ? '#F59E0B' : '#10B981', transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('ar-SA')}</td>
                  <td>
                    {u.is_banned ? <span className="badge badge-red">محظور</span> : u.role === 'admin' ? <span className="badge badge-violet">أدمن</span> : <span className="badge badge-emerald">نشط</span>}
                  </td>
                  <td>
                    <button onClick={() => loadDetails(u)} style={{ padding: '6px 10px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#A78BFA', fontSize: '12px' }}>
                      <Eye size={13} style={{ display: 'inline', marginLeft: '4px' }} />تفاصيل
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
          <div className="glass" style={{ borderRadius: '20px', padding: '28px', maxWidth: '720px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#A78BFA' }}>
                  {(selectedUser.name || selectedUser.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedUser.name || selectedUser.email}
                    {selectedUser.role === 'admin' && <span className="badge badge-violet" style={{ marginRight: '8px' }}>أدمن</span>}
                    {selectedUser.is_banned && <span className="badge badge-red" style={{ marginRight: '8px' }}>محظور</span>}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>عضو منذ {new Date(selectedUser.created_at).toLocaleDateString('ar-SA')}</div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            {/* Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-secondary)' }}>{selectedUser.email}</span>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-secondary)', direction: 'ltr' }}>{selectedUser.phone || '—'}</span>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{selectedUser.referral_code || '—'}</span>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-secondary)' }}>آخر دخول: {selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString('ar-SA') : '—'}</span>
              </div>
            </div>

            {/* Stats */}
            {details && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
                {[
                  { icon: <Smartphone size={14} />, label: 'أجهزة', value: `${details.devicesConnected}/${details.devices}`, color: '#10B981' },
                  { icon: <MessageSquare size={14} />, label: 'رسائل', value: details.messages, color: '#2563EB' },
                  { icon: <Megaphone size={14} />, label: 'حملات', value: `${details.campaignsActive}/${details.campaigns}`, color: '#F59E0B' },
                  { icon: <DollarSign size={14} />, label: 'إنفاق', value: `${details.totalSpent} ر.س`, color: '#A78BFA' },
                ].map((s) => (
                  <div key={s.label} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ color: s.color, marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Impersonate */}
              <button onClick={() => impersonate(selectedUser.id)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(124,58,237,0.3)', cursor: 'pointer', background: 'rgba(124,58,237,0.1)', color: '#A78BFA', fontWeight: 600, fontSize: '14px', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Eye size={16} /> الدخول كهذا المستخدم
              </button>

              {/* Reset Password */}
              <button onClick={() => resetPassword(selectedUser.id, selectedUser.email)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontWeight: 600, fontSize: '14px', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Key size={16} /> إعادة تعيين كلمة المرور
              </button>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-4px', textAlign: 'center' }}>
                💡 لا يمكن إظهار الباسوورد القديم (مشفّر bcrypt). نضع باسوورد جديد فقط.
              </p>

              {/* Change Plan */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>تغيير الخطة</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="input-cosmic" value={newPlanId} onChange={(e) => setNewPlanId(e.target.value)} style={{ flex: 1 }}>
                    <option value="">اختر خطة...</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name_ar} - {p.price} ر.س ({p.message_limit} رسالة)</option>)}
                  </select>
                  <button onClick={handleChangePlan} disabled={!newPlanId} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>تطبيق</button>
                </div>
              </div>

              {/* Extend */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>تمديد الاشتراك (أيام)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" className="input-cosmic" value={extendDays} onChange={(e) => setExtendDays(+e.target.value)} min={1} style={{ flex: 1 }} />
                  <button onClick={() => handleExtend(selectedUser.id)} className="btn-primary">تمديد</button>
                </div>
              </div>

              {/* Add messages */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>إضافة رسائل</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" className="input-cosmic" value={addMessages} onChange={(e) => setAddMessages(+e.target.value)} min={100} step={100} style={{ flex: 1 }} />
                  <button onClick={() => handleAddMessages(selectedUser.id)} className="btn-primary">إضافة</button>
                  <button onClick={() => resetMessages(selectedUser.id)} className="btn-secondary" style={{ padding: '0 14px' }} title="إعادة تعيين العدّاد"><RefreshCw size={14} /></button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => toggleAdmin(selectedUser.id, selectedUser.role)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontWeight: 600, fontSize: '13px', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {selectedUser.role === 'admin' ? <><Shield size={14} /> إزالة الأدمن</> : <><Crown size={14} /> ترقية لأدمن</>}
                </button>
                <button onClick={() => handleBan(selectedUser.id, selectedUser.is_banned)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: selectedUser.is_banned ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: selectedUser.is_banned ? '#10B981' : '#EF4444', fontWeight: 600, fontSize: '13px', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {selectedUser.is_banned ? <><CheckCircle size={14} /> إلغاء الحظر</> : <><Ban size={14} /> حظر</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
