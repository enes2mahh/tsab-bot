'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon, Video, Type, Clock, Plus, Trash2, X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FileUpload } from '@/components/FileUpload'

interface Device { id: string; name: string; phone: string | null; status: string }
interface Story {
  id: string
  device_id: string
  type: 'text' | 'image' | 'video'
  caption: string | null
  text_color: string
  background_color: string
  media_url: string | null
  scheduled_at: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  error_message: string | null
  posted_at: string | null
  created_at: string
}

const BG_COLORS = [
  '#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#2563EB', '#000000', '#FFFFFF',
]

function StoryForm({ devices, onClose, onSaved }: { devices: Device[]; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<'text' | 'image' | 'video'>('text')
  const [deviceId, setDeviceId] = useState(devices[0]?.id || '')
  const [caption, setCaption] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [bgColor, setBgColor] = useState('#7C3AED')
  const [scheduleNow, setScheduleNow] = useState(true)
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000)
    return d.toISOString().slice(0, 16)
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!deviceId) return alert('اختر جهازاً')
    if (type !== 'text' && !mediaUrl) return alert('أدخل رابط الوسائط')
    if (type === 'text' && !caption.trim()) return alert('اكتب نص الستوري')

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    await supabase.from('scheduled_stories').insert({
      user_id: user.id,
      device_id: deviceId,
      type,
      caption: caption || null,
      media_url: mediaUrl || null,
      background_color: bgColor,
      text_color: '#FFFFFF',
      scheduled_at: scheduleNow ? new Date().toISOString() : new Date(scheduledAt).toISOString(),
      status: 'pending',
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '560px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>ستوري جديد</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        {/* Type tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {[
            { v: 'text', label: 'نص', icon: <Type size={14} /> },
            { v: 'image', label: 'صورة', icon: <ImageIcon size={14} /> },
            { v: 'video', label: 'فيديو', icon: <Video size={14} /> },
          ].map(t => (
            <button key={t.v} onClick={() => setType(t.v as any)} style={{
              flex: 1, padding: '10px', borderRadius: '10px',
              border: type === t.v ? '1px solid var(--accent-violet)' : '1px solid var(--border)',
              background: type === t.v ? 'rgba(124,58,237,0.15)' : 'transparent',
              color: type === t.v ? '#A78BFA' : 'var(--text-secondary)',
              cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الجهاز</label>
            <select className="input-cosmic" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              {devices.map(d => <option key={d.id} value={d.id}>{d.name}{d.phone ? ` (${d.phone})` : ''}</option>)}
            </select>
          </div>

          {type !== 'text' && (
            <FileUpload
              label={type === 'image' ? 'صورة الستوري' : 'فيديو الستوري'}
              value={mediaUrl}
              onChange={setMediaUrl}
              folder={type === 'image' ? 'stories/images' : 'stories/videos'}
              accept={type === 'image' ? 'image/png,image/jpeg,image/webp' : 'video/mp4,video/webm'}
              maxSizeMB={type === 'image' ? 5 : 10}
              hint={type === 'video' ? 'الحد الأقصى 30 ثانية، حجم 10MB' : undefined}
            />
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {type === 'text' ? 'نص الستوري' : 'تعليق (اختياري)'}
            </label>
            <textarea className="input-cosmic" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={type === 'text' ? 'ما يدور في خلدك...' : 'تعليق على الصورة/الفيديو...'} style={{ resize: 'vertical' }} />
          </div>

          {type === 'text' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>لون الخلفية</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {BG_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setBgColor(c)} style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: c, border: bgColor === c ? '3px solid var(--accent-violet)' : '1px solid var(--border)',
                    cursor: 'pointer',
                  }} />
                ))}
              </div>
              <div style={{ marginTop: '10px', padding: '24px', borderRadius: '12px', background: bgColor, color: bgColor === '#FFFFFF' ? '#000' : '#FFF', textAlign: 'center', fontSize: '15px', fontWeight: 600, minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {caption || 'معاينة الستوري'}
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
              <input type="checkbox" checked={scheduleNow} onChange={(e) => setScheduleNow(e.target.checked)} style={{ accentColor: 'var(--accent-violet)' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>نشر فوري</span>
            </label>
            {!scheduleNow && (
              <input type="datetime-local" className="input-cosmic" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            )}
          </div>

          <button onClick={save} disabled={saving} className="btn-primary" style={{ justifyContent: 'center' }}>
            {saving ? 'جاري الحفظ...' : scheduleNow ? '🚀 نشر الآن' : '⏱️ جدولة'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<'pending' | 'sent' | 'failed'>('pending')

  const fetchAll = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: s }, { data: d }] = await Promise.all([
      supabase.from('scheduled_stories').select('*').eq('user_id', user.id).order('scheduled_at', { ascending: false }),
      supabase.from('devices').select('id, name, phone, status').eq('user_id', user.id).eq('status', 'connected'),
    ])
    setStories((s || []) as Story[])
    setDevices((d || []) as Device[])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const cancelStory = async (id: string) => {
    if (!confirm('إلغاء هذا الستوري؟')) return
    await createClient().from('scheduled_stories').update({ status: 'cancelled' }).eq('id', id)
    fetchAll()
  }

  const deleteStory = async (id: string) => {
    if (!confirm('حذف هذا الستوري؟')) return
    await createClient().from('scheduled_stories').delete().eq('id', id)
    fetchAll()
  }

  const filtered = stories.filter(s => {
    if (tab === 'pending') return s.status === 'pending'
    if (tab === 'sent') return s.status === 'sent'
    return s.status === 'failed' || s.status === 'cancelled'
  })

  const STATUS_BADGE: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'في الانتظار', color: '#F59E0B', icon: <Clock size={12} /> },
    sent: { label: 'تم النشر', color: '#10B981', icon: <CheckCircle size={12} /> },
    failed: { label: 'فشل', color: '#EF4444', icon: <XCircle size={12} /> },
    cancelled: { label: 'ملغى', color: '#6B7280', icon: <XCircle size={12} /> },
  }

  return (
    <div>
      <div className="page-flex-header">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>ستوريز واتساب</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stories.length} ستوري — {filtered.filter(s => s.status === 'pending').length} في الانتظار</p>
        </div>
        {devices.length > 0 && (
          <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> ستوري جديد</button>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{ padding: '14px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', color: '#F59E0B', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>تنبيه مهم:</strong> ميزة Stories عبر Baileys غير رسمية وقد تتغيّر في أي وقت من قبل WhatsApp. استخدمها بحذر — قد لا تعمل دائماً، وقد تزيد خطر حظر الرقم لو استُخدمت بكثرة.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        {[
          { v: 'pending', label: 'في الانتظار', count: stories.filter(s => s.status === 'pending').length },
          { v: 'sent', label: 'تم النشر', count: stories.filter(s => s.status === 'sent').length },
          { v: 'failed', label: 'فشل/ملغى', count: stories.filter(s => s.status === 'failed' || s.status === 'cancelled').length },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as any)} style={{
            padding: '10px 16px', background: 'none', border: 'none',
            borderBottom: tab === t.v ? '2px solid var(--accent-violet)' : '2px solid transparent',
            color: tab === t.v ? 'var(--accent-violet-light)' : 'var(--text-secondary)',
            fontFamily: 'Tajawal, sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', marginBottom: '8px', borderRadius: '8px' }} />)}</div>
      ) : devices.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>اربط جهاز واتساب أولاً</p>
          <a href="/devices" className="btn-primary">ربط جهاز</a>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          لا توجد ستوريات في هذه الحالة
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map(s => {
            const dev = devices.find(d => d.id === s.device_id)
            const sb = STATUS_BADGE[s.status]
            return (
              <div key={s.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Preview */}
                <div style={{
                  height: '180px',
                  background: s.type === 'text' ? s.background_color : '#000',
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {s.type === 'image' && s.media_url ? (
                    <img src={s.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : s.type === 'video' && s.media_url ? (
                    <Video size={48} color="white" style={{ opacity: 0.7 }} />
                  ) : (
                    <div style={{ padding: '20px', color: 'white', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>
                      {s.caption || '—'}
                    </div>
                  )}
                  <span style={{ position: 'absolute', top: '8px', right: '8px', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: sb.color, color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {sb.icon} {sb.label}
                  </span>
                </div>
                {/* Info */}
                <div style={{ padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{dev?.name || 'جهاز'}</div>
                  {s.caption && s.type !== 'text' && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.caption}</div>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {s.status === 'pending' ? `يُنشر: ${new Date(s.scheduled_at).toLocaleString('ar-SA')}` : s.posted_at ? `نُشر: ${new Date(s.posted_at).toLocaleString('ar-SA')}` : ''}
                  </div>
                  {s.error_message && (
                    <div style={{ fontSize: '11px', color: '#EF4444', marginBottom: '8px', padding: '6px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>
                      {s.error_message}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {s.status === 'pending' && (
                      <button onClick={() => cancelStory(s.id)} style={{ flex: 1, padding: '6px', background: 'rgba(245,158,11,0.1)', border: 'none', borderRadius: '6px', color: '#F59E0B', fontSize: '12px', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        إلغاء
                      </button>
                    )}
                    <button onClick={() => deleteStory(s.id)} style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', color: '#EF4444', cursor: 'pointer' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && devices.length > 0 && <StoryForm devices={devices} onClose={() => setShowForm(false)} onSaved={fetchAll} />}
    </div>
  )
}
