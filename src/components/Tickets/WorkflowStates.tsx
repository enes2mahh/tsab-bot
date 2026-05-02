import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'

interface WorkflowStatesProps {
  currentStatus: string
  createdAt: string
  updatedAt: string
}

const STEPS = [
  { key: 'open',        label: 'مفتوح',         icon: AlertCircle,   color: '#F59E0B' },
  { key: 'in_progress', label: 'قيد المعالجة',  icon: Clock,         color: '#7C3AED' },
  { key: 'waiting',     label: 'بانتظار ردك',   icon: Clock,         color: '#60A5FA' },
  { key: 'closed',      label: 'مغلق',          icon: CheckCircle,   color: '#10B981' },
]

function getElapsed(from: string): string {
  const ms = Date.now() - new Date(from).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h >= 24) return `${Math.floor(h / 24)} يوم`
  if (h > 0) return `${h} س ${m} د`
  return `${m} دقيقة`
}

function getSLAColor(createdAt: string): string {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000
  if (hours > 48) return '#EF4444'
  if (hours > 24) return '#F59E0B'
  return '#10B981'
}

export function WorkflowStates({ currentStatus, createdAt, updatedAt }: WorkflowStatesProps) {
  const currentIdx = STEPS.findIndex(s => s.key === currentStatus)
  const elapsed = getElapsed(createdAt)
  const slaColor = getSLAColor(createdAt)

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
      {/* Progress steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '10px' }}>
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const isActive = i === currentIdx
          const isDone = i < currentIdx
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '60px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isActive ? step.color : isDone ? '#10B981' : 'var(--bg-secondary)',
                  border: `2px solid ${isActive ? step.color : isDone ? '#10B981' : 'var(--border-light)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s',
                }}>
                  <Icon size={12} color={isActive || isDone ? 'white' : 'var(--text-muted)'} />
                </div>
                <span style={{ fontSize: '9px', color: isActive ? step.color : isDone ? '#10B981' : 'var(--text-muted)', textAlign: 'center', fontWeight: isActive ? 700 : 400 }}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: isDone ? '#10B981' : 'var(--border)', margin: '0 4px', marginBottom: '18px', transition: 'background 0.3s' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* SLA timer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span style={{ color: slaColor, fontWeight: 600 }}>⏱ مضى {elapsed}</span>
        <span>آخر تحديث: {new Date(updatedAt).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}</span>
      </div>
    </div>
  )
}
