'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, Phone, Eye, EyeOff, Zap, AlertCircle, CheckCircle, MessageCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StarField } from '@/components/cosmic/StarField'
import { FloatingOrbs } from '@/components/cosmic/FloatingOrbs'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8 أحرف على الأقل', valid: password.length >= 8 },
    { label: 'حرف كبير', valid: /[A-Z]/.test(password) },
    { label: 'رقم', valid: /\d/.test(password) },
  ]
  const strength = checks.filter((c) => c.valid).length
  const colors = ['#EF4444', '#F59E0B', '#10B981']
  if (!password) return null
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: '3px', flex: 1, borderRadius: '2px', background: i < strength ? colors[strength - 1] : 'var(--border)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {checks.map((c) => (
          <span key={c.label} style={{ fontSize: '11px', color: c.valid ? '#10B981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {c.valid ? <CheckCircle size={10} /> : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

type Step = 'form' | 'otp' | 'success'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [otp, setOtp] = useState('')
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null)
  const [otpSkipped, setOtpSkipped] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return }
    if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    if (!agreed) { setError('يجب الموافقة على الشروط والأحكام'); return }
    if (!phone || phone.replace(/\D/g, '').length < 8) { setError('أدخل رقم هاتف صحيح'); return }

    setLoading(true)

    try {
      const r = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'register' }),
      })
      const data = await r.json()

      if (!r.ok) {
        setError(data.error || 'فشل إرسال الرمز')
        setLoading(false)
        return
      }

      if (data.otp_skipped) {
        // No OTP device configured — proceed directly to register
        setOtpSkipped(true)
        await completeRegister(null)
        return
      }

      setStep('otp')
      setResendIn(60)
      const interval = setInterval(() => {
        setResendIn((s) => {
          if (s <= 1) { clearInterval(interval); return 0 }
          return s - 1
        })
      }, 1000)
    } catch {
      setError('خطأ في الاتصال')
    }
    setLoading(false)
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (otp.length !== 6) { setError('الرمز يجب أن يكون 6 أرقام'); return }

    setLoading(true)
    try {
      const r = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      })
      const data = await r.json()

      if (!r.ok) {
        setError(data.error || 'الرمز غير صحيح')
        setLoading(false)
        return
      }

      setVerifiedToken(data.verifiedToken)
      await completeRegister(data.verifiedToken)
    } catch {
      setError('خطأ في الاتصال')
      setLoading(false)
    }
  }

  const completeRegister = async (token: string | null) => {
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, verifiedToken: token, referralCode }),
      })
      const data = await r.json()

      if (!r.ok) {
        setError(data.error || 'فشل إنشاء الحساب')
        setLoading(false)
        setStep('form')
        return
      }

      // Auto sign-in
      const supabase = createClient()
      await supabase.auth.signInWithPassword({ email, password })

      setStep('success')
      setTimeout(() => router.push('/home'), 2000)
    } catch {
      setError('خطأ في الاتصال')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '24px' }}>
      <StarField />
      <FloatingOrbs />

      <div style={{ width: '100%', maxWidth: '450px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--gradient)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>
            <Zap size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {step === 'otp' ? 'تحقق من رقمك' : step === 'success' ? '🎉 مرحباً بك' : 'إنشاء حساب جديد'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {step === 'otp' ? `أرسلنا رمزاً إلى ${phone} عبر واتساب` : step === 'success' ? 'جاري تحويلك...' : 'ابدأ تجربتك المجانية'}
          </p>
        </div>

        <div className="glass auth-card" style={{ borderRadius: '20px', padding: '32px' }}>
          {step === 'success' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle size={56} color="#10B981" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>تم إنشاء الحساب</h3>
              {!otpSkipped && verifiedToken && <div style={{ fontSize: '12px', color: '#10B981', marginTop: '8px' }}>✅ رقم هاتفك تم التحقق منه</div>}
            </div>
          ) : step === 'otp' ? (
            <form onSubmit={handleVerifyOTP}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>رمز التحقق (6 أرقام)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="input-cosmic"
                  style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontFamily: 'monospace' }}
                  autoFocus
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                  افحص محادثاتك على واتساب — صلاحية الرمز 10 دقائق
                </p>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '16px', color: '#EF4444', fontSize: '13px' }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}>
                {loading ? 'جاري التحقق...' : 'تحقّق وأنشئ الحساب'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <button type="button" onClick={() => { setStep('form'); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowLeft size={12} /> تغيير الرقم
                </button>
                {resendIn > 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>إعادة الإرسال خلال {resendIn}s</span>
                ) : (
                  <button type="button" onClick={(e) => handleSendOTP(e as any)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-violet-light)', fontFamily: 'Tajawal, sans-serif' }}>
                    إعادة إرسال الرمز
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleSendOTP}>
              {[
                { id: 'register-name', type: 'text', value: name, set: setName, label: 'الاسم الكامل', placeholder: 'محمد أحمد', icon: <User size={16} />, required: true },
                { id: 'register-email', type: 'email', value: email, set: setEmail, label: 'البريد الإلكتروني', placeholder: 'example@email.com', icon: <Mail size={16} />, required: true },
              ].map(f => (
                <div key={f.id} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <input id={f.id} type={f.type} required={f.required} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="input-cosmic" style={{ paddingRight: '44px' }} />
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>{f.icon}</span>
                  </div>
                </div>
              ))}

              {/* Phone — WA OTP */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                  رقم الواتساب <span style={{ color: '#10B981', fontSize: '11px' }}>(للتحقق)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="register-phone"
                    type="tel"
                    inputMode="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="9665XXXXXXXX"
                    className="input-cosmic"
                    style={{ paddingRight: '44px', direction: 'ltr' }}
                  />
                  <Phone size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>سنرسل رمز تحقق على واتساب</p>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>كلمة المرور</label>
                <div style={{ position: 'relative' }}>
                  <input id="register-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-cosmic" style={{ paddingRight: '44px', paddingLeft: '44px' }} />
                  <Lock size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>تأكيد كلمة المرور</label>
                <input id="register-confirm-password" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="input-cosmic" />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                  كود الإحالة <span style={{ color: 'var(--text-muted)' }}>(اختياري)</span>
                </label>
                <input id="register-referral" type="text" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} placeholder="ABCD1234" className="input-cosmic" />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
                <input id="register-terms" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: '3px', accentColor: 'var(--accent-violet)', width: '16px', height: '16px' }} />
                <label htmlFor="register-terms" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.5 }}>
                  أوافق على{' '}<a href="/terms" target="_blank" style={{ color: 'var(--accent-violet-light)', textDecoration: 'none' }}>شروط الخدمة</a>{' '}و{' '}<a href="/privacy" target="_blank" style={{ color: 'var(--accent-violet-light)', textDecoration: 'none' }}>سياسة الخصوصية</a>
                </label>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '16px', color: '#EF4444', fontSize: '13px' }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <button id="register-submit" type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
                <MessageCircle size={16} /> {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </button>
            </form>
          )}

          {step !== 'success' && step !== 'otp' && (
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
              لديك حساب بالفعل؟{' '}
              <Link href="/login" style={{ color: 'var(--accent-violet-light)', textDecoration: 'none', fontWeight: 600 }}>سجّل الدخول</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: 'var(--text-muted)' }}>جاري التحميل...</div></div>}>
      <RegisterForm />
    </Suspense>
  )
}
