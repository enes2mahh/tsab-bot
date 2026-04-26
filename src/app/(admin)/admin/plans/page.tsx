'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Star, X, Save, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Plan {
  id: string; name: string; name_ar: string; slug: string; price: number
  duration_days: number; trial_days: number; message_limit: number; device_limit: number
  features: Record<string, boolean>; is_recommended: boolean; is_active: boolean; sort_order: number
  description: string; description_ar: string
}

const FEATURE_LABELS: Record<string, string> = {
  auto_reply: 'رد تلقائي', send_message: 'إرسال رسائل', send_media: 'إرسال ملفات',
  api: 'API', webhook: 'Webhook', ai: 'ذكاء اصطناعي', bulk_send: 'إرسال جماعي',
  scheduling: 'جدولة رسائل', chatflow: 'تدفق محادثة', warmer: 'WA Warmer',
  live_chat: 'Live Chat', team: 'إدارة فريق', advanced_analytics: 'تحليلات متقدمة',
  file_manager: 'مدير الملفات', phonebook: 'دليل الهاتف', number_filter: 'فلتر أرقام',
}

function PlanForm({ plan, onClose, onSaved }: { plan?: Plan | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!plan
  const [form, setForm] = useState<Omit<Plan, 'id'>>({
    name: plan?.name || '', name_ar: plan?.name_ar || '', slug: plan?.slug || '',
    price: plan?.price || 0, duration_days: plan?.duration_days || 30,
    trial_days: plan?.trial_days || 0, message_limit: plan?.message_limit || 1000,
    device_limit: plan?.device_limit || 1, features: plan?.features || {},
    is_recommended: plan?.is_recommended || false, is_active: plan?.is_active ?? true,
    sort_order: plan?.sort_order || 0, description: plan?.description || '',
    description_ar: plan?.description_ar || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name || !form.name_ar || !form.slug) return alert('يجب تعبئة الاسم والـ slug')
    setSaving(true)
    const supabase = createClient()
    if (isEdit && plan) {
      await supabase.from('plans').update(form).eq('id', plan.id)
    } else {
      await supabase.from('plans').insert(form)
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  const toggleFeature = (key: string) => {
    setForm(prev => ({ ...prev, features: { ...prev.features, [key]: !prev.features[key] } }))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isEdit ? 'تعديل الخطة' : 'إضافة خطة جديدة'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الاسم (عربي)</label>
            <input className="input-cosmic" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} placeholder="الاحترافية" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>الاسم (إنجليزي)</label>
            <input className="input-cosmic" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Professional" style={{ direction: 'ltr' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Slug (فريد)</label>
            <input className="input-cosmic" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })} placeholder="professional" style={{ direction: 'ltr', fontFamily: 'monospace' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>السعر (ريال/شهر)</label>
            <input type="number" className="input-cosmic" value={form.price} min={0} onChange={e => setForm({ ...form, price: +e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>حد الرسائل / شهر</label>
            <input type="number" className="input-cosmic" value={form.message_limit} min={100} step={100} onChange={e => setForm({ ...form, message_limit: +e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>حد الأجهزة</label>
            <input type="number" className="input-cosmic" value={form.device_limit} min={1} onChange={e => setForm({ ...form, device_limit: +e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>مدة الاشتراك (يوم)</label>
            <input type="number" className="input-cosmic" value={form.duration_days} min={1} onChange={e => setForm({ ...form, duration_days: +e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>أيام التجربة المجانية</label>
            <input type="number" className="input-cosmic" value={form.trial_days} min={0} onChange={e => setForm({ ...form, trial_days: +e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>ترتيب العرض</label>
            <input type="number" className="input-cosmic" value={form.sort_order} min={0} onChange={e => setForm({ ...form, sort_order: +e.target.value })} />
          </div>
        </div>

        <div style={{ marginTop: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>وصف (عربي)</label>
          <input className="input-cosmic" value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} placeholder="مثالية للأعمال المتنامية..." />
        </div>

        {/* Features */}
        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>الميزات المتاحة</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {Object.entries(FEATURE_LABELS).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', background: form.features[key] ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)', border: `1px solid ${form.features[key] ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`, transition: 'all 0.2s' }}>
                <input type="checkbox" checked={!!form.features[key]} onChange={() => toggleFeature(key)} style={{ accentColor: '#10B981', width: '14px', height: '14px' }} />
                <span style={{ fontSize: '12px', color: form.features[key] ? '#10B981' : 'var(--text-muted)' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Options */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_recommended} onChange={e => setForm({ ...form, is_recommended: e.target.checked })} style={{ accentColor: 'var(--accent-violet)', width: '16px', height: '16px' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>⭐ الأكثر شيوعاً</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ accentColor: '#10B981', width: '16px', height: '16px' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>✅ نشط</span>
          </label>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}>
          <Save size={16} /> {saving ? 'جاري الحفظ...' : 'حفظ الخطة'}
        </button>
      </div>
    </div>
  )
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)

  const fetchPlans = async () => {
    const { data } = await createClient()
      .from('plans')
      .select('*')
      .order('sort_order', { ascending: true })
    setPlans(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPlans() }, [])

  const deletePlan = async (id: string) => {
    if (!confirm('حذف هذه الخطة؟ تأكد أنه لا يوجد مستخدمون عليها.')) return
    await createClient().from('plans').delete().eq('id', id)
    fetchPlans()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await createClient().from('plans').update({ is_active: !current }).eq('id', id)
    fetchPlans()
  }

  return (
    <div>
      <div className="page-flex-header">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>إدارة الخطط</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{plans.length} خطة</p>
        </div>
        <button onClick={() => { setEditPlan(null); setShowForm(true) }} className="btn-primary">
          <Plus size={16} /> خطة جديدة
        </button>
      </div>

      {/* Plans Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />)
        ) : plans.map(plan => (
          <div key={plan.id} className="card" style={{ position: 'relative', border: plan.is_recommended ? '2px solid var(--accent-violet)' : '1px solid var(--border)', opacity: plan.is_active ? 1 : 0.6 }}>
            {plan.is_recommended && (
              <div style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--accent-violet)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px' }}>
                ⭐ الأكثر شيوعاً
              </div>
            )}
            {!plan.is_active && (
              <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>
                معطّل
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name_ar}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', direction: 'ltr', textAlign: 'right' }}>{plan.name} · {plan.slug}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '16px' }}>
              <span style={{ fontSize: '36px', fontWeight: 900, color: 'var(--accent-violet-light)' }}>{plan.price}</span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>ريال / {plan.duration_days} يوم</span>
            </div>

            <div className="grid-2" style={{ gap: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>📱 {plan.device_limit} جهاز</div>
              <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>💬 {plan.message_limit.toLocaleString('ar')}</div>
              <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>🎁 {plan.trial_days} يوم تجريبي</div>
              <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>📊 ترتيب: {plan.sort_order}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>الميزات المفعّلة:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {Object.entries(plan.features || {}).filter(([, v]) => v).map(([key]) => (
                  <span key={key} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                    {FEATURE_LABELS[key] || key}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setEditPlan(plan); setShowForm(true) }} style={{ flex: 1, padding: '8px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '8px', cursor: 'pointer', color: '#A78BFA', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontFamily: 'Tajawal, sans-serif' }}>
                <Edit2 size={13} /> تعديل
              </button>
              <button onClick={() => toggleActive(plan.id, plan.is_active)} style={{ flex: 1, padding: '8px', background: plan.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${plan.is_active ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`, borderRadius: '8px', cursor: 'pointer', color: plan.is_active ? '#EF4444' : '#10B981', fontSize: '13px', fontFamily: 'Tajawal, sans-serif' }}>
                {plan.is_active ? 'تعطيل' : 'تفعيل'}
              </button>
              <button onClick={() => deletePlan(plan.id)} style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#EF4444' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
          <p>لا توجد خطط بعد. أضف خطة جديدة.</p>
        </div>
      )}

      {showForm && (
        <PlanForm
          plan={editPlan}
          onClose={() => { setShowForm(false); setEditPlan(null) }}
          onSaved={fetchPlans}
        />
      )}
    </div>
  )
}
