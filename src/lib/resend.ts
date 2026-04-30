const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM = process.env.RESEND_FROM_EMAIL || `Sends Bot <noreply@${process.env.RESEND_DOMAIN || 'sendsbot.com'}>`

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[Resend] RESEND_API_KEY not set — email skipped')
    return { error: 'RESEND_API_KEY not configured' }
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: from || FROM, to: Array.isArray(to) ? to : [to], subject, html }),
  })

  const body = await res.json()
  if (!res.ok) { console.error('[Resend] failed:', body); return { error: body } }
  return { data: body }
}

// ── Pre-built templates ───────────────────────────────────────────────────────

export function emailCampaignCompleted(opts: { name: string; sent: number; failed: number; total: number }) {
  return {
    subject: `✅ حملتك "${opts.name}" اكتملت`,
    html: `
      <div dir="rtl" style="font-family:Tajawal,Arial,sans-serif;max-width:560px;margin:auto;background:#0F0F1A;color:#E2E8F0;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#7C3AED,#4F46E5);padding:32px;text-align:center">
          <h1 style="margin:0;font-size:22px;color:#fff">🚀 اكتملت الحملة</h1>
        </div>
        <div style="padding:28px">
          <p style="font-size:16px;font-weight:700;color:#A78BFA;margin-bottom:20px">"${opts.name}"</p>
          <div style="display:flex;gap:12px;margin-bottom:24px">
            <div style="flex:1;background:#1E1E2E;border-radius:12px;padding:16px;text-align:center;border-top:3px solid #10B981">
              <div style="font-size:26px;font-weight:700;color:#10B981">${opts.sent}</div>
              <div style="font-size:12px;color:#94A3B8;margin-top:4px">تم الإرسال</div>
            </div>
            <div style="flex:1;background:#1E1E2E;border-radius:12px;padding:16px;text-align:center;border-top:3px solid #EF4444">
              <div style="font-size:26px;font-weight:700;color:#EF4444">${opts.failed}</div>
              <div style="font-size:12px;color:#94A3B8;margin-top:4px">فشل</div>
            </div>
            <div style="flex:1;background:#1E1E2E;border-radius:12px;padding:16px;text-align:center;border-top:3px solid #7C3AED">
              <div style="font-size:26px;font-weight:700;color:#A78BFA">${opts.total > 0 ? Math.round((opts.sent / opts.total) * 100) : 0}%</div>
              <div style="font-size:12px;color:#94A3B8;margin-top:4px">نسبة النجاح</div>
            </div>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/campaigns" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;text-decoration:none;padding:14px;border-radius:12px;font-weight:700;font-size:15px">عرض التقرير الكامل ←</a>
        </div>
        <div style="padding:16px;text-align:center;font-size:11px;color:#475569">Sends Bot — منصة التسويق عبر واتساب</div>
      </div>`,
  }
}

export function emailSubscriptionExpiring(opts: { name: string; daysLeft: number; planName: string }) {
  const urgent = opts.daysLeft <= 3
  return {
    subject: `${urgent ? '🚨' : '⚠️'} اشتراكك ينتهي خلال ${opts.daysLeft} يوم`,
    html: `
      <div dir="rtl" style="font-family:Tajawal,Arial,sans-serif;max-width:560px;margin:auto;background:#0F0F1A;color:#E2E8F0;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,${urgent ? '#EF4444,#DC2626' : '#F59E0B,#D97706'});padding:32px;text-align:center">
          <h1 style="margin:0;font-size:22px;color:#fff">${urgent ? '🚨' : '⚠️'} تذكير بانتهاء الاشتراك</h1>
        </div>
        <div style="padding:28px">
          <p style="font-size:15px;color:#E2E8F0;line-height:1.8">مرحباً <strong>${opts.name}</strong>،</p>
          <p style="font-size:15px;color:#E2E8F0;line-height:1.8">اشتراكك في خطة <strong style="color:#A78BFA">${opts.planName}</strong> سينتهي خلال <strong style="color:${urgent ? '#EF4444' : '#F59E0B'}">${opts.daysLeft} يوم</strong>.</p>
          <p style="font-size:14px;color:#94A3B8">جدّد الآن للاستمرار في إرسال الرسائل وإدارة حملاتك.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/plans" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;text-decoration:none;padding:14px;border-radius:12px;font-weight:700;font-size:15px;margin-top:20px">تجديد الاشتراك الآن ←</a>
        </div>
        <div style="padding:16px;text-align:center;font-size:11px;color:#475569">Sends Bot — منصة التسويق عبر واتساب</div>
      </div>`,
  }
}

