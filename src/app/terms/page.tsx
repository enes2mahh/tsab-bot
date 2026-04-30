import type { Metadata } from 'next'
import Link from 'next/link'
import { StarField } from '@/components/cosmic/StarField'
import { Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'شروط الخدمة | Sends Bot',
  description: 'شروط وأحكام استخدام منصة Sends Bot',
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      <StarField />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Navbar */}
        <nav style={{ background: 'rgba(8,8,18,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="white" />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Sends Bot</span>
            </Link>
            <Link href="/" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>← العودة للرئيسية</Link>
          </div>
        </nav>

        {/* Content */}
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
          {/* Arabic */}
          <div style={{ marginBottom: '60px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>شروط الخدمة</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '40px' }}>آخر تحديث: أبريل 2026</p>

            <div style={{ padding: '16px 20px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', marginBottom: '32px', fontSize: '14px', color: '#F59E0B' }}>
              ⚠️ يُرجى قراءة هذه الشروط بعناية قبل استخدام المنصة. استخدامك للمنصة يعني قبولك الكامل لهذه الشروط.
            </div>

            {[
              {
                title: '1. القبول بالشروط',
                content: `باستخدامك لمنصة Sends Bot، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يُرجى عدم استخدام المنصة.`,
              },
              {
                title: '2. وصف الخدمة',
                content: `Sends Bot هي منصة SaaS تتيح لك:
• ربط أجهزة واتساب وإدارتها
• إرسال رسائل فردية وجماعية
• إعداد ردود تلقائية وتدفقات محادثة
• استخدام الذكاء الاصطناعي للرد على العملاء
• تتبع وتحليل أداء الرسائل`,
              },
              {
                title: '3. الاستخدام المقبول',
                content: `يُسمح باستخدام المنصة لـ:
✅ التواصل مع العملاء لأغراض تجارية مشروعة
✅ إرسال محتوى تسويقي للمشتركين الذين وافقوا على ذلك
✅ خدمة العملاء والدعم التقني

يُحظر استخدام المنصة لـ:
❌ إرسال رسائل مزعجة (Spam) أو غير مرغوب فيها
❌ نشر محتوى مسيء أو غير قانوني
❌ انتهاك شروط خدمة WhatsApp
❌ أي نشاط احتيالي أو ضار`,
              },
              {
                title: '4. المسؤولية عن الحساب',
                content: `أنت مسؤول عن:
• الحفاظ على سرية بيانات دخولك
• جميع النشاطات التي تتم عبر حسابك
• التأكد من امتثال استخدامك لقوانين بلدك
• الامتثال لشروط واتساب/Meta`,
              },
              {
                title: '5. الاشتراكات والدفع',
                content: `• الاشتراكات شهرية وتُجدَّد تلقائياً ما لم تلغِها
• الفترة التجريبية المجانية حسب الخطة المختارة
• لا يوجد استرداد للمبالغ بعد بدء فترة الاشتراك المدفوع
• في حال الإلغاء، يستمر وصولك حتى نهاية الفترة المدفوعة
• نحتفظ بالحق في تغيير الأسعار مع إشعار مسبق 30 يوم`,
              },
              {
                title: '6. إيقاف الخدمة',
                content: `نحتفظ بالحق في:
• تعليق أو إنهاء حسابك في حال انتهاك الشروط
• تعطيل الميزات التي تُساء استخدامها
• وقف الخدمة بشكل مؤقت للصيانة
سنحاول الإشعار المسبق عند أي انقطاع مخطط`,
              },
              {
                title: '7. حدود المسؤولية',
                content: `• Sends Bot غير مسؤول عن قيام واتساب/Meta بحظر أرقامك
• لسنا مسؤولين عن أي خسائر ناتجة عن انقطاع الخدمة
• الحد الأقصى لمسؤوليتنا لا يتجاوز مبلغ اشتراكك الشهري
• الخدمة مقدَّمة "كما هي" بدون ضمانات صريحة`,
              },
              {
                title: '8. الملكية الفكرية',
                content: `• جميع حقوق المنصة محفوظة لـ Sends Bot
• لا يحق لك نسخ أو إعادة بيع أو توزيع المنصة
• محتوى بياناتك يبقى ملكك، وتمنحنا رخصة استخدامه لتقديم الخدمة`,
              },
              {
                title: '9. القانون المطبق',
                content: `تخضع هذه الشروط لقوانين المملكة العربية السعودية. أي نزاع يُحل عبر التفاوض أولاً ثم المحاكم السعودية المختصة.`,
              },
              {
                title: '10. التواصل',
                content: `لأي استفسار عن الشروط:
📧 البريد: support@sendsbot.com`,
              },
            ].map(section => (
              <div key={section.title} style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '4px', height: '20px', background: 'var(--gradient)', borderRadius: '2px', display: 'inline-block' }} />
                  {section.title}
                </h2>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', whiteSpace: 'pre-line' }}>
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '40px 0' }} />

          {/* English */}
          <div style={{ direction: 'ltr', textAlign: 'left' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Terms of Service</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '40px' }}>Last updated: April 2026</p>

            <div style={{ padding: '16px 20px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', marginBottom: '32px', fontSize: '14px', color: '#F59E0B' }}>
              ⚠️ Please read these terms carefully before using the platform. Using the platform means you fully accept these terms.
            </div>

            {[
              {
                title: '1. Acceptance of Terms',
                content: 'By using Sends Bot, you agree to be bound by these terms. If you disagree with any part, please do not use the platform.',
              },
              {
                title: '2. Acceptable Use',
                content: `Permitted uses:
✅ Business communication with customers
✅ Marketing to opted-in subscribers
✅ Customer service and support

Prohibited uses:
❌ Sending spam or unsolicited messages
❌ Posting harmful or illegal content
❌ Violating WhatsApp/Meta terms of service
❌ Any fraudulent activity`,
              },
              {
                title: '3. Subscriptions & Payment',
                content: `• Subscriptions are monthly and auto-renew unless cancelled
• Trial periods vary by plan
• No refunds after the paid period begins
• Cancellation takes effect at end of billing period
• We reserve the right to change prices with 30 days notice`,
              },
              {
                title: '4. Limitation of Liability',
                content: `• Sends Bot is not responsible for WhatsApp/Meta banning your numbers
• We are not liable for losses from service interruptions
• Our maximum liability does not exceed your monthly subscription fee
• Service is provided "as-is" without express warranties`,
              },
              {
                title: '5. Contact',
                content: 'For any inquiries about these terms:\n📧 support@sendsbot.com',
              },
            ].map(section => (
              <div key={section.title} style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '4px', height: '20px', background: 'var(--gradient)', borderRadius: '2px', display: 'inline-block' }} />
                  {section.title}
                </h2>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', whiteSpace: 'pre-line' }}>
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          <Link href="/" style={{ color: 'var(--accent-violet-light)', textDecoration: 'none' }}>Sends Bot</Link> — جميع الحقوق محفوظة © 2026
        </div>
      </div>
    </div>
  )
}
