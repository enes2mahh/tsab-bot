import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupaClient } from '@supabase/supabase-js'

// POST /api/auth/register
// Body: { name, email, password, phone, verifiedToken?, referralCode? }
// Creates auth.users + profile. If verifiedToken is valid, marks phone_verified=true.
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone: rawPhone, verifiedToken, referralCode } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 })
    }

    const phone = rawPhone ? String(rawPhone).replace(/\D/g, '') : null

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json({ error: 'إعدادات الخادم غير مكتملة' }, { status: 500 })
    }

    const supabase = createSupaClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if OTP device is configured — if so, OTP is REQUIRED
    const { data: settings } = await supabase.from('system_settings').select('settings').eq('id', 'global').single()
    const otpDeviceId = (settings?.settings as any)?.otp_device_id as string | undefined

    let phoneVerified = false

    if (otpDeviceId && phone) {
      // OTP required
      if (!verifiedToken) {
        return NextResponse.json({ error: 'يجب التحقق من رقم الهاتف أولاً' }, { status: 400 })
      }
      // Check verified token belongs to this phone and is recent (< 15 min)
      const { data: otp } = await supabase
        .from('phone_otps')
        .select('*')
        .eq('id', verifiedToken)
        .eq('phone', phone)
        .eq('used', true)
        .single()

      if (!otp) {
        return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 400 })
      }
      if (new Date(otp.expires_at).getTime() < Date.now() - 15 * 60 * 1000) {
        return NextResponse.json({ error: 'انتهت صلاحية رمز التحقق. سجّل من جديد.' }, { status: 410 })
      }

      phoneVerified = true
    }

    // Create auth user
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: String(email).toLowerCase(),
      password,
      email_confirm: true, // skip email confirmation OR set false if you want email verification
      phone: phone || undefined,
      user_metadata: {
        name: name || null,
        phone: phone || null,
        referral_code: referralCode || null,
      },
    })

    if (createErr) {
      const msg = createErr.message.includes('already')
        ? 'هذا البريد مسجّل مسبقاً'
        : createErr.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    if (!created.user) {
      return NextResponse.json({ error: 'فشل إنشاء المستخدم' }, { status: 500 })
    }

    // Update profile with phone + verification flags
    // (handle_new_user trigger already created profile)
    await supabase.from('profiles').update({
      name: name || null,
      phone,
      phone_verified: phoneVerified,
      phone_verified_at: phoneVerified ? new Date().toISOString() : null,
    }).eq('id', created.user.id)

    return NextResponse.json({
      success: true,
      userId: created.user.id,
      phoneVerified,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'خطأ غير متوقع'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