export function emailPasswordReset(opts: { resetLink: string }) {
  return {
    subject: '🔐 إعادة تعيين كلمة المرور — Sends Bot',
    html: `
      <div dir="rtl" style="font-family:Tajawal,Arial,sans-serif;max-width:560px;margin:auto;background:#0F0F1A;color:#E2E8F0;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#7C3AED,#4F46E5);padding:40px;text-align:center">
          <div style="font-size:48px;margin-bottom:12px">🔐</div>
          <h1 style="margin:0;font-size:22px;color:#fff">إعادة تعيين كلمة المرور</h1>
        </div>
        <div style="padding:32px">
          <p style="font-size:15px;color:#E2E8F0;line-height:1.8;margin-bottom:8px">تلقّينا طلباً لإعادة تعيين كلمة مرور حسابك في <strong>Sends Bot</strong>.</p>
          <p style="font-size:14px;color:#94A3B8;line-height:1.8;margin-bottom:28px">إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد وستبقى كلمة مرورك كما هي.</p>
          <a href="${opts.resetLink}" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;text-decoration:none;padding:16px;border-radius:12px;font-weight:700;font-size:16px;margin-bottom:20px">
            تعيين كلمة مرور جديدة ←
          </a>
          <p style="font-size:12px;color:#475569;text-align:center;line-height:1.8">
            أو انسخ هذا الرابط في المتصفح:<br>
            <span style="color:#7C3AED;word-break:break-all">${opts.resetLink}</span>
          </p>
          <div style="margin-top:24px;padding:16px;background:#1E1E2E;border-radius:12px;border-right:4px solid #F59E0B">
            <p style="margin:0;font-size:13px;color:#F59E0B">⏰ صلاحية الرابط: ساعة واحدة فقط</p>
          </div>
        </div>
        <div style="padding:16px;text-align:center;font-size:11px;color:#475569">Sends Bot — منصة التسويق عبر واتساب</div>
      </div>`,
  }
}

export function emailWelcome(opts: { name: string }) {
  return {
    subject: '🎉 أهلاً بك في Sends Bot!',
    html: `
      <div dir="rtl" style="font-family:Tajawal,Arial,sans-serif;max-width:560px;margin:auto;background:#0F0F1A;color:#E2E8F0;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#7C3AED,#4F46E5);padding:40px;text-align:center">
          <div style="font-size:48px;margin-bottom:12px">⚡</div>
          <h1 style="margin:0;font-size:24px;color:#fff">أهلاً بك في Sends Bot</h1>
        </div>
        <div style="padding:28px">
          <p style="font-size:15px;color:#E2E8F0;line-height:1.8">مرحباً <strong>${opts.name}</strong>! 🎉</p>
          <p style="font-size:14px;color:#94A3B8;line-height:1.8">تم تفعيل حسابك بنجاح. يمكنك الآن ربط أجهزة واتساب، إنشاء حملات، وإدارة عملائك بكل سهولة.</p>
          <div style="background:#1E1E2E;border-radius:12px;padding:20px;margin:20px 0">
            <div style="font-weight:700;color:#A78BFA;margin-bottom:12px">🚀 ابدأ الآن:</div>
            <div style="color:#94A3B8;font-size:14px;line-height:2">
              1️⃣ اذهب إلى <strong style="color:#E2E8F0">الأجهزة</strong> وامسح QR Code<br>
              2️⃣ أنشئ <strong style="color:#E2E8F0">حملتك الأولى</strong> في 4 خطوات<br>
              3️⃣ راقب النتائج من <strong style="color:#E2E8F0">لوحة التحكم</strong>
            </div>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/home" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;text-decoration:none;padding:14px;border-radius:12px;font-weight:700;font-size:15px">ابدأ الآن ←</a>
        </div>
        <div style="padding:16px;text-align:center;font-size:11px;color:#475569">Sends Bot — منصة التسويق عبر واتساب</div>
      </div>`,
  }
}
