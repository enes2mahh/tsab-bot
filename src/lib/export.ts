/**
 * Universal export helper.
 * Supports CSV (fast, no deps) and XLSX (using xlsx package).
 */

export type ExportFormat = 'csv' | 'xlsx'

export interface ExportColumn<T> {
  header: string
  accessor: (row: T) => string | number | null | undefined
}

export async function exportData<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  format: ExportFormat = 'csv',
) {
  const headers = columns.map((c) => c.header)
  const data = rows.map((r) => columns.map((c) => c.accessor(r) ?? ''))

  if (format === 'csv') {
    return exportCSV(headers, data, filename)
  }
  return exportXLSX(headers, data, filename)
}

function exportCSV(headers: string[], data: (string | number)[][], filename: string) {
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.map(escape).join(','), ...data.map((row) => row.map(escape).join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${filename}.csv`)
}

async function exportXLSX(headers: string[], data: (string | number)[][], filename: string) {
  // Lazy-load xlsx (~600KB) only when needed
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
  // Auto column widths
  const colWidths = headers.map((h, i) => {
    const max = Math.max(
      h.length,
      ...data.map((r) => String(r[i] ?? '').length),
    )
    return { wch: Math.min(50, Math.max(10, max + 2)) }
  })
  ws['!cols'] = colWidths
  // RTL by default for Arabic data
  if (!ws['!margins']) ws['!margins'] = { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  triggerDownload(blob, `${filename}.xlsx`)
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}
