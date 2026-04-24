'use client'

import { useState, useEffect } from 'react'
import { Plus, Smartphone, Settings, RefreshCw, Trash2, X, CheckCircle, Wifi, WifiOff, AlertCircle, ExternalLink, Bot } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Device {
  id: string
  name: string
  phone: string | null
  status: 'connected' | 'disconnected' | 'banned' | 'connecting' | 'expired'
  messages_sent: number
  webhook_url: string | null
  ai_enabled: boolean
  ai_prompt: string
  created_at: string
}

// ===== QR MODAL =====
function QRModal({ deviceId, onClose, onConnected }: { deviceId: string; onClose: () => void; onConnected: () => void }) {
  const [qr, setQr] = useState<string | null>(null)
  const [timer, setTimer] = useState(60)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQR = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/devices/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })
      const data = await res.json()
      if (data.alreadyConnected) {
        setConnected(true)
        setTimeout(() => { onConnected(); onClose() }, 1500)
        return
      }
      if (data.qr) {
        setQr(data.qr)
        setTimer(60)
      } else {
        setError(data.error || 'فشل في توليد QR. تأكد من إعداد سيرفر واتساب.')
      }
    } catch {
      setError('تعذر الاتصال بسيرفر واتساب')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchQR()

    // Realtime: listen for device connected via Supabase
    const supabase = createClient()
    const channel = supabase
      .channel(`device-${deviceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'devices',
        filter: `id=eq.${deviceId}`,
      }, (payload) => {
        if ((payload.new as Device).status === 'connected') {
          setConnected(true)
          setTimeout(() => {
            onConnected()
            onClose()
          }, 2000)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  // Timer countdown
  useEffect(() => {
    if (connected || loading) return
    if (timer <= 0) return
    const t = setTimeout(() => setTimer(timer - 1), 1000)
    return () => clearTimeout(t)
  }, [timer, connected, loading])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass"
        style={{ borderRadius: '20px', padding: '32px', maxWidth: '420px', width: '90%', textAlign: 'center' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>ربط جهاز واتساب</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {connected ? (
          <div style={{ padding: '40px 0' }}>
            <CheckCircle size={60} color="#10B981" style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#10B981', marginBottom: '8px' }}>تم الاتصال بنجاح! ✅</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>سيتم إغلاق هذه النافذة تلقائياً...</p>
          </div>
        ) : loading ? (
          <div style={{ padding: '40px 0' }}>
            <div
              style={{
                width: '256px',
                height: '256px',
                margin: '0 auto 16px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--accent-violet)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>جاري توليد QR Code...</p>
          </div>
        ) : qr ? (
          <>
            <div
              style={{
                width: '256px',
                height: '256px',
                margin: '0 auto 16px',
                background: 'white',
                borderRadius: '12px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img src={qr} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            {/* Timer */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: timer <= 15 ? '#EF4444' : 'var(--text-muted)', marginBottom: '6px' }}>
                {timer > 0 ? `ينتهي خلال ${timer} ثانية` : 'انتهت صلاحية الكود'}
              </div>
              <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(timer / 60) * 100}%`,
                    background: timer <= 15 ? '#EF4444' : 'var(--gradient)',
                    transition: 'width 1s linear, background 0.3s',
                    borderRadius: '2px',
                  }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'right',
                marginBottom: '16px',
              }}
            >
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '2', margin: 0 }}>
                1. افتح واتساب على هاتفك<br />
                2. اضغط على المزيد (⋮) أو الإعدادات<br />
                3. اختر <strong style={{ color: 'var(--text-primary)' }}>الأجهزة المرتبطة</strong><br />
                4. اضغط <strong style={{ color: 'var(--text-primary)' }}>ربط جهاز</strong><br />
                5. امسح رمز QR أعلاه
              </p>
            </div>

            {timer <= 0 && (
              <button
                onClick={fetchQR}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <RefreshCw size={16} />
                تحديث QR
              </button>
            )}
          </>
        ) : (
          <div style={{ padding: '20px' }}>
            <div style={{ color: '#EF4444', marginBottom: '16px', fontSize: '14px' }}>
              {error || 'فشل في توليد QR. تأكد من إعداد سيرفر واتساب.'}
            </div>
            <button onClick={fetchQR} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <RefreshCw size={16} /> إعادة المحاولة
            </button>
          </div>
        )}
      </div>
      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ===== ADD DEVICE MODAL =====
