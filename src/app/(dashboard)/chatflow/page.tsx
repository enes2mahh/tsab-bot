'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Save, Play, ArrowLeft, Trash2, Zap, MessageSquare, HelpCircle, GitBranch, Bot, Clock, X, ToggleLeft, ToggleRight, Download, Upload, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { validateFlow, simulateFlow, type FlowNode, type FlowEdge } from '@/lib/flow-validator'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const NODE_WIDTH = 150
const NODE_HEIGHT = 64

const nodeTypeConfig = {
  start:     { color: '#7C3AED', bg: 'rgba(124,58,237,0.2)',  icon: <Zap size={14} />,           label: 'بداية' },
  message:   { color: '#2563EB', bg: 'rgba(37,99,235,0.2)',   icon: <MessageSquare size={14} />,  label: 'رسالة' },
  question:  { color: '#10B981', bg: 'rgba(16,185,129,0.2)',  icon: <HelpCircle size={14} />,     label: 'سؤال' },
  condition: { color: '#F97316', bg: 'rgba(249,115,22,0.2)',  icon: <GitBranch size={14} />,      label: 'شرط' },
  ai:        { color: '#F59E0B', bg: 'rgba(245,158,11,0.2)',  icon: <Bot size={14} />,            label: 'ذكاء اصطناعي' },
  delay:     { color: '#94A3B8', bg: 'rgba(148,163,184,0.2)', icon: <Clock size={14} />,          label: 'تأخير' },
  end:       { color: '#EF4444', bg: 'rgba(239,68,68,0.2)',   icon: <X size={14} />,              label: 'نهاية' },
} as const

const initialNodes: FlowNode[] = [
  { id: '1', type: 'start', x: 200, y: 80, data: { label: 'بداية', keyword: 'مرحبا' } },
]

// Get port positions relative to canvas
function getOutputPort(node: FlowNode) {
  return { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 }
}
function getInputPort(node: FlowNode) {
  return { x: node.x, y: node.y + NODE_HEIGHT / 2 }
}

