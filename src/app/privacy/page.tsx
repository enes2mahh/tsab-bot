import type { Metadata } from 'next'
import Link from 'next/link'
import { StarField } from '@/components/cosmic/StarField'
import { Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | Sends Bot',
  description: 'سياسة الخصوصية وحماية البيانات لمنصة Sends Bot',
}

export default function PrivacyPage() {
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
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>سياسة الخصوصية</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '40px' }}>آخر تحديث: أبريل 2026</p>

            {[
              {
                title: '1. المعلومات التي نجمعها',
                content: `نجمع المعلومات التالية عند استخدامك لمنصة Sends Bot:
• معلومات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف
• معلومات الاستخدام: بيانات الأجهزة المربوطة، الرسائل المرسلة، سجلات النشاط
• معلومات الدفع: يتم معالجتها بشكل آمن عبر معالجات الدفع المعتمدة ولا نخزن بيانات بطاقتك
• المعلومات التقنية: عنوان IP، نوع المتصفح، بيانات الجلسة`,
              },
              {
                title: '2. كيف نستخدم معلوماتك',
                content: `نستخدم بياناتك لـ:
• تقديم خدمات المنصة وتشغيلها
• تحسين تجربة المستخدم والميزات
• إرسال إشعارات مهمة تتعلق بحسابك
• الامتثال للمتطلبات القانونية
• منع الاحتيال وحماية الأمان`,
              },
              {
                title: '3. مشاركة البيانات',
                content: `لا نبيع بياناتك الشخصية أبداً. قد نشارك البيانات مع:
• مزودي الخدمات المعتمدين (Supabase، Google Gemini) لتشغيل المنصة
• جهات إنفاذ القانون عند الطلب القانوني الصريح
لن نشارك بياناتك مع أطراف ثالثة لأغراض تسويقية`,
              },
              {
                title: '4. أمان البيانات',
                content: `نطبق معايير أمان عالية تشمل:
• تشفير البيانات أثناء النقل (SSL/TLS)
• حماية قاعدة البيانات بسياسات Row Level Security
• مراجعة دورية لصلاحيات الوصول
• نسخ احتياطية منتظمة`,
              },
              {
                title: '5. حقوقك',
                content: `لديك الحق في:
• طلب نسخة من بياناتك الشخصية
• تصحيح البيانات غير الدقيقة
• حذف حسابك وبياناتك (يمكن التواصل معنا)
• سحب الموافقة على أي معالجة اختيارية للبيانات`,
              },
              {
                title: '6. ملفات تعريف الارتباط (Cookies)',
                content: `نستخدم ملفات تعريف الارتباط لـ:
• الحفاظ على جلسة تسجيل الدخول
• تذكر تفضيلاتك
يمكنك التحكم في الكوكيز من إعدادات متصفحك`,
              },
              {
                title: '7. خدمات الطرف الثالث',
                content: `نستخدم الخدمات التالية:
• Google Gemini AI: لمعالجة الردود الذكية (تخضع لسياسة خصوصية Google)
• Supabase: لقاعدة البيانات والمصادقة
• Moyasar/Stripe: لمعالجة المدفوعات`,
              },
              {
                title: '8. تغييرات على السياسة',
                content: `قد نحدّث هذه السياسة دورياً. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة. الاستمرار في استخدام المنصة بعد النشر يعني قبولك للسياسة المحدّثة.`,
              },
              {
                title: '9. تواصل معنا',
                content: `لأي استفسار عن الخصوصية:
📧 البريد: privacy@sendsbot.com
📍 يمكنك أيضاً فتح تذكرة دعم من داخل المنصة`,
              },
            ].map(section => (
              <div key={section.title} style={{ marginBottom: '32px' }}>
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
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Privacy Policy</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '40px' }}>Last updated: April 2026</p>

            {[
              {
                title: '1. Information We Collect',
                content: `We collect the following information when you use Sends Bot:
• Account info: name, email address, phone number
• Usage data: connected devices, messages sent, activity logs
• Payment info: processed securely via certified payment gateways — we do not store card details
• Technical data: IP address, browser type, session data`,
              },
              {
                title: '2. How We Use Your Information',
                content: `We use your data to:
• Provide and operate platform services
• Improve user experience and features
• Send important account notifications
• Comply with legal requirements
• Prevent fraud and ensure security`,
              },
              {
                title: '3. Data Sharing',
                content: `We never sell your personal data. We may share data with:
• Certified service providers (Supabase, Google Gemini) to operate the platform
• Law enforcement when legally required
We will never share your data with third parties for marketing purposes.`,
              },
              {
                title: '4. Data Security',
                content: `We apply high security standards including:
• Data encryption in transit (SSL/TLS)
• Database protection with Row Level Security policies
• Regular access permission reviews
• Regular backups`,
              },
              {
                title: '5. Your Rights',
                content: `You have the right to:
• Request a copy of your personal data
• Correct inaccurate data
• Delete your account and data (contact us)
• Withdraw consent for any optional data processing`,
              },
              {
                title: '6. Cookies',
                content: `We use cookies to:
• Maintain login sessions
• Remember your preferences
You can control cookies through your browser settings.`,
              },
              {
                title: '7. Contact Us',
                content: `For any privacy inquiries:
📧 Email: privacy@sendsbot.com
📍 You can also open a support ticket from within the platform`,
              },
            ].map(section => (
              <div key={section.title} style={{ marginBottom: '32px' }}>
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

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          <Link href="/" style={{ color: 'var(--accent-violet-light)', textDecoration: 'none' }}>Sends Bot</Link> — جميع الحقوق محفوظة © 2026
        </div>
      </div>
    </div>
  )
}
