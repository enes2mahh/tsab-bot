'use client'

import { useState, useEffect } from 'react'
import { Store, Plus, Trash2, Save, Sparkles, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Service {
  name: string
  description?: string
  price?: string
  link?: string
  category?: string
}

interface BusinessProfile {
  business_name: string
  business_type: string
  description: string
  bot_personality: string
  greeting_message: string
  off_topic_response: string
  handoff_message: string
  payment_info: string
  working_hours: string
  contact_info: string
  services: Service[]
  custom_rules: string
  language: string
}

const empty: BusinessProfile = {
  business_name: '',
  business_type: '',
  description: '',
  bot_personality: 'ودود ومحترف',
  greeting_message: '',
  off_topic_response: 'عذراً، أنا مساعد متخصّص بمتجرنا فقط. هل تريد معرفة المزيد عن منتجاتنا وخدماتنا؟',
  handoff_message: 'ممتاز! خدمة العملاء ستتواصل معك خلال دقائق لإكمال الطلب. شكراً لاختيارك متجرنا 🌹',
  payment_info: '',
  working_hours: '',
  contact_info: '',
  services: [],
  custom_rules: '',
  language: 'ar',
}

const PERSONALITIES = [
  'ودود ومحترف',
  'رسمي ومختصر',
  'مرح وعفوي',
  'احترافي وتقني',
  'متعاطف وداعم',
]

const BUSINESS_TYPES = [
  'متجر إلكتروني',
  'خدمات تسويقية',
  'خدمات تصميم',
  'مطعم / كافيه',
  'صالون / مركز تجميل',
  'عيادة طبية',
  'مكتب عقاري',
  'وكالة سياحة',
  'تعليم وتدريب',
  'استشارات',
  'أخرى',
]

export default function BusinessProfilePage() {
  const [form, setForm] = useState<BusinessProfile>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('business_profile').select('*').eq('user_id', user.id).single().then(({ data }) => {
        if (data) {
          setForm({
            ...empty,
            ...data,
            services: Array.isArray(data.services) ? data.services : [],
          })
        }
        setLoading(false)
      })
    })
  }, [])

  const update = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) => {
    setForm((s) => ({ ...s, [key]: value }))
  }

  const addService = () => {
    setForm((s) => ({ ...s, services: [...s.services, { name: '', description: '', price: '', link: '' }] }))
  }

  const updateService = (i: number, key: keyof Service, value: string) => {
    setForm((s) => ({ ...s, services: s.services.map((sv, idx) => idx === i ? { ...sv, [key]: value } : sv) }))
  }

  const removeService = (i: number) => {
    setForm((s) => ({ ...s, services: s.services.filter((_, idx) => idx !== i) }))
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('business_profile').upsert({ ...form, user_id: user.id })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: '12px' }} />

  return (
    <div>
      <div className="page-flex-header">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>الملف التجاري</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>هذه المعلومات تُغذّي الذكاء الاصطناعي ليرد على عملائك بدقّة</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          <Save size={15} /> {saving ? 'جاري الحفظ...' : saved ? '✓ تم الحفظ' : 'حفظ كل البيانات'}
        </button>
      </div>

      {/* Hint */}
      <div style={{ padding: '14px 16px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', color: '#A78BFA', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <Sparkles size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>كيف يستفيد البوت من هذه البيانات؟</strong>
          <br />
          عند ردّ AI على عميل، يستخدم اسم متجرك، خدماتك وأسعارها، وروابطها. مثلاً لو سأل "ايش الخدمات؟" يردّ بقائمة فعلية من خدماتك. وعند موافقته على شراء، يردّ برسالة التحويل المخصّصة.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '780px' }}>
        {/* Basic */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={16} /> معلومات المتجر
          </h3>
          <div className="grid-2" style={{ gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>اسم المتجر/النشاط *</label>
              <input className="input-cosmic" value={form.business_name} onChange={(e) => update('business_name', e.target.value)} placeholder="متجر النور" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>نوع النشاط</label>
              <select className="input-cosmic" value={form.business_type} onChange={(e) => update('business_type', e.target.value)}>
                <option value="">اختر نوع النشاط...</option>
                {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>وصف مختصر للمتجر</label>
            <textarea className="input-cosmic" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="مثال: متجر لبيع متابعين انستجرام وتويتر بأسعار مناسبة وتسليم سريع." style={{ resize: 'vertical' }} />
          </div>
        </div>

        {/* Services */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📦 الخدمات / المنتجات
            </h3>
            <button onClick={addService} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              <Plus size={14} /> إضافة
            </button>
          </div>
          {form.services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
              لا توجد خدمات بعد. أضف خدماتك ليعرفها البوت ويرشّحها للعملاء.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {form.services.map((s, i) => (
                <div key={i} style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '12px', position: 'relative' }}>
                  <button onClick={() => removeService(i)} style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#EF4444' }}>
                    <Trash2 size={12} />
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '8px' }}>
                    <input className="input-cosmic" value={s.name} onChange={(e) => updateService(i, 'name', e.target.value)} placeholder="اسم الخدمة (مثلاً: 1000 متابع انستجرام)" />
                    <input className="input-cosmic" value={s.price || ''} onChange={(e) => updateService(i, 'price', e.target.value)} placeholder="السعر (مثلاً: 50 ريال)" />
                  </div>
                  <textarea className="input-cosmic" rows={2} value={s.description || ''} onChange={(e) => updateService(i, 'description', e.target.value)} placeholder="وصف مختصر..." style={{ resize: 'vertical', marginBottom: '8px' }} />
                  <input type="url" className="input-cosmic" value={s.link || ''} onChange={(e) => updateService(i, 'link', e.target.value)} placeholder="رابط المنتج (اختياري) - https://..." style={{ direction: 'ltr' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bot Behavior */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🤖 سلوك البوت
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>شخصية البوت</label>
              <select className="input-cosmic" value={form.bot_personality} onChange={(e) => update('bot_personality', e.target.value)}>
                {PERSONALITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>رسالة الترحيب المخصّصة (اختيارية)</label>
              <textarea className="input-cosmic" rows={2} value={form.greeting_message} onChange={(e) => update('greeting_message', e.target.value)} placeholder="مثال: أهلاً بك في متجر النور 🌟 كيف نقدر نخدمك؟" style={{ resize: 'vertical' }} />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>تستخدم بدلاً من الرد الافتراضي عند تحية العميل</p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>رد على الأسئلة خارج النطاق</label>
              <textarea className="input-cosmic" rows={2} value={form.off_topic_response} onChange={(e) => update('off_topic_response', e.target.value)} style={{ resize: 'vertical' }} />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>عند سؤال عن شيء غير موجود في متجرك</p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>رسالة التحويل لخدمة العملاء</label>
              <textarea className="input-cosmic" rows={2} value={form.handoff_message} onChange={(e) => update('handoff_message', e.target.value)} style={{ resize: 'vertical' }} />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>تُرسل عند موافقة العميل على الشراء</p>
            </div>
          </div>
        </div>

        {/* Operations */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🛒 معلومات الدفع والتشغيل
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>طرق الدفع</label>
              <textarea className="input-cosmic" rows={2} value={form.payment_info} onChange={(e) => update('payment_info', e.target.value)} placeholder="مثال: تحويل بنكي، STC Pay، Apple Pay" style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>ساعات العمل</label>
              <input className="input-cosmic" value={form.working_hours} onChange={(e) => update('working_hours', e.target.value)} placeholder="السبت - الخميس، 9 صباحاً - 11 مساءً" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>قواعد إضافية للبوت (اختياري)</label>
              <textarea className="input-cosmic" rows={3} value={form.custom_rules} onChange={(e) => update('custom_rules', e.target.value)} placeholder="مثال: لا تذكر أسعار أقل من 50 ريال. اذكر دائماً أن الشحن مجاني فوق 200 ريال." style={{ resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Sticky Save */}
        <div style={{ position: 'sticky', bottom: '20px', textAlign: 'center', paddingTop: '12px' }}>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '14px 32px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <Save size={16} /> {saving ? 'جاري الحفظ...' : saved ? '✓ تم حفظ كل البيانات' : 'حفظ كل البيانات'}
          </button>
        </div>
      </div>
    </div>
  )
}
