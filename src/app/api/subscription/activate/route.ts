import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // User client - verify auth
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const { code } = body
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'الكود مطلوب' }, { status: 400 })
  }

  // Admin client - bypass RLS to read activation_codes
  const admin = createAdminClient()

  const { data: activationCode } = await admin
    .from('activation_codes')
    .select('*, plans(*)')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  if (!activationCode) {
    return NextResponse.json({ message: 'كود غير صحيح أو منتهي الصلاحية' }, { status: 400 })
  }

  if (activationCode.uses_count >= activationCode.max_uses) {
    return NextResponse.json({ message: 'تم استخدام هذا الكود بالكامل' }, { status: 400 })
  }

  if (activationCode.expires_at && new Date(activationCode.expires_at) < new Date()) {
    return NextResponse.json({ message: 'انتهت صلاحية هذا الكود' }, { status: 400 })
  }

  const plan = activationCode.plans as any
  if (!plan) return NextResponse.json({ message: 'الخطة غير موجودة' }, { status: 400 })

  const durationDays = activationCode.duration_days || plan.duration_days || 30
  const startsAt = new Date()
  const expiresAt = new Date(startsAt.getTime() + durationDays * 86400000)

  // Cancel existing subscriptions
  await admin.from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .in('status', ['trial', 'active'])

  // Create new subscription
  const { error: subError } = await admin.from('subscriptions').insert({
    user_id: user.id,
    plan_id: plan.id,
    status: 'active',
    messages_used: 0,
    messages_limit: plan.message_limit,
    starts_at: startsAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    activation_code: code.toUpperCase(),
    notes: activationCode.notes,
  })

  if (subError) {
    return NextResponse.json({ message: 'حدث خطأ في التفعيل، حاول مجدداً' }, { status: 500 })
  }

  // Update code usage count
  const newCount = activationCode.uses_count + 1
  await admin.from('activation_codes').update({
    uses_count: newCount,
    is_active: newCount < activationCode.max_uses,
  }).eq('id', activationCode.id)

  return NextResponse.json({
    message: `تم التفعيل بنجاح! اشتراك ${plan.name_ar} لمدة ${durationDays} يوم 🎉`
  })
}
