'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Save, Play, ArrowLeft, Trash2, Zap, MessageSquare, HelpCircle, GitBranch, Bot, Clock, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface FlowNode {
  id: string
  type: 'start' | 'message' | 'question' | 'condition' | 'ai' | 'delay' | 'end'
  x: number
  y: number
  data: {
    label: string
    keyword?: string
    text?: string
    options?: string[]
    seconds?: number
    prompt?: string
    condition?: string
  }
  connected_to?: string[]
}

const nodeTypeConfig = {
  start: { color: '#7C3AED', bg: 'rgba(124,58,237,0.2)', icon: <Zap size={14} />, label: 'بداية' },
  message: { color: '#2563EB', bg: 'rgba(37,99,235,0.2)', icon: <MessageSquare size={14} />, label: 'رسالة' },
  question: { color: '#10B981', bg: 'rgba(16,185,129,0.2)', icon: <HelpCircle size={14} />, label: 'سؤال' },
  condition: { color: '#F97316', bg: 'rgba(249,115,22,0.2)', icon: <GitBranch size={14} />, label: 'شرط' },
  ai: { color: '#F59E0B', bg: 'rgba(245,158,11,0.2)', icon: <Bot size={14} />, label: 'ذكاء اصطناعي' },
  delay: { color: '#94A3B8', bg: 'rgba(148,163,184,0.2)', icon: <Clock size={14} />, label: 'تأخير' },
  end: { color: '#EF4444', bg: 'rgba(239,68,68,0.2)', icon: <X size={14} />, label: 'نهاية' },
}

const initialNodes: FlowNode[] = [
  { id: '1', type: 'start', x: 300, y: 50, data: { label: 'بداية', keyword: 'مرحبا' } },
]

