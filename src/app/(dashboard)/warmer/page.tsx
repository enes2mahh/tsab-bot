'use client'

import { useState, useEffect } from 'react'
import { Flame, Play, Pause, Settings, Smartphone, MessageSquare, Calendar, Clock, TrendingUp, AlertCircle, History } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface WarmerConfig {
  id?: string
  device_ids: string[]
  daily_target: number
  start_hour: number
  end_hour: number
  is_active: boolean
  messages_today: number
  total_messages: number
  days_running: number
}

const defaultMessages = [
  'مرحبا! كيف حالك؟', 'أهلاً وسهلاً!', 'السلام عليكم ورحمة الله',
  'صباح الخير ☀️', 'مساء النور 🌙', 'كيف يومك؟', 'تحياتي!',
  'أتمنى لك يوم سعيد', 'شكراً لتواصلك', 'أسعد الله أوقاتك',
]

export default function WarmerPage() {
  const [devices, setDevices] = useState<any[]>([])
  const [config, setConfig] = useState<WarmerConfig>({
    device_ids: [], daily_target: 20, start_hour: 9, end_hour: 21,
    is_active: false, messages_today: 0, total_messages: 0, days_running: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('devices').select('id, name, phone, status'),
      supabase.from('warmer_config').select('*').limit(1).single(),
      supabase.from('warmer_sessions').select('*').order('created_at', { ascending: false }).limit(50),
    ]).then(([d, w, s]) => {
      setDevices(d.data || [])
      if (w.data) setConfig(prev => ({ ...prev, ...w.data }))
      setSessions(s.data || [])
      setLoading(false)
    })
  }, [])

  const connectedDevices = devices.filter(d => d.status === 'connected')

  const toggleWarmer = async () => {
    if (!config.is_active && config.device_ids.length < 2) {
      alert('يتطلب WA Warmer جهازين على الأقل!')
      return
    }
    const newActive = !config.is_active
    setConfig(prev => ({ ...prev, is_active: newActive }))
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('warmer_config').upsert({
      id: config.id || undefined,
      user_id: user.id,
      ...config,
      is_active: newActive,
    })
  }

  const saveConfig = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('warmer_config').upsert({
      id: config.id || undefined, user_id: user.id, ...config,
    })
    setSaving(false)
  }

  const toggleDevice = (id: string) => {
    setConfig(prev => ({
      ...prev,
      device_ids: prev.device_ids.includes(id) ? prev.device_ids.filter(d => d !== id) : [...prev.device_ids, id],
    }))
  }

  const progressPercent = config.daily_target > 0 ? Math.min(100, Math.round((config.messages_today / config.daily_target) * 100)) : 0

  return (
    <div>
      <div className="page-flex-header">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={22} color="#F59E0B" /> WA Warmer
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>تدفئة أرقام الواتساب لتجنب الحظر</p>
        </div>
        <button onClick={toggleWarmer} className={config.is_active ? 'btn-secondary' : 'btn-primary'}
          style={config.is_active ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' } : {}}>
          {config.is_active ? <><Pause size={16} /> إيقاف</> : <><Play size={16} /> تشغيل</>}
        </button>
      </div>

      {/* Warning */}
      {connectedDevices.length < 2 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', color: '#F59E0B' }}>
          <AlertCircle size={18} /> يتطلب WA Warmer جهازين متصلين على الأقل. حالياً لديك {connectedDevices.length} جهاز متصل.
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {[
          { label: 'رسائل اليوم', value: config.messages_today, color: '#10B981', icon: <MessageSquare size={18} /> },
          { label: 'إجمالي الرسائل', value: config.total_messages, color: '#7C3AED', icon: <TrendingUp size={18} /> },
          { label: 'أيام التشغيل', value: config.days_running, color: '#2563EB', icon: <Calendar size={18} /> },
          { label: 'الحالة', value: config.is_active ? 'يعمل' : 'متوقف', color: config.is_active ? '#10B981' : '#EF4444', icon: <Flame size={18} /> },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTopColor: s.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>تقدم اليوم</span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{config.messages_today} / {config.daily_target}</span>
        </div>
        <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--gradient)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      <div className="grid-2" style={{ gap: '20px' }}>
        {/* Device Selection */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={16} /> الأجهزة المشاركة
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>اختر الأجهزة التي ستتبادل الرسائل فيما بينها</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {devices.map(d => (
              <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: config.device_ids.includes(d.id) ? 'rgba(124,58,237,0.1)' : 'var(--bg-secondary)', border: `1px solid ${config.device_ids.includes(d.id) ? 'var(--accent-violet)' : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <input type="checkbox" checked={config.device_ids.includes(d.id)} onChange={() => toggleDevice(d.id)} style={{ width: '16px', height: '16px', accentColor: 'var(--accent-violet)' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{d.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.phone || 'لا يوجد رقم'} • <span style={{ color: d.status === 'connected' ? '#10B981' : '#EF4444' }}>{d.status === 'connected' ? 'متصل' : 'غير متصل'}</span></div>
                </div>
              </label>
            ))}
            {devices.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>لا توجد أجهزة. أضف أجهزة من صفحة الأجهزة.</div>}
          </div>
        </div>

        {/* Settings */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} /> إعدادات التدفئة
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الهدف اليومي (رسالة)</label>
              <input type="number" className="input-cosmic" value={config.daily_target} min={5} max={100} onChange={e => setConfig({ ...config, daily_target: +e.target.value })} />
              <p style={{ fontSize: '11px', color: '#F59E0B', marginTop: '4px' }}>⚠️ نوصي بـ 15-30 رسالة يومياً</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>من الساعة</label>
                <input type="number" className="input-cosmic" value={config.start_hour} min={0} max={23} onChange={e => setConfig({ ...config, start_hour: +e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>إلى الساعة</label>
                <input type="number" className="input-cosmic" value={config.end_hour} min={0} max={23} onChange={e => setConfig({ ...config, end_hour: +e.target.value })} />
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>📋 كيف يعمل:</div>
              <div>1. يرسل رسائل عشوائية بين الأجهزة المحددة</div>
              <div>2. فترات عشوائية بين الرسائل</div>
              <div>3. رسائل طبيعية تحاكي المحادثات</div>
              <div>4. يعمل فقط خلال الساعات المحددة</div>
            </div>
            <button onClick={saveConfig} disabled={saving} className="btn-primary" style={{ justifyContent: 'center' }}>
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Log */}
      <div className="card" style={{ marginTop: '20px', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>آخر 50 رسالة تدفئة</span>
        </div>
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
            لا توجد جلسات بعد. شغّل الـ Warmer لتبدأ.
          </div>
        ) : (
          <div className="responsive-table-wrap">
            <table className="table-cosmic">
              <thead><tr><th>من</th><th>إلى</th><th>الرسالة</th><th>الحالة</th><th>الوقت</th></tr></thead>
              <tbody>
                {sessions.map((s: any) => (
                  <tr key={s.id}>
                    <td style={{ fontSize: '12px', direction: 'ltr' }}>{s.from_device_id ? devices.find(d => d.id === s.from_device_id)?.name || s.from_device_id : '—'}</td>
                    <td style={{ fontSize: '12px', direction: 'ltr' }}>{s.to_device_id ? devices.find(d => d.id === s.to_device_id)?.name || s.to_device_id : '—'}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.message || '—'}</td>
                    <td><span className={`badge badge-${s.status === 'sent' ? 'emerald' : s.status === 'failed' ? 'red' : 'yellow'}`}>{s.status === 'sent' ? 'تم' : s.status === 'failed' ? 'فشل' : 'معلق'}</span></td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
