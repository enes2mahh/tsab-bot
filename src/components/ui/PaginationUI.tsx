'use client'

import { ChevronRight, ChevronLeft } from 'lucide-react'

interface PaginationUIProps {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
  onNext: () => void
  onPrev: () => void
}

export function PaginationUI({
  page,
  totalPages,
  totalCount,
  pageSize,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
}: PaginationUIProps) {
  if (totalPages <= 1) return null

  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalCount)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderTop: '1px solid var(--border)',
      flexWrap: 'wrap',
      gap: '8px',
    }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        عرض {from}–{to} من {totalCount.toLocaleString('ar-SA')}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: hasPrev ? 'var(--bg-card)' : 'transparent',
            color: hasPrev ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: hasPrev ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontFamily: 'Tajawal, sans-serif',
          }}
        >
          <ChevronRight size={14} /> السابق
        </button>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '0 8px' }}>
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={!hasNext}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: hasNext ? 'var(--bg-card)' : 'transparent',
            color: hasNext ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: hasNext ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontFamily: 'Tajawal, sans-serif',
          }}
        >
          التالي <ChevronLeft size={14} />
        </button>
      </div>
    </div>
  )
}
