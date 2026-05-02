'use client'

import { useState, useEffect } from 'react'
import {
  Search, Eye, X, Smartphone, MessageSquare, Megaphone, DollarSign, Calendar,
  Mail, Phone, Hash, Crown, Shield, Ban, CheckCircle, RefreshCw, Key, Trash2,
  Copy, ExternalLink, Activity, Globe, Clock, ChevronDown, AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface DetailStats {
  devices: number
  devicesConnected: number
  messages: number
  messagesToday: number
  campaigns: number
  campaignsActive: number
  contacts: number
  referralsCount: number
  referralsEarned: number
  totalSpent: number
  ticketsCount: number
  storiesCount: number
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  const colors: Record<string, string> = { success: '#10B981', error: '#EF4444', info: '#7C3AED' }
  const icons: Record<string, string> = { success: '✅', error: '❌', info: 'ℹ️' }
  return (
    <div style={{
      position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--bg-card)', border: `1px solid ${colors[type]}`,
      color: colors[type], padding: '12px 24px', borderRadius: '12px',
      fontSize: '14px', fontWeight: 600, zIndex: 9999,
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <span>{icons[type]}</span> {message}
    </div>
  )
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
  const [newPlanDays, setNewPlanDays] = useState(30)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [showDangerZone, setShowDangerZone] = useState(false)
  const [actionConfirm, setActionConfirm] = useState<{ title: string; desc: string; action: () => void; variant?: 'danger' | 'warning' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }

  const fetchUsers = async () => {
    const supabase = createClient()
    const [u, p] = await Promise.all([
      supabase.from('profiles').select('*, subscriptions(id, status, expires_at, messages_used, messages_limit, plan_id, plans(name_ar, name, price))').order('created_at', { ascending: false }),
      supabase.from('plans').select('id, name_ar, price, message_limit, device_limit, duration_days').eq('is_active', true).order('sort_order'),
    ])
    setUsers(u.data || [])
    setPlans(p.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const loadDetails = async (user: any) => {
    setSelectedUser(user)
    setDetails(null)
    setNewPlanId('')
    setShowDangerZone(false)
    const supabase = createClient()
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const [d, dc, m, mt, c, ca, ct, r, t, s] = await Promise.all([
      supabase.from('devices').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('devices').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'connected'),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayISO),
      supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'running'),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('referrals').select('commission_amount, status').eq('referrer_id', user.id),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('scheduled_stories').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    const totalSpent = (user.subscriptions || []).reduce((s: number, sub: any) => s + (sub.plans?.price || 0), 0)
    const refsList = r.data || []
    const refsEarned = refsList.filter((x: any) => x.status === 'available' || x.status === 'withdrawn').reduce((s: number, x: any) => s + (x.commission_amount || 0), 0)

    setDetails({
      devices: d.count || 0,
      devicesConnected: dc.count || 0,
      messages: m.count || 0,
      messagesToday: mt.count || 0,
      campaigns: c.count || 0,
      campaignsActive: ca.count || 0,
      contacts: ct.count || 0,
      referralsCount: refsList.length,
      referralsEarned: refsEarned,
      totalSpent,
      ticketsCount: t.count || 0,
      storiesCount: s.count || 0,
    })
  }

  const callApi = async (action: string, payload: any = {}) => {
    if (!selectedUser) return
    setBusy(true)
    try {
      const r = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, action, payload }),
      })
      const data = await r.json()
      if (!r.ok) {
        showToast(data.error || 'فشل العملية', 'error')
      } else {
        showToast(data.message || 'تم بنجاح', 'success')
        await fetchUsers()
        // Refresh selected user
        const updated = (await createClient().from('profiles').select('*, subscriptions(id, status, expires_at, messages_used, messages_limit, plan_id, plans(name_ar, price))').eq('id', selectedUser.id).single()).data
        if (updated) {
          setSelectedUser(updated)
          loadDetails(updated)
        }
      }
    } catch (err) {
      showToast('خطأ في الاتصال', 'error')
    }
    setBusy(false)
  }

  const handleChangeRole = (newRole: string) => {
    setActionConfirm({
      title: 'تغيير الدور',
      desc: `تغيير الدور إلى "${newRole === 'admin' ? 'أدمن كامل' : newRole === 'support' ? 'دعم فني' : 'مستخدم عادي'}"؟`,
      action: () => callApi('change_role', { role: newRole }),
      variant: 'warning',
    })
  }

  const handleBan = () => {
    const isBanned = selectedUser?.is_banned
    setActionConfirm({
      title: isBanned ? 'إلغاء الحظر' : 'حظر المستخدم',
      desc: isBanned ? 'سيتمكن المستخدم من الدخول مجدداً.' : 'لن يتمكن المستخدم من تسجيل الدخول.',
      action: () => callApi('toggle_ban'),
      variant: isBanned ? 'warning' : 'danger',
    })
  }

  const handleChangePlan = () => {
    if (!newPlanId) return showToast('اختر خطة', 'error')
    callApi('change_plan', { planId: newPlanId, days: newPlanDays })
  }

  const handleExtend = () => callApi('extend', { days: extendDays })
  const handleAddMessages = () => callApi('add_messages', { count: addMessages })
  const handleResetMessages = () => {
    setActionConfirm({
      title: 'إعادة تعيين عدّاد الرسائل',
      desc: 'سيتم إعادة عدّاد الرسائل إلى 0. هل أنت متأكد؟',
      action: () => callApi('reset_messages'),
      variant: 'warning',
    })
  }
  const handleCancelSubscription = () => {
    setActionConfirm({
      title: 'إلغاء الاشتراك',
      desc: 'سيتم إلغاء اشتراك هذا المستخدم فوراً.',
      action: () => callApi('cancel_subscription'),
      variant: 'danger',
    })
  }
  const handleDelete = () => {
    setActionConfirm({
      title: `حذف الحساب نهائياً`,
      desc: `⚠️ سيتم حذف كل بيانات "${selectedUser?.email}" بما فيها الأجهزة والرسائل والحملات. لا يمكن التراجع عن هذا الإجراء.`,
      action: () => callApi('delete_user').then(() => setSelectedUser(null)),
      variant: 'danger',
    })
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return
    const newPwd = prompt(`أدخل كلمة مرور جديدة لـ ${selectedUser.email}\n(8 أحرف على الأقل)`)
    if (!newPwd) return
    if (newPwd.length < 8) return showToast('كلمة المرور قصيرة', 'error')
    setBusy(true)
    try {
      const r = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, newPassword: newPwd }),
      })
      const data = await r.json()
      if (data.success) {
        showToast('تم تغيير كلمة المرور', 'success')
        // Show password to admin one time
        prompt(`✅ تم تغيير كلمة المرور.\nشاركها مع المستخدم بأمان:\n(انقر OK بعد الحفظ)`, newPwd)
      } else {
        showToast(data.error || 'فشل', 'error')
      }
    } catch { showToast('تعذر الاتصال', 'error') }
    setBusy(false)
  }

  const handleImpersonate = async () => {
    if (!selectedUser) return
    try {
      const r = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id }),
      })
      const data = await r.json()
      if (data.url) window.location.href = data.url
      else showToast(data.error || 'فشل', 'error')
    } catch { showToast('تعذر الاتصال', 'error') }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showToast(`تم نسخ ${label}`, 'info')
  }

  const filtered = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false
    if (filterStatus === 'banned' && !u.is_banned) return false
    if (filterStatus === 'active' && u.is_banned) return false
    if (filterStatus === 'verified' && !u.phone_verified) return false
    if (search) {
      const s = search.toLowerCase()
      return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.phone?.includes(s) || u.referral_code?.toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>إدارة المستخدمين</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {users.length} مستخدم — {users.filter((u) => !u.is_banned).length} نشط — {users.filter((u) => u.is_banned).length} محظور — {users.filter((u) => u.role === 'admin').length} أدمن
        </p>
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
        <select className="input-cosmic" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '160px' }}>
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="banned">محظور</option>
          <option value="verified">رقم متحقّق</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="responsive-table-wrap">
        <table className="table-cosmic">
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>الهاتف</th>
              <th>الخطة</th>
              <th>الاستهلاك</th>
              <th>الانضمام</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
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
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: u.role === 'admin' ? 'rgba(239,68,68,0.2)' : 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: u.role === 'admin' ? '#EF4444' : '#A78BFA' }}>
                        {(u.name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {u.name || '—'}
                          {u.role === 'admin' && <Crown size={12} color="#F59E0B" />}
                          {u.phone_verified && <CheckCircle size={12} color="#10B981" />}
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
                          <div style={{ height: '100%', width: `${usagePct}%`, background: usagePct > 90 ? '#EF4444' : usagePct > 70 ? '#F59E0B' : '#10B981' }} />
                        </div>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('ar-SA')}</td>
                  <td>
                    {u.is_banned ? <span className="badge badge-red">محظور</span> :
                      u.role === 'admin' ? <span className="badge badge-violet">أدمن</span> :
                      u.role === 'support' ? <span className="badge badge-blue">دعم</span> :
                      <span className="badge badge-emerald">نشط</span>}
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
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
          <div className="glass" style={{ borderRadius: '20px', padding: 0, maxWidth: '820px', width: '100%', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'rgba(124,58,237,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: selectedUser.role === 'admin' ? 'rgba(239,68,68,0.2)' : 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: selectedUser.role === 'admin' ? '#EF4444' : '#A78BFA' }}>
                    {(selectedUser.name || selectedUser.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedUser.name || selectedUser.email}</h3>
                      {selectedUser.role === 'admin' && <span className="badge badge-violet">👑 أدمن</span>}
                      {selectedUser.role === 'support' && <span className="badge badge-blue">🎧 دعم</span>}
                      {selectedUser.is_banned && <span className="badge badge-red">🚫 محظور</span>}
                      {selectedUser.phone_verified && <span className="badge badge-emerald">✓ متحقّق</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>عضو منذ {new Date(selectedUser.created_at).toLocaleDateString('ar-SA')} · UID: {selectedUser.id.slice(0, 8)}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={22} /></button>
              </div>
            </div>

            {/* Body — scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                <InfoCard icon={<Mail size={14} />} label="البريد" value={selectedUser.email} copy onCopy={copyToClipboard} />
                <InfoCard icon={<Phone size={14} />} label="الهاتف" value={selectedUser.phone || '—'} ltr copy={!!selectedUser.phone} onCopy={copyToClipboard} />
                <InfoCard icon={<Hash size={14} />} label="كود الإحالة" value={selectedUser.referral_code || '—'} mono copy={!!selectedUser.referral_code} onCopy={copyToClipboard} />
                <InfoCard icon={<Key size={14} />} label="API Key" value={selectedUser.api_key ? `${selectedUser.api_key.slice(0, 12)}...` : '—'} mono copy={!!selectedUser.api_key} onCopy={copyToClipboard} fullValue={selectedUser.api_key} />
                <InfoCard icon={<Globe size={14} />} label="اللغة / المنطقة" value={`${selectedUser.language || 'ar'} · ${selectedUser.timezone || 'Asia/Riyadh'}`} />
                <InfoCard icon={<Clock size={14} />} label="آخر دخول" value={selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString('ar-SA') : '—'} />
                <InfoCard icon={<CheckCircle size={14} />} label="تحقّق الهاتف" value={selectedUser.phone_verified ? `✓ ${new Date(selectedUser.phone_verified_at || selectedUser.created_at).toLocaleDateString('ar-SA')}` : '✗ غير متحقّق'} color={selectedUser.phone_verified ? '#10B981' : '#F59E0B'} />
                <InfoCard icon={<Mail size={14} />} label="تحقّق البريد" value={selectedUser.email_verified ? '✓ متحقّق' : '✗ غير متحقّق'} color={selectedUser.email_verified ? '#10B981' : '#F59E0B'} />
              </div>

              {/* Stats grid */}
              {details && (
                <>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>إحصاءات الاستخدام</h4>
                  <div className="grid-4" style={{ gap: '10px', marginBottom: '20px' }}>
                    <Stat icon={<Smartphone size={14} />} label="أجهزة" value={`${details.devicesConnected}/${details.devices}`} color="#10B981" />
                    <Stat icon={<MessageSquare size={14} />} label="رسائل" value={details.messages.toLocaleString('ar')} color="#2563EB" sub={`+${details.messagesToday} اليوم`} />
                    <Stat icon={<Megaphone size={14} />} label="حملات" value={`${details.campaignsActive}/${details.campaigns}`} color="#F59E0B" />
                    <Stat icon={<Hash size={14} />} label="جهات" value={details.contacts.toLocaleString('ar')} color="#A78BFA" />
                    <Stat icon={<DollarSign size={14} />} label="أنفق" value={`${details.totalSpent} ر.س`} color="#10B981" />
                    <Stat icon={<Activity size={14} />} label="إحالات" value={details.referralsCount} color="#EC4899" sub={`${details.referralsEarned} ر.س ربح`} />
                    <Stat icon={<Eye size={14} />} label="تذاكر" value={details.ticketsCount} color="#60A5FA" />
                    <Stat icon={<Calendar size={14} />} label="ستوريز" value={details.storiesCount} color="#F472B6" />
                  </div>
                </>
              )}

              {/* Actions */}
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>الإجراءات</h4>

              {/* Quick actions row */}
              <div className="grid-2" style={{ gap: '8px', marginBottom: '16px' }}>
                <button onClick={handleImpersonate} disabled={busy} style={ActionStyle('#A78BFA', 'rgba(124,58,237,0.1)')}>
                  <Eye size={14} /> الدخول كهذا المستخدم
                </button>
                <button onClick={handleResetPassword} disabled={busy} style={ActionStyle('#F59E0B', 'rgba(245,158,11,0.1)')}>
                  <Key size={14} /> إعادة تعيين الباسوورد
                </button>
              </div>

              {/* Role change */}
              <div style={SectionStyle()}>
                <label style={LabelStyle()}>الصلاحية</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { v: 'user', label: '👤 مستخدم عادي', color: '#10B981' },
                    { v: 'support', label: '🎧 دعم فني', color: '#60A5FA' },
                    { v: 'admin', label: '👑 أدمن كامل', color: '#EF4444' },
                  ].map((r) => {
                    const active = selectedUser.role === r.v
                    return (
                      <button
                        key={r.v}
                        onClick={() => !active && handleChangeRole(r.v)}
                        disabled={busy || active}
                        style={{
                          flex: 1,
                          padding: '10px 14px', borderRadius: '10px',
                          border: active ? `1px solid ${r.color}` : '1px solid var(--border)',
                          background: active ? `${r.color}20` : 'transparent',
                          color: active ? r.color : 'var(--text-secondary)',
                          cursor: active ? 'default' : 'pointer',
                          fontFamily: 'Tajawal, sans-serif', fontSize: '13px', fontWeight: 600,
                          opacity: active ? 1 : (busy ? 0.5 : 1),
                        }}
                      >
                        {r.label}{active && ' ✓'}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Plan + extend */}
              <div style={SectionStyle()}>
                <label style={LabelStyle()}>إدارة الاشتراك</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <select className="input-cosmic" value={newPlanId} onChange={(e) => setNewPlanId(e.target.value)}>
                    <option value="">— اختر خطة جديدة —</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name_ar} · {p.price} ر.س · {p.message_limit.toLocaleString('ar')} رسالة</option>)}
                  </select>
                  <input type="number" className="input-cosmic" value={newPlanDays} onChange={(e) => setNewPlanDays(+e.target.value)} placeholder="أيام" min={1} />
                  <button onClick={handleChangePlan} disabled={busy || !newPlanId} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>تطبيق</button>
                </div>

                <div className="grid-2" style={{ gap: '8px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="number" className="input-cosmic" value={extendDays} onChange={(e) => setExtendDays(+e.target.value)} min={1} placeholder="أيام التمديد" />
                    <button onClick={handleExtend} disabled={busy} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>تمديد</button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="number" className="input-cosmic" value={addMessages} onChange={(e) => setAddMessages(+e.target.value)} min={100} step={100} placeholder="رسائل" />
                    <button onClick={handleAddMessages} disabled={busy} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>إضافة</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  <button onClick={handleResetMessages} disabled={busy} style={SmallBtnStyle('#60A5FA')}>
                    <RefreshCw size={12} /> إعادة عدّاد
                  </button>
                  <button onClick={handleCancelSubscription} disabled={busy} style={SmallBtnStyle('#F59E0B')}>
                    إلغاء الاشتراك
                  </button>
                </div>
              </div>

              {/* Ban / Danger */}
              <div style={SectionStyle()}>
                <button onClick={handleBan} disabled={busy} style={{
                  width: '100%', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: selectedUser.is_banned ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: selectedUser.is_banned ? '#10B981' : '#EF4444',
                  fontWeight: 600, fontSize: '14px', fontFamily: 'Tajawal, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  {selectedUser.is_banned ? <><CheckCircle size={16} /> إلغاء الحظر</> : <><Ban size={16} /> حظر المستخدم</>}
                </button>
              </div>

              {/* Danger zone (collapsed) */}
              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(239,68,68,0.2)', paddingTop: '16px' }}>
                <button onClick={() => setShowDangerZone(!showDangerZone)} style={{
                  width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px', color: '#EF4444', cursor: 'pointer', fontSize: '13px', fontFamily: 'Tajawal, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <AlertCircle size={14} /> منطقة الخطر <ChevronDown size={14} style={{ transform: showDangerZone ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {showDangerZone && (
                  <div style={{ marginTop: '12px', padding: '14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                    <p style={{ fontSize: '12px', color: '#EF4444', marginBottom: '12px' }}>
                      ⚠️ حذف الحساب نهائي ولا يمكن التراجع عنه. كل بيانات المستخدم (أجهزة، رسائل، حملات، اشتراكات) ستُحذف.
                    </p>
                    <button onClick={handleDelete} disabled={busy} style={{
                      width: '100%', padding: '10px', background: 'rgba(239,68,68,0.2)', border: '1px solid #EF4444',
                      borderRadius: '8px', color: '#EF4444', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                      fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}>
                      <Trash2 size={14} /> حذف الحساب نهائياً
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!actionConfirm}
        title={actionConfirm?.title || ''}
        description={actionConfirm?.desc}
        confirmLabel="تأكيد"
        variant={actionConfirm?.variant || 'danger'}
        onConfirm={() => { actionConfirm?.action(); setActionConfirm(null) }}
        onCancel={() => setActionConfirm(null)}
      />
    </div>
  )
}

// ===== Helpers =====
function ActionStyle(color: string, bg: string): React.CSSProperties {
  return {
    padding: '12px', borderRadius: '10px', border: `1px solid ${color}40`,
    background: bg, color, fontWeight: 600, fontSize: '13px',
    fontFamily: 'Tajawal, sans-serif', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  }
}
function SectionStyle(): React.CSSProperties {
  return { padding: '14px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '12px' }
}
function LabelStyle(): React.CSSProperties {
  return { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }
}
function SmallBtnStyle(color: string): React.CSSProperties {
  return {
    flex: 1, padding: '8px', background: `${color}15`, border: `1px solid ${color}30`,
    borderRadius: '8px', color, cursor: 'pointer', fontSize: '12px',
    fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
  }
}

function InfoCard({ icon, label, value, color, mono, ltr, copy, onCopy, fullValue }: any) {
  return (
    <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ color: color || 'var(--text-muted)' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
        <div style={{ fontSize: '13px', color: color || 'var(--text-primary)', fontWeight: 500, direction: ltr ? 'ltr' : 'rtl', fontFamily: mono ? 'monospace' : 'Tajawal, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </div>
      </div>
      {copy && onCopy && (
        <button onClick={() => onCopy(fullValue || value, label)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }} title="نسخ">
          <Copy size={12} />
        </button>
      )}
    </div>
  )
}

function Stat({ icon, label, value, color, sub }: any) {
  return (
    <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', textAlign: 'center' }}>
      <div style={{ color, marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color, marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}
