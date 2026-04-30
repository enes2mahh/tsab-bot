import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupaClient } from '@supabase/supabase-js'
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'

// POST /api/auth/verify-otp
// Body: { phone: string, code: string }
// Returns { success: true, token: string } on success — token is a one-time key
// the client uses to actually create the auth.users row in the next step.
export async function POST(req: NextRequest) {
  try {
    // IP-based rate limit: max 20 verify attempts per IP per hour
    const ip = getClientIp(req)
    if (!checkRateLimit(`otp-verify:${ip}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'تجاوزت الحد المسموح. حاول لاحقاً.' }, { status: 429 })
    }

    const { phone: rawPhone, code } = await req.json()
    if (!rawPhone || !code) {
      return NextResponse.json({ error: 'الهاتف والرمز مطلوبان' }, { status: 400 })
    }

    const phone = String(rawPhone).replace(/\D/g, '')
    const codeStr = String(code).trim()

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json({ error: 'إعدادات الخادم غير مكتملة' }, { status: 500 })
    }

    const supabase = createSupaClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Get latest OTP for this phone
    const { data: otp } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('phone', phone)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!otp) {
      return NextResponse.json({ error: 'لم يُطلب رمز تحقق لهذا الرقم' }, { status: 404 })
    }

    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.' }, { status: 410 })
    }

    if (otp.attempts >= 5) {
      return NextResponse.json({ error: 'تجاوزت محاولات التحقق. اطلب رمزاً جديداً.' }, { status: 429 })
    }

    if (otp.code !== codeStr) {
      await supabase.from('phone_otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id)
      return NextResponse.json({ error: 'الرمز غير صحيح' }, { status: 400 })
    }

    // Mark used
    await supabase.from('phone_otps').update({ used: true }).eq('id', otp.id)

    // Generate a one-time verification token (15min validity)
    // We reuse the otp.id as token reference (client will pass it back to register endpoint)
    return NextResponse.json({
      success: true,
      verifiedToken: otp.id,
      phone,
      message: 'تم التحقق بنجاح',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'خطأ غير متوقع'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
