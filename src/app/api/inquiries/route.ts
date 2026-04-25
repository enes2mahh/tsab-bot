import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['contact', 'career', 'partner', 'help', 'feedback'] as const

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, name, email, phone, subject, message, metadata } = body

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'نوع غير صالح' }, { status: 400 })
    }
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'الحقول المطلوبة مفقودة' }, { status: 400 })
    }
    // basic email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'صيغة البريد غير صحيحة' }, { status: 400 })
    }
    if (message.length > 5000 || name.length > 200) {
      return NextResponse.json({ error: 'النص طويل جداً' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const userAgent = req.headers.get('user-agent')?.substring(0, 500) || null

    const { error } = await supabase.from('inquiries').insert({
      type,
      name: String(name).substring(0, 200),
      email: String(email).substring(0, 200).toLowerCase(),
      phone: phone ? String(phone).substring(0, 30) : null,
      subject: subject ? String(subject).substring(0, 300) : null,
      message: String(message).substring(0, 5000),
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      user_agent: userAgent,
    })

    if (error) {
      console.error('Insert inquiry error:', error)
      return NextResponse.json({ error: 'حدث خطأ في الحفظ' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'خطأ غير متوقع'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
