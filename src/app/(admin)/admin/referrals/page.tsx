'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminReferralsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [commissionRate, setCommissionRate] = useState(10)
  const [minWithdrawal, setMinWithdrawal] = useState(25)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('withdrawals').select('*, profiles(name, email)').order('created_at', { ascending: false }).then(({ data }) => {
      setWithdrawals(data || [])
      setLoading(false)
    })
  }, [])

  const handleApprove = async (id: string) => {
    await createClient().from('withdrawals').update({ status: 'completed', processed_at: new Date().toISOString() }).eq('id', id)
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'completed' } : w))
    setSelected(null)
  }

  const handleReject = async (id: string) => {
    await createClient().from('withdrawals').update({ status: 'rejected', rejection_reason: rejectReason, processed_at: new Date().toISOString() }).eq('id', id)
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected' } : w))
    setSelected(null)
    setRejectReason('')
  }

  const pending = withdrawals.filter(w => w.status === 'pending')

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>الإحالات والسحوبات</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{pending.length} طلب معلق</p>
      </div>

      {/* Settings */}
      <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>نسبة العمولة %</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="number" className="input-cosmic" value={commissionRate} min={1} max={50} onChange={e => setCommissionRate(+e.target.value)} style={{ width: '100px' }} />
            <button className="btn-secondary">حفظ</button>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>حد السحب الأدنى (ريال)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="number" className="input-cosmic" value={minWithdrawal} min={10} onChange={e => setMinWithdrawal(+e.target.value)} style={{ width: '100px' }} />
            <button className="btn-secondary">حفظ</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table-cosmic">
          <thead><tr><th>المستخدم</th><th>المبلغ</th><th>البنك / IBAN</th><th>التاريخ</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6}><div className="skeleton" style={{ height: '36px', borderRadius: '8px' }} /></td></tr>)
              : withdrawals.map(w => (
                <tr key={w.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>{w.profiles?.name || '—'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{w.profiles?.email}</div>
                  </td>
                  <td style={{ fontSize: '15px', fontWeight: 600, color: '#10B981' }}>{w.amount} ريال</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', direction: 'ltr' }}>
                    <div>{w.bank_details?.bank_name}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{w.bank_details?.iban?.slice(0, 10)}...</div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(w.created_at).toLocaleDateString('ar-SA')}</td>
                  <td>
                    <span className={`badge badge-${w.status === 'completed' ? 'emerald' : w.status === 'pending' ? 'yellow' : 'red'}`}>
                      {w.status === 'completed' ? 'مكتمل' : w.status === 'pending' ? 'معلق' : 'مرفوض'}
                    </span>
                  </td>
                  <td>
                    {w.status === 'pending' && (
                      <button onClick={() => setSelected(w)} style={{ padding: '5px 10px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#A78BFA', fontSize: '12px' }}>
                        مراجعة
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass" style={{ borderRadius: '20px', padding: '32px', maxWidth: '420px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>طلب السحب</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 2 }}>
              <div>👤 {selected.profiles?.name} - {selected.profiles?.email}</div>
              <div>💰 المبلغ: <strong style={{ color: '#10B981' }}>{selected.amount} ريال</strong></div>
              <div>🏦 {selected.bank_details?.bank_name}</div>
              <div style={{ direction: 'ltr', fontFamily: 'monospace' }}>IBAN: {selected.bank_details?.iban}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>سبب الرفض (اختياري)</label>
              <input className="input-cosmic" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="سبب الرفض..." />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleApprove(selected.id)} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#10B981' }}>
                <CheckCircle size={16} /> قبول
              </button>
              <button onClick={() => handleReject(selected.id)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <XCircle size={16} /> رفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
