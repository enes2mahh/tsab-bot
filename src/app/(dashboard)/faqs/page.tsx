'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2, Save, X, MessageCircle, Bot, TrendingUp, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FAQ {
  id: string
  device_id: string
  question_normalized: string
  question_original: string
  answer: string
  source: 'manual' | 'auto_learned' | 'greeting'
  hits_count: number
  is_active: boolean
  created_at: string
}

interface Device { id: string; name: string; phone: string | null }

interface LearningQueue {
  id: string
  device_id: string
  question_normalized: string
  last_question: string
  last_ai_answer: string
  count: number
  promoted: boolean
}

function FAQForm({ devices, faq, onClose, onSaved }: { devices: Device[]; faq?: FAQ | null; onClose: () => void; onSaved: () => void }) {
  const [deviceId, setDeviceId] = useState(faq?.device_id || devices[0]?.id || '')
  const [question, setQuestion] = useState(faq?.question_original || '')
  const [answer, setAnswer] = useState(faq?.answer || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!deviceId || !question.trim() || !answer.trim()) return alert('املأ كل الحقول')
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const normalized = question.trim().toLowerCase().replace(/[آأإ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').replace(/[?!.,،؟،]+$/, '')

    if (faq) {
      await supabase.from('bot_faqs').update({
        device_id: deviceId, question_original: question, question_normalized: normalized,
        answer, source: faq.source,
      }).eq('id', faq.id)
    } else {
      await supabase.from('bot_faqs').insert({
        device_id: deviceId, user_id: user.id,
        question_original: question, question_normalized: normalized,
        answer, source: 'manual', is_active: true,
      })
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '560px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {faq ? 'تعديل سؤال شائع' : 'إضافة سؤال شائع'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الجهاز</label>
            <select className="input-cosmic" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.name} {d.phone ? `(${d.phone})` : ''}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>السؤال (كما يكتبه العميل)</label>
            <input className="input-cosmic" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="مثلاً: ايش الأسعار؟" />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>نطابق السؤال بشكل ذكي (يتجاهل التشكيل والاختلافات الإملائية)</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الردّ</label>
            <textarea className="input-cosmic" rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="أسعارنا تبدأ من 50 ريال للخدمة الأساسية..." style={{ resize: 'vertical' }} />
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ justifyContent: 'center' }}>
            <Save size={15} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [queue, setQueue] = useState<LearningQueue[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editFaq, setEditFaq] = useState<FAQ | null>(null)
  const [tab, setTab] = useState<'active' | 'learning'>('active')

  const fetchAll = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: f }, { data: d }] = await Promise.all([
      supabase.from('bot_faqs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('devices').select('id, name, phone').eq('user_id', user.id),
    ])
    setFaqs(f || [])
    setDevices(d || [])

    // Get learning queue (not yet promoted)
    if (d?.length) {
      const deviceIds = d.map((x: any) => x.id)
      const { data: q } = await supabase
        .from('faq_learning_queue')
        .select('*')
        .in('device_id', deviceIds)
        .eq('promoted', false)
        .gte('count', 2)
        .order('count', { ascending: false })
        .limit(50)
      setQueue(q || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const toggleActive = async (id: string, current: boolean) => {
    await createClient().from('bot_faqs').update({ is_active: !current }).eq('id', id)
    fetchAll()
  }

  const deleteFaq = async (id: string) => {
    if (!confirm('حذف هذا السؤال؟')) return
    await createClient().from('bot_faqs').delete().eq('id', id)
    fetchAll()
  }

  const promoteFromQueue = async (item: LearningQueue) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('bot_faqs').insert({
      device_id: item.device_id, user_id: user.id,
      question_normalized: item.question_normalized,
      question_original: item.last_question,
      answer: item.last_ai_answer,
      source: 'auto_learned', is_active: true,
    })
    await supabase.from('faq_learning_queue').update({ promoted: true }).eq('id', item.id)
    fetchAll()
  }

  const sourceBadge = (source: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      manual: { label: 'مُضاف يدوياً', color: '#7C3AED', bg: 'rgba(124,58,237,0.15)' },
      auto_learned: { label: 'تعلّم تلقائي 🧠', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
      greeting: { label: 'تحية', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    }
    const m = map[source] || map.manual
    return <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, background: m.bg, color: m.color }}>{m.label}</span>
  }

  const totalHits = faqs.reduce((s, f) => s + (f.hits_count || 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>الأسئلة المتكررة (FAQ)</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>الردود الذكية بدون استهلاك tokens</p>
        </div>
        {devices.length > 0 && (
          <button onClick={() => { setEditFaq(null); setShowForm(true) }} className="btn-primary">
            <Plus size={16} /> سؤال جديد
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div className="stat-card" style={{ borderTopColor: '#7C3AED' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>إجمالي الأسئلة</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{faqs.length}</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#10B981' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>مرات الاستخدام</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalHits.toLocaleString('ar')}</div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px' }}>≈ {totalHits} token تم توفيره</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#F59E0B' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>قائمة الانتظار</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{queue.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>سؤال متكرّر</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => setTab('active')} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: tab === 'active' ? '2px solid var(--accent-violet)' : '2px solid transparent', color: tab === 'active' ? 'var(--accent-violet-light)' : 'var(--text-secondary)', fontFamily: 'Tajawal, sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          الأسئلة النشطة ({faqs.length})
        </button>
        <button onClick={() => setTab('learning')} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: tab === 'learning' ? '2px solid var(--accent-violet)' : '2px solid transparent', color: tab === 'learning' ? 'var(--accent-violet-light)' : 'var(--text-secondary)', fontFamily: 'Tajawal, sans-serif', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          🧠 قائمة التعلّم ({queue.length})
        </button>
      </div>

      {/* Hint */}
      {tab === 'active' && (
        <div style={{ padding: '14px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', color: '#10B981', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <Sparkles size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>عند مطابقة سؤال أحد العملاء لأي من هذه الأسئلة، يردّ البوت مباشرةً <strong>بدون استخدام Gemini AI</strong> — يوفّر فلوس وأسرع للعميل.</span>
        </div>
      )}
      {tab === 'learning' && (
        <div style={{ padding: '14px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', color: '#F59E0B', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <Bot size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>هذه أسئلة تكرّر سؤالها من عملاء مختلفين. عند 3 تكرارات يتمّ ترقيتها تلقائياً، أو تستطيع ترقيتها يدوياً الآن.</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="card">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '8px', borderRadius: '8px' }} />)}</div>
      ) : tab === 'active' ? (
        faqs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <Sparkles size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>لا توجد أسئلة بعد. أضف أسئلتك الأكثر تكراراً.</p>
            {devices.length > 0 ? (
              <button onClick={() => { setEditFaq(null); setShowForm(true) }} className="btn-primary"><Plus size={16} /> أضف أول سؤال</button>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>اربط جهازاً أولاً من صفحة <a href="/devices" style={{ color: 'var(--accent-violet-light)' }}>الأجهزة</a></p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((f) => {
              const dev = devices.find((d) => d.id === f.device_id)
              return (
                <div key={f.id} className="card" style={{ opacity: f.is_active ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <MessageCircle size={14} color="var(--accent-violet-light)" />
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{f.question_original}</strong>
                        {sourceBadge(f.source)}
                        {dev && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {dev.name}</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingRight: '22px', whiteSpace: 'pre-wrap' }}>{f.answer}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <span style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.1)', color: '#10B981', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>
                        <TrendingUp size={11} style={{ display: 'inline', marginLeft: '3px' }} /> {f.hits_count || 0}
                      </span>
                      <button onClick={() => { setEditFaq(f); setShowForm(true) }} style={{ padding: '6px 10px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#A78BFA', fontSize: '11px', fontFamily: 'Tajawal, sans-serif' }}>تعديل</button>
                      <button onClick={() => toggleActive(f.id, f.is_active)} style={{ padding: '6px 10px', background: f.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: f.is_active ? '#F59E0B' : '#10B981', fontSize: '11px', fontFamily: 'Tajawal, sans-serif' }}>
                        {f.is_active ? 'تعطيل' : 'تفعيل'}
                      </button>
                      <button onClick={() => deleteFaq(f.id)} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : queue.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          لا توجد أسئلة في قائمة التعلّم بعد. عند تكرار العملاء لنفس السؤال، يظهر هنا.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {queue.map((q) => (
            <div key={q.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ padding: '2px 8px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>تكرر {q.count} مرات</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{q.last_question}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>الردّ الذي قاله AI آخر مرة:</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>{q.last_ai_answer}</div>
                </div>
                <button onClick={() => promoteFromQueue(q)} className="btn-primary" style={{ flexShrink: 0 }}>
                  <CheckCircle size={14} /> ترقية لـ FAQ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && devices.length > 0 && <FAQForm devices={devices} faq={editFaq} onClose={() => { setShowForm(false); setEditFaq(null) }} onSaved={fetchAll} />}
    </div>
  )
}
