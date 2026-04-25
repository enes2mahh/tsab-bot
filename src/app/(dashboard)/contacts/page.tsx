'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Plus, Search, Import, Download, Trash2, Tag, Phone, X, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Contact {
  id: string; phone: string; name: string | null; email: string | null
  tags: string[]; notes: string | null; is_blocked: boolean; created_at: string
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

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Contact | null>(null)

  const fetchContacts = async () => {
    const { data } = await createClient().from('contacts').select('*').order('created_at', { ascending: false })
    setContacts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchContacts() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذه الجهة؟')) return
    await createClient().from('contacts').delete().eq('id', id)
    fetchContacts()
  }

  const exportCSV = () => {
    const csv = ['الاسم,الهاتف,البريد,التصنيفات', ...contacts.map(c => `${c.name || ''},${c.phone},${c.email || ''},${c.tags?.join(';') || ''}`)].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'contacts.csv'; a.click()
  }

  const importFromWhatsApp = async () => {
    const supabase = createClient()
    const { data: devices } = await supabase.from('devices').select('id, name, status').eq('status', 'connected')
    if (!devices?.length) {
      alert('⚠️ ما في جهاز متصل. اربط جهاز أولاً من صفحة الأجهزة.')
      return
    }
    const deviceId = devices.length === 1 ? devices[0].id : prompt(`اختر جهازاً:\n${devices.map((d: any, i: number) => `${i + 1}. ${d.name}`).join('\n')}\n\nأدخل الرقم:`)?.trim()
      .split('').map(Number)[0]
    let target: any
    if (devices.length === 1) target = devices[0]
    else if (deviceId !== undefined && devices[deviceId - 1]) target = devices[deviceId - 1]
    else return

    const r = await fetch('/api/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: target.id, source: 'chats' }),
    })
    const data = await r.json()
    if (data.success) {
      alert(`✅ تم استيراد ${data.imported} جهة اتصال جديدة من ${data.total || 0}`)
      fetchContacts()
    } else {
      alert(data.error || 'فشل الاستيراد')
    }
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const lines = (ev.target?.result as string).split('\n').slice(1)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const toInsert = lines.filter(l => l.trim()).map(l => {
        const [name, phone] = l.split(',')
        return { user_id: user.id, phone: phone?.trim() || '', name: name?.trim() || null }
      }).filter(c => c.phone)
      if (toInsert.length) { await supabase.from('contacts').upsert(toInsert, { onConflict: 'user_id,phone' }); fetchContacts() }
    }
    reader.readAsText(file)
  }

  const filtered = contacts.filter(c =>
    c.phone.includes(search) || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.includes(search)
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div><h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>دليل الهاتف</h2><p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{contacts.length} جهة اتصال</p></div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={importFromWhatsApp} className="btn-secondary" style={{ background: 'rgba(37,211,102,0.1)', borderColor: 'rgba(37,211,102,0.3)', color: '#25D366' }}>
            <MessageCircle size={15} /> استيراد من واتساب
          </button>
          <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Import size={15} /> استيراد CSV
            <input type="file" hidden accept=".csv" onChange={handleImportCSV} />
          </label>
          <button onClick={exportCSV} className="btn-secondary"><Download size={15} /> تصدير</button>
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
        )}
      </div>
      {showForm && <ContactForm onClose={() => setShowForm(false)} onSaved={fetchContacts} existing={editItem} />}
    </div>
  )
}
