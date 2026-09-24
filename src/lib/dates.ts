import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

export type Lang = 'ar' | 'en'

const LOCALES = { ar, en: enUS }

export function formatDate(iso: string, lang: Lang, pattern = 'd MMM') {
  return format(parseISO(iso), pattern, { locale: LOCALES[lang] })
}

/** Positive = in the future, negative = in the past. */
export function daysFrom(today: string, iso: string) {
  return differenceInCalendarDays(parseISO(iso), parseISO(today))
}

export function useLang(): Lang {
  const { i18n } = useTranslation()
  return i18n.language === 'en' ? 'en' : 'ar'
}

export function useDateFormat() {
  const lang = useLang()
  return (iso: string, pattern?: string) => formatDate(iso, lang, pattern)
}
