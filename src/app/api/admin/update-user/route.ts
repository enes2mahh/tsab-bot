import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupaClient } from '@supabase/supabase-js'

// POST /api/admin/update-user
// Body: { userId, action, payload }
// Actions: change_role | toggle_ban | change_plan | extend | add_messages | reset_messages
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { data: caller } = await supabase
    .from('profiles').select('role, email').eq('id', user.id).single()
  if (caller?.role !== 'admin') {
    return NextResponse.json({ error: 'هذه الميزة للأدمن فقط' }, { status: 403 })
  }

  const { userId, action, payload } = await req.json()
  if (!userId || !action) {
    return NextResponse.json({ error: 'userId و action مطلوبان' }, { status: 400 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY غير مضبوط' }, { status: 500 })
  }

  const admin = createSupaClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Fetch target
  const { data: target } = await admin.from('profiles').select('*').eq('id', userId).single()
  if (!target) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  try {
    switch (action) {
      case 'change_role': {
        const newRole = payload?.role
        if (!['user', 'admin', 'support'].includes(newRole)) {
          return NextResponse.json({ error: 'role غير صالح' }, { status: 400 })
        }
        // Don't allow demoting yourself
        if (target.id === user.id && newRole !== 'admin') {
          return NextResponse.json({ error: 'لا تستطيع إزالة صلاحياتك' }, { status: 400 })
        }
        const { error } = await admin.from('profiles').update({ role: newRole }).eq('id', userId)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, message: `تم تغيير الدور إلى ${newRole}` })
      }

      case 'toggle_ban': {
        if (target.id === user.id) {
          return NextResponse.json({ error: 'لا تستطيع حظر نفسك' }, { status: 400 })
        }
        const newState = !target.is_banned
        const { error } = await admin.from('profiles').update({ is_banned: newState }).eq('id', userId)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, banned: newState })
      }

      case 'change_plan': {
        const planId = payload?.planId
        const days = Number(payload?.days || 30)
        if (!planId) return NextResponse.json({ error: 'planId مطلوب' }, { status: 400 })

        const { data: plan } = await admin.from('plans').select('message_limit, duration_days').eq('id', planId).single()
        if (!plan) return NextResponse.json({ error: 'الخطة غير موجودة' }, { status: 404 })

        // Cancel any active subs
        await admin.from('subscriptions').update({ status: 'cancelled' })
          .eq('user_id', userId).in('status', ['trial', 'active'])

        // Create new active sub
        const expires = new Date(); expires.setDate(expires.getDate() + days)
        const { error } = await admin.from('subscriptions').insert({
          user_id: userId, plan_id: planId, status: 'active',
          messages_used: 0, messages_limit: plan.message_limit || 1000,
          starts_at: new Date().toISOString(), expires_at: expires.toISOString(),
          notes: `تم تغيير الخطة بواسطة الأدمن: ${caller.email}`,
        })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, message: 'تم تغيير الخطة' })
      }

      case 'extend': {
        const days = Number(payload?.days)
        if (!days || days < 1) return NextResponse.json({ error: 'عدد أيام غير صالح' }, { status: 400 })

        const { data: sub } = await admin.from('subscriptions')
          .select('id, expires_at')
          .eq('user_id', userId)
          .in('status', ['active', 'trial'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (!sub) return NextResponse.json({ error: 'لا يوجد اشتراك نشط' }, { status: 404 })

        const newExpiry = new Date(sub.expires_at)
        newExpiry.setDate(newExpiry.getDate() + days)
        const { error } = await admin.from('subscriptions')
          .update({ expires_at: newExpiry.toISOString() })
          .eq('id', sub.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, message: `تم تمديد ${days} يوم. ينتهي في ${newExpiry.toLocaleDateString('ar')}` })
      }

      case 'add_messages': {
        const count = Number(payload?.count)
        if (!count || count < 1) return NextResponse.json({ error: 'العدد غير صالح' }, { status: 400 })

        const { data: sub } = await admin.from('subscriptions')
          .select('id, messages_limit')
          .eq('user_id', userId)
          .in('status', ['active', 'trial'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (!sub) return NextResponse.json({ error: 'لا يوجد اشتراك نشط' }, { status: 404 })

        const { error } = await admin.from('subscriptions')
          .update({ messages_limit: (sub.messages_limit || 0) + count })
          .eq('id', sub.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, message: `تم إضافة ${count} رسالة` })
      }

      case 'reset_messages': {
        const { error } = await admin.from('subscriptions')
          .update({ messages_used: 0 })
          .eq('user_id', userId)
          .in('status', ['active', 'trial'])
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, message: 'تم إعادة عداد الرسائل' })
      }

      case 'cancel_subscription': {
        const { error } = await admin.from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('user_id', userId)
          .in('status', ['active', 'trial'])
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, message: 'تم إلغاء الاشتراك' })
      }

      case 'delete_user': {
        if (target.id === user.id) {
          return NextResponse.json({ error: 'لا تستطيع حذف نفسك' }, { status: 400 })
        }
        // Delete from auth.users (cascades to profiles)
        const { error } = await admin.auth.admin.deleteUser(userId)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, message: 'تم حذف الحساب نهائياً' })
      }

      default:
        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'خطأ غير متوقع'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
