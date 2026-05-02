'use client'

import { useState, useEffect } from 'react'
import { Settings, Key, RefreshCw, Bell, Clock, Lock, User, Globe, Eye, EyeOff, CheckCircle, XCircle, Mail, Phone, AlertTriangle, ExternalLink, Loader, X, Send, Copy, Webhook } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/ConfirmDialog'

// ===== FORGOT PASSWORD MODAL =====
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState<'input' | 'otp'>('input')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const sendEmailReset = async () => {
    setLoading(true); setErr('')
    const supabase = createClient()
    const origin = window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset` })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setDone(true)
  }

  const sendPhoneOtp = async () => {
    setLoading(true); setErr('')
    const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, purpose: 'reset' }) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(data.error || 'فشل الإرسال'); return }
    setStep('otp')
  }

  const verifyAndReset = async () => {
    if (newPassword.length < 8) { setErr('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    setLoading(true); setErr('')
    const res = await fetch('/api/auth/reset-password-with-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp, newPassword }) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(data.error || 'فشل التحقق'); return }
    setDone(true)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(8px)' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '420px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>نسيت كلمة المرور؟</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={48} color="#10B981" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>
              {mode === 'email' ? 'تم إرسال رابط الاستعادة على بريدك الإلكتروني!' : 'تم تحديث كلمة المرور بنجاح!'}
            </p>
            <button onClick={onClose} className="btn-primary" style={{ marginTop: '16px' }}>إغلاق</button>
          </div>
        ) : (
          <>
            {/* Mode tabs */}
            {step === 'input' && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[{ v: 'email', l: '📧 بالبريد' }, { v: 'phone', l: '📱 بالهاتف' }].map(t => (
                  <button key={t.v} onClick={() => { setMode(t.v as any); setErr('') }}
                    style={{ flex: 1, padding: '9px', borderRadius: '10px', border: `1px solid ${mode === t.v ? 'var(--accent-violet)' : 'var(--border)'}`, background: mode === t.v ? 'rgba(124,58,237,0.15)' : 'transparent', color: mode === t.v ? '#A78BFA' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>
                    {t.l}
                  </button>
                ))}
              </div>
            )}

            {err && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: '#EF4444', fontSize: '13px', marginBottom: '14px' }}>{err}</div>}

            {mode === 'email' && step === 'input' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>البريد الإلكتروني</label>
                  <input className="input-cosmic" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ direction: 'ltr' }} />
                </div>
                <button onClick={sendEmailReset} className="btn-primary" disabled={loading || !email}>
                  {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                  {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                </button>
              </div>
            )}

            {mode === 'phone' && step === 'input' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>رقم الهاتف</label>
                  <input className="input-cosmic" value={phone} onChange={e => setPhone(e.target.value)} placeholder="966501234567" style={{ direction: 'ltr' }} />
                </div>
                <button onClick={sendPhoneOtp} className="btn-primary" disabled={loading || !phone}>
                  {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق عبر واتساب'}
                </button>
              </div>
            )}

            {mode === 'phone' && step === 'otp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>تم إرسال رمز التحقق لـ <strong>{phone}</strong> عبر واتساب</p>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>رمز التحقق (6 أرقام)</label>
                  <input className="input-cosmic" value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" maxLength={6} style={{ direction: 'ltr', letterSpacing: '4px', fontSize: '18px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>كلمة المرور الجديدة</label>
                  <input className="input-cosmic" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="8 أحرف على الأقل" />
                </div>
                <button onClick={verifyAndReset} className="btn-primary" disabled={loading || !otp || !newPassword}>
                  {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  {loading ? 'جاري التحقق...' : 'تحديث كلمة المرور'}
                </button>
                <button onClick={() => setStep('input')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px' }}>رجوع</button>
              </div>
            )}
          </>
        )}
      </div>
      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ===== MAIN PAGE =====
export default function SettingsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'profile' | 'security' | 'api' | 'notifications' | 'timezone'>('profile')
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', avatar_url: '' })
  const [emailVerified, setEmailVerified] = useState(false)
  const [password, setPassword] = useState({ current: '', newPass: '', confirm: '' })
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false })
  const [apiKey, setApiKey] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [timezone, setTimezone] = useState('Asia/Riyadh')
  const [language, setLanguage] = useState('ar')
  const [notifications, setNotifications] = useState({ email: true, device_connected: true, device_disconnected: true, campaign_completed: true })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [resendDone, setResendDone] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [regenerateConfirm, setRegenerateConfirm] = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmailVerified(!!user.email_confirmed_at)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile({ name: data.name || '', email: user.email || '', phone: data.phone || '', avatar_url: data.avatar_url || '' })
        setApiKey(data.api_key || '')
        setWebhookUrl(data.webhook_url || '')
        setTimezone(data.timezone || 'Asia/Riyadh')
        setLanguage(data.language || 'ar')
        setNotifications(data.notification_settings || notifications)
      }
    }
    init()
  }, [])

  const showSaved = () => { setSaved(true); setErr(''); setTimeout(() => setSaved(false), 2500) }
  const showErr = (msg: string) => { setErr(msg); setTimeout(() => setErr(''), 4000) }

  const saveProfile = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ name: profile.name, webhook_url: webhookUrl, timezone, language, notification_settings: notifications }).eq('id', user.id)
    setLoading(false); showSaved()
  }

  const changePassword = async () => {
    if (password.newPass !== password.confirm) { showErr('كلمتا المرور غير متطابقتان'); return }
    if (password.newPass.length < 8) { showErr('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    if (!password.current) { showErr('أدخل كلمة المرور الحالية'); return }
    setLoading(true); setErr('')
    const supabase = createClient()
    // Verify current password
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setLoading(false); return }
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: password.current })
    if (signInErr) { setLoading(false); showErr('كلمة المرور الحالية غير صحيحة'); return }
    // Update
    const { error } = await supabase.auth.updateUser({ password: password.newPass })
    if (error) { setLoading(false); showErr(error.message); return }
    setPassword({ current: '', newPass: '', confirm: '' })
    setLoading(false); showSaved()
  }

  const resendConfirmation = async () => {
    setResendingEmail(true)
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email: profile.email })
    setResendingEmail(false); setResendDone(true)
    setTimeout(() => setResendDone(false), 5000)
  }

  const regenerateApiKey = async () => {
    setLoading(true)
    const newKey = 'sends_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { await supabase.from('profiles').update({ api_key: newKey }).eq('id', user.id); setApiKey(newKey) }
    setLoading(false)
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const testWebhook = async () => {
    if (!webhookUrl) { setWebhookTestResult('أدخل Webhook URL أولاً'); return }
    setTestingWebhook(true); setWebhookTestResult(null)
    try {
      const res = await fetch('/api/settings/test-webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: webhookUrl }) })
      const data = await res.json()
      setWebhookTestResult(res.ok ? `✓ نجح الاتصال (${data.status || 200})` : `✗ فشل: ${data.error || 'خطأ'}`)
    } catch (e) {
      setWebhookTestResult('✗ تعذّر الاتصال بالخادم')
    }
    setTestingWebhook(false)
  }

  const tabs = [
    { key: 'profile', label: 'الملف الشخصي', icon: <User size={15} /> },
    { key: 'security', label: 'الأمان', icon: <Lock size={15} /> },
    { key: 'api', label: 'API & Webhook', icon: <Key size={15} /> },
    { key: 'notifications', label: 'الإشعارات', icon: <Bell size={15} /> },
    { key: 'timezone', label: 'الوقت واللغة', icon: <Globe size={15} /> },
  ]

  const timezones = [
    { v: 'Asia/Riyadh', l: 'الرياض (UTC+3)' }, { v: 'Asia/Dubai', l: 'دبي (UTC+4)' },
    { v: 'Africa/Cairo', l: 'القاهرة (UTC+2)' }, { v: 'Asia/Kuwait', l: 'الكويت (UTC+3)' },
    { v: 'Asia/Baghdad', l: 'بغداد (UTC+3)' }, { v: 'Africa/Casablanca', l: 'المغرب (UTC+0)' },
    { v: 'Asia/Amman', l: 'عمّان (UTC+3)' }, { v: 'Asia/Beirut', l: 'بيروت (UTC+2)' },
    { v: 'Asia/Bahrain', l: 'البحرين (UTC+3)' }, { v: 'Asia/Qatar', l: 'قطر (UTC+3)' },
    { v: 'Asia/Muscat', l: 'مسقط (UTC+4)' }, { v: 'UTC', l: 'UTC' },
  ]

  const inputStyle = { position: 'relative' as const, display: 'flex', alignItems: 'center' }

  return (
    <div>
      {/* Header */}
      <div className="page-flex-header">
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>الإعدادات</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saved && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '13px', fontWeight: 500 }}><CheckCircle size={15} /> تم الحفظ!</div>}
          {err && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontSize: '13px' }}><AlertTriangle size={15} /> {err}</div>}
        </div>
      </div>

      <div className="settings-grid">
        {/* Sidebar */}
        <div className="card" style={{ padding: '10px', height: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', background: tab === t.key ? 'rgba(124,58,237,0.15)' : 'transparent', color: tab === t.key ? '#A78BFA' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontFamily: 'Tajawal, sans-serif', marginBottom: '2px', textAlign: 'right', justifyContent: 'flex-start' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card">

          {/* ─── PROFILE ─── */}
          {tab === 'profile' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>الملف الشخصي</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الاسم الكامل</label>
                  <input className="input-cosmic" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="محمد أحمد" />
                </div>

                {/* Email with verify badge */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>البريد الإلكتروني</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input-cosmic" value={profile.email} disabled style={{ opacity: 0.7, cursor: 'not-allowed', paddingLeft: emailVerified ? '90px' : '130px' }} />
                    <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                      {emailVerified ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10B981', background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: '6px' }}>
                          <CheckCircle size={11} /> تم التحقق
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#F59E0B', background: 'rgba(245,158,11,0.12)', padding: '3px 8px', borderRadius: '6px' }}>
                          <XCircle size={11} /> غير متحقق
                        </span>
                      )}
                    </div>
                  </div>
                  {!emailVerified && (
                    <button onClick={resendConfirmation} disabled={resendingEmail || resendDone}
                      style={{ marginTop: '6px', background: 'none', border: 'none', cursor: resendDone ? 'default' : 'pointer', color: resendDone ? '#10B981' : '#A78BFA', fontSize: '12px', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {resendingEmail ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Mail size={11} />}
                      {resendDone ? '✓ تم الإرسال! تحقق من بريدك' : 'إرسال رسالة تأكيد البريد'}
                    </button>
                  )}
                </div>

                {/* Phone - disabled */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>رقم الهاتف</label>
                  <input className="input-cosmic" value={profile.phone} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>لتغيير رقم الهاتف، افتح تذكرة دعم</p>
                    <button onClick={() => router.push('/tickets?subject=طلب تغيير رقم الهاتف')}
                      style={{ fontSize: '11px', color: '#A78BFA', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                      فتح تذكرة
                    </button>
                  </div>
                </div>

                <button onClick={saveProfile} disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                  {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </div>
          )}

          {/* ─── SECURITY ─── */}
          {tab === 'security' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>تغيير كلمة المرور</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px' }}>
                {/* Current password */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>كلمة المرور الحالية *</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass.current ? 'text' : 'password'} className="input-cosmic" value={password.current} onChange={e => setPassword({ ...password, current: e.target.value })} placeholder="••••••••" />
                    <button onClick={() => setShowPass(p => ({ ...p, current: !p.current }))} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPass.current ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {/* New password */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>كلمة المرور الجديدة *</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass.new ? 'text' : 'password'} className="input-cosmic" value={password.newPass} onChange={e => setPassword({ ...password, newPass: e.target.value })} placeholder="8 أحرف على الأقل" />
                    <button onClick={() => setShowPass(p => ({ ...p, new: !p.new }))} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPass.new ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {password.newPass && (
                    <div style={{ marginTop: '6px', display: 'flex', gap: '4px' }}>
                      {[8, 12, 16].map((n, i) => (
                        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: password.newPass.length >= n ? i === 0 ? '#F59E0B' : i === 1 ? '#3B82F6' : '#10B981' : 'var(--border)' }} />
                      ))}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px' }}>
                        {password.newPass.length < 8 ? 'ضعيف' : password.newPass.length < 12 ? 'متوسط' : password.newPass.length < 16 ? 'جيد' : 'قوي'}
                      </span>
                    </div>
                  )}
                </div>
                {/* Confirm */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>تأكيد كلمة المرور *</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass.confirm ? 'text' : 'password'} className="input-cosmic" value={password.confirm} onChange={e => setPassword({ ...password, confirm: e.target.value })} placeholder="••••••••" style={{ borderColor: password.confirm && password.confirm !== password.newPass ? '#EF4444' : undefined }} />
                    <button onClick={() => setShowPass(p => ({ ...p, confirm: !p.confirm }))} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPass.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {password.confirm && password.confirm !== password.newPass && (
                    <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>كلمتا المرور غير متطابقتان</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button onClick={changePassword} disabled={loading || !password.current || !password.newPass || !password.confirm} className="btn-primary">
                    {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                  </button>
                  <button onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontSize: '13px', textDecoration: 'underline' }}>
                    نسيت كلمة المرور؟
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── API & WEBHOOK ─── */}
          {tab === 'api' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>API & Webhook</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>اربط تطبيقاتك الخارجية بمنصة Sends Bot.</p>

              {/* API Key */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Key size={15} color="#A78BFA" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>مفتاح API</span>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(124,58,237,0.05)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>متى أحتاج الـ API؟</p>
                  <ul style={{ fontSize: '12px', color: 'var(--text-muted)', paddingRight: '16px', margin: 0, lineHeight: 1.8 }}>
                    <li>ربط متجر Shopify/Salla لإرسال تأكيدات الطلبات</li>
                    <li>إرسال إشعارات من نظام CRM أو ERP</li>
                    <li>أتمتة إرسال التذكيرات من تطبيقك الخاص</li>
                  </ul>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="input-cosmic" value={apiKey} readOnly style={{ flex: 1, direction: 'ltr', fontSize: '12px', letterSpacing: '0.5px' }} />
                  <button onClick={() => copyText(apiKey, 'apikey')} className="btn-secondary" style={{ padding: '10px 14px', minWidth: '70px' }}>{copied === 'apikey' ? <CheckCircle size={14} color="#10B981" /> : <Copy size={14} />}</button>
                  <button onClick={() => setRegenerateConfirm(true)} disabled={loading} className="btn-secondary" style={{ padding: '10px 14px' }} title="تجديد"><RefreshCw size={14} /></button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>استخدمه في الـ Header: <code style={{ background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px', direction: 'ltr', display: 'inline-block' }}>Authorization: Bearer {'<key>'}</code></p>
              </div>

              {/* Webhook */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Webhook size={15} color="#A78BFA" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Webhook URL</span>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(124,58,237,0.05)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>متى أحتاج الـ Webhook؟</p>
                  <ul style={{ fontSize: '12px', color: 'var(--text-muted)', paddingRight: '16px', margin: 0, lineHeight: 1.8 }}>
                    <li>استقبال رسائل العملاء في نظامك الخارجي لحظياً</li>
                    <li>تشغيل أتمتة عند وصول رسالة جديدة (Zapier، Make)</li>
                    <li>تسجيل المحادثات في CRM تلقائياً</li>
                  </ul>
                </div>
                <input className="input-cosmic" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://your-server.com/webhook" style={{ direction: 'ltr', marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={testWebhook} disabled={testingWebhook} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    {testingWebhook ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
                    اختبر الـ Webhook
                  </button>
                  {webhookTestResult && (
                    <span style={{ fontSize: '13px', color: webhookTestResult.startsWith('✓') ? '#10B981' : '#EF4444' }}>{webhookTestResult}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={saveProfile} className="btn-primary">حفظ</button>
                <a href="/api-docs" style={{ fontSize: '13px', color: '#A78BFA', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ExternalLink size={13} /> توثيق الـ API
                </a>
              </div>
            </div>
          )}

          {/* ─── NOTIFICATIONS ─── */}
          {tab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>إعدادات الإشعارات</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
                {[
                  { key: 'email', label: 'إشعارات البريد الإلكتروني', desc: 'استلم ملخصاً أسبوعياً بنشاطك' },
                  { key: 'device_connected', label: 'اتصال جهاز', desc: 'عند اتصال أي جهاز واتساب' },
                  { key: 'device_disconnected', label: 'انقطاع جهاز', desc: 'تنبيه فوري عند انقطاع الاتصال' },
                  { key: 'campaign_completed', label: 'اكتمال حملة', desc: 'عند انتهاء إرسال حملة' },
                ].map(n => (
                  <label key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer', padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{n.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{n.desc}</div>
                    </div>
                    <div onClick={() => setNotifications({ ...notifications, [n.key]: !(notifications as any)[n.key] })}
                      style={{ width: '40px', height: '22px', borderRadius: '11px', background: (notifications as any)[n.key] ? 'var(--accent-violet)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: '4px', width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'right 0.2s', right: (notifications as any)[n.key] ? '4px' : '22px' }} />
                    </div>
                  </label>
                ))}
                <button onClick={saveProfile} disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>حفظ</button>
              </div>
            </div>
          )}

          {/* ─── TIMEZONE & LANGUAGE ─── */}
          {tab === 'timezone' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>الوقت واللغة</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>المنطقة الزمنية</label>
                  <select className="input-cosmic" value={timezone} onChange={e => setTimezone(e.target.value)}>
                    {timezones.map(tz => <option key={tz.v} value={tz.v}>{tz.l}</option>)}
                  </select>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    الوقت الحالي: {new Date().toLocaleString('ar', { timeZone: timezone, hour12: true })}
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>لغة الواجهة</label>
                  <select className="input-cosmic" value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <button onClick={saveProfile} disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      <ConfirmDialog
        open={regenerateConfirm}
        title="تجديد مفتاح API"
        description="سيتم إلغاء المفتاح الحالي ولن يعمل في أي تطبيقات مرتبطة به. هل تريد المتابعة؟"
        confirmLabel="تجديد"
        cancelLabel="إلغاء"
        variant="warning"
        onConfirm={() => { setRegenerateConfirm(false); regenerateApiKey() }}
        onCancel={() => setRegenerateConfirm(false)}
      />
      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @media (max-width: 640px) { .settings-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
