'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Copy, Share2, DollarSign, Clock, Users, Banknote, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ReferralsPage() {
  const [data, setData] = useState<any>({ referralCode: '', referralLink: '', earnings: { available: 0, pending: 0, total: 0 }, referees: [], commissions: [], withdrawals: [] })
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [iban, setIban] = useState('')
  const [bankName, setBankName] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'overview' | 'referees' | 'withdrawals'>('overview')

  useEffect(() => {
    const supabase = createClient()
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profile, referrals, withdrawals] = await Promise.all([
        supabase.from('profiles').select('referral_code').eq('id', user.id).single(),
        supabase.from('referrals').select('*, profiles!referee_id(name, email, created_at)').eq('referrer_id', user.id),
        supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      const code = profile.data?.referral_code || ''
      const refs = referrals.data || []
      const available = refs.filter((r: any) => r.status === 'available').reduce((s: number, r: any) => s + (r.commission_amount || 0), 0)
      const pending = refs.filter((r: any) => r.status === 'pending').reduce((s: number, r: any) => s + (r.commission_amount || 0), 0)
      const total = refs.reduce((s: number, r: any) => s + (r.commission_amount || 0), 0)

      setData({
        referralCode: code,
        referralLink: `${window.location.origin}/register?ref=${code}`,
        earnings: { available, pending, total },
        referees: refs,
        withdrawals: withdrawals.data || [],
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWithdraw = async () => {
    if (+withdrawAmount < 25) return alert('الحد الأدنى للسحب 25 ريال')
    setWithdrawing(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('withdrawals').insert({
      user_id: user.id,
      amount: +withdrawAmount,
      method: 'bank_transfer',
      bank_details: { iban, bank_name: bankName },
      status: 'pending',
    })
    setWithdrawing(false)
    setWithdrawAmount('')
    alert('تم إرسال طلب السحب! سيتم مراجعته خلال 3-5 أيام عمل.')
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>مركز الإحالات</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>اربح 10% عمولة على كل اشتراك تحيله</p>
      </div>

      {/* Earnings Cards */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        {[
          { label: 'أرباح متاحة للسحب', value: data.earnings.available, color: '#10B981', icon: <DollarSign size={18} /> },
          { label: 'أرباح قيد الانتظار', value: data.earnings.pending, color: '#F59E0B', icon: <Clock size={18} /> },
          { label: 'إجمالي الأرباح', value: data.earnings.total, color: '#A78BFA', icon: <TrendingUp size={18} /> },
        ].map(card => (
          <div key={card.label} className="stat-card" style={{ borderTopColor: card.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{card.label}</span>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>{card.icon}</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{card.value.toFixed(2)} <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400 }}>ريال</span></div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {/* Referral Link */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>رابط الإحالة</h3>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>الكود</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '16px', fontWeight: 700, color: 'var(--accent-violet-light)', letterSpacing: '3px', border: '1px solid var(--border)' }}>{data.referralCode}</div>
              <button onClick={() => copyToClipboard(data.referralCode)} className="btn-secondary" style={{ padding: '10px 14px' }}>
                {copied ? <CheckCircle size={16} color="#10B981" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>الرابط الكامل</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '12px', color: 'var(--text-muted)', border: '1px solid var(--border)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.referralLink}</div>
              <button onClick={() => copyToClipboard(data.referralLink)} className="btn-secondary" style={{ padding: '10px 14px' }}><Copy size={16} /></button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <a href={`https://wa.me/?text=${encodeURIComponent('انضم لـ Sends Bot ' + data.referralLink)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '10px', background: '#25D366', borderRadius: '10px', color: 'white', textDecoration: 'none', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
              📱 واتساب
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('جرب Sends Bot ' + data.referralLink)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '10px', background: '#1DA1F2', borderRadius: '10px', color: 'white', textDecoration: 'none', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
              🐦 تويتر
            </a>
          </div>
        </div>

        {/* Withdrawal */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>طلب سحب</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>المبلغ (ريال) - الحد الأدنى 25</label>
              <input type="number" className="input-cosmic" min={25} max={data.earnings.available} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="أدخل المبلغ" />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>IBAN</label>
              <input className="input-cosmic" value={iban} onChange={e => setIban(e.target.value)} placeholder="SA..." style={{ direction: 'ltr' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>اسم البنك</label>
              <input className="input-cosmic" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="البنك الأهلي..." />
            </div>
            <button onClick={handleWithdraw} disabled={withdrawing || !withdrawAmount || !iban || data.earnings.available < 25} className="btn-primary" style={{ justifyContent: 'center' }}>
              <Banknote size={16} /> {withdrawing ? 'جاري الإرسال...' : 'طلب سحب'}
            </button>
          </div>
        </div>
      </div>

      {/* Referees table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>المحالون ({data.referees.length})</h3>
        </div>
        {data.referees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
            <Users size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>لا توجد إحالات بعد. شارك رابطك لتبدأ الكسب!</p>
          </div>
        ) : (
          <div className="responsive-table-wrap">
          <table className="table-cosmic">
            <thead><tr><th>المستخدم</th><th>تاريخ الانضمام</th><th>العمولة</th><th>الحالة</th></tr></thead>
            <tbody>
              {data.referees.map((r: any) => (
                <tr key={r.id}>
                  <td>{(r as any).profiles?.name || (r as any).profiles?.email || 'مستخدم'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date((r as any).profiles?.created_at || r.created_at).toLocaleDateString('ar-SA')}</td>
                  <td style={{ color: '#10B981' }}>{r.commission_amount?.toFixed(2) || '0.00'} ريال</td>
                  <td><span className={`badge badge-${r.status === 'available' ? 'emerald' : r.status === 'pending' ? 'yellow' : 'violet'}`}>{r.status === 'available' ? 'متاح' : r.status === 'pending' ? 'انتظار' : 'مسحوب'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Withdrawals History */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>سجل السحوبات ({data.withdrawals?.length || 0})</h3>
        </div>
        {(!data.withdrawals || data.withdrawals.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
            <Banknote size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>لا توجد عمليات سحب بعد</p>
          </div>
        ) : (
          <div className="responsive-table-wrap">
          <table className="table-cosmic">
            <thead><tr><th>المبلغ</th><th>البنك</th><th>الحالة</th><th>التاريخ</th></tr></thead>
            <tbody>
              {data.withdrawals.map((w: any) => (
                <tr key={w.id}>
                  <td style={{ fontSize: '15px', fontWeight: 600, color: '#10B981' }}>{w.amount} ريال</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{w.bank_details?.bank_name || '—'}</td>
                  <td>
                    <span className={`badge badge-${w.status === 'completed' ? 'emerald' : w.status === 'pending' ? 'yellow' : 'red'}`}>
                      {w.status === 'completed' ? 'مكتمل' : w.status === 'pending' ? 'معلق' : 'مرفوض'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(w.created_at).toLocaleDateString('ar-SA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
