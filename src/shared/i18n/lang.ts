import { getCookie } from '@/lib/cookies'

export type Lang = 'ar' | 'en'

export const LANG_COOKIE = 'lang'
export const DEFAULT_LANG: Lang = 'ar'

export const dirOf = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr')

/** The language saved in the cookie, else Arabic. */
export function initialLang(): Lang {
  const saved = getCookie(LANG_COOKIE)
  return saved === 'en' || saved === 'ar' ? saved : DEFAULT_LANG
}
