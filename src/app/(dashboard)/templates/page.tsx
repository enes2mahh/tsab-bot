'use client'

import { useState, useEffect } from 'react'
import { Layout, Plus, Trash2, Edit, Copy, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const SAMPLE_TEMPLATES = [
  { id: '1', name: 'رسالة ترحيب', content: 'مرحباً {{name}}! أهلاً وسهلاً بك في خدمتنا 🎉', category: 'ترحيب', uses: 0 },
  { id: '2', name: 'تأكيد الطلب', content: 'تم تأكيد طلبك رقم {{order_id}} وسيتم توصيله خلال {{days}} أيام ✅', category: 'طلبات', uses: 0 },
  { id: '3', name: 'تذكير موعد', content: 'مرحباً {{name}}، نذكّرك بموعدك غداً الساعة {{time}} ⏰', category: 'تذكيرات', uses: 0 },
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(SAMPLE_TEMPLATES)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const copyTemplate = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layout size={24} color="var(--accent-violet)" /> القوالب
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>قوالب جاهزة لرسائلك</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> قالب جديد
        </button>
      </div>

      {/* Add Template Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ borderRadius: '20px', padding: '32px', width: '500px', maxWidth: '90vw' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>قالب جديد</h3>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>اسم القالب</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="رسالة ترحيب" className="input-cosmic" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                المحتوى <span style={{ color: 'var(--text-muted)' }}>(استخدم {'{{name}}'} للمتغيرات)</span>
              </label>
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="مرحباً {{name}}! ..."
                className="input-cosmic"
                style={{ minHeight: '120px', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => {
                if (newName && newContent) {
                  setTemplates([...templates, { id: Date.now().toString(), name: newName, content: newContent, category: 'عام', uses: 0 }])
                  setNewName(''); setNewContent(''); setShowAdd(false)
                }
              }} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>حفظ القالب</button>
              <button onClick={() => setShowAdd(false)} className="btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {templates.map(t => (
          <div key={t.id} className="glass" style={{ borderRadius: '16px', padding: '20px', transition: 'transform 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', background: 'rgba(124,58,237,0.15)', color: 'var(--accent-violet-light)' }}>{t.category}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => copyTemplate(t.content, t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === t.id ? '#10B981' : 'var(--text-muted)' }}>
                  <Copy size={16} />
                </button>
                <button onClick={() => setTemplates(templates.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px' }}>
              {t.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
