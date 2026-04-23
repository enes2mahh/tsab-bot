'use client'

export function FloatingOrbs() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Violet orb */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite',
          filter: 'blur(40px)',
        }}
      />
      {/* Blue orb */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '5%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
          animation: 'float 10s ease-in-out infinite reverse',
          filter: 'blur(50px)',
        }}
      />
      {/* Emerald orb */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '30%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)',
          animation: 'float 12s ease-in-out infinite',
          filter: 'blur(60px)',
        }}
      />
    </div>
  )
}
