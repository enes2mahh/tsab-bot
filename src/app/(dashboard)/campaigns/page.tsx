'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Megaphone, Play, Pause, Square, Trash2, Clock, CheckCircle, XCircle, Loader, ChevronRight, ChevronLeft, X, Upload, Users, FileText, AlertCircle, BarChart2, Image as ImageIcon, FileUp, Video, Search, ChevronDown, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ===== TYPES =====
interface Campaign {
  id: string; name: string
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  total_count: number; sent_count: number; failed_count: number; pending_count: number
  message_type: string; created_at: string; started_at: string | null; completed_at: string | null
}

interface Contact { id: string; phone: string; name: string | null; tags: string[] }
interface Template { id: string; name: string; content: string; category: string | null }
interface RecipientStats { valid: string[]; invalid: string[]; duplicates: number; stripped: number }

// ===== HELPERS =====
const statusConfig: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  draft: { label: 'مسودة', cls: 'badge-yellow', icon: <FileText size={10} /> },
  scheduled: { label: 'مجدولة', cls: 'badge-blue', icon: <Clock size={10} /> },
  running: { label: 'تعمل', cls: 'badge-blue', icon: <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} /> },
  paused: { label: 'موقوفة', cls: 'badge-yellow', icon: <Pause size={10} /> },
  completed: { label: 'مكتملة', cls: 'badge-emerald', icon: <CheckCircle size={10} /> },
  failed: { label: 'فشلت', cls: 'badge-red', icon: <XCircle size={10} /> },
  cancelled: { label: 'ملغاة', cls: 'badge-red', icon: <X size={10} /> },
}

// Common country code prefixes to strip (Arabic market focus)
const COUNTRY_CODES = ['966', '971', '974', '973', '968', '965', '964', '963', '962', '961', '967', '20', '212', '213', '216', '218', '249']

function normalizeRecipients(text: string, cleanCodes: boolean): RecipientStats {
  const lines = text.split(/[\n,;]+/).map(l => l.trim()).filter(l => l.length > 0)
  const seen = new Set<string>()
  const valid: string[] = []
  const invalid: string[] = []
  let duplicates = 0
  let stripped = 0

  for (let raw of lines) {
    let num = raw.replace(/[\s\-().+]/g, '')
    if (num.startsWith('00')) { num = num.slice(2); stripped++ }

    if (cleanCodes) {
      for (const code of COUNTRY_CODES) {
        if (num.startsWith(code) && num.length > code.length + 6) {
          num = num.slice(code.length); stripped++; break
        }
      }
    }

    if (!/^\d{8,15}$/.test(num)) { invalid.push(raw); continue }
    if (seen.has(num)) { duplicates++; continue }
    seen.add(num)
    valid.push(num)
  }
  return { valid, invalid, duplicates, stripped }
}

