'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Download, Globe, Filter, Phone, X, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { exportData, type ExportFormat } from '@/lib/export'

interface ContactRow {
  id: string
  user_id: string
  phone: string
  name: string | null
  email: string | null
  country_code: string | null
  source: string
  tags: string[]
  created_at: string
  profiles: { name: string | null; email: string }
}

const COUNTRY_NAMES: Record<string, string> = {
  '+966': '🇸🇦 السعودية',
  '+971': '🇦🇪 الإمارات',
  '+20': '🇪🇬 مصر',
  '+962': '🇯🇴 الأردن',
  '+965': '🇰🇼 الكويت',
  '+974': '🇶🇦 قطر',
  '+973': '🇧🇭 البحرين',
  '+968': '🇴🇲 عُمان',
  '+963': '🇸🇾 سوريا',
  '+964': '🇮🇶 العراق',
  '+961': '🇱🇧 لبنان',
  '+970': '🇵🇸 فلسطين',
  '+212': '🇲🇦 المغرب',
  '+213': '🇩🇿 الجزائر',
  '+216': '🇹🇳 تونس',
  '+218': '🇱🇾 ليبيا',
  '+249': '🇸🇩 السودان',
  '+1': '🇺🇸 USA/Canada',
  '+44': '🇬🇧 UK',
}

const SOURCE_LABELS: Record<string, string> = {
  manual: 'يدوي',
  wa_phonebook: 'واتساب (دليل)',
  wa_chats: 'واتساب (محادثات)',
  imported_csv: 'CSV',
  campaign: 'حملة',
}

export default function AdminAllContactsPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    createClient()
      .from('contacts')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(2000)
      .then(({ data }) => {
        setContacts((data || []) as any)
        setLoading(false)
      })
  }, [])

  const filtered = contacts.filter((c) => {
    if (filterCountry && c.country_code !== filterCountry) return false
    if (filterSource && c.source !== filterSource) return false
    if (filterUser && c.user_id !== filterUser) return false
    if (search) {
      const s = search.toLowerCase()
      return c.phone.includes(s)
        || c.name?.toLowerCase().includes(s)
        || c.email?.toLowerCase().includes(s)
        || c.profiles?.name?.toLowerCase().includes(s)
        || c.profiles?.email?.toLowerCase().includes(s)
    }
    return true
  })

  const countryStats = contacts.reduce<Record<string, number>>((acc, c) => {
    if (c.country_code) acc[c.country_code] = (acc[c.country_code] || 0) + 1
    return acc
  }, {})

  const sourceStats = contacts.reduce<Record<string, number>>((acc, c) => {
    acc[c.source] = (acc[c.source] || 0) + 1
    return acc
  }, {})

  const uniqueUsers = Array.from(new Map(contacts.map((c) => [c.user_id, c.profiles])).entries())
    .filter(([, p]) => p)

  const handleExport = (format: ExportFormat) => {
    setExportOpen(false)
    exportData(
      filtered,
      [
        { header: 'الاسم', accessor: (c) => c.name || '' },
        { header: 'الهاتف', accessor: (c) => c.phone },
        { header: 'الدولة', accessor: (c) => c.country_code || '' },
        { header: 'البريد', accessor: (c) => c.email || '' },
        { header: 'المالك', accessor: (c) => c.profiles?.name || '' },
        { header: 'بريد المالك', accessor: (c) => c.profiles?.email || '' },
        { header: 'المصدر', accessor: (c) => SOURCE_LABELS[c.source] || c.source },
        { header: 'التصنيفات', accessor: (c) => (c.tags || []).join('; ') },
        { header: 'تاريخ الإضافة', accessor: (c) => new Date(c.created_at).toISOString().slice(0, 10) },
      ],
      `tsab-all-contacts-${new Date().toISOString().slice(0, 10)}`,
      format,
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>كل جهات الاتصال</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>جهات اتصال جميع المستخدمين عبر المنصة — {contacts.length.toLocaleString('ar')} رقم</p>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setExportOpen(!exportOpen)} className="btn-primary">
            <Download size={15} /> تصدير ({filtered.length}) <ChevronDown size={13} />
          </button>
          {exportOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100 }}>
              <button onClick={() => handleExport('csv')} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'Tajawal, sans-serif', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>📄 CSV</button>
              <button onClick={() => handleExport('xlsx')} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'Tajawal, sans-serif', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border)' }}>📊 Excel</button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div className="stat-card" style={{ borderTopColor: '#7C3AED' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>إجمالي الأرقام</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{contacts.length.toLocaleString('ar')}</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#10B981' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>دول مختلفة</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{Object.keys(countryStats).length}</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#F59E0B' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>مستخدمون نشطون</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{uniqueUsers.length}</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#2563EB' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>مستورد من واتساب</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{(sourceStats.wa_chats || 0) + (sourceStats.wa_phonebook || 0)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <input className="input-cosmic" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث برقم/اسم/بريد..." style={{ paddingRight: '40px' }} />
          <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        <select className="input-cosmic" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} style={{ width: '180px' }}>
          <option value="">كل الدول</option>
          {Object.keys(countryStats).sort().map((cc) => (
            <option key={cc} value={cc}>{COUNTRY_NAMES[cc] || cc} ({countryStats[cc]})</option>
          ))}
        </select>
        <select className="input-cosmic" value={filterSource} onChange={(e) => setFilterSource(e.target.value)} style={{ width: '160px' }}>
          <option value="">كل المصادر</option>
          {Object.keys(sourceStats).map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s] || s} ({sourceStats[s]})</option>
          ))}
        </select>
        <select className="input-cosmic" value={filterUser} onChange={(e) => setFilterUser(e.target.value)} style={{ width: '220px' }}>
          <option value="">كل المستخدمين</option>
          {uniqueUsers.map(([uid, p]: any) => (
            <option key={uid} value={uid}>{p?.name || p?.email}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px' }}>{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '40px', marginBottom: '8px', borderRadius: '8px' }} />)}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>لا توجد نتائج</p>
          </div>
        ) : (
          <table className="table-cosmic">
            <thead>
              <tr><th>الاسم</th><th>الهاتف</th><th>الدولة</th><th>المالك</th><th>المصدر</th><th>التاريخ</th></tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((c) => (
                <tr key={c.id}>
                  <td style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{c.name || '—'}</td>
                  <td style={{ fontSize: '13px', direction: 'ltr', textAlign: 'right' }}>
                    <a href={`https://wa.me/${c.phone}`} target="_blank" style={{ color: 'var(--accent-violet-light)', textDecoration: 'none' }}>{c.phone}</a>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.country_code ? (COUNTRY_NAMES[c.country_code] || c.country_code) : '—'}</td>
                  <td>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{c.profiles?.name || '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.profiles?.email}</div>
                  </td>
                  <td><span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', background: 'rgba(124,58,237,0.1)', color: '#A78BFA' }}>{SOURCE_LABELS[c.source] || c.source}</span></td>
                  <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString('ar-SA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filtered.length > 500 && (
          <div style={{ padding: '14px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
            معروض 500 من {filtered.length} — استخدم الفلاتر للتضييق أو صدّر للحصول على الكل
          </div>
        )}
      </div>
    </div>
  )
}
