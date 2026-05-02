'use client'

import { useState, useRef } from 'react'
import { Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react'

interface ExportOption {
  label: string
  format: 'csv' | 'excel' | 'print'
}

interface ExportButtonProps {
  onExport: (format: 'csv' | 'excel' | 'print') => void
  loading?: boolean
}

export function ExportButton({ onExport, loading }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const options: ExportOption[] = [
    { label: 'CSV', format: 'csv' },
    { label: 'Excel', format: 'excel' },
    { label: 'طباعة / PDF', format: 'print' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="btn-secondary"
        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
      >
        <Download size={15} />
        تصدير
        <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            padding: '6px',
            zIndex: 999,
            minWidth: '160px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          }}>
            {options.map(opt => (
              <button
                key={opt.format}
                onClick={() => { setOpen(false); onExport(opt.format) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'Tajawal, sans-serif',
                  textAlign: 'right',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {opt.format === 'csv' ? <FileText size={14} color="#10B981" /> : opt.format === 'excel' ? <FileSpreadsheet size={14} color="#2563EB" /> : <FileText size={14} color="#F59E0B" />}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
