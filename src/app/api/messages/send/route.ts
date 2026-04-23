import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { generateReply } from '@/lib/ai/gemini'

// POST /api/messages/send - Send a message
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const { device_id, phone, type = 'text', content } = body

  if (!device_id || !phone || !content) {
    return NextResponse.json({ error: 'device_id, phone, content مطلوبة' }, { status: 400 })
  }

  // Verify device ownership
  const { data: device } = await supabase.from('devices').select('id, status').eq('id', device_id).eq('user_id', user.id).single()
  if (!device) return NextResponse.json({ error: 'الجهاز غير موجود' }, { status: 404 })
  if (device.status !== 'connected') return NextResponse.json({ error: 'الجهاز غير متصل' }, { status: 400 })

  // Check message quota
  const { data: sub } = await supabase.from('subscriptions').select('messages_used, messages_limit').eq('user_id', user.id).in('status', ['trial', 'active']).order('created_at', { ascending: false }).limit(1).single()
  if (sub && sub.messages_used >= sub.messages_limit) {
    return NextResponse.json({ error: 'تجاوزت حد الرسائل الشهري' }, { status: 429 })
  }

  // Send via WA server
  const waServerUrl = process.env.NEXT_PUBLIC_WA_SERVER_URL
  if (!waServerUrl) return NextResponse.json({ error: 'سيرفر واتساب غير مضبوط' }, { status: 500 })

  try {
    const endpoint = type === 'text' ? '/messages/text' : type === 'image' ? '/messages/image' : type === 'document' ? '/messages/document' : '/messages/text'
    const res = await fetch(`${waServerUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.WA_SERVER_SECRET}` },
      body: JSON.stringify({ deviceId: device_id, phone, ...content }),
    })

    if (!res.ok) throw new Error('WA server error')

    // Log message
    await supabase.from('messages').insert({
      user_id: user.id, device_id, direction: 'outgoing',
      to_number: phone, type, content, status: 'sent',
    })

    // Update quota
    if (sub) await supabase.from('subscriptions').update({ messages_used: sub.messages_used + 1 }).eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    // Log failed message
    await supabase.from('messages').insert({
      user_id: user.id, device_id, direction: 'outgoing',
      to_number: phone, type, content, status: 'failed',
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
