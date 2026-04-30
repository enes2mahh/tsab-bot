'use client'

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', direction: 'rtl', background: '#0F0F1A' }}>
      <div style={{ textAlign: 'center', padding: '40px', maxWidth: '420px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ color: '#A78BFA', fontSize: '22px', marginBottom: '12px' }}>حدث خطأ</h2>
        <p style={{ color: '#94A3B8', marginBottom: '24px', lineHeight: '1.6' }}>
          يرجى المحاولة مجدداً أو التواصل مع الدعم.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <pre style={{ background: '#1E1E2E', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#F87171', textAlign: 'left', marginBottom: '24px', overflow: 'auto' }}>
            {error.message}
          </pre>
        )}
        <button onClick={reset} className="btn-cosmic" style={{ padding: '10px 28px' }}>
          إعادة المحاولة
        </button>
      </div>
    </div>
  )
}
