'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Lang = 'ar' | 'en'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  toggleLang: () => void
}

const LangContext = createContext<LangContextValue>({
  lang: 'ar',
  setLang: () => {},
  toggleLang: () => {},
})

const STORAGE_KEY = 'sends_lang'

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar')
  const [hydrated, setHydrated] = useState(false)

  // Read from localStorage and URL on mount
  useEffect(() => {
    let initial: Lang = 'ar'
    try {
      // 1) Check URL query param ?lang=en
      const params = new URLSearchParams(window.location.search)
      const urlLang = params.get('lang')
      if (urlLang === 'ar' || urlLang === 'en') {
        initial = urlLang
      } else {
        // 2) Else check localStorage
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === 'ar' || stored === 'en') initial = stored
      }
    } catch {}
    setLangState(initial)
    setHydrated(true)
  }, [])

  // Persist on every change
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, lang)
      // Update URL search param without navigation
      const url = new URL(window.location.href)
      url.searchParams.set('lang', lang)
      window.history.replaceState({}, '', url.toString())
      // Set <html lang> + dir
      document.documentElement.lang = lang
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    } catch {}
  }, [lang, hydrated])

  const setLang = (l: Lang) => setLangState(l)
  const toggleLang = () => setLangState((prev) => (prev === 'ar' ? 'en' : 'ar'))

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
