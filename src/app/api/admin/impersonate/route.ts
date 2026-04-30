import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupaClient } from '@supabase/supabase-js'
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'

// POST /api/admin/impersonate
// Body: { userId: string }
// Generates a magic-link login URL for the target user.
// Only admins can call this.
export async function POST(req: NextRequest) {
  // IP-based rate limit: max 10 impersonate requests per IP per hour
  const ip = getClientIp(req)
  if (!checkRateLimit(`impersonate:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'تجاوزت الحد المسموح.' }, { status: 429 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  // Verify caller is admin
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

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY غير مضبوط على Vercel' }, { status: 500 })
  }

  // Get target user's email
  const { data: target } = await supabase
    .from('profiles')
    .select('email, name, role')
    .eq('id', userId)
    .single()

  if (!target) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  // Don't allow impersonating other admins (safety)
  if (target.role === 'admin' && target.email !== caller.email) {
    return NextResponse.json({ error: 'لا يمكن الدخول كأدمن آخر' }, { status: 403 })
  }

  // Use the service-role client to generate magic link
  const adminClient = createSupaClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const origin = req.headers.get('origin') || new URL(req.url).origin

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: target.email,
    options: { redirectTo: `${origin}/home?impersonating=1` },
  })

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message || 'فشل في توليد الرابط' }, { status: 500 })
  }

  // Build response with cookie tracking original admin
  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL || 'https://sendsbot.com']
  const requestOrigin = req.headers.get('origin') || ''
  const safeOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0]
  const safeActionLink = data.properties.action_link.replace(new URL(data.properties.action_link).origin, safeOrigin)

  const res = NextResponse.json({ url: safeActionLink, target: { email: target.email, name: target.name } })

  // These cookies hold display-only info (email/name for the banner UI)
  // They must remain non-httpOnly so the ImpersonateBanner can read/clear them from JS.
  // Actual session security is handled by Supabase's own httpOnly session cookies.
  res.cookies.set('impersonate_origin_email', caller.email || '', {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 6, // 6 hours
  })
  res.cookies.set('impersonate_origin_name', caller.name || 'Admin', {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 6,
  })

  return res
}
