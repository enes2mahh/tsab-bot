interface SkeletonTableProps {
  rows?: number
  columns?: number
  showHeader?: boolean
}

export function SkeletonTable({ rows = 5, columns = 5, showHeader = true }: SkeletonTableProps) {
  return (
    <div>
      {showHeader && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '12px',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '4px',
        }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '14px', borderRadius: '4px', width: '60%' }} />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '12px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="skeleton"
              style={{
                height: '14px',
                borderRadius: '4px',
                width: colIdx === 0 ? '80%' : colIdx === columns - 1 ? '40%' : '70%',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
