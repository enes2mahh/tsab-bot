import type { Metadata } from 'next'
import Link from 'next/link'
import { StarField } from '@/components/cosmic/StarField'
import { FloatingOrbs } from '@/components/cosmic/FloatingOrbs'
import { LandingContent } from '@/components/landing/LandingContent'

export const metadata: Metadata = {
  title: 'Tsab Bot - أتمتة واتساب بقوة الذكاء الاصطناعي',
  description: 'منصة متكاملة لإدارة بوتات الواتساب مع ردود ذكية فورية. ابدأ مجاناً لمدة 7 أيام.',
  keywords: 'واتساب بوت، أتمتة واتساب، بوت واتساب، ذكاء اصطناعي، Gemini AI',
}

export default function LandingPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <StarField />
      <FloatingOrbs />
      <LandingContent />
    </main>
  )
}
