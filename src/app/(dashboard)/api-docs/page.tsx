'use client'

import { useState } from 'react'
import { Code, Copy, CheckCircle, Zap, Key, Book } from 'lucide-react'

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/messages/send',
    desc: 'إرسال رسالة نصية',
    body: `{
  "deviceId": "your-device-id",
  "to": "966500000000",
  "message": "مرحباً!"
}`,
    response: `{ "success": true, "messageId": "uuid" }`,
    color: '#10B981',
  },
  {
    method: 'GET',
    path: '/api/devices',
    desc: 'جلب قائمة الأجهزة',
    body: null,
    response: `[{ "id": "uuid", "name": "جهازي", "status": "connected" }]`,
    color: '#3B82F6',
  },
  {
    method: 'POST',
    path: '/api/campaigns',
    desc: 'إنشاء حملة إرسال جماعي',
    body: `{
  "name": "حملة رمضان",
  "deviceId": "device-id",
  "numbers": ["966500000000"],
  "message": "رسالة الحملة"
}`,
    response: `{ "id": "uuid", "status": "draft" }`,
    color: '#7C3AED',
  },
]

export default function ApiPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tsab-bot.vercel.app'

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Code size={24} color="var(--accent-violet)" /> توثيق API
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>ادمج Tsab Bot في تطبيقاتك بسهولة</p>
      </div>

      {/* Base URL */}
      <div className="glass" style={{ borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Book size={14} /> الـ Base URL
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <code style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: 'var(--accent-violet-light)', direction: 'ltr' }}>
            {baseUrl}
          </code>
          <button onClick={() => copy(baseUrl, 'base')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === 'base' ? '#10B981' : 'var(--text-muted)' }}>
            {copied === 'base' ? <CheckCircle size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {/* Auth Header */}
      <div className="glass" style={{ borderRadius: '14px', padding: '20px', marginBottom: '24px', border: '1px solid rgba(124,58,237,0.3)' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Key size={14} /> المصادقة — أضف في كل طلب
        </div>
        <code style={{ display: 'block', background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', color: '#10B981', direction: 'ltr' }}>
          {`Authorization: Bearer YOUR_SUPABASE_TOKEN`}
        </code>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
          احصل على التوكن من Supabase Auth أو استخدم session token بعد تسجيل الدخول
        </p>
      </div>

      {/* Endpoints */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {ENDPOINTS.map((ep, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              background: activeTab === i ? ep.color : 'rgba(255,255,255,0.05)',
              color: activeTab === i ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s' }}>
            <span style={{ opacity: 0.8, fontSize: '11px', marginLeft: '6px' }}>{ep.method}</span>
            {ep.desc}
          </button>
        ))}
      </div>

      {/* Active Endpoint */}
      {(() => {
        const ep = ENDPOINTS[activeTab]
        return (
          <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: ep.color + '22', color: ep.color }}>
                {ep.method}
              </span>
              <code style={{ fontSize: '14px', color: 'var(--text-primary)', direction: 'ltr' }}>{ep.path}</code>
              <button onClick={() => copy(baseUrl + ep.path, 'url')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginRight: 'auto' }}>
                {copied === 'url' ? <CheckCircle size={16} color="#10B981" /> : <Copy size={16} />}
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{ep.desc}</p>
              {ep.body && (
                <>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Request Body:</div>
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '10px', fontSize: '13px', color: '#A78BFA', overflow: 'auto', direction: 'ltr', margin: 0 }}>
                      {ep.body}
                    </pre>
                    <button onClick={() => copy(ep.body!, 'body')} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {copied === 'body' ? <CheckCircle size={14} color="#10B981" /> : <Copy size={14} />}
                    </button>
                  </div>
                </>
              )}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Response:</div>
              <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '10px', fontSize: '13px', color: '#34D399', direction: 'ltr', margin: 0 }}>
                {ep.response}
              </pre>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
