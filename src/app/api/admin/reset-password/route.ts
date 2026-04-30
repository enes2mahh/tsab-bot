import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupaClient } from '@supabase/supabase-js'
import { getClientIp } from '@/lib/rate-limit'

// POST /api/admin/reset-password
// Body: { userId: string, newPassword: string }
// Admin-only. Sets a new password for the target user via Supabase Admin API.
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { data: caller } = await supabase
    .from('profiles').select('role, email, name').eq('id', user.id).single()

  if (caller?.role !== 'admin') {
    return NextResponse.json({ error: 'هذه الميزة للأدمن فقط' }, { status: 403 })
  }

  const { userId, newPassword } = await req.json()
  if (!userId || !newPassword) {
    return NextResponse.json({ error: 'userId و newPassword مطلوبان' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'الباسوورد يجب أن يكون 8 أحرف على الأقل' }, { status: 400 })
  }

  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY غير مضبوط' }, { status: 500 })
  }

  const { data: target } = await supabase
    .from('profiles').select('email, role').eq('id', userId).single()
  if (!target) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  if (target.role === 'admin' && target.email !== user.email) {
    return NextResponse.json({ error: 'لا يمكن تغيير كلمة مرور أدمن آخر' }, { status: 403 })
  }

  const adminClient = createSupaClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log
  try {
    await adminClient.from('admin_audit_logs').insert({
      admin_id:       user.id,
      admin_email:    caller.email,
      action:         'reset_password',
      target_user_id: userId,
      target_email:   target.email,
      ip_address:     req.headers.get('x-forwarded-for') || getClientIp(req),
      user_agent:     req.headers.get('user-agent') || '',
      timestamp:      new Date().toISOString(),
    })
  } catch {}

  return NextResponse.json({ success: true, email: target.email })
}
