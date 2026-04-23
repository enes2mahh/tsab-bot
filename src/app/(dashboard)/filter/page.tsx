'use client'

import { useState } from 'react'
import { Filter, CheckCircle, Copy, Download, Upload, Trash2 } from 'lucide-react'

export default function FilterPage() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState({ removeDuplicates: true, removeEmpty: true, formatInternational: true })

  const handleFilter = () => {
    setLoading(true)
    const lines = input.split('\n').map(l => l.trim())
    let phones = lines

    if (options.removeEmpty) phones = phones.filter(p => p.length > 0)

    if (options.formatInternational) {
      phones = phones.map(p => {
        p = p.replace(/[\s\-\(\)\+]/g, '')
        if (p.startsWith('00')) p = p.slice(2)
        if (p.startsWith('0') && p.length === 10) p = '966' + p.slice(1)
        return p
      }).filter(p => p.length >= 10 && p.length <= 15 && /^\d+$/.test(p))
    }

    if (options.removeDuplicates) phones = [...new Set(phones)]

    setResults(phones)
    setLoading(false)
  }

  const copyAll = () => navigator.clipboard.writeText(results.join('\n'))
  const exportTxt = () => {
    const blob = new Blob([results.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'filtered_numbers.txt'; a.click()
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>فلتر الأرقام</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>تنظيف وتنسيق أرقام الهاتف</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>الأرقام المُدخلة</h3>
          <textarea
            className="input-cosmic"
            rows={14}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="أدخل الأرقام هنا، رقم لكل سطر:&#10;0501234567&#10;+966507654321&#10;00966512345678"
            style={{ resize: 'vertical', direction: 'ltr', fontSize: '13px' }}
          />

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'removeDuplicates', label: 'حذف الأرقام المكررة' },
              { key: 'removeEmpty', label: 'حذف الأسطر الفارغة' },
              { key: 'formatInternational', label: 'تنسيق دولي (إزالة 00 و +)' },
            ].map(opt => (
              <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={(options as any)[opt.key]} onChange={e => setOptions({ ...options, [opt.key]: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--accent-violet)' }} />
                {opt.label}
              </label>
            ))}
          </div>

          <button onClick={handleFilter} disabled={loading || !input.trim()} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
            <Filter size={16} /> {loading ? 'جاري الفلترة...' : 'فلتر الأرقام'}
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              النتائج{results.length > 0 && <span style={{ fontSize: '13px', color: '#10B981', marginRight: '8px' }}>({results.length} رقم)</span>}
            </h3>
            {results.length > 0 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={copyAll} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><Copy size={13} /> نسخ</button>
                <button onClick={exportTxt} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><Download size={13} /> تصدير</button>
              </div>
            )}
          </div>
          <textarea
            className="input-cosmic"
            rows={14}
            value={results.join('\n')}
            readOnly
            placeholder="النتائج ستظهر هنا بعد الفلترة..."
            style={{ resize: 'vertical', direction: 'ltr', fontSize: '13px', background: results.length > 0 ? 'rgba(16,185,129,0.05)' : undefined }}
          />
          {results.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px', fontSize: '13px' }}>
              <span style={{ color: '#10B981' }}>✓ صالح: {results.length}</span>
              <span style={{ color: '#EF4444' }}>✗ محذوف: {input.split('\n').filter(l => l.trim()).length - results.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
