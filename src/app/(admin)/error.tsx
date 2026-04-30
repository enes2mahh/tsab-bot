'use client'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', direction: 'rtl' }}>
      <div style={{ textAlign: 'center', padding: '40px', maxWidth: '480px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚨</div>
        <h2 style={{ color: '#F87171', fontSize: '22px', marginBottom: '12px' }}>خطأ في لوحة الإدارة</h2>
        <p style={{ color: '#94A3B8', marginBottom: '24px', lineHeight: '1.6' }}>
          حدث خطأ غير متوقع. يرجى المحاولة مجدداً.
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
