import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// GET /api/campaigns
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/campaigns - create
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()

  // Input validation
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ error: 'اسم الحملة مطلوب' }, { status: 400 })
  }
  if (body.name.length > 200) {
    return NextResponse.json({ error: 'اسم الحملة طويل جداً' }, { status: 400 })
  }
  if (!Array.isArray(body.recipients)) {
    return NextResponse.json({ error: 'قائمة المستلمين غير صحيحة' }, { status: 400 })
  }
  if (body.recipients.length === 0) {
    return NextResponse.json({ error: 'يجب إضافة مستلم واحد على الأقل' }, { status: 400 })
  }
  if (body.recipients.length > 10000) {
    return NextResponse.json({ error: 'الحد الأقصى للمستلمين هو 10,000' }, { status: 400 })
  }
  const msgText = body.message_content?.text || body.message_content?.caption || ''
  if (typeof msgText === 'string' && msgText.length > 4096) {
    return NextResponse.json({ error: 'نص الرسالة طويل جداً (الحد 4096 حرف)' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      user_id: user.id,
      name: body.name,
      device_id: body.device_id,
      message_type: body.message_type || 'text',
      message_content: body.message_content,
      recipients: body.recipients,
      total_count: body.recipients?.length || 0,
      sent_count: 0,
      failed_count: 0,
      pending_count: body.recipients?.length || 0,
      delay_min: body.delay_min || 5,
      delay_max: body.delay_max || 10,
      scheduled_at: body.scheduled_at || null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-start if no schedule
  if (!body.scheduled_at) {
    const waServerUrl = process.env.NEXT_PUBLIC_WA_SERVER_URL
    if (waServerUrl) {
      try {
        await fetch(`${waServerUrl}/campaigns/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.WA_SERVER_SECRET}` },
          body: JSON.stringify({ campaignId: data.id }),
        })
      } catch (err) { console.error('Campaign start error:', err) }
    }
  }

  return NextResponse.json(data)
}
