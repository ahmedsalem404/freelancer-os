import { createContext, useContext, useEffect, useState } from 'react'
import { DirectionProvider as RdxDirProvider } from '@radix-ui/react-direction'
import { LANG_COOKIE, type Lang, dirOf, initialLang } from '@/shared/i18n/lang'
import { setCookie } from '@/shared/lib/cookies'
import i18n from 'i18next'

export type Direction = 'ltr' | 'rtl'

const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type LocaleContextType = {
  lang: Lang
  dir: Direction
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

const LocaleContext = createContext<LocaleContextType | null>(null)

/** Language drives direction: Arabic = RTL, English = LTR. */
export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const dir = dirOf(lang)

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('dir', dir)
    html.setAttribute('lang', lang)
    void i18n.changeLanguage(lang)
  }, [lang, dir])

  const setLang = (next: Lang) => {
    setLangState(next)
    setCookie(LANG_COOKIE, next, LANG_COOKIE_MAX_AGE)
  }

  return (
    <LocaleContext
      value={{
        lang,
        dir,
        setLang,
        toggleLang: () => setLang(lang === 'ar' ? 'en' : 'ar'),
      }}
    >
      <RdxDirProvider dir={dir}>{children}</RdxDirProvider>
    </LocaleContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a DirectionProvider')
  }
  return context
}
