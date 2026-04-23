'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, CheckCircle, Key, Globe, AlertTriangle, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    gemini_api_key: '', default_system_prompt: 'أنت مساعد ذكي ومفيد. أجب باللغة التي يكتب بها المستخدم.',
    maintenance_mode: false, global_announcement: '', platform_name: 'Tsab Bot', platform_logo_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    createClient().from('system_settings').select('*').single().then(({ data }) => {
      if (data) setSettings(prev => ({ ...prev, ...data.settings }))
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('system_settings').upsert({ id: 'global', settings })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>إعدادات النظام</h2>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          <Save size={15} /> {saving ? 'جاري الحفظ...' : saved ? '✓ تم الحفظ' : 'حفظ الإعدادات'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
        {/* Platform Settings */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} /> إعدادات المنصة
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>اسم المنصة</label>
              <input className="input-cosmic" value={settings.platform_name} onChange={e => setSettings({ ...settings, platform_name: e.target.value })} />
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={16} /> إعدادات Gemini AI
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Gemini API Key</label>
              <input className="input-cosmic" type="password" value={settings.gemini_api_key} onChange={e => setSettings({ ...settings, gemini_api_key: e.target.value })} placeholder="AIzaSy..." style={{ direction: 'ltr', fontFamily: 'monospace' }} />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                احصل على مفتاح من <a href="https://aistudio.google.com" target="_blank" style={{ color: 'var(--accent-violet-light)' }}>aistudio.google.com</a>
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>System Prompt الافتراضي</label>
              <textarea className="input-cosmic" rows={4} value={settings.default_system_prompt} onChange={e => setSettings({ ...settings, default_system_prompt: e.target.value })} style={{ resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Announcement */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} /> إعلان عام
          </h3>
          <textarea className="input-cosmic" rows={3} value={settings.global_announcement} onChange={e => setSettings({ ...settings, global_announcement: e.target.value })} placeholder="اترك فارغاً لعدم العرض..." style={{ resize: 'vertical' }} />
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>يظهر كشريط أعلى كل الصفحات</p>
        </div>

        {/* Maintenance Mode */}
        <div className="card" style={{ border: settings.maintenance_mode ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: settings.maintenance_mode ? '#EF4444' : 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} /> وضع الصيانة
          </h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={settings.maintenance_mode} onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked })} style={{ width: '20px', height: '20px', accentColor: '#EF4444' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>تفعيل وضع الصيانة</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>يعرض صفحة صيانة لكل المستخدمين ما عدا الأدمن</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
