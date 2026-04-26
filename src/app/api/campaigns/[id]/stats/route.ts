import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// GET /api/campaigns/[id]/stats
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  // Verify ownership
  const { data: campaign, error: campErr } = await supabase
    .from('campaigns')
    .select('id, recipients, sent_count, failed_count, pending_count, total_count')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (campErr || !campaign) return NextResponse.json({ error: 'حملة غير موجودة' }, { status: 404 })

  // recipients is a JSONB array of { phone, status, sent_at, error }
  const recipients = (campaign.recipients as any[] || []).map((r: any) => ({
    phone: r.phone,
    status: r.status || 'pending',
    sent_at: r.sent_at || null,
    error: r.error || null,
  }))

  return NextResponse.json({ recipients })
}
