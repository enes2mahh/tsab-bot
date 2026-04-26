import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupaClient } from '@supabase/supabase-js'

// POST /api/auth/reset-password-with-otp
// Body: { phone: string, otp: string, newPassword: string }
// Verifies OTP then resets user's password via service role.
export async function POST(req: NextRequest) {
  try {
    const { phone: rawPhone, otp: code, newPassword } = await req.json()

    if (!rawPhone || !code || !newPassword) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 })
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

    // Verify OTP
    const { data: otp } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('phone', phone)
      .eq('used', false)
      .eq('purpose', 'reset')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!otp) return NextResponse.json({ error: 'لم يُطلب رمز تحقق لهذا الرقم' }, { status: 404 })
    if (new Date(otp.expires_at).getTime() < Date.now()) return NextResponse.json({ error: 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.' }, { status: 410 })
    if ((otp.attempts || 0) >= 5) return NextResponse.json({ error: 'تجاوزت محاولات التحقق. اطلب رمزاً جديداً.' }, { status: 429 })
    if (otp.code !== codeStr) {
      await supabase.from('phone_otps').update({ attempts: (otp.attempts || 0) + 1 }).eq('id', otp.id)
      return NextResponse.json({ error: 'الرمز غير صحيح' }, { status: 400 })
    }

    // Find user by phone in profiles
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single()

    if (!profileRow) return NextResponse.json({ error: 'لا يوجد حساب مرتبط بهذا الرقم' }, { status: 404 })

    // Update password via admin API
    const { error: updateErr } = await supabase.auth.admin.updateUserById(profileRow.id, { password: newPassword })
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    // Mark OTP used
    await supabase.from('phone_otps').update({ used: true }).eq('id', otp.id)

    return NextResponse.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'خطأ غير متوقع'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
