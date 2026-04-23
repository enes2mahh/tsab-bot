import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tsab Bot - منصة أتمتة واتساب بالذكاء الاصطناعي',
  description: 'منصة متكاملة لإدارة بوتات الواتساب مع ردود ذكية فورية بقوة Gemini AI',
  keywords: 'واتساب بوت، أتمتة واتساب، بوت واتساب، chatbot whatsapp',
  openGraph: {
    title: 'Tsab Bot',
    description: 'أتمتة واتساب بقوة الذكاء الاصطناعي',
    type: 'website',
  },
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
      <body>{children}</body>
    </html>
  )
}

