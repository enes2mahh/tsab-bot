'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, MessageSquare, CheckCircle, XCircle, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
  getPresetRanges, getMessageStats, getDailyChart, getTypeDistribution,
  getCampaignStats, getDeviceStats, calcChange,
  type DateRange, type MessageStats, type DailyPoint, type CampaignStat, type DeviceStat, type TypePoint,
} from '@/lib/reports'
import { ExportButton } from '@/components/Reports/ExportButton'
import * as XLSX from 'xlsx'

type Tab = 'overview' | 'campaigns' | 'devices'

const COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#2563EB', '#EF4444', '#60A5FA']

function StatChange({ current, previous }: { current: number; previous: number }) {
  const { pct, up } = calcChange(current, previous)
  if (previous === 0 && current === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: up ? '#10B981' : '#EF4444', marginTop: '4px' }}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {pct}% مقارنة بالفترة السابقة
    </div>
  )
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [range, setRange] = useState<DateRange>(getPresetRanges()[0])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<MessageStats | null>(null)
  const [dailyChart, setDailyChart] = useState<DailyPoint[]>([])
  const [typeData, setTypeData] = useState<TypePoint[]>([])
  const [campaigns, setCampaigns] = useState<CampaignStat[]>([])
  const [devices, setDevices] = useState<DeviceStat[]>([])

  const presets = getPresetRanges()

  const load = useCallback(async (r: DateRange) => {
    setLoading(true)
    const [s, daily, types, camps, devs] = await Promise.all([
      getMessageStats(r),
      getDailyChart(r),
      getTypeDistribution(r),
      getCampaignStats(r),
      getDeviceStats(r),
    ])
    setStats(s)
    setDailyChart(daily)
    setTypeData(types)
    setCampaigns(camps)
    setDevices(devs)
    setLoading(false)
  }, [])

  useEffect(() => { load(range) }, [range, load])

  const handleExport = async (format: 'csv' | 'excel' | 'print') => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (format === 'print') {
      window.print()
      return
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('to_number, from_number, direction, type, status, created_at')
      .eq('user_id', user.id)
      .gte('created_at', range.from.toISOString())
      .lt('created_at', range.to.toISOString())
      .order('created_at', { ascending: false })

    const rows = (msgs || []).map((m: { to_number: string; from_number: string; direction: string; type: string; status: string; created_at: string }) => ({
      'الرقم': m.to_number || m.from_number || '-',
      'الاتجاه': m.direction === 'outgoing' ? 'صادر' : 'وارد',
      'النوع': m.type,
      'الحالة': m.status,
      'التاريخ': new Date(m.created_at).toLocaleDateString('ar-SA'),
    }))

    if (format === 'csv') {
      const headers = Object.keys(rows[0] || {})
      const csv = [headers.join(','), ...rows.map(r => Object.values(r).join(','))].join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'تقرير-الرسائل.csv'; a.click()
    } else {
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'الرسائل')
      XLSX.writeFile(wb, 'تقرير-الرسائل.xlsx')
    }
  }

  const statCards = stats ? [
    { label: 'مرسلة', value: stats.sent, prev: stats.prevSent, color: '#7C3AED', icon: <MessageSquare size={18} /> },
    { label: 'واردة', value: stats.received, prev: stats.prevReceived, color: '#10B981', icon: <ArrowUpRight size={18} /> },
    { label: 'فشلت', value: stats.failed, prev: 0, color: '#EF4444', icon: <XCircle size={18} /> },
    { label: 'نسبة النجاح', value: `${stats.successRate}%`, prev: 0, color: '#10B981', icon: <CheckCircle size={18} /> },
  ] : []

  return (
    <div>
      {/* Header */}
      <div className="page-flex-header">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            التقارير والتحليلات
          </h2>
          {/* Date range presets */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => setRange(p)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${range.label === p.label ? 'var(--accent-violet)' : 'var(--border)'}`,
                  background: range.label === p.label ? 'rgba(124,58,237,0.15)' : 'transparent',
                  color: range.label === p.label ? '#A78BFA' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'Tajawal, sans-serif',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <ExportButton onExport={handleExport} loading={loading} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-card)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {([['overview', 'نظرة عامة'], ['campaigns', 'الحملات'], ['devices', 'الأجهزة']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '7px 16px',
              borderRadius: '9px',
              border: 'none',
              background: tab === key ? 'rgba(124,58,237,0.2)' : 'transparent',
              color: tab === key ? '#A78BFA' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: tab === key ? 600 : 400,
              fontFamily: 'Tajawal, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
        </div>
      )}

      {/* ── Overview Tab ── */}
      {!loading && tab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid-4" style={{ marginBottom: '24px' }}>
            {statCards.map(s => (
              <div key={s.label} className="stat-card" style={{ borderTopColor: s.color }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                {typeof s.prev === 'number' && s.prev > 0 && typeof s.value === 'number' && (
                  <StatChange current={s.value} previous={s.prev} />
                )}
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                نشاط الرسائل — {range.label}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'Tajawal, sans-serif' }} />
                  <Line type="monotone" dataKey="sent" stroke="#7C3AED" name="مرسلة" strokeWidth={2} dot={{ fill: '#7C3AED', r: 3 }} />
                  <Line type="monotone" dataKey="received" stroke="#10B981" name="واردة" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>أنواع الرسائل</h3>
              {typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>لا توجد بيانات</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Campaigns Tab ── */}
      {!loading && tab === 'campaigns' && (
        <>
          {campaigns.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <BarChart3 size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p>لا توجد حملات في هذه الفترة</p>
            </div>
          ) : (
            <>
              {/* Bar chart */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>أداء الحملات</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={campaigns.slice(0, 8)} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'Tajawal, sans-serif' }} />
                    <Bar dataKey="sent" name="مرسل" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failed" name="فشل" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="responsive-table-wrap">
                  <table className="table-cosmic">
                    <thead>
                      <tr>
                        <th>الحملة</th>
                        <th>الإجمالي</th>
                        <th>مرسل</th>
                        <th>فشل</th>
                        <th>النجاح</th>
                        <th>التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600, fontSize: '13px' }}>{c.name}</td>
                          <td style={{ fontSize: '13px' }}>{c.total}</td>
                          <td><span className="badge badge-emerald">{c.sent}</span></td>
                          <td><span className="badge badge-red">{c.failed}</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${c.successRate}%`, height: '100%', background: c.successRate >= 80 ? '#10B981' : c.successRate >= 50 ? '#F59E0B' : '#EF4444', borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '36px' }}>{c.successRate}%</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString('ar-SA')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Devices Tab ── */}
      {!loading && tab === 'devices' && (
        <>
          {devices.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <p>لا توجد بيانات أجهزة في هذه الفترة</p>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>نشاط الأجهزة</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={devices} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="device_name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'Tajawal, sans-serif' }} />
                    <Bar dataKey="sent" name="صادر" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="received" name="وارد" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="responsive-table-wrap">
                  <table className="table-cosmic">
                    <thead><tr><th>الجهاز</th><th>صادر</th><th>وارد</th><th>الإجمالي</th></tr></thead>
                    <tbody>
                      {devices.map(d => (
                        <tr key={d.device_id}>
                          <td style={{ fontWeight: 600, fontSize: '13px' }}>{d.device_name}</td>
                          <td><span className="badge badge-blue">{d.sent}</span></td>
                          <td><span className="badge badge-emerald">{d.received}</span></td>
                          <td style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{d.sent + d.received}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