function AddDeviceModal({ onClose, onAdded }: { onClose: () => void; onAdded: (deviceId: string) => void }) {
  const [name, setName] = useState('')
  const [webhook, setWebhook] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || 'جهازي', webhook_url: webhook || null }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
      } else {
        onAdded(data.id)
        onClose()
      }
    } catch {
      setError('حدث خطأ، يرجى المحاولة مجدداً')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '400px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>إضافة جهاز جديد</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleAdd}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
              اسم الجهاز <span style={{ color: 'var(--text-muted)' }}>(اختياري)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="جهازي الرئيسي"
              className="input-cosmic"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
              رابط Webhook <span style={{ color: 'var(--text-muted)' }}>(اختياري)</span>
            </label>
            <input
              type="url"
              value={webhook}
              onChange={(e) => setWebhook(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="input-cosmic"
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              يستقبل الرسائل الواردة تلقائياً
            </p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '16px', color: '#EF4444', fontSize: '13px' }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء وعرض QR'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ===== AI SETTINGS MODAL =====
function AISettingsModal({ device, onClose, onSaved }: { device: Device; onClose: () => void; onSaved: () => void }) {
  const [aiEnabled, setAiEnabled] = useState(device.ai_enabled || false)
  const [prompt, setPrompt] = useState(device.ai_prompt || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await createClient().from('devices').update({ ai_enabled: aiEnabled, ai_prompt: prompt || null }).eq('id', device.id)
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>إعدادات الذكاء الاصطناعي</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>🤖 جهاز: <strong style={{ color: 'var(--text-primary)' }}>{device.name}</strong> — {device.phone || 'لا يوجد رقم'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '14px', background: aiEnabled ? 'rgba(124,58,237,0.1)' : 'var(--bg-secondary)', border: `1px solid ${aiEnabled ? 'var(--accent-violet)' : 'var(--border)'}`, borderRadius: '12px' }}>
            <input type="checkbox" checked={aiEnabled} onChange={e => setAiEnabled(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-violet)' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>تفعيل الرد بالذكاء الاصطناعي</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>عند عدم وجود رد تلقائي مطابق، يرد Gemini AI</div>
            </div>
          </label>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>System Prompt مخصص (اختياري)</label>
            <textarea className="input-cosmic" rows={4} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="اتركه فارغاً لاستخدام الافتراضي..." style={{ resize: 'vertical' }} />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>مثال: أنت مساعد لمتجر إلكتروني، أجب عن المنتجات والأسعار فقط.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ justifyContent: 'center' }}>{saving ? 'جاري الحفظ...' : '💾 حفظ إعدادات AI'}</button>
        </div>
      </div>
    </div>
  )
}

