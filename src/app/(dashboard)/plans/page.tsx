'use client'

import { useState, useEffect } from 'react'
import { Crown, Check, Copy, Plus, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Plan {
  id: string; name: string; name_ar: string; price: number; trial_days: number
  message_limit: number; device_limit: number; features: Record<string, boolean>
  is_recommended: boolean; duration_days: number
}

interface Subscription {
  id: string; status: string; starts_at: string; expires_at: string
  messages_used: number; messages_limit: number
  plans: Plan
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [activationCode, setActivationCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [activateResult, setActivateResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('plans').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('subscriptions').select('*, plans(*)').order('created_at', { ascending: false }).limit(1).single(),
    ]).then(([p, s]) => {
      setPlans(p.data || [])
      setSubscription(s.data)
      setLoading(false)
    })
  }, [])

  const handleActivate = async () => {
    if (!activationCode.trim()) return
    setActivating(true)
    setActivateResult(null)

    const res = await fetch('/api/subscription/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: activationCode.trim().toUpperCase() }),
    })
    const data = await res.json()

    setActivateResult({ success: res.ok, message: data.message || (res.ok ? 'تم التفعيل بنجاح!' : 'كود غير صحيح') })
    setActivating(false)

    if (res.ok) {
      setActivationCode('')
      // Refresh subscription
      const supabase = createClient()
      const { data: s } = await supabase.from('subscriptions').select('*, plans(*)').order('created_at', { ascending: false }).limit(1).single()
      setSubscription(s)
    }
  }

  const daysRemaining = subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86400000))
    : 0

  const featureLabels: Record<string, string> = {
    auto_reply: 'رد تلقائي', send_message: 'إرسال رسائل', send_media: 'إرسال وسائط', api: 'API',
    webhook: 'Webhook', ai: 'ذكاء اصطناعي', bulk_send: 'إرسال جماعي', scheduling: 'جدولة',
    chatflow: 'تدفق المحادثة', warmer: 'WA Warmer', live_chat: 'دردشة مباشرة', team: 'إدارة فريق',
    advanced_analytics: 'تحليلات متقدمة', file_manager: 'مدير الملفات', phonebook: 'دليل الهاتف',
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>خطط الاشتراك</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>اختر الخطة المناسبة لنشاطك</p>
      </div>

      {/* Current subscription */}
      {subscription && (
        <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '14px', padding: '20px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Crown size={24} color="#F59E0B" />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '16px' }}>{(subscription.plans as any)?.name_ar}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span className={`badge badge-${subscription.status === 'active' || subscription.status === 'trial' ? 'emerald' : 'red'}`} style={{ marginLeft: '8px' }}>
                  {subscription.status === 'trial' ? 'تجريبي' : subscription.status === 'active' ? 'نشط' : 'منتهي'}
                </span>
                {daysRemaining} يوم متبقي
              </div>
            </div>
          </div>
          <div style={{ marginRight: 'auto', fontSize: '13px', color: 'var(--text-secondary)' }}>
            الرسائل: {subscription.messages_used?.toLocaleString('ar')} / {subscription.messages_limit?.toLocaleString('ar')}
          </div>
        </div>
      )}

      {/* Plans grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '400px', borderRadius: '16px' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {plans.map(plan => {
            const isCurrent = (subscription?.plans as any)?.id === plan.id
            const features = Object.entries(plan.features || {}).filter(([, v]) => v)

            return (
              <div key={plan.id} style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '28px', border: isCurrent ? '2px solid var(--accent-violet)' : plan.is_recommended ? '2px solid var(--accent-gold)' : '1px solid var(--border)', position: 'relative', transition: 'transform 0.3s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                {isCurrent && <div style={{ position: 'absolute', top: '-12px', right: '50%', transform: 'translateX(50%)', background: 'var(--accent-violet)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 14px', borderRadius: '20px' }}>خطتك الحالية ✓</div>}
                {plan.is_recommended && !isCurrent && <div style={{ position: 'absolute', top: '-12px', right: '50%', transform: 'translateX(50%)', background: 'var(--accent-gold)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 14px', borderRadius: '20px' }}>⭐ الأكثر شيوعاً</div>}

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{plan.name_ar}</div>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: plan.is_recommended ? 'var(--accent-gold)' : 'var(--accent-violet)' }}>
                    {plan.price} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)' }}>ريال/شهر</span>
                  </div>
                  {plan.trial_days > 0 && <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>🎁 {plan.trial_days} أيام مجاناً</div>}
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <div>📱 {plan.device_limit} جهاز</div>
                  <div style={{ marginTop: '4px' }}>💬 {plan.message_limit.toLocaleString('ar')} رسالة/شهر</div>
                </div>

                <ul style={{ listStyle: 'none', marginBottom: '20px' }}>
                  {features.slice(0, 6).map(([key]) => (
                    <li key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <Check size={13} color="#10B981" style={{ flexShrink: 0 }} />
                      {featureLabels[key] || key}
                    </li>
                  ))}
                  {features.length > 6 && <li style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>+{features.length - 6} ميزة أخرى</li>}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {/* Activation Code */}
      <div className="card" style={{ maxWidth: '480px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          🔑 كيف أشترك؟
        </h3>
        <ol style={{ paddingRight: '16px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 2, marginBottom: '20px' }}>
          <li>تواصل معنا عبر واتساب</li>
          <li>أتم عملية الدفع</li>
          <li>ستصلك كود التفعيل</li>
          <li>أدخله أدناه</li>
        </ol>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            className="input-cosmic"
            value={activationCode}
            onChange={e => setActivationCode(e.target.value.toUpperCase())}
            placeholder="مثال: ABCD1234"
            style={{ flex: 1, letterSpacing: '2px', fontWeight: 600 }}
          />
          <button onClick={handleActivate} disabled={activating || !activationCode.trim()} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
            {activating ? 'جاري...' : 'تفعيل'}
          </button>
        </div>

        {activateResult && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 14px', background: activateResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${activateResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '10px', fontSize: '13px', color: activateResult.success ? '#10B981' : '#EF4444' }}>
            {activateResult.success ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {activateResult.message}
          </div>
        )}
      </div>
    </div>
  )
}
