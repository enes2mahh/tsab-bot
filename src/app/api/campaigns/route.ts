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
