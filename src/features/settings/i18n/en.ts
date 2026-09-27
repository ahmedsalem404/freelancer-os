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
      'A full copy in one file: the data, uploaded files and the vault key. Keep it somewhere safe, off this machine.',
    backupPrivate:
      'The backup opens the vault for whoever holds it — never send it or upload it anywhere public.',
    backupPreparing: 'Preparing…',
    backupDone: 'Backup downloaded',
    backendSoon: 'Coming in the next phase',
    export: 'Download backup',
    appearance: 'Appearance & language',
  },
  templates: {
    title: 'Message templates',
    hint: 'The WhatsApp texts the app sends. Tap a field below to insert it at the cursor.',
    which: 'Message',
    preview: 'Preview (sample values)',
    reset: 'Restore the original text',
    resetDone: 'Original text restored',
    saved: 'Template saved',
    keys: {
      invoice_send: 'Send an invoice',
      reminder_due: 'Due-day reminder',
      reminder_overdue: 'Overdue reminder',
      renewal_notice: 'Subscription renewal notice',
      portal_link: 'Client follow-up link',
      lead_follow_up: 'Lead follow-up',
    },
    vars: {
      client_name: 'Client name',
      invoice_number: 'Invoice number',
      amount: 'Amount',
      balance: 'Balance',
      due_on: 'Due date',
      days_late: 'Days late',
      pay_methods: 'Payment methods',
      service: 'Service',
      ends_on: 'End date',
      link: 'Link',
    },
  },
}
