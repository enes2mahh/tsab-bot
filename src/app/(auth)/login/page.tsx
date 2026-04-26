'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Zap, AlertCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StarField } from '@/components/cosmic/StarField'
import { FloatingOrbs } from '@/components/cosmic/FloatingOrbs'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail }),
    })
    setForgotSent(true)
    setForgotLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      setLoading(false)
    } else {
      router.push('/home')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '24px',
      }}
    >
      <StarField />
      <FloatingOrbs />

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'var(--gradient)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 0 40px rgba(124,58,237,0.4)',
            }}
          >
            <Zap size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            أهلاً بك في Tsab Bot
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            سجّل دخولك للمتابعة
          </p>
        </div>

        {/* Card */}
        <div
          className="glass auth-card"
          style={{ borderRadius: '20px', padding: '32px' }}
        >
          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}
              >
                البريد الإلكتروني
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="input-cosmic"
                  style={{ paddingRight: '44px' }}
                />
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}
              >
                كلمة المرور
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-cosmic"
                  style={{ paddingRight: '44px', paddingLeft: '44px' }}
                />
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ textAlign: 'left', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotSent(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--accent-violet-light)', padding: 0 }}>
                  نسيت كلمة المرور؟
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  color: '#EF4444',
                  fontSize: '13px',
                }}
              >
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  جاري تسجيل الدخول...
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
            ليس لديك حساب؟{' '}
            <Link href="/register" style={{ color: 'var(--accent-violet-light)', textDecoration: 'none', fontWeight: 600 }}>
              سجّل الآن
            </Link>
          </p>
        </div>
      </div>

      {showForgot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)', padding: '24px' }} onClick={e => e.target === e.currentTarget && setShowForgot(false)}>
          <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>إعادة تعيين كلمة المرور</h3>
              <button onClick={() => setShowForgot(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            {forgotSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📧</div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>تم إرسال رابط إعادة التعيين!</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>تحقق من بريدك الإلكتروني <strong>{forgotEmail}</strong> واضغط على الرابط.</p>
                <button onClick={() => setShowForgot(false)} className="btn-primary" style={{ marginTop: '20px', justifyContent: 'center' }}>حسناً</button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.</p>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>البريد الإلكتروني</label>
                  <input type="email" required className="input-cosmic" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="example@email.com" style={{ direction: 'ltr' }} />
                </div>
                <button type="submit" disabled={forgotLoading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {forgotLoading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
