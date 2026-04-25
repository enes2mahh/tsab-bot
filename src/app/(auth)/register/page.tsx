'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff, Zap, AlertCircle, CheckCircle } from 'lucide-react'
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

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return }
    if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    if (!agreed) { setError('يجب الموافقة على الشروط والأحكام'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, referral_code: referralCode || null }, emailRedirectTo: `${window.location.origin}/home` },
    })

    if (error) {
      // Show actual error for debugging
      const msg = error.message === 'User already registered'
        ? 'هذا البريد الإلكتروني مسجّل مسبقاً'
        : `خطأ: ${error.message}`
      setError(msg)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/home'), 2000)
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>إنشاء حساب جديد</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>ابدأ تجربتك المجانية 7 أيام</p>
        </div>

        <div className="glass" style={{ borderRadius: '20px', padding: '32px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle size={48} color="#10B981" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>تم إنشاء الحساب! 🎉</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>جاري تحويلك للوحة التحكم...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister}>
              {[
                { id: 'register-name', type: 'text', value: name, set: setName, label: 'الاسم الكامل', placeholder: 'محمد أحمد', icon: <User size={16} /> },
                { id: 'register-email', type: 'email', value: email, set: setEmail, label: 'البريد الإلكتروني', placeholder: 'example@email.com', icon: <Mail size={16} /> },
              ].map(f => (
                <div key={f.id} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <input id={f.id} type={f.type} required value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="input-cosmic" style={{ paddingRight: '44px' }} />
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>{f.icon}</span>
                  </div>
                </div>
              ))}

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
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب مجاناً'}
              </button>
            </form>
          )}

          {!success && (
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
