import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

function isAllowedWebhookUrl(raw: string): boolean {
  let parsed: URL
  try { parsed = new URL(raw) } catch { return false }
  if (!['http:', 'https:'].includes(parsed.protocol)) return false
  const host = parsed.hostname.toLowerCase()
  const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '::1', '[::1]']
  if (blockedHosts.includes(host)) return false
  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (ipv4) {
    const [, a, b] = ipv4.map(Number)
    if (a === 10) return false
    if (a === 172 && b >= 16 && b <= 31) return false
    if (a === 192 && b === 168) return false
    if (a === 127) return false
  }
  return true
}

// POST /api/settings/test-webhook
// Body: { url: string }
// Sends a test POST to the provided webhook URL and returns the response status.
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { url } = await req.json()
  if (!url || !isAllowedWebhookUrl(url)) {
    return NextResponse.json({ error: 'رابط غير صحيح أو غير مسموح به' }, { status: 400 })
  }

  const payload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    message: 'اختبار Webhook من Sends Bot ✓',
    user_id: user.id,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Sends-Event': 'test' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })
    return NextResponse.json({ success: res.ok, status: res.status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'فشل الاتصال'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
