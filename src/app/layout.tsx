import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata(): Promise<Metadata> {
  // Fetch dynamic platform branding from system_settings
  let name = 'Tsab Bot'
  let ogImage: string | undefined
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('system_settings').select('settings').eq('id', 'global').single()
    const s = (data?.settings || {}) as Record<string, string>
    if (s.platform_name) name = s.platform_name
    if (s.og_image_url) ogImage = s.og_image_url
  } catch {}

  const title = `${name} - منصة أتمتة واتساب بالذكاء الاصطناعي`
  const description = `منصة متكاملة لإدارة بوتات الواتساب مع ردود ذكية فورية بقوة Gemini AI`

  return {
    title,
    description,
    keywords: 'واتساب بوت، أتمتة واتساب، بوت واتساب، chatbot whatsapp, whatsapp automation, ai chatbot',
    openGraph: {
      title: name,
      description,
      type: 'website',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
