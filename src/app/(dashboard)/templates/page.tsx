'use client'

import { useState, useEffect } from 'react'
import { Layout, Plus, Trash2, Edit, Copy, CheckCircle, X, ChevronDown, Tag, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { exportData, type ExportColumn } from '@/lib/export'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface Template {
  id: string; name: string; content: string; category: string | null; uses_count: number; created_at: string
}

const DEFAULT_TEMPLATES: Omit<Template, 'id' | 'uses_count' | 'created_at'>[] = [
  { name: 'تحية ترحيبية', content: 'مرحباً {{name}}! 👋 أهلاً وسهلاً بك في {{company}}. كيف يمكنني مساعدتك اليوم؟', category: 'ترحيب' },
  { name: 'رد خارج أوقات العمل', content: 'شكراً على تواصلك! 🕐 ساعات عملنا من 9 صباحاً حتى 6 مساءً (الأحد - الخميس). سيرد عليك فريقنا أول أوقات العمل.', category: 'ترحيب' },
  { name: 'تأكيد الطلب', content: '✅ تم استلام طلبك رقم {{order_id}} بنجاح!\n\nالمنتج: {{product}}\nالكمية: {{quantity}}\nالإجمالي: {{total}} ريال\n\nسيتم التواصل معك خلال 24 ساعة لتأكيد التوصيل.', category: 'طلبات' },
  { name: 'شحنة في الطريق', content: '🚚 طلبك رقم {{order_id}} في الطريق إليك!\n\nرقم التتبع: {{tracking}}\nالمتوقع وصوله: {{date}}\n\nيمكنك تتبع شحنتك عبر: {{link}}', category: 'طلبات' },
  { name: 'تم التوصيل', content: '📦 تم توصيل طلبك رقم {{order_id}} بنجاح!\n\nنتمنى أن تكون راضياً عن تجربتك معنا. شاركنا رأيك: ⭐⭐⭐⭐⭐', category: 'طلبات' },
  { name: 'تذكير بالعربة', content: '🛒 نسيت شيئاً؟\n\nلا يزال {{product}} ينتظرك في سلة مشترياتك.\n\nأكمل طلبك الآن واستفد من خصم {{discount}}% لفترة محدودة!', category: 'ترويج' },
  { name: 'عرض ترويجي', content: '🔥 عرض حصري لك يا {{name}}!\n\nاستمتع بخصم {{discount}}% على جميع المنتجات.\n\n⏰ العرض ينتهي: {{date}}\nكود الخصم: {{code}}\n\nتسوق الآن!', category: 'ترويج' },
  { name: 'شكر بعد الشراء', content: 'شكراً جزيلاً {{name}} على ثقتك بنا! 🙏\n\nنأمل أن يعجبك {{product}}. لا تتردد في التواصل معنا لأي استفسار.\n\nنراك قريباً! 😊', category: 'متابعة' },
  { name: 'استبيان رضا', content: 'مرحباً {{name}}! 😊\n\nكيف كانت تجربتك معنا؟ نريد معرفة رأيك.\n\nقيّم خدمتنا:\n⭐ - ضعيف\n⭐⭐⭐ - جيد\n⭐⭐⭐⭐⭐ - ممتاز', category: 'متابعة' },
  { name: 'تذكير الموعد', content: '⏰ تذكير بموعدك!\n\nمرحباً {{name}}، موعدك غداً الساعة {{time}} في {{location}}.\n\nللتأكيد أو إعادة الجدولة تواصل معنا قبل الموعد بساعة.', category: 'تذكيرات' },
  { name: 'تذكير دفع', content: '📋 تذكير بسداد المستحقات\n\nمرحباً {{name}}،\nالمبلغ المستحق: {{amount}} ريال\nتاريخ الاستحقاق: {{date}}\n\nللاستفسار تواصل معنا.', category: 'تذكيرات' },
  { name: 'رسالة عيد', content: '🌙✨ كل عام وأنتم بخير!\n\nبمناسبة {{occasion}}، نتمنى لكم ولعائلاتكم دوام الصحة والسعادة والنجاح.\n\nفريق {{company}}', category: 'مناسبات' },
  { name: 'تهنئة عيد ميلاد', content: '🎂🎉 عيد ميلاد سعيد {{name}}!\n\nنتمنى لك يوماً مليئاً بالفرح والسعادة.\n\nهدية خاصة منا: خصم {{discount}}% على طلبك القادم! 🎁', category: 'مناسبات' },
  { name: 'دعم فني', content: 'مرحباً {{name}}! 🛠️\n\nتم استلام طلب الدعم الفني رقم {{ticket_id}}.\n\nسيتواصل معك أحد فنيينا خلال {{hours}} ساعة.\n\nشكراً لصبرك!', category: 'دعم' },
  { name: 'رد على شكوى', content: 'مرحباً {{name}}،\n\nنعتذر عن الإزعاج الذي تعرضت له. تلقينا شكواك وسنعمل على حلها فوراً.\n\nسنتواصل معك خلال {{hours}} ساعة بحل نهائي.\n\nفريق خدمة العملاء', category: 'دعم' },
  { name: 'تأكيد اشتراك', content: '🎉 مرحباً {{name}}!\n\nتم تفعيل اشتراكك في {{service}} بنجاح.\n\nنوع الاشتراك: {{plan}}\nتاريخ الانتهاء: {{date}}\n\nاستمتع بجميع المزايا!', category: 'اشتراكات' },
  { name: 'تجديد اشتراك', content: 'مرحباً {{name}}! 📅\n\nاشتراكك في {{service}} سينتهي خلال {{days}} أيام.\n\nجدّد الآن واستمر في الاستمتاع بالخدمة بدون انقطاع.\n\nرابط التجديد: {{link}}', category: 'اشتراكات' },
  { name: 'دعوة رفيق', content: 'مرحباً {{name}}! 🤝\n\nادعُ أصدقاءك واكسب مكافآت!\n\nرابط الدعوة الخاص بك: {{referral_link}}\n\nستحصل على {{reward}} عند كل صديق يشترك.', category: 'إحالات' },
  { name: 'تأكيد الحجز', content: '✅ تم تأكيد حجزك!\n\nالاسم: {{name}}\nالخدمة: {{service}}\nالتاريخ: {{date}}\nالوقت: {{time}}\n\nنراك قريباً! إذا احتجت تعديل الحجز تواصل معنا.', category: 'حجوزات' },
  { name: 'مشاركة كتالوج', content: 'مرحباً {{name}}! 📋\n\nيسعدنا مشاركة كتالوج منتجاتنا الجديد معك.\n\nتصفح أحدث المنتجات: {{link}}\n\nللطلب أو الاستفسار نحن هنا! 😊', category: 'ترويج' },
]

const VARIABLES = ['{{name}}', '{{phone}}', '{{date}}', '{{time}}', '{{order_id}}', '{{product}}', '{{company}}', '{{amount}}', '{{discount}}', '{{link}}', '{{tracking}}']

const categories = ['الكل', 'ترحيب', 'طلبات', 'ترويج', 'متابعة', 'تذكيرات', 'مناسبات', 'دعم', 'اشتراكات', 'إحالات', 'حجوزات']

function TemplateForm({ onClose, onSaved, existing }: { onClose: () => void; onSaved: () => void; existing?: Template }) {
  const [form, setForm] = useState({ name: existing?.name || '', content: existing?.content || '', category: existing?.category || 'ترحيب' })
  const [loading, setLoading] = useState(false)
  const textareaRef = useState<HTMLTextAreaElement | null>(null)

  const insertVariable = (v: string) => {
    setForm(f => ({ ...f, content: f.content + v }))
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (existing) {
      await supabase.from('templates').update({ name: form.name, content: form.content, category: form.category }).eq('id', existing.id)
    } else {
      await supabase.from('templates').insert({ ...form, user_id: user.id, uses_count: 0 })
    }
    setLoading(false); onSaved(); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '28px', maxWidth: '520px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{existing ? 'تعديل قالب' : 'قالب جديد'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>اسم القالب *</label>
            <input className="input-cosmic" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: تأكيد الطلب" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>التصنيف</label>
            <select className="input-cosmic" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {categories.filter(c => c !== 'الكل').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>محتوى القالب *</label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {VARIABLES.slice(0, 6).map(v => (
                  <button key={v} onClick={() => insertVariable(v)} style={{ padding: '2px 7px', borderRadius: '5px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA', cursor: 'pointer', fontSize: '11px' }}>{v}</button>
                ))}
              </div>
            </div>
            <textarea className="input-cosmic" rows={7} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="اكتب نص القالب هنا..." style={{ resize: 'vertical' }} />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>استخدم المتغيرات أعلاه — تُستبدل تلقائياً عند الإرسال</p>
          </div>
          {form.content && (
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>معاينة:</label>
              <div style={{ background: '#DCF8C6', borderRadius: '12px 12px 12px 0', padding: '10px 14px', fontSize: '13px', color: '#111', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{form.content}</div>
            </div>
          )}
          <button onClick={handleSave} disabled={loading || !form.name || !form.content} className="btn-primary" style={{ justifyContent: 'center' }}>
            {loading ? 'جاري الحفظ...' : 'حفظ القالب'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<Template | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('الكل')
  const [seeded, setSeeded] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchTemplates = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('templates').select('*').order('created_at', { ascending: false })
    const list = data || []
    setTemplates(list)
    setLoading(false)
    // Seed default templates if empty
    if (list.length === 0 && !seeded) {
      setSeeded(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const rows = DEFAULT_TEMPLATES.map(t => ({ ...t, user_id: user.id, uses_count: 0 }))
      await supabase.from('templates').insert(rows)
      const { data: fresh } = await supabase.from('templates').select('*').order('created_at', { ascending: false })
      setTemplates(fresh || [])
    }
  }

  useEffect(() => { fetchTemplates() }, [])

  const copyTemplate = async (t: Template) => {
    navigator.clipboard.writeText(t.content)
    setCopied(t.id)
    setTimeout(() => setCopied(null), 2000)
    // increment uses_count
    await createClient().from('templates').update({ uses_count: (t.uses_count || 0) + 1 }).eq('id', t.id)
  }

  const deleteTemplate = (id: string) => setDeleteConfirm(id)

  const confirmDeleteTemplate = async () => {
    if (!deleteConfirm) return
    await createClient().from('templates').delete().eq('id', deleteConfirm)
    setDeleteConfirm(null)
    fetchTemplates()
  }

  const filtered = templates.filter(t => {
    const matchCat = catFilter === 'الكل' || t.category === catFilter
    const matchSearch = !search || t.name.includes(search) || t.content.includes(search)
    return matchCat && matchSearch
  })

  return (
    <div>
      <div className="page-flex-header">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>القوالب</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{templates.length} قالب — انسخه واستخدمه في الحملات</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => {
            const cols: ExportColumn<Template>[] = [
              { header: 'الاسم', accessor: t => t.name },
              { header: 'التصنيف', accessor: t => t.category || '' },
              { header: 'المحتوى', accessor: t => t.content },
              { header: 'الاستخدامات', accessor: t => t.uses_count },
            ]
            exportData(templates, cols, 'templates', 'csv')
          }} className="btn-secondary" style={{ fontSize: '13px' }}>
            تصدير CSV
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> قالب جديد
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-cosmic" placeholder="بحث في القوالب..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: '32px', height: '38px' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${catFilter === c ? 'var(--accent-violet)' : 'var(--border)'}`, background: catFilter === c ? 'rgba(124,58,237,0.15)' : 'transparent', color: catFilter === c ? '#A78BFA' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton card" style={{ height: '180px' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Layout size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>لا توجد قوالب تطابق البحث</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map(t => (
            <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{t.name}</div>
                  {t.category && (
                    <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(124,58,237,0.12)', color: '#A78BFA', borderRadius: '5px' }}>
                      <Tag size={9} style={{ display: 'inline', marginLeft: '3px' }} />{t.category}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => setEditItem(t)} style={{ padding: '5px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#A78BFA' }}><Edit size={13} /></button>
                  <button onClick={() => deleteTemplate(t.id)} style={{ padding: '5px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                </div>
              </div>

              <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', whiteSpace: 'pre-wrap' }}>
                {t.content}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>استُخدم {t.uses_count || 0} مرة</span>
                <button onClick={() => copyTemplate(t)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: copied === t.id ? 'rgba(16,185,129,0.1)' : 'transparent', color: copied === t.id ? '#10B981' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}>
                  {copied === t.id ? <CheckCircle size={13} /> : <Copy size={13} />}
                  {copied === t.id ? 'تم النسخ!' : 'نسخ'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <TemplateForm onClose={() => setShowAdd(false)} onSaved={fetchTemplates} />}
      {editItem && <TemplateForm onClose={() => setEditItem(null)} onSaved={fetchTemplates} existing={editItem} />}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="حذف القالب"
        description="هل أنت متأكد من حذف هذا القالب؟"
        confirmLabel="حذف"
        variant="danger"
        onConfirm={confirmDeleteTemplate}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
