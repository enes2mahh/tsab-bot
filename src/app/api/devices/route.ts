import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/devices - جلب أجهزة المستخدم
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/devices - إنشاء جهاز جديد
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const { name, webhook_url } = body

  // Validate webhook_url to prevent SSRF
  if (webhook_url) {
    let parsed: URL
    try { parsed = new URL(webhook_url) } catch { return NextResponse.json({ error: 'رابط الـ webhook غير صحيح' }, { status: 400 }) }
    if (!['http:', 'https:'].includes(parsed.protocol)) return NextResponse.json({ error: 'رابط الـ webhook يجب أن يبدأ بـ http أو https' }, { status: 400 })
    const host = parsed.hostname.toLowerCase()
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '::1']
    if (blockedHosts.includes(host)) return NextResponse.json({ error: 'رابط الـ webhook غير مسموح به' }, { status: 400 })
    const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    if (ipv4) {
      const [, a, b] = ipv4.map(Number)
      if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
        return NextResponse.json({ error: 'رابط الـ webhook غير مسموح به' }, { status: 400 })
      }
    }
  }

  // Check device limit
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plans(device_limit)')
    .eq('user_id', user.id)
    .in('status', ['trial', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const deviceLimit = (subscription?.plans as any)?.device_limit || 1

  const { count } = await supabase
    .from('devices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count || 0) >= deviceLimit) {
    return NextResponse.json({ error: 'وصلت للحد الأقصى للأجهزة في خطتك' }, { status: 403 })
  }

  // Create device in DB
  const sessionId = `${user.id}-${Date.now()}`
  const { data: device, error } = await supabase
    .from('devices')
    .insert({
      user_id: user.id,
      name: name || 'جهازي',
      webhook_url: webhook_url || null,
      session_id: sessionId,
      status: 'disconnected',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify WA server to init session
  const waServerUrl = process.env.NEXT_PUBLIC_WA_SERVER_URL
  if (waServerUrl) {
    try {
      await fetch(`${waServerUrl}/devices/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WA_SERVER_SECRET}`,
        },
        body: JSON.stringify({ deviceId: device.id, userId: user.id, sessionId }),
      })
    } catch (err) {
      console.error('WA server init error:', err)
    }
  }

  return NextResponse.json(device)
}
