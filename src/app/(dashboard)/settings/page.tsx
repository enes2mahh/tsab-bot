'use client'

import { useState, useEffect } from 'react'
import { Settings, Key, RefreshCw, Bell, Clock, Lock, User, Globe, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [tab, setTab] = useState<'profile' | 'security' | 'api' | 'notifications' | 'timezone'>('profile')
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', avatar_url: '' })
  const [password, setPassword] = useState({ current: '', newPass: '', confirm: '' })
  const [apiKey, setApiKey] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [timezone, setTimezone] = useState('Asia/Riyadh')
  const [notifications, setNotifications] = useState({ email: true, device_connected: true, device_disconnected: true, campaign_completed: true })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile({ name: data.name || '', email: user.email || '', phone: data.phone || '', avatar_url: data.avatar_url || '' })
        setApiKey(data.api_key || '')
        setWebhookUrl(data.webhook_url || '')
        setTimezone(data.timezone || 'Asia/Riyadh')
        setNotifications(data.notification_settings || notifications)
      }
    }
    fetchProfile()
  }, [])

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  const saveProfile = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ name: profile.name, phone: profile.phone, webhook_url: webhookUrl, timezone, notification_settings: notifications }).eq('id', user.id)
    setLoading(false); showSaved()
  }

  const changePassword = async () => {
    if (password.newPass !== password.confirm) return alert('كلمتا المرور غير متطابقتان')
    if (password.newPass.length < 8) return alert('يجب أن تكون كلمة المرور 8 أحرف على الأقل')
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.updateUser({ password: password.newPass })
    setPassword({ current: '', newPass: '', confirm: '' })
    setLoading(false); showSaved()
  }

  const regenerateApiKey = async () => {
    if (!confirm('تجديد مفتاح API سيبطل المفتاح القديم. متأكد؟')) return
    setLoading(true)
    const newKey = 'tsab_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { await supabase.from('profiles').update({ api_key: newKey }).eq('id', user.id); setApiKey(newKey) }
    setLoading(false)
  }

  const tabs = [
    { key: 'profile', label: 'الملف الشخصي', icon: <User size={16} /> },
    { key: 'security', label: 'الأمان', icon: <Lock size={16} /> },
    { key: 'api', label: 'API & Webhook', icon: <Key size={16} /> },
    { key: 'notifications', label: 'الإشعارات', icon: <Bell size={16} /> },
    { key: 'timezone', label: 'المنطقة الزمنية', icon: <Globe size={16} /> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>الإعدادات</h2>
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '14px', fontWeight: 500 }}>
            <CheckCircle size={16} /> تم الحفظ بنجاح!
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px' }}>
        {/* Sidebar */}
        <div className="card" style={{ padding: '12px', height: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', background: tab === t.key ? 'rgba(124,58,237,0.15)' : 'transparent', color: tab === t.key ? '#A78BFA' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontFamily: 'Tajawal, sans-serif', marginBottom: '4px' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card">
          {tab === 'profile' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>الملف الشخصي</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                {[
                  { key: 'name', label: 'الاسم الكامل', placeholder: 'محمد أحمد' },
                  { key: 'email', label: 'البريد الإلكتروني', placeholder: '', disabled: true },
                  { key: 'phone', label: 'رقم الهاتف', placeholder: '966XXXXXXXXX' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{f.label}</label>
                    <input className="input-cosmic" value={(profile as any)[f.key]} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} placeholder={f.placeholder} disabled={f.disabled} style={f.disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}} />
                  </div>
                ))}
                <button onClick={saveProfile} disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start' }}>{loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}</button>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>تغيير كلمة المرور</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                {[
                  { key: 'newPass', label: 'كلمة المرور الجديدة' },
                  { key: 'confirm', label: 'تأكيد كلمة المرور' },
                ].map(f => (
                  <div key={f.key} style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{f.label}</label>
                    <input type={showPassword ? 'text' : 'password'} className="input-cosmic" value={(password as any)[f.key]} onChange={e => setPassword({ ...password, [f.key]: e.target.value })} />
                    <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', left: '12px', top: '34px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                ))}
                <button onClick={changePassword} disabled={loading || !password.newPass} className="btn-primary" style={{ alignSelf: 'flex-start' }}>تحديث كلمة المرور</button>
              </div>
            </div>
          )}

          {tab === 'api' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>مفتاح API & Webhook</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>مفتاح API</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="input-cosmic" value={apiKey} readOnly style={{ flex: 1, direction: 'ltr', fontSize: '12px', letterSpacing: '0.5px', cursor: 'text' }} />
                    <button onClick={() => navigator.clipboard.writeText(apiKey)} className="btn-secondary" style={{ padding: '10px 14px' }}>نسخ</button>
                    <button onClick={regenerateApiKey} disabled={loading} className="btn-secondary" style={{ padding: '10px 14px' }} title="تجديد"><RefreshCw size={15} /></button>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>استخدم هذا المفتاح في Authorization: Bearer &lt;key&gt;</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Webhook URL</label>
                  <input className="input-cosmic" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://your-server.com/webhook" style={{ direction: 'ltr' }} />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>يستقبل الرسائل الواردة من كل الأجهزة</p>
                </div>
                <button onClick={saveProfile} className="btn-primary" style={{ alignSelf: 'flex-start' }}>حفظ</button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>إعدادات الإشعارات</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                {[
                  { key: 'email', label: 'إشعارات البريد الإلكتروني' },
                  { key: 'device_connected', label: 'عند اتصال جهاز' },
                  { key: 'device_disconnected', label: 'عند انقطاع جهاز' },
                  { key: 'campaign_completed', label: 'عند اكتمال حملة' },
                ].map(n => (
                  <label key={n.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '14px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <input type="checkbox" checked={(notifications as any)[n.key]} onChange={e => setNotifications({ ...notifications, [n.key]: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-violet)', cursor: 'pointer' }} />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{n.label}</span>
                  </label>
                ))}
                <button onClick={saveProfile} className="btn-primary" style={{ alignSelf: 'flex-start' }}>حفظ</button>
              </div>
            </div>
          )}

          {tab === 'timezone' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>المنطقة الزمنية</h3>
              <div style={{ maxWidth: '400px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>اختر منطقتك الزمنية</label>
                <select className="input-cosmic" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  <option value="Asia/Riyadh">الرياض (UTC+3)</option>
                  <option value="Asia/Dubai">دبي (UTC+4)</option>
                  <option value="Africa/Cairo">القاهرة (UTC+2)</option>
                  <option value="Asia/Kuwait">الكويت (UTC+3)</option>
                  <option value="Asia/Baghdad">بغداد (UTC+3)</option>
                  <option value="Africa/Casablanca">المغرب (UTC+0)</option>
                  <option value="UTC">UTC</option>
                </select>
                <button onClick={saveProfile} className="btn-primary" style={{ marginTop: '16px' }}>حفظ</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
