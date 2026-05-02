interface SkeletonCardProps {
  count?: number
  height?: number | string
  gap?: number
}

export function SkeletonCard({ count = 4, height = 120, gap = 16 }: SkeletonCardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height, borderRadius: '12px' }} />
      ))}
    </div>
  )
}

interface SkeletonGridProps {
  count?: number
  columns?: number
  height?: number | string
}

export function SkeletonGrid({ count = 4, columns = 4, height = 100 }: SkeletonGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height, borderRadius: '12px' }} />
      ))}
    </div>
  )
}

export function SkeletonText({ lines = 3, widths }: { lines?: number; widths?: string[] }) {
  const defaultWidths = ['100%', '80%', '60%', '90%', '70%']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: '14px', borderRadius: '6px', width: widths?.[i] || defaultWidths[i % defaultWidths.length] }}
        />
      ))}
    </div>
  )
}
