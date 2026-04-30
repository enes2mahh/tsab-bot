'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ background: '#0F0F1A', color: '#E2E8F0', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '40px', maxWidth: '500px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ color: '#A78BFA', fontSize: '24px', marginBottom: '12px' }}>حدث خطأ غير متوقع</h1>
          <p style={{ color: '#94A3B8', marginBottom: '24px', lineHeight: '1.6' }}>
            نعتذر عن هذا الخطأ. يرجى المحاولة مجدداً أو التواصل مع الدعم إذا استمرت المشكلة.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <pre style={{ background: '#1E1E2E', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#F87171', textAlign: 'left', marginBottom: '24px', overflow: 'auto' }}>
              {error.message}
            </pre>
          )}
          <button
            onClick={reset}
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '10px', fontSize: '16px', cursor: 'pointer' }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  )
}
