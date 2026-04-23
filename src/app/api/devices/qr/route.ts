import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// POST /api/devices/qr - Request QR from WA server
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { deviceId } = await req.json()

  // Verify device belongs to user
  const { data: device } = await supabase
    .from('devices')
    .select('id, session_id')
    .eq('id', deviceId)
    .eq('user_id', user.id)
    .single()

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
      body: JSON.stringify({ deviceId: device.id }),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'تعذر الاتصال بسيرفر واتساب' }, { status: 500 })
  }
}
