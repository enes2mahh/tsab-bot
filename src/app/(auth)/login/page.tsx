'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Zap, AlertCircle } from 'lucide-react'
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
          className="glass"
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
                <a href="#" style={{ fontSize: '12px', color: 'var(--accent-violet-light)', textDecoration: 'none' }}>
                  نسيت كلمة المرور؟
                </a>
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

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