// ===== MAIN PAGE =====
export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [qrDeviceId, setQrDeviceId] = useState<string | null>(null)
  const [aiDevice, setAiDevice] = useState<Device | null>(null)
  const [deviceLimit, setDeviceLimit] = useState(3)

  const fetchDevices = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false })
    setDevices(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDevices()

    // Realtime subscription
    const supabase = createClient()
    const channel = supabase
      .channel('devices-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, fetchDevices)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleDeviceAdded = (deviceId: string) => {
    fetchDevices()
    setQrDeviceId(deviceId)
  }

  const handleDisconnect = async (deviceId: string) => {
    await fetch(`/api/devices/${deviceId}/disconnect`, { method: 'POST' })
    fetchDevices()
  }

  const handleDelete = async (deviceId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الجهاز؟')) return
    await fetch(`/api/devices/${deviceId}`, { method: 'DELETE' })
    fetchDevices()
  }

  const statusBadge = (status: Device['status']) => {
    const map = {
      connected: { label: 'متصل', class: 'badge-emerald', icon: <Wifi size={10} /> },
      disconnected: { label: 'منقطع', class: 'badge-red', icon: <WifiOff size={10} /> },
      connecting: { label: 'جاري الاتصال', class: 'badge-yellow', icon: null },
      banned: { label: 'محظور', class: 'badge-red', icon: <AlertCircle size={10} /> },
      expired: { label: 'منتهي', class: 'badge-yellow', icon: null },
    }
    const s = map[status] || map.disconnected
    return (
      <span className={`badge ${s.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {s.icon}
        {s.label}
        {status === 'connecting' && (
          <span
            style={{
              width: '8px',
              height: '8px',
              border: '1.5px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              display: 'inline-block',
            }}
          />
        )}
      </span>
    )
  }

  const atLimit = devices.length >= deviceLimit

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            أجهزة الواتساب
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {devices.length}/{deviceLimit} أجهزة مستخدمة
          </p>
        </div>
        <button
          id="add-device-btn"
          onClick={() => !atLimit && setShowAddModal(true)}
          className={atLimit ? 'btn-secondary' : 'btn-primary'}
          disabled={atLimit}
          title={atLimit ? 'وصلت للحد الأقصى لخطتك' : ''}
          style={{ opacity: atLimit ? 0.5 : 1, cursor: atLimit ? 'not-allowed' : 'pointer' }}
        >
          <Plus size={16} />
          إضافة جهاز
        </button>
      </div>

      {atLimit && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '12px',
            marginBottom: '20px',
            color: '#F59E0B',
            fontSize: '14px',
          }}
        >
          <AlertCircle size={18} />
          وصلت للحد الأقصى لخطتك الحالية.{' '}
          <a href="/plans" style={{ color: '#F59E0B', fontWeight: 600, textDecoration: 'underline' }}>
            ترقية الخطة
          </a>
        </div>
      )}

      {/* Devices Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '52px', marginBottom: '8px', borderRadius: '8px' }} />
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Smartphone size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              لا توجد أجهزة بعد
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              أضف جهازك الأول واربطه بواتساب
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={16} />
              إضافة جهاز الآن
            </button>
          </div>
        ) : (
          <table className="table-cosmic">
            <thead>
              <tr>
                <th>الجهاز</th>
                <th>رقم الهاتف</th>
                <th>الحالة</th>
                <th>الرسائل</th>
                <th>Webhook</th>
                <th>تاريخ الإضافة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: device.status === 'connected' ? 'rgba(16,185,129,0.15)' : 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Smartphone size={16} color={device.status === 'connected' ? '#10B981' : 'var(--text-muted)'} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{device.name}</div>
                        {device.ai_enabled && (
                          <span style={{ fontSize: '10px', color: '#A78BFA', background: 'rgba(124,58,237,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                            AI مفعّل
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}>{device.phone || '-'}</td>
                  <td>{statusBadge(device.status)}</td>
                  <td>{device.messages_sent?.toLocaleString('ar') || '0'}</td>
                  <td>
                    {device.webhook_url ? (
                      <a href={device.webhook_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-violet-light)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <ExternalLink size={12} />
                        مفعّل
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(device.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => setAiDevice(device)} style={{ padding: '6px', background: device.ai_enabled ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: device.ai_enabled ? '#A78BFA' : 'var(--text-muted)' }} title="إعدادات AI"><Bot size={14} /></button>
                      {device.status === 'disconnected' && (<button onClick={() => setQrDeviceId(device.id)} style={{ padding: '6px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#A78BFA' }} title="إعادة الاتصال"><RefreshCw size={14} /></button>)}
                      {device.status === 'connected' && (<button onClick={() => handleDisconnect(device.id)} style={{ padding: '6px', background: 'rgba(245,158,11,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#F59E0B' }} title="قطع الاتصال"><WifiOff size={14} /></button>)}
                      <button onClick={() => handleDelete(device.id)} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }} title="حذف"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddDeviceModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleDeviceAdded}
        />
      )}
      {qrDeviceId && (
        <QRModal
          deviceId={qrDeviceId}
          onClose={() => setQrDeviceId(null)}
          onConnected={fetchDevices}
        />
      )}
      {aiDevice && <AISettingsModal device={aiDevice} onClose={() => setAiDevice(null)} onSaved={fetchDevices} />}

      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
