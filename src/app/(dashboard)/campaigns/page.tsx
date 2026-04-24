'use client'

import { useState, useEffect } from 'react'
import { Plus, Megaphone, Play, Pause, Square, Eye, Trash2, Clock, CheckCircle, XCircle, Loader, ChevronRight, ChevronLeft, X, Upload, Users, FileText, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Campaign {
  id: string
  name: string
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  total_count: number
  sent_count: number
  failed_count: number
  pending_count: number
  message_type: string
  created_at: string
  started_at: string | null
  completed_at: string | null
}

const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  draft: { label: 'مسودة', class: 'badge-yellow', icon: <FileText size={10} /> },
  scheduled: { label: 'مجدولة', class: 'badge-blue', icon: <Clock size={10} /> },
  running: { label: 'تعمل', class: 'badge-blue', icon: <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} /> },
  paused: { label: 'موقوفة', class: 'badge-yellow', icon: <Pause size={10} /> },
  completed: { label: 'مكتملة', class: 'badge-emerald', icon: <CheckCircle size={10} /> },
  failed: { label: 'فشلت', class: 'badge-red', icon: <XCircle size={10} /> },
  cancelled: { label: 'ملغاة', class: 'badge-red', icon: <X size={10} /> },
}

// ===== CAMPAIGN BUILDER MODAL =====
function CampaignBuilder({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)
  const [devices, setDevices] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '', device_id: '', delay_min: 5, delay_max: 10,
    recipient_type: 'numbers' as 'numbers' | 'file',
    recipients_text: '', message_type: 'text',
    message_content: { text: '', imageUrl: '', caption: '' },
    scheduled_at: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    createClient().from('devices').select('id, name, phone, status').eq('status', 'connected').then(({ data }) => setDevices(data || []))
  }, [])

  const recipientCount = form.recipients_text.split('\n').filter(l => l.trim()).length
  const canNext = step === 1 ? form.name && form.device_id : step === 2 ? recipientCount > 0 : step === 3 ? form.message_content.text : true

  const handleCreate = async () => {
    setLoading(true)
    const recipients = form.recipients_text.split('\n').filter(l => l.trim()).map(phone => ({ phone: phone.trim() }))
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, recipients, total_count: recipients.length, message_content: form.message_content }),
    })
    setLoading(false)
    if (res.ok) { onCreated(); onClose() }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '580px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>حملة جديدة</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {['الأساسيات', 'المستلمون', 'الرسالة', 'الإرسال'].map((s, i) => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i + 1 <= step ? 'var(--accent-violet)' : 'var(--border)' }} />
          ))}
        </div>

        {/* Step 1: Basic info */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>الخطوة 1: المعلومات الأساسية</p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>اسم الحملة</label>
              <input className="input-cosmic" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: عرض عيد الفطر" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الجهاز</label>
              <select className="input-cosmic" value={form.device_id} onChange={e => setForm({ ...form, device_id: e.target.value })}>
                <option value="">اختر جهازاً...</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.name} {d.phone ? `(${d.phone})` : ''}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                التأخير بين الرسائل: {form.delay_min}-{form.delay_max} ثانية
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>من</label>
                  <input type="number" className="input-cosmic" value={form.delay_min} min={2} max={60} onChange={e => setForm({ ...form, delay_min: +e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>إلى</label>
                  <input type="number" className="input-cosmic" value={form.delay_max} min={2} max={120} onChange={e => setForm({ ...form, delay_max: +e.target.value })} />
                </div>
              </div>
              {form.delay_min < 2 && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#EF4444', fontSize: '12px', marginTop: '6px' }}>
                  <AlertCircle size={12} /> تأخير أقل من ثانيتين يزيد خطر الحظر!
                </div>
              )}
              <p style={{ fontSize: '11px', color: '#F59E0B', marginTop: '4px' }}>⚠️ نوصي بـ 5-10 ثواني لتجنب الحظر</p>
            </div>
          </div>
        )}

        {/* Step 2: Recipients */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>الخطوة 2: المستلمون</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button onClick={() => {}} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--accent-violet)', background: 'rgba(124,58,237,0.15)', color: '#A78BFA', cursor: 'pointer', fontSize: '13px' }}>📝 أرقام يدوية</button>
              <label style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Upload size={13} /> رفع CSV
                <input type="file" accept=".csv,.txt" hidden onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => {
                    const lines = (ev.target?.result as string).split('\n').map(l => l.replace(/[",]/g, '').trim()).filter(l => l && /^\d{10,15}$/.test(l))
                    setForm({ ...form, recipients_text: (form.recipients_text ? form.recipients_text + '\n' : '') + lines.join('\n') })
                  }
                  reader.readAsText(file)
                }} />
              </label>
            </div>
            <textarea
              className="input-cosmic"
              rows={10}
              placeholder={"أدخل الأرقام، رقم في كل سطر:\n966501234567\n966507654321\n..."}
              value={form.recipients_text}
              onChange={e => setForm({ ...form, recipients_text: e.target.value })}
              style={{ resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px' }}>
              <span style={{ color: recipientCount > 0 ? '#10B981' : 'var(--text-muted)' }}>
                <Users size={13} style={{ display: 'inline', marginLeft: '4px' }} />
                {recipientCount} رقم
              </span>
              <span style={{ color: 'var(--text-muted)' }}>رقم لكل سطر بدون 00 أو +</span>
            </div>
          </div>
        )}

        {/* Step 3: Message */}
        {step === 3 && (
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>الخطوة 3: محتوى الرسالة</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[{ v: 'text', l: '📝 نص' }, { v: 'image', l: '🖼 صورة' }, { v: 'document', l: '📄 مستند' }, { v: 'location', l: '📍 موقع' }].map(t => (
                <button key={t.v} onClick={() => setForm({ ...form, message_type: t.v })} style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${form.message_type === t.v ? 'var(--accent-violet)' : 'var(--border)'}`, background: form.message_type === t.v ? 'rgba(124,58,237,0.15)' : 'transparent', color: form.message_type === t.v ? '#A78BFA' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>
                  {t.l}
                </button>
              ))}
            </div>
            <textarea
              className="input-cosmic"
              rows={7}
              placeholder={`اكتب الرسالة هنا...\n\nيمكنك استخدام المتغيرات:\n{{اسم}} - اسم جهة الاتصال\n{{رقم}} - رقم الهاتف`}
              value={form.message_content.text}
              onChange={e => setForm({ ...form, message_content: { ...form.message_content, text: e.target.value } })}
              style={{ resize: 'vertical' }}
            />
            {form.message_content.text && (
              <div style={{ marginTop: '12px', padding: '12px 16px', background: '#DCF8C6', borderRadius: '12px 12px 12px 0', maxWidth: '280px', fontSize: '14px', color: '#111', lineHeight: 1.6 }}>
                {form.message_content.text}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Schedule */}
        {step === 4 && (
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>الخطوة 4: وقت الإرسال</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: !form.scheduled_at ? 'rgba(124,58,237,0.1)' : 'var(--bg-card)', border: `1px solid ${!form.scheduled_at ? 'var(--accent-violet)' : 'var(--border)'}`, borderRadius: '12px', cursor: 'pointer' }}>
                <input type="radio" name="schedule" checked={!form.scheduled_at} onChange={() => setForm({ ...form, scheduled_at: '' })} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>إرسال فوري</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>تبدأ الحملة فور الإنشاء</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: form.scheduled_at ? 'rgba(124,58,237,0.1)' : 'var(--bg-card)', border: `1px solid ${form.scheduled_at ? 'var(--accent-violet)' : 'var(--border)'}`, borderRadius: '12px', cursor: 'pointer' }}>
                <input type="radio" name="schedule" checked={!!form.scheduled_at} onChange={() => setForm({ ...form, scheduled_at: new Date().toISOString().slice(0, 16) })} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '6px' }}>جدولة لوقت معين</div>
                  {form.scheduled_at && <input type="datetime-local" className="input-cosmic" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} style={{ fontSize: '13px' }} />}
                </div>
              </label>
            </div>
            {/* Summary */}
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>ملخص الحملة:</div>
              <div>📌 {form.name}</div>
              <div>👥 {recipientCount} مستلم</div>
              <div>⏱ تأخير {form.delay_min}-{form.delay_max} ثانية</div>
              <div>💬 نوع: {form.message_type}</div>
            </div>
          </div>
        )}

        {/* Nav Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChevronRight size={16} /> السابق
            </button>
          ) : <div />}
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary" disabled={!canNext}>
              التالي <ChevronLeft size={16} />
            </button>
          ) : (
            <button onClick={handleCreate} className="btn-primary" disabled={loading}>
              {loading ? 'جاري الإنشاء...' : '🚀 إنشاء الحملة'}
            </button>
          )}
        </div>
      </div>
      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ===== MAIN PAGE =====
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>الحملات الإعلانية</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{campaigns.length} حملة إجمالاً</p>
        </div>
        <button onClick={() => setShowBuilder(true)} className="btn-primary"><Plus size={16} /> حملة جديدة</button>
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
          <table className="table-cosmic">
            <thead><tr><th>الحملة</th><th>الحالة</th><th>التقدم</th><th>الإحصائيات</th><th>التاريخ</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {campaigns.map(c => {
                const progress = c.total_count > 0 ? Math.round((c.sent_count / c.total_count) * 100) : 0
                const s = statusConfig[c.status] || statusConfig.draft
                return (
                  <tr key={c.id}>
                    <td><div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px' }}>{c.name}</div></td>
                    <td><span className={`badge ${s.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{s.icon}{s.label}</span></td>
                    <td style={{ minWidth: '150px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{progress}% ({c.sent_count}/{c.total_count})</div>
                      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gradient)', transition: 'width 0.5s ease', borderRadius: '2px' }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <span style={{ color: '#10B981' }}>✓{c.sent_count}</span>{' '}
                        <span style={{ color: '#EF4444' }}>✗{c.failed_count}</span>{' '}
                        <span style={{ color: '#94A3B8' }}>⏳{c.pending_count}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString('ar-SA')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {c.status === 'draft' && <button onClick={() => handleAction(c.id, 'start')} style={{ padding: '6px', background: 'rgba(16,185,129,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#10B981' }} title="بدء"><Play size={14} /></button>}
                        {c.status === 'running' && <button onClick={() => handleAction(c.id, 'pause')} style={{ padding: '6px', background: 'rgba(245,158,11,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#F59E0B' }} title="إيقاف"><Pause size={14} /></button>}
                        {c.status === 'paused' && <button onClick={() => handleAction(c.id, 'resume')} style={{ padding: '6px', background: 'rgba(37,99,235,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#60A5FA' }} title="استئناف"><Play size={14} /></button>}
                        {['running', 'paused'].includes(c.status) && <button onClick={() => handleAction(c.id, 'stop')} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }} title="إيقاف نهائي"><Square size={14} /></button>}
                        <button onClick={async () => { if (confirm('حذف؟')) { await fetch(`/api/campaigns/${c.id}`, { method: 'DELETE' }); fetchCampaigns() } }} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }} title="حذف"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showBuilder && <CampaignBuilder onClose={() => setShowBuilder(false)} onCreated={fetchCampaigns} />}
      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
