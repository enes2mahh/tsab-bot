import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// DELETE and GET for single campaign
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const { id } = await params
  const { data } = await supabase.from('campaigns').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const { id } = await params
  await supabase.from('campaigns').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
