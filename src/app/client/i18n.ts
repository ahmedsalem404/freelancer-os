/**
 * Composes every feature's strings into one dictionary per language and
 * initialises i18next (the global instance). Keys stay global — a feature
 * owns the files its sections live in, not a separate namespace.
 */
import { sharedAr } from '@/shared/i18n/ar'
import { sharedEn } from '@/shared/i18n/en'
import { initialLang } from '@/shared/i18n/lang'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { authAr } from '@/features/auth/i18n/ar'
import { authEn } from '@/features/auth/i18n/en'
import { calendarAr } from '@/features/calendar/i18n/ar'
import { calendarEn } from '@/features/calendar/i18n/en'
import { clientsAr } from '@/features/clients/i18n/ar'
import { clientsEn } from '@/features/clients/i18n/en'
import { engagementsAr } from '@/features/engagements/i18n/ar'
import { engagementsEn } from '@/features/engagements/i18n/en'
import { filesAr } from '@/features/files/i18n/ar'
import { filesEn } from '@/features/files/i18n/en'
import { financeAr } from '@/features/finance/i18n/ar'
import { financeEn } from '@/features/finance/i18n/en'
import { invoicesAr } from '@/features/invoices/i18n/ar'
import { invoicesEn } from '@/features/invoices/i18n/en'
import { leadsAr } from '@/features/leads/i18n/ar'
import { leadsEn } from '@/features/leads/i18n/en'
import { myDayAr } from '@/features/my-day/i18n/ar'
import { myDayEn } from '@/features/my-day/i18n/en'
import { portalAr } from '@/features/portal/i18n/ar'
import { portalEn } from '@/features/portal/i18n/en'
import { pricingAr } from '@/features/pricing/i18n/ar'
import { pricingEn } from '@/features/pricing/i18n/en'
import { ratesAr } from '@/features/rates/i18n/ar'
import { ratesEn } from '@/features/rates/i18n/en'
import { remindersAr } from '@/features/reminders/i18n/ar'
import { remindersEn } from '@/features/reminders/i18n/en'
import { settingsAr } from '@/features/settings/i18n/ar'
import { settingsEn } from '@/features/settings/i18n/en'
import { timeAr } from '@/features/time/i18n/ar'
import { timeEn } from '@/features/time/i18n/en'
import { todayAr } from '@/features/today/i18n/ar'
import { todayEn } from '@/features/today/i18n/en'

const ar = {
  ...sharedAr,
  ...todayAr,
  ...clientsAr,
  ...engagementsAr,
  ...leadsAr,
  ...calendarAr,
  ...financeAr,
  ...invoicesAr,
  ...timeAr,
  ...pricingAr,
  ...ratesAr,
  ...settingsAr,
  ...portalAr,
  ...authAr,
  ...myDayAr,
  ...filesAr,
  ...remindersAr,
}

const en = {
  ...sharedEn,
  ...todayEn,
  ...clientsEn,
  ...engagementsEn,
  ...leadsEn,
  ...calendarEn,
  ...financeEn,
  ...invoicesEn,
  ...timeEn,
  ...pricingEn,
  ...ratesEn,
  ...settingsEn,
  ...portalEn,
  ...authEn,
  ...myDayEn,
  ...filesEn,
  ...remindersEn,
}

void i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: initialLang(),
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
})
