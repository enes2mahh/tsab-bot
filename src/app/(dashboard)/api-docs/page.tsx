'use client'

import { useState } from 'react'
import { Code, Copy, CheckCircle, Zap, Key, Book } from 'lucide-react'

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/messages/send',
    desc: 'إرسال رسالة نصية لرقم واتساب',
    body: `{
  "deviceId": "your-device-id",
  "to": "966500000000",
  "message": "مرحباً!"
}`,
    curl: `curl -X POST https://tsab-bot.vercel.app/api/messages/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"deviceId":"device-id","to":"966500000000","message":"مرحباً!"}'`,
    js: `const res = await fetch('/api/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    deviceId: 'device-id',
    to: '966500000000',
    message: 'مرحباً!'
  })
})
const data = await res.json()`,
    response: `{ "success": true, "messageId": "uuid" }`,
    color: '#10B981',
  },
  {
    method: 'GET',
    path: '/api/devices',
    desc: 'جلب قائمة أجهزتك المتصلة',
    body: null,
    curl: `curl https://tsab-bot.vercel.app/api/devices \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    js: `const res = await fetch('/api/devices', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
})
const devices = await res.json()`,
    response: `[
  { "id": "uuid", "name": "جهاز الشركة", "status": "connected", "phone": "966500000000" }
]`,
    color: '#3B82F6',
  },
  {
    method: 'POST',
    path: '/api/campaigns',
    desc: 'إنشاء حملة إرسال جماعي',
    body: `{
  "name": "حملة رمضان",
  "device_id": "device-id",
  "message_type": "text",
  "message_content": { "text": "رسالة الحملة" },
  "recipients": [
    { "phone": "966500000000" },
    { "phone": "966507654321" }
  ],
  "delay_min": 5,
  "delay_max": 10
}`,
    curl: `curl -X POST https://tsab-bot.vercel.app/api/campaigns \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"حملة رمضان","device_id":"id","recipients":[{"phone":"966500000000"}]}'`,
    js: `const res = await fetch('/api/campaigns', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'حملة رمضان', device_id: '...', recipients: [...] })
})`,
    response: `{ "id": "uuid", "status": "draft", "total_count": 2 }`,
    color: '#7C3AED',
  },
  {
    method: 'GET',
    path: '/api/campaigns',
    desc: 'جلب كل حملاتك',
    body: null,
    curl: `curl https://tsab-bot.vercel.app/api/campaigns \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    js: `const res = await fetch('/api/campaigns', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
})`,
    response: `[{ "id": "uuid", "name": "حملة رمضان", "status": "completed", "sent_count": 500 }]`,
    color: '#F59E0B',
  },
]

const WEBHOOK_PAYLOAD = `// يصلك هذا الـ payload عند كل رسالة واردة
{
  "event": "message.received",
  "deviceId": "device-id",
  "from": "966500000000",
  "message": {
    "id": "msg-uuid",
    "type": "text",
    "content": { "text": "مرحباً!" },
    "timestamp": "2025-01-01T10:00:00Z"
  },
  "contact": {
    "name": "محمد أحمد",
    "phone": "966500000000"
  }
}`

const ERROR_CODES = [
  { code: 401, meaning: 'Unauthorized', desc: 'مفتاح API غير صحيح أو منتهي الصلاحية' },
  { code: 400, meaning: 'Bad Request', desc: 'بيانات مفقودة أو غير صحيحة في الطلب' },
  { code: 404, meaning: 'Not Found', desc: 'المورد المطلوب (جهاز، حملة) غير موجود' },
  { code: 429, meaning: 'Too Many Requests', desc: 'تجاوزت الحد المسموح — انتظر دقيقة' },
  { code: 500, meaning: 'Server Error', desc: 'خطأ في الخادم — تواصل مع الدعم' },
]

export default function ApiPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [codeTab, setCodeTab] = useState<'curl' | 'js'>('curl')

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

      {/* Why use API */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(124,58,237,0.05)' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>متى أحتاج الـ API؟</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {[
            { icon: '🛒', text: 'إرسال تأكيد الطلب من متجر Shopify أو Salla تلقائياً' },
            { icon: '📊', text: 'إرسال تقارير أو إشعارات من نظام ERP أو CRM' },
            { icon: '🔔', text: 'تذكير العملاء بالمواعيد من تطبيقك الخاص' },
            { icon: '🤖', text: 'بناء chatbot مخصص يُرسل ويستقبل عبر واتساب' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>{item.icon}</span><span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Auth Header */}
      <div className="glass" style={{ borderRadius: '14px', padding: '20px', marginBottom: '24px', border: '1px solid rgba(124,58,237,0.3)' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Key size={14} /> المصادقة — أضف في كل طلب
        </div>
        <code style={{ display: 'block', background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', color: '#10B981', direction: 'ltr' }}>
          {`Authorization: Bearer YOUR_API_KEY`}
        </code>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
          مفتاح API موجود في <a href="/settings" style={{ color: '#A78BFA' }}>الإعدادات → API & Webhook</a>
        </p>
        <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', fontSize: '12px', color: '#F59E0B' }}>
          ⚡ Rate limit: 60 طلب/دقيقة — 429 إذا تجاوزت الحد
        </div>
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

              {/* cURL / JS examples */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                {(['curl', 'js'] as const).map(t => (
                  <button key={t} onClick={() => setCodeTab(t)}
                    style={{ padding: '4px 12px', borderRadius: '6px', border: `1px solid ${codeTab === t ? 'var(--accent-violet)' : 'var(--border)'}`, background: codeTab === t ? 'rgba(124,58,237,0.15)' : 'transparent', color: codeTab === t ? '#A78BFA' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>
                    {t === 'curl' ? '⌨️ cURL' : '🟨 JavaScript'}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '10px', fontSize: '12px', color: '#FCD34D', overflow: 'auto', direction: 'ltr', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {(ep as any)[codeTab] || '# غير متوفر'}
                </pre>
                <button onClick={() => copy((ep as any)[codeTab] || '', 'code')} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {copied === 'code' ? <CheckCircle size={14} color="#10B981" /> : <Copy size={14} />}
                </button>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Response:</div>
              <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '10px', fontSize: '13px', color: '#34D399', direction: 'ltr', margin: 0 }}>
                {ep.response}
              </pre>
            </div>
          </div>
        )
      })()}

      {/* Webhook Payload */}
      <div className="glass" style={{ borderRadius: '16px', padding: '20px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>📡 Webhook Payload</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>عند ضبط Webhook URL في الإعدادات، سيصلك هذا الـ payload عند كل رسالة واردة:</p>
        <div style={{ position: 'relative' }}>
          <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '10px', fontSize: '12px', color: '#A78BFA', direction: 'ltr', margin: 0, whiteSpace: 'pre-wrap' }}>{WEBHOOK_PAYLOAD}</pre>
          <button onClick={() => copy(WEBHOOK_PAYLOAD, 'webhook')} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            {copied === 'webhook' ? <CheckCircle size={14} color="#10B981" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Error Codes */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>⚠️ أكواد الأخطاء</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ERROR_CODES.map(e => (
            <div key={e.code} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <code style={{ fontSize: '14px', fontWeight: 700, color: e.code >= 500 ? '#EF4444' : e.code >= 400 ? '#F59E0B' : '#10B981', minWidth: '40px', direction: 'ltr' }}>{e.code}</code>
              <span style={{ fontSize: '12px', color: '#94A3B8', minWidth: '120px', direction: 'ltr' }}>{e.meaning}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{e.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
