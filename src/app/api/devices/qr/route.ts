import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Vercel Hobby default is 10s - we need up to 60s for cold-start Baileys
export const maxDuration = 60

// POST /api/devices/qr - Request QR from WA server
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { deviceId } = await req.json()

  // Verify device belongs to user (or admin)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  let deviceQuery = supabase
    .from('devices')
    .select('id, session_id, user_id')
    .eq('id', deviceId)

  if (profile?.role !== 'admin') {
    deviceQuery = deviceQuery.eq('user_id', user.id)
  }

  const { data: device } = await deviceQuery.single()

  if (!device) return NextResponse.json({ error: 'الجهاز غير موجود' }, { status: 404 })

  const waServerUrl = process.env.NEXT_PUBLIC_WA_SERVER_URL
  if (!waServerUrl) {
    return NextResponse.json({ error: 'سيرفر واتساب غير مضبوط' }, { status: 500 })
  }

  try {
    const res = await fetch(`${waServerUrl}/devices/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WA_SERVER_SECRET}`,
      },
      body: JSON.stringify({ deviceId: device.id, userId: device.user_id }),
      // Wait long enough for QR to be generated on cold-start
      signal: AbortSignal.timeout(45000),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'تعذر توليد رمز QR' },
        { status: res.status },
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'تعذر الاتصال بسيرفر واتساب'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
