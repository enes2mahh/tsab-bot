'use client'

import { AlertTriangle, Info, Trash2, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const VARIANT_CONFIG = {
  danger: {
    iconBg: 'rgba(239,68,68,0.12)',
    iconColor: '#EF4444',
    btnBg: 'linear-gradient(135deg, #EF4444, #DC2626)',
    btnShadow: 'rgba(239,68,68,0.4)',
    icon: Trash2,
  },
  warning: {
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#F59E0B',
    btnBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
    btnShadow: 'rgba(245,158,11,0.4)',
    icon: AlertTriangle,
  },
  info: {
    iconBg: 'rgba(124,58,237,0.12)',
    iconColor: '#7C3AED',
    btnBg: 'var(--gradient)',
    btnShadow: 'rgba(124,58,237,0.4)',
    icon: Info,
  },
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  const cfg = VARIANT_CONFIG[variant]
  const Icon = cfg.icon

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(8px)',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="glass"
        style={{
          borderRadius: '20px',
          padding: '28px',
          width: '420px',
          maxWidth: '95vw',
          textAlign: 'center',
        }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          style={{ position: 'absolute', top: '16px', left: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: cfg.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Icon size={28} color={cfg.iconColor} />
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            {description}
          </p>
        )}
        {!description && <div style={{ marginBottom: '24px' }} />}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: cfg.btnBg,
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
              fontFamily: 'Tajawal, sans-serif',
            }}
          >
            {loading ? 'جاري التنفيذ...' : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for easy usage
import { useState, useCallback } from 'react'

interface UseConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    resolve: ((v: boolean) => void) | null
    options: UseConfirmOptions
  }>({
    open: false,
    resolve: null,
    options: { title: '' },
  })

  const confirm = useCallback((options: UseConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, resolve, options })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState(s => ({ ...s, open: false }))
  }, [state])

  const handleCancel = useCallback(() => {
    state.resolve?.(false)
    setState(s => ({ ...s, open: false }))
  }, [state])

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.options.title}
      description={state.options.description}
      confirmLabel={state.options.confirmLabel}
      variant={state.options.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )

  return { confirm, dialog }
}
