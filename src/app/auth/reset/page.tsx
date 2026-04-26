'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StarField } from '@/components/cosmic/StarField'
import { FloatingOrbs } from '@/components/cosmic/FloatingOrbs'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Handle hash-based tokens (older Supabase flow)
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.slice(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        createClient().auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(() => setSessionReady(true))
        return
      }
    }
    // PKCE flow: session already set by /auth/callback route
    createClient().auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
      else setError('رابط إعادة التعيين منتهي الصلاحية. اطلب رابطاً جديداً.')
    })
  }, [])

  const strengthScore = () => {
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  }
  const score = strengthScore()
  const strengthColor = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#10B981'][score]
  const strengthLabel = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'قوية', 'قوية جداً'][score]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('كلمتا المرور غير متطابقتين'); return }
    if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    setLoading(true)
    setError('')
    const { error } = await createClient().auth.updateUser({ password })
    if (error) {
      setError('فشل تحديث كلمة المرور. حاول مجدداً.')
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/home'), 2500)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--gradient)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>
          <Zap size={28} color="white" />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>تعيين كلمة مرور جديدة</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>أدخل كلمة المرور الجديدة لحسابك</p>
      </div>

      <div className="glass" style={{ borderRadius: '20px', padding: '32px' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={56} color="#10B981" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#10B981', marginBottom: '8px' }}>تم تغيير كلمة المرور!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>سيتم تحويلك للوحة التحكم...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '16px', color: '#EF4444', fontSize: '13px' }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>كلمة المرور الجديدة</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="input-cosmic" style={{ paddingRight: '44px', paddingLeft: '44px' }} disabled={!sessionReady} />
                <Lock size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(score / 4) * 100}%`, background: strengthColor, borderRadius: '2px', transition: 'all 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: strengthColor, marginTop: '4px', display: 'block' }}>{strengthLabel}</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>تأكيد كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} required value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••" className="input-cosmic" style={{ paddingRight: '44px' }} disabled={!sessionReady} />
                <Lock size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: confirm && confirm === password ? '#10B981' : 'var(--text-muted)' }} />
              </div>
              {confirm && confirm !== password && (
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>كلمتا المرور غير متطابقتين</p>
              )}
            </div>

            <button type="submit" disabled={loading || !sessionReady || !password || password !== confirm} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', opacity: (loading || !sessionReady) ? 0.7 : 1 }}>
              {loading ? 'جاري الحفظ...' : !sessionReady && !error ? 'جاري التحقق...' : 'حفظ كلمة المرور الجديدة'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '24px' }}>
      <StarField />
      <FloatingOrbs />
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </div>
  )
}
