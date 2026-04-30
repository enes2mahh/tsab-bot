import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupaClient } from '@supabase/supabase-js'
import { sendEmail, emailPasswordReset } from '@/lib/resend'

export const maxDuration = 30

// POST /api/auth/forgot-password
// Body: { email: string }
// Generates a Supabase recovery link and sends it via Resend (not Supabase's default email)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json({ error: 'إعدادات الخادم غير مكتملة' }, { status: 500 })
    }

    const supabase = createSupaClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sendsbot.com'

    // Generate recovery link via admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email.toLowerCase().trim(),
      options: { redirectTo: `${appUrl}/auth/reset` },
    })

    if (error || !data?.properties?.action_link) {
      // Don't reveal whether the email exists or not
      return NextResponse.json({ success: true })
    }

    const resetLink = data.properties.action_link

    await sendEmail({
      to: email,
      ...emailPasswordReset({ resetLink }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'خطأ غير متوقع'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
