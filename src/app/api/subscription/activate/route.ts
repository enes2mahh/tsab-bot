import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const { code } = body
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'الكود مطلوب' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Use the DB-level atomic function to prevent race conditions (FOR UPDATE lock)
  const { data, error } = await admin.rpc('activate_code_safe', {
    p_code: code.toUpperCase().trim(),
    p_user_id: user.id,
    p_plan_duration_days: 30,
  })

  if (error) {
    console.error('[activate] RPC error:', error.message)
    return NextResponse.json({ message: 'حدث خطأ في التفعيل، حاول مجدداً' }, { status: 500 })
  }

  if (data?.error) {
    return NextResponse.json({ message: data.error }, { status: 400 })
  }

  const sub = data?.subscription
  return NextResponse.json({
    message: `تم التفعيل بنجاح! اشتراك ${sub?.plan_name_ar || ''} لمدة ${sub?.duration_days || 30} يوم 🎉`,
  })
}
