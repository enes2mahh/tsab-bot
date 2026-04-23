import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

type RouteParams = { params: Promise<{ id: string; action: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { id, action } = await params

  const statusMap: Record<string, string> = {
    start: 'running',
    pause: 'paused',
    resume: 'running',
    stop: 'cancelled',
  }

  const newStatus = statusMap[action]
  if (!newStatus) return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })

  await supabase.from('campaigns').update({ status: newStatus }).eq('id', id).eq('user_id', user.id)

  // Notify WA server
  const waServerUrl = process.env.NEXT_PUBLIC_WA_SERVER_URL
  if (waServerUrl && (action === 'start' || action === 'resume')) {
    try {
      await fetch(`${waServerUrl}/campaigns/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.WA_SERVER_SECRET}` },
        body: JSON.stringify({ campaignId: id }),
      })
    } catch {}
  }

  return NextResponse.json({ success: true })
}
