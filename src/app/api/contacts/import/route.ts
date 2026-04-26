import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const maxDuration = 60

// POST /api/contacts/import
// Body: { deviceId, source: 'chats' | 'phonebook' }
// Imports contacts from the device's WA session into Supabase via wa-server
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { deviceId, source } = await req.json()
  if (!deviceId) return NextResponse.json({ error: 'deviceId required' }, { status: 400 })

  // Verify device ownership
  const { data: device } = await supabase
    .from('devices')
    .select('id, user_id, status')
    .eq('id', deviceId)
    .eq('user_id', user.id)
    .single()
  if (!device) return NextResponse.json({ error: 'الجهاز غير موجود' }, { status: 404 })
  if (device.status !== 'connected') return NextResponse.json({ error: 'الجهاز غير متصل' }, { status: 400 })

  const waServerUrl = process.env.NEXT_PUBLIC_WA_SERVER_URL
  if (!waServerUrl) return NextResponse.json({ error: 'سيرفر واتساب غير مضبوط' }, { status: 500 })

  try {
    const r = await fetch(`${waServerUrl}/devices/import-contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WA_SERVER_SECRET}`,
      },
      body: JSON.stringify({ deviceId, source: source || 'chats' }),
      signal: AbortSignal.timeout(45000),
    })
    const data = await r.json()

    // If WA server returns a contacts array, upsert them with names into Supabase
    if (Array.isArray(data.contacts) && data.contacts.length > 0) {
      const rows = data.contacts.map((c: any) => ({
        user_id: user.id,
        phone: String(c.phone || c.id || '').replace(/\D/g, '').replace(/^00/, ''),
        name: c.name || c.pushname || c.notify || null,
      })).filter((c: any) => c.phone.length >= 8)

      const { error: upsertErr } = await supabase
        .from('contacts')
        .upsert(rows, { onConflict: 'user_id,phone', ignoreDuplicates: false })

      if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })
      return NextResponse.json({ success: true, imported: rows.length, total: data.contacts.length })
    }

    // WA server handled the upsert itself — pass through
    return NextResponse.json(data, { status: r.status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'تعذر الاتصال'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
