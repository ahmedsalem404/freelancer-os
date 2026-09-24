import type { Widen } from '@/shared/i18n/widen'
import type { settingsAr } from './ar'

export const settingsEn: Widen<typeof settingsAr> = {
  settings: {
    title: 'Settings',
    identities: 'Billing identities',
    identitiesHint:
      'Bill some clients under your name and others under your studio — automatically.',
    currencies: 'Currencies & exchange rates',
    currenciesHint:
      'Every amount keeps the rate of its day. Reports in SAR, USD or YER.',
    rate: '1 {{currency}} in SAR',
    invoicing: 'Invoices & reminders',
    prefix: 'Invoice number prefix',
    dueDays: 'Payment terms (days)',
    nextNumber: 'Next number',
    team: 'Team & permissions',
    roles: {
      owner: 'Owner — sees everything',
      assistant: 'Assistant — sees own tasks only',
    },
    backup: 'Backup',
    backupHint:
      'The database is one file on your machine. Export or restore it any time.',
    export: 'Export backup',
    restore: 'Restore backup',
    backendSoon: 'Coming in the next phase',
    appearance: 'Appearance & language',
  },
}
