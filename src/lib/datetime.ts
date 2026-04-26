/**
 * Format a date string/Date object according to a user's saved timezone.
 * Falls back to Asia/Riyadh if no timezone provided.
 */
export function formatDate(
  date: string | Date | null | undefined,
  timezone = 'Asia/Riyadh',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'

  const defaults: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
    ...options,
  }

  try {
    return new Intl.DateTimeFormat('ar-SA', defaults).format(d)
  } catch {
    return new Intl.DateTimeFormat('ar-SA', { ...defaults, timeZone: 'Asia/Riyadh' }).format(d)
  }
}

export function formatDateOnly(date: string | Date | null | undefined, timezone = 'Asia/Riyadh'): string {
  return formatDate(date, timezone, { year: 'numeric', month: 'short', day: 'numeric', timeZone: timezone })
}

export function formatTimeOnly(date: string | Date | null | undefined, timezone = 'Asia/Riyadh'): string {
  return formatDate(date, timezone, { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone })
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  return formatDateOnly(date)
}