export default function ChatFlowPage() {
  const [flows, setFlows] = useState<any[]>([])
  const [selectedFlow, setSelectedFlow] = useState<any | null>(null)
  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes)
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null)
  const [devices, setDevices] = useState<any[]>([])
  const [flowName, setFlowName] = useState('تدفق جديد')
  const [flowDevice, setFlowDevice] = useState('')
  const [flowKeyword, setFlowKeyword] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flowActive, setFlowActive] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('chat_flows').select('*').order('created_at', { ascending: false }),
      supabase.from('devices').select('id, name'),
    ]).then(([f, d]) => {
      setFlows(f.data || [])
      setDevices(d.data || [])
      setLoading(false)
    })
  }, [])

  const addNode = (type: FlowNode['type']) => {
    const newNode: FlowNode = {
      id: Date.now().toString(),
      type,
      x: 200 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      data: { label: nodeTypeConfig[type].label },
    }
    setNodes(prev => [...prev, newNode])
  }

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const node = nodes.find(n => n.id === id)!
    setDragging({ id, ox: e.clientX - node.x, oy: e.clientY - node.y })
    setSelectedNode(node)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return
    setNodes(prev => prev.map(n => n.id === dragging.id ? { ...n, x: e.clientX - dragging.ox, y: e.clientY - dragging.oy } : n))
  }, [dragging])

  const handleMouseUp = useCallback(() => setDragging(null), [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp) }
  }, [handleMouseMove, handleMouseUp])

  const saveFlow = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (selectedFlow && selectedFlow !== 'new') {
      await supabase.from('chat_flows').update({ name: flowName, nodes, trigger_keyword: flowKeyword, is_active: flowActive, device_id: flowDevice }).eq('id', selectedFlow.id)
    } else {
      const { data } = await supabase.from('chat_flows').insert({ name: flowName, device_id: flowDevice || null, trigger_keyword: flowKeyword, nodes, edges: [], user_id: user.id, is_active: flowActive }).select().single()
      setSelectedFlow(data)
    }
    const { data: newFlows } = await supabase.from('chat_flows').select('*').order('created_at', { ascending: false })
    setFlows(newFlows || [])
    setSaving(false)
  }

  const deleteFlow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('حذف هذا التدفق؟')) return
    await createClient().from('chat_flows').delete().eq('id', id)
    setFlows(prev => prev.filter(f => f.id !== id))
  }

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    if (selectedNode?.id === id) setSelectedNode(null)
  }

  if (!selectedFlow && flows.length >= 0 && !loading) {
    return (
      <div>
        <div className="page-flex-header">
          <div><h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>تدفقات المحادثة</h2></div>
          <button onClick={() => { setSelectedFlow('new'); setNodes(initialNodes); setFlowName('تدفق جديد') }} className="btn-primary"><Plus size={16} /> تدفق جديد</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {flows.map(f => (
            <div key={f.id} onClick={() => { setSelectedFlow(f); setNodes(f.nodes || initialNodes); setFlowName(f.name); setFlowKeyword(f.trigger_keyword || ''); setFlowDevice(f.device_id || ''); setFlowActive(f.is_active ?? true) }} className="card" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><GitBranch size={18} color="#A78BFA" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>كلمة: {f.trigger_keyword || '—'}</div>
                </div>
                <button onClick={(e) => deleteFlow(f.id, e)} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#EF4444', flexShrink: 0 }}><Trash2 size={13} /></button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>{f.nodes?.length || 0} عقدة</span>
                <span className={`badge badge-${f.is_active ? 'emerald' : 'red'}`}>{f.is_active ? 'مفعّل' : 'معطّل'}</span>
              </div>
            </div>
          ))}
          {flows.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <GitBranch size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>لا توجد تدفقات. أنشئ أول تدفق محادثة!</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-card)', borderRadius: '14px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => setSelectedFlow(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
          <ArrowLeft size={16} /> رجوع
        </button>
        <input className="input-cosmic" value={flowName} onChange={e => setFlowName(e.target.value)} style={{ width: '160px', padding: '8px 12px', fontSize: '14px' }} placeholder="اسم التدفق" />
        <input className="input-cosmic" value={flowKeyword} onChange={e => setFlowKeyword(e.target.value)} style={{ width: '130px', padding: '8px 12px', fontSize: '14px' }} placeholder="كلمة التشغيل" />
        <select className="input-cosmic" value={flowDevice} onChange={e => setFlowDevice(e.target.value)} style={{ width: '140px', padding: '8px 12px', fontSize: '13px' }}>
          <option value="">كل الأجهزة</option>
          {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button onClick={() => setFlowActive(a => !a)} style={{ padding: '7px 12px', borderRadius: '8px', border: `1px solid ${flowActive ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, background: flowActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: flowActive ? '#10B981' : '#EF4444', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {flowActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
          {flowActive ? 'مفعّل' : 'معطّل'}
        </button>
        <div style={{ marginRight: 'auto', display: 'flex', gap: '8px' }}>
          {Object.entries(nodeTypeConfig).filter(([t]) => t !== 'start').map(([type, cfg]) => (
            <button key={type} onClick={() => addNode(type as FlowNode['type'])} style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${cfg.color}40`, background: cfg.bg, color: cfg.color, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {cfg.icon} {cfg.label}
            </button>
          ))}
          <button onClick={saveFlow} disabled={saving} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
            <Save size={14} /> {saving ? 'حفظ...' : 'حفظ'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '12px', overflow: 'hidden' }}>
        {/* Canvas */}
        <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden', cursor: 'default' }}>
          {/* Grid background */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }}>
            <defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="var(--border-light)" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const cfg = nodeTypeConfig[node.type]
            const isSelected = selectedNode?.id === node.id
            return (
              <div key={node.id} onMouseDown={e => handleMouseDown(e, node.id)} style={{ position: 'absolute', left: node.x, top: node.y, minWidth: '140px', padding: '12px 14px', background: 'var(--bg-secondary)', border: `2px solid ${isSelected ? cfg.color : cfg.color + '60'}`, borderRadius: '12px', cursor: 'grab', userSelect: 'none', boxShadow: isSelected ? `0 0 20px ${cfg.color}40` : '0 4px 12px rgba(0,0,0,0.3)', zIndex: isSelected ? 10 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>{cfg.icon}</div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                  <button onClick={e => { e.stopPropagation(); deleteNode(node.id) }} style={{ marginRight: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}><X size={12} /></button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {node.data.keyword || node.data.text || node.data.label || node.type}
                </div>
              </div>
            )
          })}

          {nodes.length <= 1 && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <GitBranch size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px' }}>اضغط على أزرار الأعلى لإضافة عقد للتدفق</p>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div style={{ width: '240px', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '16px', overflowY: 'auto' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>خصائص العقدة</h4>
            {selectedNode.type === 'message' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>نص الرسالة</label>
                <textarea className="input-cosmic" rows={4} value={selectedNode.data.text || ''} onChange={e => { const updated = { ...selectedNode, data: { ...selectedNode.data, text: e.target.value } }; setSelectedNode(updated); setNodes(prev => prev.map(n => n.id === updated.id ? updated : n)) }} style={{ fontSize: '13px', resize: 'vertical' }} />
              </div>
            )}
            {selectedNode.type === 'delay' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>انتظار (ثانية)</label>
                <input type="number" className="input-cosmic" value={selectedNode.data.seconds || 5} onChange={e => { const updated = { ...selectedNode, data: { ...selectedNode.data, seconds: +e.target.value } }; setSelectedNode(updated); setNodes(prev => prev.map(n => n.id === updated.id ? updated : n)) }} />
              </div>
            )}
            {selectedNode.type === 'start' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>كلمة التشغيل</label>
                <input className="input-cosmic" value={selectedNode.data.keyword || ''} onChange={e => { const updated = { ...selectedNode, data: { ...selectedNode.data, keyword: e.target.value } }; setSelectedNode(updated); setNodes(prev => prev.map(n => n.id === updated.id ? updated : n)) }} style={{ fontSize: '13px' }} />
              </div>
            )}
            {selectedNode.type === 'ai' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>System Prompt</label>
                <textarea className="input-cosmic" rows={4} value={selectedNode.data.prompt || ''} onChange={e => { const updated = { ...selectedNode, data: { ...selectedNode.data, prompt: e.target.value } }; setSelectedNode(updated); setNodes(prev => prev.map(n => n.id === updated.id ? updated : n)) }} style={{ fontSize: '13px', resize: 'vertical' }} />
              </div>
            )}
            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
              النوع: {nodeTypeConfig[selectedNode.type].label}<br />
              ID: {selectedNode.id}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