// Cubic bezier path between two points
function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const cx1 = x1 + Math.abs(x2 - x1) * 0.5
  const cx2 = x2 - Math.abs(x2 - x1) * 0.5
  return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`
}

interface PendingConnection {
  fromNodeId: string
  fromX: number
  fromY: number
  curX: number
  curY: number
}

export default function ChatFlowPage() {
  const [flows, setFlows] = useState<Record<string, unknown>[]>([])
  const [selectedFlow, setSelectedFlow] = useState<Record<string, unknown> | 'new' | null>(null)
  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes)
  const [edges, setEdges] = useState<FlowEdge[]>([])
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null)
  const [pendingConn, setPendingConn] = useState<PendingConnection | null>(null)
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([])
  const [flowName, setFlowName] = useState('تدفق جديد')
  const [flowDevice, setFlowDevice] = useState('')
  const [flowKeyword, setFlowKeyword] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flowActive, setFlowActive] = useState(true)
  const [showTest, setShowTest] = useState(false)
  const [testMessage, setTestMessage] = useState('مرحبا')
  const [testResult, setTestResult] = useState<ReturnType<typeof simulateFlow> | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('chat_flows').select('*').order('created_at', { ascending: false }),
      supabase.from('devices').select('id, name'),
    ]).then(([f, d]) => {
      setFlows((f.data || []) as Record<string, unknown>[])
      setDevices((d.data || []) as { id: string; name: string }[])
      setLoading(false)
    })
  }, [])

  const addNode = (type: FlowNode['type']) => {
    const newNode: FlowNode = {
      id: Date.now().toString(),
      type,
      x: 150 + Math.random() * 300,
      y: 150 + Math.random() * 200,
      data: { label: nodeTypeConfig[type].label },
    }
    setNodes(prev => [...prev, newNode])
  }

  // ── Node dragging ──
  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const node = nodes.find(n => n.id === id)!
    setDragging({ id, ox: e.clientX - node.x, oy: e.clientY - node.y })
    setSelectedNode(node)
  }

  const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
    if (dragging) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      setNodes(prev => prev.map(n =>
        n.id === dragging.id
          ? { ...n, x: e.clientX - rect.left - dragging.ox, y: e.clientY - rect.top - dragging.oy }
          : n
      ))
    }
    if (pendingConn) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      setPendingConn(p => p ? { ...p, curX: e.clientX - rect.left, curY: e.clientY - rect.top } : null)
    }
  }, [dragging, pendingConn])

  const handleCanvasMouseUp = useCallback(() => {
    setDragging(null)
    setPendingConn(null)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleCanvasMouseMove)
    window.addEventListener('mouseup', handleCanvasMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleCanvasMouseMove)
      window.removeEventListener('mouseup', handleCanvasMouseUp)
    }
  }, [handleCanvasMouseMove, handleCanvasMouseUp])

  // ── Connection dragging ──
  const startConnection = (e: React.MouseEvent, fromNodeId: string) => {
    e.stopPropagation()
    const node = nodes.find(n => n.id === fromNodeId)!
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const port = getOutputPort(node)
    setPendingConn({ fromNodeId, fromX: port.x, fromY: port.y, curX: e.clientX - rect.left, curY: e.clientY - rect.top })
  }

  const finishConnection = (e: React.MouseEvent, toNodeId: string) => {
    e.stopPropagation()
    if (!pendingConn || pendingConn.fromNodeId === toNodeId) { setPendingConn(null); return }
    // Avoid duplicates
    const exists = edges.some(ed => ed.fromNodeId === pendingConn.fromNodeId && ed.toNodeId === toNodeId)
    if (!exists) {
      setEdges(prev => [...prev, { id: `${pendingConn.fromNodeId}-${toNodeId}`, fromNodeId: pendingConn.fromNodeId, toNodeId }])
    }
    setPendingConn(null)
  }

  const deleteEdge = (id: string) => setEdges(prev => prev.filter(e => e.id !== id))

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.fromNodeId !== id && e.toNodeId !== id))
    if (selectedNode?.id === id) setSelectedNode(null)
  }

  const updateNodeData = (field: string, value: string | number) => {
    if (!selectedNode) return
    const updated = { ...selectedNode, data: { ...selectedNode.data, [field]: value } }
    setSelectedNode(updated)
    setNodes(prev => prev.map(n => n.id === updated.id ? updated : n))
  }

  // ── Save / Load ──
  const saveFlow = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = { name: flowName, nodes, edges, trigger_keyword: flowKeyword, is_active: flowActive, device_id: flowDevice || null }

    if (selectedFlow && selectedFlow !== 'new') {
      await supabase.from('chat_flows').update(payload).eq('id', (selectedFlow as { id: string }).id)
    } else {
      const { data } = await supabase.from('chat_flows').insert({ ...payload, user_id: user.id }).select().single()
      setSelectedFlow(data as Record<string, unknown>)
    }
    const { data: newFlows } = await supabase.from('chat_flows').select('*').order('created_at', { ascending: false })
    setFlows((newFlows || []) as Record<string, unknown>[])
    setSaving(false)
  }

  const loadFlow = (f: Record<string, unknown>) => {
    setSelectedFlow(f)
    setNodes((f.nodes as FlowNode[]) || initialNodes)
    setEdges((f.edges as FlowEdge[]) || [])
    setFlowName(f.name as string)
    setFlowKeyword((f.trigger_keyword as string) || '')
    setFlowDevice((f.device_id as string) || '')
    setFlowActive((f.is_active as boolean) ?? true)
    setSelectedNode(null)
  }

  const confirmDeleteFlow = async () => {
    if (!deleteConfirm) return
    await createClient().from('chat_flows').delete().eq('id', deleteConfirm)
    setFlows(prev => prev.filter(f => (f as { id: string }).id !== deleteConfirm))
    setDeleteConfirm(null)
  }

  // ── Export / Import ──
  const exportFlow = () => {
    const data = JSON.stringify({ name: flowName, nodes, edges, trigger_keyword: flowKeyword }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${flowName}.json`; a.click()
  }

  const importFlow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        setNodes(data.nodes || initialNodes)
        setEdges(data.edges || [])
        setFlowName(data.name || 'تدفق مستورد')
        setFlowKeyword(data.trigger_keyword || '')
        setSelectedFlow('new')
      } catch { alert('ملف JSON غير صحيح') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── Test simulation ──
  const runTest = () => {
    const result = simulateFlow(nodes, edges, testMessage)
    setTestResult(result)
  }

  // ── Validation ──
  const validation = validateFlow(nodes, edges)

  // ═══════════════════════════════════════════════
  // FLOWS LIST VIEW
  // ═══════════════════════════════════════════════
  if (!selectedFlow && !loading) {
    return (
      <div>
        <div className="page-flex-header">
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>تدفقات المحادثة</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{flows.length} تدفق</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={15} /> استيراد JSON
              <input type="file" hidden accept=".json" onChange={importFlow} />
            </label>
            <button onClick={() => { setSelectedFlow('new'); setNodes(initialNodes); setEdges([]); setFlowName('تدفق جديد'); setFlowKeyword(''); setFlowDevice(''); setFlowActive(true) }} className="btn-primary">
              <Plus size={16} /> تدفق جديد
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {flows.map(f => (
            <div key={(f as { id: string }).id} onClick={() => loadFlow(f)} className="card" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <GitBranch size={18} color="#A78BFA" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name as string}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>كلمة: {(f.trigger_keyword as string) || '—'}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm((f as { id: string }).id) }} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#EF4444', flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>{((f.nodes as FlowNode[])?.length || 0)} عقدة · {((f.edges as FlowEdge[])?.length || 0)} اتصال</span>
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

        <ConfirmDialog
          open={!!deleteConfirm}
          title="حذف التدفق"
          description="هل أنت متأكد من حذف هذا التدفق؟ لا يمكن التراجع عن هذا الإجراء."
          confirmLabel="حذف"
          variant="danger"
          onConfirm={confirmDeleteFlow}
          onCancel={() => setDeleteConfirm(null)}
        />
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // FLOW EDITOR VIEW
  // ═══════════════════════════════════════════════
  return (
    <div style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'var(--bg-card)', borderRadius: '14px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setSelectedFlow(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
          <ArrowLeft size={16} /> رجوع
        </button>
        <input className="input-cosmic" value={flowName} onChange={e => setFlowName(e.target.value)} style={{ width: '140px', padding: '7px 10px', fontSize: '13px' }} placeholder="اسم التدفق" />
        <input className="input-cosmic" value={flowKeyword} onChange={e => setFlowKeyword(e.target.value)} style={{ width: '120px', padding: '7px 10px', fontSize: '13px' }} placeholder="كلمة التشغيل" />
        <select className="input-cosmic" value={flowDevice} onChange={e => setFlowDevice(e.target.value)} style={{ width: '130px', padding: '7px 10px', fontSize: '12px' }}>
          <option value="">كل الأجهزة</option>
          {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <button onClick={() => setFlowActive(a => !a)} style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${flowActive ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, background: flowActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: flowActive ? '#10B981' : '#EF4444', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {flowActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {flowActive ? 'مفعّل' : 'معطّل'}
        </button>

        {/* Validation indicator */}
        <button onClick={() => setShowValidation(v => !v)} style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${validation.valid ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, background: validation.valid ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: validation.valid ? '#10B981' : '#EF4444', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {validation.valid ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
          {validation.valid ? 'صالح' : `${validation.errors.length} خطأ`}
        </button>

        <div style={{ marginRight: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {/* Node type buttons */}
          {(Object.entries(nodeTypeConfig) as [FlowNode['type'], typeof nodeTypeConfig[keyof typeof nodeTypeConfig]][]).filter(([t]) => t !== 'start').map(([type, cfg]) => (
            <button key={type} onClick={() => addNode(type)} style={{ padding: '5px 8px', borderRadius: '7px', border: `1px solid ${cfg.color}40`, background: cfg.bg, color: cfg.color, cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              {cfg.icon} {cfg.label}
            </button>
          ))}

          <button onClick={() => setShowTest(true)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.1)', color: '#10B981', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Play size={13} /> اختبار
          </button>
          <button onClick={exportFlow} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>
            <Download size={13} /> تصدير
          </button>
          <button onClick={saveFlow} disabled={saving} className="btn-primary" style={{ padding: '7px 14px', fontSize: '13px' }}>
            <Save size={13} /> {saving ? 'حفظ...' : 'حفظ'}
          </button>
        </div>
      </div>

      {/* Validation panel */}
      {showValidation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: '8px', fontSize: '12px' }}>
          {validation.errors.map((e, i) => (
            <div key={i} style={{ color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <X size={12} /> {e}
            </div>
          ))}
          {validation.warnings.map((w, i) => (
            <div key={i} style={{ color: '#FCD34D', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <AlertTriangle size={12} /> {w}
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', gap: '10px', overflow: 'hidden' }}>

        {/* ── CANVAS ── */}
        <div
          ref={canvasRef}
          style={{ flex: 1, background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden', cursor: pendingConn ? 'crosshair' : 'default' }}
          onClick={() => setSelectedNode(null)}
        >
          {/* Grid background */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08, pointerEvents: 'none' }}>
            <defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="var(--border-light)" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Connection lines SVG */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            {/* Existing connections */}
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.id === edge.fromNodeId)
              const toNode = nodes.find(n => n.id === edge.toNodeId)
              if (!fromNode || !toNode) return null
              const from = getOutputPort(fromNode)
              const to = getInputPort(toNode)
              const midX = (from.x + to.x) / 2
              const midY = (from.y + to.y) / 2
              return (
                <g key={edge.id} style={{ pointerEvents: 'all' }}>
                  <path d={bezierPath(from.x, from.y, to.x, to.y)} stroke="var(--accent-violet)" strokeWidth={2} fill="none" strokeDasharray="0" opacity={0.8} />
                  {/* Delete edge button */}
                  <circle cx={midX} cy={midY} r={8} fill="rgba(18,18,31,0.9)" stroke="var(--border-light)" style={{ cursor: 'pointer' }} onClick={() => deleteEdge(edge.id)} />
                  <text x={midX} y={midY + 4} textAnchor="middle" fill="#EF4444" fontSize={10} style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => deleteEdge(edge.id)}>✕</text>
                </g>
              )
            })}

            {/* In-progress connection */}
            {pendingConn && (
              <path
                d={bezierPath(pendingConn.fromX, pendingConn.fromY, pendingConn.curX, pendingConn.curY)}
                stroke="#7C3AED"
                strokeWidth={2}
                fill="none"
                strokeDasharray="6,3"
                opacity={0.7}
              />
            )}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const cfg = nodeTypeConfig[node.type]
            const isSelected = selectedNode?.id === node.id
            const outPort = getOutputPort(node)
            const inPort = getInputPort(node)

            return (
              <div
                key={node.id}
                onMouseDown={e => handleNodeMouseDown(e, node.id)}
                onMouseUp={e => pendingConn ? finishConnection(e, node.id) : undefined}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  border: `2px solid ${isSelected ? cfg.color : cfg.color + '60'}`,
                  borderRadius: '12px',
                  cursor: 'grab',
                  userSelect: 'none',
                  boxShadow: isSelected ? `0 0 20px ${cfg.color}40` : '0 4px 12px rgba(0,0,0,0.3)',
                  zIndex: isSelected ? 10 : 1,
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>{cfg.icon}</div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: cfg.color, flex: 1 }}>{cfg.label}</span>
                  <button onClick={e => { e.stopPropagation(); deleteNode(node.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '1px' }}>
                    <X size={11} />
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {node.data.keyword || node.data.text || node.data.label}
                </div>

                {/* Input port (left) */}
                {node.type !== 'start' && (
                  <div
                    onMouseUp={e => finishConnection(e, node.id)}
                    style={{
                      position: 'absolute',
                      left: -7,
                      top: NODE_HEIGHT / 2 - 7,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: cfg.color,
                      border: '2px solid var(--bg-secondary)',
                      cursor: 'crosshair',
                      zIndex: 20,
                    }}
                  />
                )}

                {/* Output port (right) */}
                {node.type !== 'end' && (
                  <div
                    onMouseDown={e => { e.stopPropagation(); startConnection(e, node.id) }}
                    title="اسحب لإنشاء اتصال"
                    style={{
                      position: 'absolute',
                      right: -7,
                      top: NODE_HEIGHT / 2 - 7,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: cfg.color,
                      border: '2px solid var(--bg-secondary)',
                      cursor: 'crosshair',
                      zIndex: 20,
                    }}
                  />
                )}
              </div>
            )
          })}

          {nodes.length <= 1 && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <GitBranch size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <p style={{ fontSize: '13px' }}>أضف عقداً ثم اسحب من النقطة اليمنى لإنشاء اتصال</p>
            </div>
          )}
        </div>

        {/* ── PROPERTIES PANEL ── */}
        {selectedNode && (
          <div style={{ width: '230px', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '14px', overflowY: 'auto', flexShrink: 0 }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: nodeTypeConfig[selectedNode.type].color, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {nodeTypeConfig[selectedNode.type].icon} {nodeTypeConfig[selectedNode.type].label}
            </h4>

            {selectedNode.type === 'start' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>كلمة التشغيل</label>
                <input className="input-cosmic" value={selectedNode.data.keyword || ''} onChange={e => updateNodeData('keyword', e.target.value)} style={{ fontSize: '12px', padding: '7px 10px' }} placeholder="مثال: مرحبا" />
              </div>
            )}
            {selectedNode.type === 'message' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>نص الرسالة</label>
                <textarea className="input-cosmic" rows={4} value={selectedNode.data.text || ''} onChange={e => updateNodeData('text', e.target.value)} style={{ fontSize: '12px', resize: 'vertical', padding: '7px 10px' }} placeholder="اكتب الرسالة..." />
              </div>
            )}
            {selectedNode.type === 'delay' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>انتظار (ثانية)</label>
                <input type="number" className="input-cosmic" value={selectedNode.data.seconds || 5} onChange={e => updateNodeData('seconds', +e.target.value)} style={{ fontSize: '12px', padding: '7px 10px' }} min={1} max={300} />
              </div>
            )}
            {selectedNode.type === 'ai' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>System Prompt</label>
                <textarea className="input-cosmic" rows={5} value={selectedNode.data.prompt || ''} onChange={e => updateNodeData('prompt', e.target.value)} style={{ fontSize: '12px', resize: 'vertical', padding: '7px 10px' }} placeholder="تعليمات للذكاء الاصطناعي..." />
              </div>
            )}
            {selectedNode.type === 'condition' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>الشرط</label>
                <input className="input-cosmic" value={selectedNode.data.condition || ''} onChange={e => updateNodeData('condition', e.target.value)} style={{ fontSize: '12px', padding: '7px 10px' }} placeholder="مثال: contains:رقم" />
              </div>
            )}
            {selectedNode.type === 'question' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>نص السؤال</label>
                <textarea className="input-cosmic" rows={3} value={selectedNode.data.text || ''} onChange={e => updateNodeData('text', e.target.value)} style={{ fontSize: '12px', resize: 'vertical', padding: '7px 10px' }} />
              </div>
            )}

            <div style={{ marginTop: '12px', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '7px', fontSize: '10px', color: 'var(--text-muted)' }}>
              ID: {selectedNode.id}
            </div>
          </div>
        )}
      </div>

      {/* ── TEST MODAL ── */}
      {showTest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
          <div className="glass" style={{ borderRadius: '20px', padding: '24px', width: '480px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={16} color="#10B981" /> اختبار التدفق
              </h3>
              <button onClick={() => { setShowTest(false); setTestResult(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>رسالة المحاكاة</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="input-cosmic" value={testMessage} onChange={e => setTestMessage(e.target.value)} style={{ flex: 1, fontSize: '13px' }} placeholder="اكتب الرسالة التجريبية..." />
                <button onClick={runTest} className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                  <Play size={13} /> تشغيل
                </button>
              </div>
            </div>

            {testResult && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  مسار التنفيذ ({testResult.length} خطوة):
                </div>
                {testResult.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#A78BFA', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{step.label}</div>
                      {step.output && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{step.output}</div>}
                    </div>
                    {i < testResult.length - 1 && <ChevronRight size={12} color="var(--text-muted)" style={{ marginTop: '4px', flexShrink: 0 }} />}
                  </div>
                ))}
                {testResult.length === 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                    لا توجد عقدة بداية — أضف عقدة بداية أولاً
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
