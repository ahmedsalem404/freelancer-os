import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getCookie } from '@/lib/cookies'
import { ar } from './ar'
import { en } from './en'

export type Lang = 'ar' | 'en'

export const LANG_COOKIE = 'lang'
export const DEFAULT_LANG: Lang = 'ar'

export const dirOf = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr')

export function initialLang(): Lang {
  const saved = getCookie(LANG_COOKIE)
  return saved === 'en' || saved === 'ar' ? saved : DEFAULT_LANG
}

void i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: initialLang(),
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
})

export default i18n
