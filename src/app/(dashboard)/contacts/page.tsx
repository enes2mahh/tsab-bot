'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Plus, Search, Import, Download, Trash2, Tag, Phone, X, MessageCircle, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { exportData, type ExportFormat } from '@/lib/export'

interface Contact {
  id: string; phone: string; name: string | null; email: string | null
  tags: string[]; notes: string | null; is_blocked: boolean; created_at: string
}

function normalizePhone(raw: string): string {
  let phone = raw.replace(/\D/g, '')
  if (phone.startsWith('00')) phone = phone.slice(2)
  if (phone.startsWith('0') && phone.length <= 10) phone = '966' + phone.slice(1)
  return phone
}

function ContactForm({ onClose, onSaved, existing }: any) {
  const [form, setForm] = useState({ phone: existing?.phone || '', name: existing?.name || '', email: existing?.email || '', tags: (existing?.tags || []).join(', '), notes: existing?.notes || '' })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const data = { ...form, tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) }
    if (existing) { await supabase.from('contacts').update(data).eq('id', existing.id) }
    else { await supabase.from('contacts').insert({ ...data, user_id: user.id }) }
    setLoading(false); onSaved(); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '420px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{existing ? 'تعديل جهة اتصال' : 'إضافة جهة اتصال'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { key: 'phone', label: 'رقم الهاتف *', placeholder: '9665XXXXXXXX', dir: 'ltr' },
            { key: 'name', label: 'الاسم', placeholder: 'محمد أحمد' },
            { key: 'email', label: 'البريد الإلكتروني', placeholder: 'email@example.com', dir: 'ltr' },
            { key: 'tags', label: 'التصنيفات (مفصولة بفاصلة)', placeholder: 'عملاء، VIP، مهم' },
            { key: 'notes', label: 'ملاحظات', placeholder: 'أي ملاحظات...' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>{f.label}</label>
              <input className="input-cosmic" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={f.dir ? { direction: 'ltr' } : {}} />
            </div>
          ))}
          <button onClick={handleSave} disabled={loading || !form.phone} className="btn-primary" style={{ justifyContent: 'center' }}>{loading ? 'حفظ...' : 'حفظ'}</button>
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 100

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Contact | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const fetchContacts = async (p = page) => {
    setLoading(true)
    const { data, count } = await createClient()
      .from('contacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1)
    setContacts(data || [])
    setTotalCount(count || 0)
    setLoading(false)
  }

  useEffect(() => { fetchContacts(page) }, [page])

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذه الجهة؟')) return
    await createClient().from('contacts').delete().eq('id', id)
    fetchContacts(page)
  }

  const handleExport = (format: ExportFormat) => {
    setExportOpen(false)
    exportData(
      contacts,
      [
        { header: 'الاسم', accessor: (c) => c.name || '' },
        { header: 'الهاتف', accessor: (c) => c.phone },
        { header: 'البريد', accessor: (c) => c.email || '' },
        { header: 'التصنيفات', accessor: (c) => (c.tags || []).join('; ') },
        { header: 'الملاحظات', accessor: (c) => c.notes || '' },
        { header: 'تاريخ الإضافة', accessor: (c) => new Date(c.created_at).toLocaleDateString('en-CA') },
      ],
      `sends-contacts-${new Date().toISOString().slice(0, 10)}`,
      format,
    )
  }
  const _legacyExportCSV = () => {
    const csv = ['الاسم,الهاتف,البريد,التصنيفات', ...contacts.map(c => `${c.name || ''},${c.phone},${c.email || ''},${c.tags?.join(';') || ''}`)].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'contacts.csv'; a.click()
  }

  const pickDevice = async () => {
    const supabase = createClient()
    const { data: devices } = await supabase.from('devices').select('id, name, status').eq('status', 'connected')
    if (!devices?.length) {
      alert('⚠️ ما في جهاز متصل. اربط جهاز أولاً من صفحة الأجهزة.')
      return null
    }
    if (devices.length === 1) return devices[0]
    const choice = prompt(`اختر جهازاً:\n${devices.map((d: any, i: number) => `${i + 1}. ${d.name}`).join('\n')}\n\nأدخل الرقم:`)?.trim()
    const idx = parseInt(choice || '') - 1
    return devices[idx] ?? null
  }

  const importFromWhatsApp = async () => {
    const target = await pickDevice()
    if (!target) return
    const r = await fetch('/api/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: target.id, source: 'chats' }),
    })
    const data = await r.json()
    if (data.success) {
      alert(`✅ تم استيراد ${data.imported} جهة اتصال جديدة من ${data.total || 0}`)
      fetchContacts(0); setPage(0)
    } else {
      alert(data.error || 'فشل الاستيراد')
    }
  }

  const importFromPhonebook = async () => {
    const target = await pickDevice()
    if (!target) return
    const r = await fetch('/api/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: target.id, source: 'phonebook' }),
    })
    const data = await r.json()
    if (data.success) {
      alert(`✅ تم استيراد ${data.imported} جهة اتصال من دليل الهاتف (المجموع: ${data.total || 0})`)
      fetchContacts(0); setPage(0)
    } else {
      alert(data.error || 'فشل استيراد دليل الهاتف')
    }
  }

  const downloadTemplate = () => {
    const csv = 'Name,Phone,Email,Tags,Notes\nمحمد أحمد,966501234567,example@email.com,عملاء VIP,ملاحظة اختبار'
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'contacts-template.csv'; a.click()
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const allLines = (ev.target?.result as string).split('\n').map(l => l.trim()).filter(l => l)
      if (!allLines.length) return
      // Detect headers: if first row has non-numeric values in phone-like column
      const headerRow = allLines[0].toLowerCase()
      const hasHeaders = headerRow.includes('name') || headerRow.includes('phone') || headerRow.includes('اسم') || headerRow.includes('هاتف')
      const dataLines = hasHeaders ? allLines.slice(1) : allLines

      // Detect column order from header (Name, Phone, Email, Tags)
      let nameIdx = 0, phoneIdx = 1, emailIdx = 2, tagsIdx = 3
      if (hasHeaders) {
        const cols = headerRow.split(',').map((c: string) => c.trim())
        nameIdx = cols.findIndex((c: string) => c.includes('name') || c.includes('اسم') || c.includes('الاسم'))
        phoneIdx = cols.findIndex((c: string) => c.includes('phone') || c.includes('هاتف') || c.includes('رقم'))
        emailIdx = cols.findIndex((c: string) => c.includes('email') || c.includes('بريد'))
        tagsIdx = cols.findIndex((c: string) => c.includes('tag') || c.includes('تصنيف'))
        if (phoneIdx === -1) phoneIdx = 1
        if (nameIdx === -1) nameIdx = 0
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const toInsert = dataLines.filter(l => l).map(l => {
        const cols = l.split(',').map((c: string) => c.replace(/['"]/g, '').trim())
        const phone = normalizePhone(cols[phoneIdx] || '')
        const name = cols[nameIdx] || null
        const email = emailIdx >= 0 && cols[emailIdx] ? cols[emailIdx] : null
        const tags = tagsIdx >= 0 && cols[tagsIdx] ? cols[tagsIdx].split(';').map((t: string) => t.trim()).filter(Boolean) : []
        return { user_id: user.id, phone, name, email, tags }
      }).filter(c => c.phone && c.phone.length >= 8)

      if (toInsert.length) { await supabase.from('contacts').upsert(toInsert, { onConflict: 'user_id,phone' }); fetchContacts(0); setPage(0) }
      alert(`✅ تم استيراد ${toInsert.length} جهة اتصال`)
    }
    reader.readAsText(file)
  }

  const filtered = contacts.filter(c =>
    c.phone.includes(search) || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.includes(search)
  )

  return (
    <div>
      <div className="page-flex-header">
        <div><h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>دليل الهاتف</h2><p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{contacts.length} جهة اتصال</p></div>
        <div className="stack-mobile" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={importFromWhatsApp} className="btn-secondary" style={{ background: 'rgba(37,211,102,0.1)', borderColor: 'rgba(37,211,102,0.3)', color: '#25D366' }}>
            <MessageCircle size={15} /> استيراد المحادثات
          </button>
          <button onClick={importFromPhonebook} className="btn-secondary" style={{ background: 'rgba(37,211,102,0.1)', borderColor: 'rgba(37,211,102,0.3)', color: '#25D366' }}>
            <Phone size={15} /> استيراد دليل الهاتف
          </button>
          <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Import size={15} /> استيراد CSV
            <input type="file" hidden accept=".csv,.txt" onChange={handleImportCSV} />
          </label>
          <button onClick={downloadTemplate} className="btn-secondary" title="تنزيل قالب CSV فارغ" style={{ fontSize: '13px' }}>
            📋 قالب فارغ
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setExportOpen(!exportOpen)} className="btn-secondary">
              <Download size={15} /> تصدير <ChevronDown size={13} />
            </button>
            {exportOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100 }}>
                <button onClick={() => handleExport('csv')} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'Tajawal, sans-serif', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📄 CSV
                </button>
                <button onClick={() => handleExport('xlsx')} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'Tajawal, sans-serif', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border)' }}>
                  📊 Excel
                </button>
              </div>
            )}
          </div>
          <button onClick={() => { setEditItem(null); setShowForm(true) }} className="btn-primary"><Plus size={16} /> إضافة</button>
        </div>
      </div>

      <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '400px' }}>
        <input className="input-cosmic" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." style={{ paddingRight: '40px' }} />
        <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px' }}>{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '50px', marginBottom: '8px', borderRadius: '8px' }} />)}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <BookOpen size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>{search ? 'لا توجد نتائج' : 'لا توجد جهات اتصال'}</p>
          </div>
        ) : (
          <div className="responsive-table-wrap">
          <table className="table-cosmic">
            <thead><tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>التصنيفات</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px' }}>{c.name || '—'}</div></td>
                  <td style={{ fontSize: '13px', direction: 'ltr' }}>{c.phone}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(c.tags || []).map((tag, i) => <span key={i} style={{ padding: '2px 8px', background: 'rgba(124,58,237,0.15)', color: '#A78BFA', borderRadius: '8px', fontSize: '11px' }}>{tag}</span>)}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => { setEditItem(c); setShowForm(true) }} style={{ padding: '5px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#A78BFA' }}>✏️</button>
                      <button onClick={() => handleDelete(c.id)} style={{ padding: '5px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
      {/* Pagination */}
      {totalCount > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '16px', direction: 'ltr' }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-cosmic"
            style={{ padding: '6px 16px', opacity: page === 0 ? 0.4 : 1 }}
          >
            ‹
          </button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {page + 1} / {Math.ceil(totalCount / PAGE_SIZE)}
            <span style={{ marginRight: '8px', color: 'var(--text-muted)' }}>({totalCount} جهة)</span>
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * PAGE_SIZE >= totalCount}
            className="btn-cosmic"
            style={{ padding: '6px 16px', opacity: (page + 1) * PAGE_SIZE >= totalCount ? 0.4 : 1 }}
          >
            ›
          </button>
        </div>
      )}
      {showForm && <ContactForm onClose={() => setShowForm(false)} onSaved={() => { fetchContacts(0); setPage(0) }} existing={editItem} />}
    </div>
  )
}
