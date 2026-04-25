'use client'

import { LangProvider } from '@/lib/lang'

export function Providers({ children }: { children: React.ReactNode }) {
  return <LangProvider>{children}</LangProvider>
}
