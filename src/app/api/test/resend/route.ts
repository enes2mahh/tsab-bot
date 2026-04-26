import { NextResponse } from 'next/server'
import { sendEmail, emailWelcome, emailCampaignCompleted } from '@/lib/resend'

export async function GET() {
  const results: Record<string, any> = {}

  // Test 1: simple email
  results.simple = await sendEmail({
    to: 'zero.anas123@gmail.com',
    subject: '✅ Tsab Bot — اختبار Resend',
    html: `<div dir="rtl" style="font-family:Arial;padding:20px;background:#0F0F1A;color:#E2E8F0;border-radius:12px">
      <h2 style="color:#A78BFA">✅ Resend يعمل بنجاح!</h2>
      <p>تم إرسال هذا الإيميل من Tsab Bot عبر Resend API.</p>
      <p style="color:#64748B;font-size:12px">الوقت: ${new Date().toLocaleString('ar-SA')}</p>
    </div>`,
  })

  // Test 2: welcome template
  results.welcome = await sendEmail({
    to: 'zero.anas123@gmail.com',
    ...emailWelcome({ name: 'أنس' }),
  })

  // Test 3: campaign completed template
  results.campaign = await sendEmail({
    to: 'zero.anas123@gmail.com',
    ...emailCampaignCompleted({ name: 'حملة الاختبار', sent: 150, failed: 3, total: 153 }),
  })

  const allOk = Object.values(results).every((r: any) => !r.error)

  return NextResponse.json({
    status: allOk ? '✅ كل الإيميلات أُرسلت بنجاح' : '❌ بعض الإيميلات فشلت',
    results,
  })
}
