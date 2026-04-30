import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupaClient } from '@supabase/supabase-js'
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'

// GET /api/admin/impersonate
// Returns impersonation context from httpOnly cookies (for the banner)
export async function GET(req: NextRequest) {
  const originEmail = req.cookies.get('impersonate_origin_email')?.value || null
  const originName  = req.cookies.get('impersonate_origin_name')?.value  || null
  if (!originEmail) return NextResponse.json({ impersonating: false })
  return NextResponse.json({ impersonating: true, originEmail, originName })
}

// DELETE /api/admin/impersonate
// Clears httpOnly impersonation cookies (called by banner on exit)
export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ success: true })
  res.cookies.set('impersonate_origin_email', '', { maxAge: 0, path: '/' })
  res.cookies.set('impersonate_origin_name',  '', { maxAge: 0, path: '/' })
  return res
}

// POST /api/admin/impersonate
// Generates a magic-link login URL for the target user. Admin only.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!checkRateLimit(`impersonate:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'تجاوزت الحد المسموح.' }, { status: 429 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { data: caller } = await supabase
    .from('profiles')
    .select('role, email, name')
    .eq('id', user.id)
    .single()

  if (caller?.role !== 'admin') {
    return NextResponse.json({ error: 'هذه الميزة للأدمن فقط' }, { status: 403 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY غير مضبوط على Vercel' }, { status: 500 })
  }

  const { data: target } = await supabase
    .from('profiles')
    .select('email, name, role')
    .eq('id', userId)
    .single()

  if (!target) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  if (target.role === 'admin' && target.email !== caller.email) {
    return NextResponse.json({ error: 'لا يمكن الدخول كأدمن آخر' }, { status: 403 })
  }

  const adminClient = createSupaClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL || 'https://sendsbot.com']
  const requestOrigin  = req.headers.get('origin') || ''
  const safeOrigin     = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0]

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: target.email,
    options: { redirectTo: `${safeOrigin}/home?impersonating=1` },
  })

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message || 'فشل في توليد الرابط' }, { status: 500 })
  }

  const safeActionLink = data.properties.action_link.replace(
    new URL(data.properties.action_link).origin,
    safeOrigin,
  )

  // Audit log
  try {
    await adminClient.from('admin_audit_logs').insert({
      admin_id:       user.id,
      admin_email:    caller.email,
      action:         'impersonate_start',
      target_user_id: userId,
      target_email:   target.email,
      ip_address:     req.headers.get('x-forwarded-for') || ip,
      user_agent:     req.headers.get('user-agent') || '',
      timestamp:      new Date().toISOString(),
    })
  } catch {}

  const res = NextResponse.json({ url: safeActionLink, target: { email: target.email, name: target.name } })

  // httpOnly cookies — banner reads them via GET /api/admin/impersonate
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 6, // 6 hours
  }
  res.cookies.set('impersonate_origin_email', caller.email || '', cookieOpts)
  res.cookies.set('impersonate_origin_name',  caller.name  || 'Admin', cookieOpts)

  return res
}
