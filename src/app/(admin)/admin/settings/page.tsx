'use client'

import { useState, useEffect } from 'react'
import { Save, Key, Globe, AlertTriangle, Bell, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FileUpload } from '@/components/FileUpload'

interface SystemSettings {
  // Platform
  platform_name: string
  platform_logo_url: string
  og_image_url: string
  // Contact
  contact_email: string
  contact_phone: string
  contact_address: string
  // Social
  social_twitter: string
  social_facebook: string
  social_instagram: string
  social_linkedin: string
  social_youtube: string
  social_tiktok: string
  social_whatsapp: string
  // AI
  gemini_api_key: string
  default_system_prompt: string
  // Referrals
  commission_rate: number
  min_withdrawal: number
  referral_hold_days: number
  // OTP
  otp_device_id: string
  // System
  maintenance_mode: boolean
  global_announcement: string
}

const defaultSettings: SystemSettings = {
  platform_name: 'Tsab Bot',
  platform_logo_url: '',
  og_image_url: '',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  social_twitter: '',
  social_facebook: '',
  social_instagram: '',
  social_linkedin: '',
  social_youtube: '',
  social_tiktok: '',
  social_whatsapp: '',
  gemini_api_key: '',
  default_system_prompt: 'أنت مساعد ذكي ومفيد. أجب باللغة التي يكتب بها المستخدم.',
  commission_rate: 10,
  min_withdrawal: 25,
  referral_hold_days: 14,
  otp_device_id: '',
  maintenance_mode: false,
  global_announcement: '',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [otpDevices, setOtpDevices] = useState<{ id: string; name: string; phone: string | null; status: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('system_settings').select('*').eq('id', 'global').single(),
      supabase.from('devices').select('id, name, phone, status, profiles(role)').eq('status', 'connected'),
    ]).then(([s, d]) => {
      if (s.data?.settings) setSettings({ ...defaultSettings, ...s.data.settings })
      // Filter to admin-owned connected devices only (safer for OTP)
      const adminDevices = (d.data || []).filter((dev: any) => dev.profiles?.role === 'admin')
      setOtpDevices(adminDevices.length ? adminDevices : (d.data || []))
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await createClient().from('system_settings').upsert({ id: 'global', settings })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  if (loading) {
    return <div style={{ padding: '24px' }}>{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', marginBottom: '12px', borderRadius: '12px' }} />)}</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>إعدادات النظام</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>يظهر تأثير معظم الإعدادات فوراً على الموقع</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          <Save size={15} /> {saving ? 'جاري الحفظ...' : saved ? '✓ تم الحفظ' : 'حفظ كل الإعدادات'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '780px' }}>
        {/* === Platform === */}
        <Section icon={<Globe size={16} />} title="إعدادات المنصة">
          <Field label="اسم المنصة" value={settings.platform_name} onChange={(v) => update('platform_name', v)} placeholder="Tsab Bot" />
          <FileUpload
            label="شعار المنصة (Logo)"
            value={settings.platform_logo_url}
            onChange={(v) => update('platform_logo_url', v)}
            folder="logos"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            maxSizeMB={2}
            hint="يظهر في الـ navbar والـ footer. الأفضل صورة مربعة 200×200 بصيغة PNG شفافة."
          />
          <FileUpload
            label="صورة OG (للمشاركة على وسائل التواصل)"
            value={settings.og_image_url}
            onChange={(v) => update('og_image_url', v)}
            folder="og-images"
            accept="image/png,image/jpeg,image/webp"
            maxSizeMB={3}
            hint="الصورة التي تظهر عند مشاركة الموقع على واتساب/تويتر. يفضل 1200×630."
          />
          <Textarea label="إعلان عام (يظهر أعلى الصفحات)" value={settings.global_announcement} onChange={(v) => update('global_announcement', v)} placeholder="اتركه فارغاً لإخفاء الإعلان..." />
        </Section>

        {/* === Contact === */}
        <Section icon={<Mail size={16} />} title="معلومات التواصل (تظهر في الفوتر)">
          <Field label="البريد الإلكتروني" type="email" value={settings.contact_email} onChange={(v) => update('contact_email', v)} placeholder="support@example.com" ltr />
          <Field label="رقم الهاتف" type="tel" value={settings.contact_phone} onChange={(v) => update('contact_phone', v)} placeholder="+966 5x xxx xxxx" ltr />
          <Field label="العنوان (اختياري)" value={settings.contact_address} onChange={(v) => update('contact_address', v)} placeholder="الرياض، المملكة العربية السعودية" />
        </Section>

        {/* === Social === */}
        <Section icon={<Globe size={16} />} title="روابط مواقع التواصل الاجتماعي">
          <SocialField badge="𝕏" color="#000" label="X / Twitter" value={settings.social_twitter} onChange={(v) => update('social_twitter', v)} placeholder="https://x.com/yourhandle" />
          <SocialField badge="f" color="#1877F2" label="Facebook" value={settings.social_facebook} onChange={(v) => update('social_facebook', v)} placeholder="https://facebook.com/yourpage" />
          <SocialField badge="IG" color="#E4405F" label="Instagram" value={settings.social_instagram} onChange={(v) => update('social_instagram', v)} placeholder="https://instagram.com/yourhandle" />
          <SocialField badge="in" color="#0A66C2" label="LinkedIn" value={settings.social_linkedin} onChange={(v) => update('social_linkedin', v)} placeholder="https://linkedin.com/company/yours" />
          <SocialField badge="YT" color="#FF0000" label="YouTube" value={settings.social_youtube} onChange={(v) => update('social_youtube', v)} placeholder="https://youtube.com/@yourchannel" />
          <SocialField badge="TT" color="#000" label="TikTok" value={settings.social_tiktok} onChange={(v) => update('social_tiktok', v)} placeholder="https://tiktok.com/@yourhandle" />
          <SocialField badge="WA" color="#25D366" label="WhatsApp Business" value={settings.social_whatsapp} onChange={(v) => update('social_whatsapp', v)} placeholder="https://wa.me/9665..." />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>اترك الحقل فارغاً لإخفاء الأيقونة من الفوتر.</p>
        </Section>

        {/* === AI === */}
        <Section icon={<Key size={16} />} title="إعدادات Gemini AI">
          <Field
            label="Gemini API Key"
            type="password"
            value={settings.gemini_api_key}
            onChange={(v) => update('gemini_api_key', v)}
            placeholder="AIzaSy..."
            ltr
            hint={<>احصل على مفتاح من <a href="https://aistudio.google.com" target="_blank" style={{ color: 'var(--accent-violet-light)' }}>aistudio.google.com</a>. يستخدم لجميع المستخدمين كافتراضي.</>}
          />
          <Textarea label="System Prompt الافتراضي" value={settings.default_system_prompt} onChange={(v) => update('default_system_prompt', v)} placeholder="..." />
        </Section>

        {/* === OTP === */}
        <Section icon={<Mail size={16} />} title="🔐 إعدادات التحقق برقم الهاتف (WhatsApp OTP)">
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            عند إنشاء حساب جديد، نُرسل رمز تحقق عبر واتساب من الجهاز المختار أدناه. لو لم تختر جهازاً → يُتجاوز التحقق ويتم إنشاء الحساب مباشرةً (للتطوير).
          </p>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الجهاز المرسل لرسائل OTP</label>
            <select className="input-cosmic" value={settings.otp_device_id} onChange={(e) => update('otp_device_id', e.target.value)}>
              <option value="">— لا يوجد (تجاوز التحقق) —</option>
              {otpDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}{d.phone ? ` (${d.phone})` : ''} {d.status === 'connected' ? '✅' : '❌'}
                </option>
              ))}
            </select>
            {otpDevices.length === 0 && (
              <p style={{ fontSize: '11px', color: '#F59E0B', marginTop: '4px' }}>
                ⚠️ لا يوجد جهاز متصل. اربط جهاز واتساب باسم الأدمن أولاً من <a href="/devices" style={{ color: 'var(--accent-violet-light)' }}>صفحة الأجهزة</a>
              </p>
            )}
          </div>
        </Section>

        {/* === Referrals === */}
        <Section icon={<Bell size={16} />} title="إعدادات الإحالات">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            <NumberField label="نسبة العمولة %" value={settings.commission_rate} onChange={(v) => update('commission_rate', v)} min={1} max={50} />
            <NumberField label="حد السحب الأدنى (ر.س)" value={settings.min_withdrawal} onChange={(v) => update('min_withdrawal', v)} min={10} />
            <NumberField label="فترة الاحتجاز (يوم)" value={settings.referral_hold_days} onChange={(v) => update('referral_hold_days', v)} min={0} />
          </div>
        </Section>

        {/* === Maintenance === */}
        <div className="card" style={{ border: settings.maintenance_mode ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: settings.maintenance_mode ? '#EF4444' : 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} /> وضع الصيانة
          </h3>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={settings.maintenance_mode} onChange={(e) => update('maintenance_mode', e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#EF4444', marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>تفعيل وضع الصيانة</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>يعرض صفحة صيانة لكل المستخدمين ما عدا الأدمن</div>
            </div>
          </label>
        </div>

        {/* Floating save reminder */}
        <div style={{ position: 'sticky', bottom: '20px', textAlign: 'center', paddingTop: '12px' }}>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '14px 32px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <Save size={16} /> {saving ? 'جاري الحفظ...' : saved ? '✓ تم حفظ كل الإعدادات' : 'حفظ كل الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>{icon} {title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', hint, ltr }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: React.ReactNode; ltr?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</label>
      <input type={type} className="input-cosmic" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={ltr ? { direction: 'ltr', fontFamily: type === 'password' ? 'monospace' : undefined } : {}} />
      {hint && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{hint}</p>}
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</label>
      <textarea className="input-cosmic" rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ resize: 'vertical' }} />
    </div>
  )
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</label>
      <input type="number" className="input-cosmic" value={value} min={min} max={max} onChange={(e) => onChange(+e.target.value)} />
    </div>
  )
}

function SocialField({ badge, color, label, value, onChange, placeholder }: { badge: string; color: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
        <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{badge}</span>
        {label}
      </label>
      <input type="url" className="input-cosmic" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ direction: 'ltr' }} />
    </div>
  )
}
