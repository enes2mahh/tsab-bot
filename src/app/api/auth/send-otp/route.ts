import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupaClient } from '@supabase/supabase-js'
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 30

// POST /api/auth/send-otp
// Body: { phone: string, purpose?: 'register' | 'reset' }
// Sends a 6-digit OTP via WhatsApp using the platform's configured OTP device.
// Falls back gracefully if no device is configured (returns ok=true, otp_skipped=true).
export async function POST(req: NextRequest) {
  try {
    // IP-based rate limit: max 10 OTP requests per IP per hour
    const ip = getClientIp(req)
    if (!checkRateLimit(`otp-send:${ip}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'تجاوزت الحد المسموح. حاول لاحقاً.' }, { status: 429 })
    }

    const { phone: rawPhone, purpose = 'register' } = await req.json()

    if (!rawPhone || typeof rawPhone !== 'string') {
      return NextResponse.json({ error: 'رقم الهاتف مطلوب' }, { status: 400 })
    }

    // Normalize phone (digits only)
    const phone = rawPhone.replace(/\D/g, '')
    if (phone.length < 8 || phone.length > 15) {
      return NextResponse.json({ error: 'رقم الهاتف غير صحيح' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json({ error: 'إعدادات الخادم غير مكتملة' }, { status: 500 })
    }

    const supabase = createSupaClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Get platform OTP device from system_settings
    const { data: settings } = await supabase.from('system_settings').select('settings').eq('id', 'global').single()
    const otpDeviceId = (settings?.settings as any)?.otp_device_id as string | undefined

    // Rate limiting: max 3 OTPs per phone per 10 mins
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count: recent } = await supabase
      .from('phone_otps')
      .select('*', { count: 'exact', head: true })
      .eq('phone', phone)
      .gte('created_at', tenMinAgo)

    if ((recent || 0) >= 3) {
      return NextResponse.json({ error: 'تجاوزت الحد المسموح. حاول بعد 10 دقائق.' }, { status: 429 })
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min

    // Store
    await supabase.from('phone_otps').insert({
      phone,
      code,
      purpose,
      expires_at: expiresAt,
      used: false,
      attempts: 0,
    })

    // If no OTP device configured, skip sending (graceful) — don't expose reason
    if (!otpDeviceId) {
      return NextResponse.json({ success: true })
    }

    // Send via WA server
    const waUrl = process.env.NEXT_PUBLIC_WA_SERVER_URL
    const waSecret = process.env.WA_SERVER_SECRET
    if (!waUrl || !waSecret) {
      return NextResponse.json({ success: true })
    }

    const purposeLabel = purpose === 'register' ? 'إنشاء حساب' : 'استعادة كلمة المرور'
    const message = `🔐 رمز التحقق الخاص بك في Sends Bot

الرمز: *${code}*

الغرض: ${purposeLabel}
صلاحية الرمز: 10 دقائق

⚠️ لا تشارك هذا الرمز مع أحد.`

    try {
      const r = await fetch(`${waUrl}/messages/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${waSecret}`,
        },
        body: JSON.stringify({ deviceId: otpDeviceId, phone, text: message }),
        signal: AbortSignal.timeout(15000),
      })

      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        console.error('OTP WA send failed:', err)
        return NextResponse.json({
          success: true,
          otp_skipped: true,
          warning: 'فشل إرسال OTP. تواصل مع الدعم.',
        })
      }
    } catch (err) {
      console.error('OTP send error:', err)
      return NextResponse.json({
        success: true,
        otp_skipped: true,
        warning: 'تعذّر الاتصال بسيرفر واتساب. تواصل مع الدعم.',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق إلى رقمك عبر واتساب',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'خطأ غير متوقع'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
