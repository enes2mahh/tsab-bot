import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// POST /api/settings/test-webhook
// Body: { url: string }
// Sends a test POST to the provided webhook URL and returns the response status.
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { url } = await req.json()
  if (!url || !url.startsWith('http')) {
    return NextResponse.json({ error: 'رابط غير صحيح' }, { status: 400 })
  }

  const payload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    message: 'اختبار Webhook من Tsab Bot ✓',
    user_id: user.id,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tsab-Event': 'test' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })
    return NextResponse.json({ success: res.ok, status: res.status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'فشل الاتصال'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
