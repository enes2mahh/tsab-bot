export interface FlowNode {
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
}

export interface FlowEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  label?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateFlow(nodes: FlowNode[], edges: FlowEdge[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Must have a start node
  const startNodes = nodes.filter(n => n.type === 'start')
  if (startNodes.length === 0) {
    errors.push('التدفق يجب أن يحتوي على عقدة بداية')
  } else if (startNodes.length > 1) {
    errors.push('لا يمكن أن يكون هناك أكثر من عقدة بداية واحدة')
  }

  // Must have at least one end node
  const endNodes = nodes.filter(n => n.type === 'end')
  if (endNodes.length === 0) {
    warnings.push('لا توجد عقدة نهاية — التدفق قد لا ينتهي بشكل صريح')
  }

  // Check for isolated nodes (no connections)
  if (nodes.length > 1) {
    const connectedIds = new Set<string>()
    edges.forEach(e => { connectedIds.add(e.fromNodeId); connectedIds.add(e.toNodeId) })
    const isolated = nodes.filter(n => !connectedIds.has(n.id) && n.type !== 'start')
    if (isolated.length > 0) {
      warnings.push(`${isolated.length} عقدة غير متصلة: ${isolated.map(n => n.data.label).join(', ')}`)
    }
  }

  // Validate start node has keyword
  startNodes.forEach(n => {
    if (!n.data.keyword?.trim()) {
      warnings.push('عقدة البداية لا تحتوي على كلمة تشغيل')
    }
  })

  // Validate message nodes have content
  nodes.filter(n => n.type === 'message').forEach(n => {
    if (!n.data.text?.trim()) {
      warnings.push(`عقدة الرسالة "${n.data.label}" لا تحتوي على نص`)
    }
  })

  // Check for cycles (basic DFS)
  const hasCycle = detectCycle(nodes, edges)
  if (hasCycle) {
    errors.push('التدفق يحتوي على حلقة مغلقة — قد يسبب تكراراً لا نهاية له')
  }

  return { valid: errors.length === 0, errors, warnings }
}

function detectCycle(nodes: FlowNode[], edges: FlowEdge[]): boolean {
  const graph = new Map<string, string[]>()
  nodes.forEach(n => graph.set(n.id, []))
  edges.forEach(e => graph.get(e.fromNodeId)?.push(e.toNodeId))

  const visited = new Set<string>()
  const inStack = new Set<string>()

  function dfs(id: string): boolean {
    visited.add(id)
    inStack.add(id)
    for (const neighbor of graph.get(id) || []) {
      if (!visited.has(neighbor) && dfs(neighbor)) return true
      if (inStack.has(neighbor)) return true
    }
    inStack.delete(id)
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id) && dfs(node.id)) return true
  }
  return false
}

// Simulate a flow execution given a trigger message
export interface SimulationStep {
  nodeId: string
  nodeType: string
  label: string
  output?: string
  decision?: string
}

export function simulateFlow(
  nodes: FlowNode[],
  edges: FlowEdge[],
  triggerMessage: string,
  maxSteps = 20,
): SimulationStep[] {
  const steps: SimulationStep[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const edgeMap = new Map<string, FlowEdge[]>()
  edges.forEach(e => {
    if (!edgeMap.has(e.fromNodeId)) edgeMap.set(e.fromNodeId, [])
    edgeMap.get(e.fromNodeId)!.push(e)
  })

  const startNode = nodes.find(n => n.type === 'start')
  if (!startNode) return steps

  let current: FlowNode | undefined = startNode

  while (current && steps.length < maxSteps) {
    const step: SimulationStep = {
      nodeId: current.id,
      nodeType: current.type,
      label: current.data.label,
    }

    if (current.type === 'message') step.output = current.data.text || '(رسالة)'
    if (current.type === 'ai') step.output = '(رد ذكاء اصطناعي)'
    if (current.type === 'delay') step.output = `انتظار ${current.data.seconds || 5} ثانية`
    if (current.type === 'end') { steps.push(step); break }

    steps.push(step)

    const outEdges = edgeMap.get(current.id) || []
    if (outEdges.length === 0) break
    // For condition nodes, pick first edge (simulation simplified)
    const nextEdge = outEdges[0]
    current = nodeMap.get(nextEdge.toNodeId)
  }

  return steps
}