// ===== STATS MODAL =====
function StatsModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const [details, setDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/campaigns/${campaign.id}/stats`)
      .then(r => r.json())
      .then(d => { setDetails(d.recipients || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [campaign.id])

  const pieData = [
    { name: 'تم الإرسال', value: campaign.sent_count, color: '#10B981' },
    { name: 'فشل', value: campaign.failed_count, color: '#EF4444' },
    { name: 'معلّق', value: campaign.pending_count, color: '#94A3B8' },
  ].filter(d => d.value > 0)

  // group sent by hour
  const byHour: Record<string, number> = {}
  details.filter(r => r.sent_at).forEach(r => {
    const h = new Date(r.sent_at).getHours() + ':00'
    byHour[h] = (byHour[h] || 0) + 1
  })
  const barData = Object.entries(byHour).sort().map(([h, c]) => ({ hour: h, رسائل: c }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(8px)' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '28px', width: '95%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>إحصاءات: {campaign.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'إجمالي', value: campaign.total_count, color: '#A78BFA' },
            { label: 'تم الإرسال', value: campaign.sent_count, color: '#10B981' },
            { label: 'فشل', value: campaign.failed_count, color: '#EF4444' },
            { label: 'معلّق', value: campaign.pending_count, color: '#94A3B8' },
          ].map(c => (
            <div key={c.label} className="card" style={{ padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ gap: '20px', marginBottom: '24px' }}>
          {/* Donut */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>توزيع الحالة</div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Bar */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>رسائل / ساعة</div>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="رسائل" fill="#7C3AED" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>لا توجد بيانات</div>}
          </div>
        </div>

        {/* Detail table */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>جاري التحميل...</div>
        ) : details.length > 0 ? (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>تفاصيل لكل رقم</div>
            <div className="responsive-table-wrap">
              <table className="table-cosmic">
                <thead><tr><th>الرقم</th><th>الحالة</th><th>وقت الإرسال</th><th>ملاحظة</th></tr></thead>
                <tbody>
                  {details.map((r: any, i: number) => (
                    <tr key={i}>
                      <td style={{ direction: 'ltr', fontSize: '13px' }}>{r.phone}</td>
                      <td>
                        <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: r.status === 'sent' ? 'rgba(16,185,129,0.15)' : r.status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.15)', color: r.status === 'sent' ? '#10B981' : r.status === 'failed' ? '#EF4444' : '#94A3B8' }}>
                          {r.status === 'sent' ? 'تم' : r.status === 'failed' ? 'فشل' : 'معلّق'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.sent_at ? new Date(r.sent_at).toLocaleString('ar') : '—'}</td>
                      <td style={{ fontSize: '12px', color: '#EF4444' }}>{r.error || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ===== CAMPAIGN BUILDER MODAL =====
function CampaignBuilder({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)
  const [devices, setDevices] = useState<any[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [contactTagFilter, setContactTagFilter] = useState('')
  const [inputMode, setInputMode] = useState<'manual' | 'csv' | 'contacts' | 'groups'>('manual')
  const [cleanCodes, setCleanCodes] = useState(true)
  const [recipientStats, setRecipientStats] = useState<RecipientStats>({ valid: [], invalid: [], duplicates: 0, stripped: 0 })
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showGroupsPanel, setShowGroupsPanel] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [groupMembers, setGroupMembers] = useState<string[]>([])

  const [form, setForm] = useState({
    name: '', device_id: '', delay_min: 5, delay_max: 10,
    recipients_text: '',
    message_type: 'text',
    message_content: { text: '', imageUrl: '', caption: '', documentUrl: '', videoUrl: '' },
    images: [] as { url: string; caption: string }[],
    scheduled_at: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('devices').select('id, name, phone, status').eq('status', 'connected').then(({ data }) => setDevices(data || []))
    supabase.from('contacts').select('id, phone, name, tags').order('name').then(({ data }) => setContacts(data || []))
    supabase.from('templates').select('id, name, content, category').order('name').then(({ data }) => setTemplates(data || []))
  }, [])

  // Recompute stats whenever text or cleanCodes changes
  useEffect(() => {
    const stats = normalizeRecipients(form.recipients_text, cleanCodes)
    setRecipientStats(stats)
  }, [form.recipients_text, cleanCodes])

  const fetchGroups = async (deviceId: string) => {
    if (!deviceId) return
    setLoadingGroups(true)
    try {
      const waUrl = process.env.NEXT_PUBLIC_WA_SERVER_URL
      const res = await fetch(`${waUrl}/devices/${deviceId}/groups`, {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_WA_SERVER_SECRET || 'sends-bot-super-secret-key-2024-railway'}` }
      })
      const data = await res.json()
      setGroups(data.groups || [])
    } catch { setGroups([]) }
    setLoadingGroups(false)
  }

  const selectGroup = (group: any) => {
    setSelectedGroup(group)
    const members = (group.participants || []).map((p: any) => p.id?.replace('@s.whatsapp.net', '') || p)
    setGroupMembers(members)
    const existingLines = form.recipients_text.trim()
    const newText = existingLines ? existingLines + '\n' + members.join('\n') : members.join('\n')
    setForm({ ...form, recipients_text: newText })
    setInputMode('manual')
  }

  const buildRecipientsText = () => {
    if (inputMode === 'contacts') {
      const phones = contacts
        .filter(c => selectedContacts.has(c.id))
        .map(c => c.phone)
      return phones.join('\n')
    }
    return form.recipients_text
  }

  const handleCreate = async () => {
    setLoading(true)
    const text = buildRecipientsText()
    const stats = normalizeRecipients(text, cleanCodes)
    const recipients = stats.valid.map(phone => ({ phone }))

    const body: any = {
      name: form.name,
      device_id: form.device_id,
      delay_min: form.delay_min,
      delay_max: form.delay_max,
      message_type: form.message_type,
      message_content: {
        text: form.message_content.text,
        imageUrl: form.images[0]?.url || form.message_content.imageUrl,
        caption: form.images[0]?.caption || form.message_content.caption,
        images: form.images,
        documentUrl: form.message_content.documentUrl,
        videoUrl: form.message_content.videoUrl,
      },
      recipients,
      scheduled_at: form.scheduled_at || null,
    }

    const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setLoading(false)
    if (res.ok) { onCreated(); onClose() }
  }

  const validCount = inputMode === 'contacts' ? selectedContacts.size : recipientStats.valid.length
  const canNext = step === 1 ? !!(form.name && form.device_id)
    : step === 2 ? validCount > 0
    : step === 3 ? !!(form.message_content.text || form.images.length > 0)
    : true

  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))]
  const filteredContacts = contacts.filter(c => {
    const matchSearch = !contactSearch || (c.name || '').includes(contactSearch) || c.phone.includes(contactSearch)
    const matchTag = !contactTagFilter || (c.tags || []).includes(contactTagFilter)
    return matchSearch && matchTag
  })

  const toggleContact = (id: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const uploadFile = async (file: File, type: 'image' | 'document' | 'video') => {
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('media').upload(path, file)
    if (error) { setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
    if (type === 'image') {
      setForm(f => ({ ...f, images: [...f.images, { url: publicUrl, caption: '' }], message_type: 'image' }))
    } else if (type === 'document') {
      setForm(f => ({ ...f, message_content: { ...f.message_content, documentUrl: publicUrl }, message_type: 'document' }))
    } else if (type === 'video') {
      setForm(f => ({ ...f, message_content: { ...f.message_content, videoUrl: publicUrl }, message_type: 'video' }))
    }
    setUploading(false)
  }

  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '620px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>حملة جديدة</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        {/* Step bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {['الأساسيات', 'المستلمون', 'الرسالة', 'الإرسال'].map((s, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: '3px', borderRadius: '2px', background: i + 1 <= step ? 'var(--accent-violet)' : 'var(--border)', marginBottom: '4px' }} />
              <div style={{ fontSize: '10px', color: i + 1 <= step ? '#A78BFA' : 'var(--text-muted)', textAlign: 'center' }}>{s}</div>
            </div>
          ))}
        </div>

        {/* ─── STEP 1 ─── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>اسم الحملة *</label>
              <input className="input-cosmic" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: عرض عيد الفطر" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الجهاز *</label>
              <select className="input-cosmic" value={form.device_id} onChange={e => { setForm({ ...form, device_id: e.target.value }); if (e.target.value) fetchGroups(e.target.value) }}>
                <option value="">اختر جهازاً...</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.name}{d.phone ? ` (${d.phone})` : ''}</option>)}
              </select>
              {devices.length === 0 && <p style={{ fontSize: '12px', color: '#F59E0B', marginTop: '4px' }}>لا يوجد جهاز متصل. اذهب لصفحة الأجهزة لتوصيل جهازك.</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>التأخير بين الرسائل: {form.delay_min}–{form.delay_max} ثانية</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>من</label><input type="number" className="input-cosmic" value={form.delay_min} min={2} max={60} onChange={e => setForm({ ...form, delay_min: +e.target.value })} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>إلى</label><input type="number" className="input-cosmic" value={form.delay_max} min={2} max={120} onChange={e => setForm({ ...form, delay_max: +e.target.value })} /></div>
              </div>
              {form.delay_min < 2 && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> تأخير أقل من ثانيتين يزيد خطر الحظر</p>}
              <p style={{ fontSize: '11px', color: '#F59E0B', marginTop: '4px' }}>⚠️ نوصي بـ 5-10 ثواني لتجنب الحظر</p>
            </div>
          </div>
        )}

        {/* ─── STEP 2 ─── */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>المستلمون</p>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[
                { v: 'manual', l: '📝 يدوي' },
                { v: 'csv', l: '📤 CSV' },
                { v: 'contacts', l: '📞 جهات الاتصال' },
                ...(groups.length > 0 ? [{ v: 'groups', l: '👥 مجموعات' }] : []),
              ].map(t => (
                <button key={t.v} onClick={() => setInputMode(t.v as any)}
                  style={{ padding: '7px 13px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: `1px solid ${inputMode === t.v ? 'var(--accent-violet)' : 'var(--border)'}`, background: inputMode === t.v ? 'rgba(124,58,237,0.15)' : 'transparent', color: inputMode === t.v ? '#A78BFA' : 'var(--text-secondary)' }}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* Manual */}
            {(inputMode === 'manual' || inputMode === 'csv') && (
              <>
                {inputMode === 'csv' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: '1px dashed var(--border)', cursor: 'pointer', marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <Upload size={16} /> اسحب ملف CSV/TXT أو انقر للاختيار
                    <input type="file" accept=".csv,.txt" hidden onChange={e => {
                      const file = e.target.files?.[0]; if (!file) return
                      const reader = new FileReader()
                      reader.onload = ev => {
                        const raw = ev.target?.result as string
                        const lines = raw.split(/[\n,;]/).map(l => l.replace(/["\s]/g, '')).filter(l => l)
                        setForm({ ...form, recipients_text: (form.recipients_text ? form.recipients_text + '\n' : '') + lines.join('\n') })
                        setInputMode('manual')
                      }
                      reader.readAsText(file)
                    }} />
                  </label>
                )}
                <textarea className="input-cosmic" rows={8} placeholder={"أدخل الأرقام، رقم في كل سطر أو مفصولة بفاصلة:\n966501234567\n966507654321\n..."} value={form.recipients_text} onChange={e => setForm({ ...form, recipients_text: e.target.value })} style={{ resize: 'vertical' }} />
              </>
            )}

            {/* Contacts */}
            {inputMode === 'contacts' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input-cosmic" placeholder="بحث..." value={contactSearch} onChange={e => setContactSearch(e.target.value)} style={{ paddingRight: '32px' }} />
                  </div>
                  {allTags.length > 0 && (
                    <select className="input-cosmic" value={contactTagFilter} onChange={e => setContactTagFilter(e.target.value)} style={{ width: 'auto' }}>
                      <option value="">كل التصنيفات</option>
                      {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {selectedContacts.size} محدد من {filteredContacts.length}
                  {filteredContacts.length > 0 && (
                    <button onClick={() => { const allIds = filteredContacts.map(c => c.id); setSelectedContacts(new Set(allIds)) }} style={{ marginRight: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontSize: '12px' }}>تحديد الكل</button>
                  )}
                  {selectedContacts.size > 0 && (
                    <button onClick={() => setSelectedContacts(new Set())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '12px' }}>إلغاء التحديد</button>
                  )}
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
                  {filteredContacts.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>لا توجد جهات اتصال</div>
                  ) : filteredContacts.map(c => (
                    <div key={c.id} onClick={() => toggleContact(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: selectedContacts.has(c.id) ? 'rgba(124,58,237,0.08)' : 'transparent' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${selectedContacts.has(c.id) ? 'var(--accent-violet)' : 'var(--border)'}`, background: selectedContacts.has(c.id) ? 'var(--accent-violet)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {selectedContacts.has(c.id) && <Check size={11} color="white" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{c.name || c.phone}</div>
                        {c.name && <div style={{ fontSize: '11px', color: 'var(--text-muted)', direction: 'ltr' }}>{c.phone}</div>}
                      </div>
                      {(c.tags || []).slice(0, 2).map(tag => <span key={tag} style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(124,58,237,0.15)', color: '#A78BFA', borderRadius: '4px' }}>{tag}</span>)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            {inputMode === 'groups' && (
              <div>
                {loadingGroups ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>جاري تحميل المجموعات...</div>
                ) : groups.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>لا توجد مجموعات. تأكد من اتصال الجهاز.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>اختر مجموعة — سيتم إرسال الرسائل لكل عضو بشكل DM منفصل</p>
                    {groups.map(g => (
                      <button key={g.id} onClick={() => selectGroup(g)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px' }}>
                        <span>{g.name || g.id}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(g.participants || []).length} عضو</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Clean codes toggle */}
            {inputMode !== 'contacts' && inputMode !== 'groups' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <button onClick={() => setCleanCodes(!cleanCodes)} style={{ width: '36px', height: '20px', borderRadius: '10px', border: 'none', background: cleanCodes ? 'var(--accent-violet)' : 'var(--border)', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '3px', width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'right 0.2s', right: cleanCodes ? '3px' : '19px' }} />
                </button>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>تنظيف رموز الدول تلقائياً (966، 971، 20...)</span>
              </div>
            )}

            {/* Stats cards */}
            {(inputMode === 'manual' || inputMode === 'csv') && (
              <div className="grid-4" style={{ gap: '8px', marginTop: '12px' }}>
                {[
                  { label: 'إجمالي', value: recipientStats.valid.length + recipientStats.invalid.length + recipientStats.duplicates, color: '#A78BFA' },
                  { label: 'صالح', value: recipientStats.valid.length, color: '#10B981' },
                  { label: 'مكرر محذوف', value: recipientStats.duplicates, color: '#F59E0B' },
                  { label: 'غير صالح', value: recipientStats.invalid.length, color: '#EF4444' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '10px', background: 'var(--bg-card)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            {inputMode === 'contacts' && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', fontSize: '13px', color: '#10B981' }}>
                <Users size={13} style={{ display: 'inline', marginLeft: '6px' }} />
                {selectedContacts.size} جهة اتصال محددة
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 3 ─── */}
        {step === 3 && (
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>محتوى الرسالة</p>

            {/* Media type tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[{ v: 'text', l: '📝 نص فقط' }, { v: 'image', l: '🖼 صورة' }, { v: 'document', l: '📄 مستند' }, { v: 'video', l: '🎥 فيديو' }].map(t => (
                <button key={t.v} onClick={() => setForm({ ...form, message_type: t.v })}
                  style={{ padding: '7px 13px', borderRadius: '8px', border: `1px solid ${form.message_type === t.v ? 'var(--accent-violet)' : 'var(--border)'}`, background: form.message_type === t.v ? 'rgba(124,58,237,0.15)' : 'transparent', color: form.message_type === t.v ? '#A78BFA' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* Text */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>نص الرسالة {form.message_type === 'text' ? '*' : '(اختياري)'}</label>
              <textarea className="input-cosmic" rows={6} placeholder={`اكتب الرسالة هنا...\n\nمتغيرات:\n{{name}} - الاسم  {{phone}} - الرقم  {{date}} - التاريخ`} value={form.message_content.text} onChange={e => setForm({ ...form, message_content: { ...form.message_content, text: e.target.value } })} style={{ resize: 'vertical' }} />
            </div>

            {/* Templates shortcuts */}
            {templates.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>قوالب جاهزة:</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '80px', overflowY: 'auto' }}>
                  {templates.map(t => (
                    <button key={t.id} onClick={() => setForm({ ...form, message_content: { ...form.message_content, text: t.content } })}
                      style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image uploads */}
            {form.message_type === 'image' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {form.images.map((img, i) => (
                    <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img src={img.url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                      <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={10} color="white" />
                      </button>
                    </div>
                  ))}
                  {form.images.length < 5 && (
                    <label style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {uploading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><ImageIcon size={20} /><span style={{ fontSize: '10px', marginTop: '4px' }}>إضافة</span></>}
                      <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'image') }} />
                    </label>
                  )}
                </div>
                {form.images.length > 0 && (
                  <input className="input-cosmic" placeholder="وصف الصورة (caption)..." value={form.images[0]?.caption || ''} onChange={e => setForm(f => ({ ...f, images: f.images.map((img, i) => i === 0 ? { ...img, caption: e.target.value } : img) }))} />
                )}
              </div>
            )}

            {/* Document upload */}
            {form.message_type === 'document' && (
              <div>
                {form.message_content.documentUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px' }}>
                    <FileUp size={18} color="#10B981" />
                    <span style={{ fontSize: '13px', color: '#10B981', flex: 1 }}>تم الرفع بنجاح</span>
                    <button onClick={() => setForm(f => ({ ...f, message_content: { ...f.message_content, documentUrl: '' } }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><X size={14} /></button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '10px', border: '2px dashed var(--border)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {uploading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileUp size={16} />}
                    اختر ملف PDF/DOC/ZIP
                    <input type="file" accept=".pdf,.doc,.docx,.zip,.xls,.xlsx" hidden onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'document') }} />
                  </label>
                )}
              </div>
            )}

            {/* Video upload */}
            {form.message_type === 'video' && (
              <div>
                {form.message_content.videoUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px' }}>
                    <Video size={18} color="#10B981" />
                    <span style={{ fontSize: '13px', color: '#10B981', flex: 1 }}>تم رفع الفيديو</span>
                    <button onClick={() => setForm(f => ({ ...f, message_content: { ...f.message_content, videoUrl: '' } }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><X size={14} /></button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '10px', border: '2px dashed var(--border)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {uploading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Video size={16} />}
                    اختر فيديو (MP4)
                    <input type="file" accept="video/mp4,video/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'video') }} />
                  </label>
                )}
              </div>
            )}

            {/* Preview */}
            {form.message_content.text && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>معاينة:</div>
                <div style={{ background: '#DCF8C6', borderRadius: '12px 12px 12px 0', padding: '12px 16px', maxWidth: '280px', fontSize: '14px', color: '#111', lineHeight: 1.6, direction: 'rtl' }}>
                  {form.message_content.text}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 4 ─── */}
        {step === 4 && (
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>وقت الإرسال</p>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>منطقتك الزمنية: {userTz}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: !form.scheduled_at ? 'rgba(124,58,237,0.1)' : 'var(--bg-card)', border: `1px solid ${!form.scheduled_at ? 'var(--accent-violet)' : 'var(--border)'}`, borderRadius: '12px', cursor: 'pointer' }}>
                <input type="radio" name="schedule" checked={!form.scheduled_at} onChange={() => setForm({ ...form, scheduled_at: '' })} />
                <div><div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>إرسال فوري</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>تبدأ الحملة فور الإنشاء</div></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', background: form.scheduled_at ? 'rgba(124,58,237,0.1)' : 'var(--bg-card)', border: `1px solid ${form.scheduled_at ? 'var(--accent-violet)' : 'var(--border)'}`, borderRadius: '12px', cursor: 'pointer' }}>
                <input type="radio" name="schedule" checked={!!form.scheduled_at} onChange={() => setForm({ ...form, scheduled_at: new Date().toISOString().slice(0, 16) })} style={{ marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '8px' }}>جدولة لوقت معيّن</div>
                  {form.scheduled_at && (
                    <>
                      <input type="datetime-local" className="input-cosmic" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} style={{ fontSize: '13px' }} />
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>الوقت المحدد بتوقيتك المحلي ({userTz})</p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Summary */}
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>ملخص الحملة:</div>
              <div>📌 {form.name}</div>
              <div>👥 {validCount} مستلم</div>
              <div>⏱ تأخير {form.delay_min}–{form.delay_max} ثانية</div>
              <div>💬 {form.message_type === 'text' ? 'نص' : form.message_type === 'image' ? `صورة (${form.images.length})` : form.message_type === 'document' ? 'مستند' : 'فيديو'}</div>
              {form.scheduled_at && <div>🕐 {new Date(form.scheduled_at).toLocaleString('ar')}</div>}
            </div>
          </div>
        )}

        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChevronRight size={16} /> السابق
            </button>
          ) : <div />}
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary" disabled={!canNext} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              التالي <ChevronLeft size={16} />
            </button>
          ) : (
            <button onClick={handleCreate} className="btn-primary" disabled={loading || validCount === 0} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {loading ? 'جاري الإنشاء...' : '🚀 إنشاء الحملة'}
            </button>
          )}
        </div>
      </div>
      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ===== MAIN PAGE =====
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [statsTarget, setStatsTarget] = useState<Campaign | null>(null)

  const fetchCampaigns = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
    setCampaigns(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCampaigns() }, [])

  const handleAction = async (id: string, action: string) => {
    await fetch(`/api/campaigns/${id}/${action}`, { method: 'POST' })
    fetchCampaigns()
  }

  return (
    <div>
      <div className="page-flex-header">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>الحملات الإعلانية</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{campaigns.length} حملة إجمالاً</p>
        </div>
        <button onClick={() => setShowBuilder(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> حملة جديدة
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px' }}>{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '52px', marginBottom: '8px', borderRadius: '8px' }} />)}</div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Megaphone size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>لا توجد حملات بعد</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>أنشئ حملتك الأولى للإرسال الجماعي</p>
            <button onClick={() => setShowBuilder(true)} className="btn-primary"><Plus size={16} /> حملة جديدة</button>
          </div>
        ) : (
          <div className="responsive-table-wrap">
            <table className="table-cosmic">
              <thead>
                <tr><th>الحملة</th><th>الحالة</th><th>التقدم</th><th>الإحصاءات</th><th>التاريخ</th><th>إجراءات</th></tr>
              </thead>
              <tbody>
                {campaigns.map(c => {
                  const progress = c.total_count > 0 ? Math.round((c.sent_count / c.total_count) * 100) : 0
                  const s = statusConfig[c.status] || statusConfig.draft
                  return (
                    <tr key={c.id}>
                      <td><div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px' }}>{c.name}</div></td>
                      <td><span className={`badge ${s.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{s.icon}{s.label}</span></td>
                      <td style={{ minWidth: '140px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{progress}% ({c.sent_count}/{c.total_count})</div>
                        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gradient)', transition: 'width 0.5s ease', borderRadius: '2px' }} />
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: '#10B981' }}>✓{c.sent_count} </span>
                          <span style={{ color: '#EF4444' }}>✗{c.failed_count} </span>
                          <span style={{ color: '#94A3B8' }}>⏳{c.pending_count}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString('ar-SA')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => setStatsTarget(c)} style={{ padding: '6px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#A78BFA' }} title="الإحصاءات"><BarChart2 size={14} /></button>
                          {c.status === 'draft' && <button onClick={() => handleAction(c.id, 'start')} style={{ padding: '6px', background: 'rgba(16,185,129,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#10B981' }} title="بدء"><Play size={14} /></button>}
                          {c.status === 'running' && <button onClick={() => handleAction(c.id, 'pause')} style={{ padding: '6px', background: 'rgba(245,158,11,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#F59E0B' }} title="إيقاف"><Pause size={14} /></button>}
                          {c.status === 'paused' && <button onClick={() => handleAction(c.id, 'resume')} style={{ padding: '6px', background: 'rgba(37,99,235,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#60A5FA' }} title="استئناف"><Play size={14} /></button>}
                          {['running', 'paused'].includes(c.status) && <button onClick={() => handleAction(c.id, 'stop')} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }} title="إيقاف نهائي"><Square size={14} /></button>}
                          <button onClick={async () => { if (confirm('حذف الحملة؟')) { await fetch(`/api/campaigns/${c.id}`, { method: 'DELETE' }); fetchCampaigns() } }} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }} title="حذف"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showBuilder && <CampaignBuilder onClose={() => setShowBuilder(false)} onCreated={fetchCampaigns} />}
      {statsTarget && <StatsModal campaign={statsTarget} onClose={() => setStatsTarget(null)} />}
      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
