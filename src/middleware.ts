import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ADMIN_CACHE_COOKIE  = '__admin_verified'
const ADMIN_CACHE_MAX_AGE = 300 // 5 minutes

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isDashboard = pathname.includes('/home') || pathname.includes('/devices') ||
    pathname.includes('/campaigns') || pathname.includes('/messages') ||
    pathname.includes('/autoreply') || pathname.includes('/chatflow') ||
    pathname.includes('/contacts') || pathname.includes('/files') ||
    pathname.includes('/plans') || pathname.includes('/warmer') ||
    pathname.includes('/filter') || pathname.includes('/tickets') ||
    pathname.includes('/referrals') || pathname.includes('/settings') ||
    pathname.includes('/reports')

  const isAdmin = pathname.includes('/admin')

  if ((isDashboard || isAdmin) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAdmin && user) {
    // Fast path: role cached in cookie (5-min TTL) — avoids DB round-trip on every request
    const cachedRole = request.cookies.get(ADMIN_CACHE_COOKIE)?.value
    if (cachedRole === user.id) {
      return supabaseResponse
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }

    // Cache verified admin identity in a short-lived httpOnly cookie
    supabaseResponse.cookies.set(ADMIN_CACHE_COOKIE, user.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: ADMIN_CACHE_MAX_AGE,
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
