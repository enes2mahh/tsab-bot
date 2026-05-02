import { createClient } from '@/lib/supabase/client'

export interface DateRange {
  from: Date
  to: Date
  label: string
}

export function getPresetRanges(): DateRange[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return [
    {
      label: 'آخر 7 أيام',
      from: new Date(today.getTime() - 6 * 86400000),
      to: new Date(today.getTime() + 86400000),
    },
    {
      label: 'آخر 30 يوم',
      from: new Date(today.getTime() - 29 * 86400000),
      to: new Date(today.getTime() + 86400000),
    },
    {
      label: 'آخر 90 يوم',
      from: new Date(today.getTime() - 89 * 86400000),
      to: new Date(today.getTime() + 86400000),
    },
    {
      label: 'هذا الشهر',
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(today.getTime() + 86400000),
    },
  ]
}

export interface MessageStats {
  sent: number
  received: number
  failed: number
  successRate: number
  prevSent: number
  prevReceived: number
}

export interface DailyPoint {
  day: string
  date: string
  sent: number
  received: number
}

export interface TypePoint {
  name: string
  value: number
}

export interface CampaignStat {
  id: string
  name: string
  total: number
  sent: number
  failed: number
  successRate: number
  created_at: string
}

export interface DeviceStat {
  device_id: string
  device_name: string
  sent: number
  received: number
}

// Build array of days between two dates
function buildDayRange(from: Date, to: Date): { key: string; label: string }[] {
  const days: { key: string; label: string }[] = []
  const cur = new Date(from)
  while (cur < to) {
    days.push({
      key: cur.toDateString(),
      label: cur.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
    })
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

// Fetch messages in range
async function fetchMessages(userId: string, from: Date, to: Date) {
  const supabase = createClient()
  const { data } = await supabase
    .from('messages')
    .select('id, direction, status, type, created_at, device_id, metadata')
    .eq('user_id', userId)
    .gte('created_at', from.toISOString())
    .lt('created_at', to.toISOString())
    .order('created_at', { ascending: false })
  return data || []
}

export async function getMessageStats(range: DateRange): Promise<MessageStats> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { sent: 0, received: 0, failed: 0, successRate: 100, prevSent: 0, prevReceived: 0 }

  const duration = range.to.getTime() - range.from.getTime()
  const prevFrom = new Date(range.from.getTime() - duration)
  const prevTo = range.from

  const [current, previous] = await Promise.all([
    fetchMessages(user.id, range.from, range.to),
    fetchMessages(user.id, prevFrom, prevTo),
  ])

  const sent = current.filter((m: { direction: string }) => m.direction === 'outgoing').length
  const received = current.filter((m: { direction: string }) => m.direction === 'incoming').length
  const failed = current.filter((m: { status: string }) => m.status === 'failed').length
  const successRate = sent > 0 ? Math.round(((sent - failed) / sent) * 100) : 100
  const prevSent = previous.filter((m: { direction: string }) => m.direction === 'outgoing').length
  const prevReceived = previous.filter((m: { direction: string }) => m.direction === 'incoming').length

  return { sent, received, failed, successRate, prevSent, prevReceived }
}

export async function getDailyChart(range: DateRange): Promise<DailyPoint[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const msgs = await fetchMessages(user.id, range.from, range.to)
  const days = buildDayRange(range.from, range.to)
  const map: Record<string, DailyPoint> = {}
  days.forEach(d => { map[d.key] = { day: d.label, date: d.key, sent: 0, received: 0 } })

  msgs.forEach((msg: { direction: string; created_at: string }) => {
    const key = new Date(msg.created_at).toDateString()
    if (map[key]) {
      if (msg.direction === 'outgoing') map[key].sent++
      else map[key].received++
    }
  })

  return Object.values(map)
}

export async function getTypeDistribution(range: DateRange): Promise<TypePoint[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const msgs = await fetchMessages(user.id, range.from, range.to)
  const types: Record<string, number> = {}
  msgs.forEach((msg: { type: string }) => {
    const label = msg.type === 'text' ? 'نص' : msg.type === 'image' ? 'صورة' : msg.type === 'video' ? 'فيديو' : msg.type === 'document' ? 'ملف' : msg.type
    types[label] = (types[label] || 0) + 1
  })
  return Object.entries(types).map(([name, value]) => ({ name, value }))
}

export async function getCampaignStats(range: DateRange): Promise<CampaignStat[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, recipients, created_at')
    .eq('user_id', user.id)
    .gte('created_at', range.from.toISOString())
    .lt('created_at', range.to.toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  if (!campaigns) return []

  return campaigns.map((c: { id: string; name: string; recipients: { status: string }[]; created_at: string }) => {
    const recipients: { status: string }[] = c.recipients || []
    const total = recipients.length
    const sent = recipients.filter(r => r.status === 'sent' || r.status === 'delivered' || r.status === 'read').length
    const failed = recipients.filter(r => r.status === 'failed').length
    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0
    return { id: c.id, name: c.name, total, sent, failed, successRate, created_at: c.created_at }
  })
}

export async function getDeviceStats(range: DateRange): Promise<DeviceStat[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const [msgs, devices] = await Promise.all([
    fetchMessages(user.id, range.from, range.to),
    supabase.from('devices').select('id, name').eq('user_id', user.id),
  ])

  const deviceMap = new Map((devices.data || []).map((d: { id: string; name: string }) => [d.id, d.name]))
  const stats: Record<string, DeviceStat> = {}

  msgs.forEach((msg: { device_id: string; direction: string }) => {
    if (!msg.device_id) return
    if (!stats[msg.device_id]) {
      stats[msg.device_id] = {
        device_id: msg.device_id,
        device_name: deviceMap.get(msg.device_id) || 'جهاز غير معروف',
        sent: 0,
        received: 0,
      }
    }
    if (msg.direction === 'outgoing') stats[msg.device_id].sent++
    else stats[msg.device_id].received++
  })

  return Object.values(stats).sort((a, b) => (b.sent + b.received) - (a.sent + a.received))
}

// Change % from previous period
export function calcChange(current: number, previous: number): { pct: number; up: boolean } {
  if (previous === 0) return { pct: current > 0 ? 100 : 0, up: current > 0 }
  const pct = Math.round(((current - previous) / previous) * 100)
  return { pct: Math.abs(pct), up: pct >= 0 }
}
