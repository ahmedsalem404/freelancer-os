import type { Widen } from '@/shared/i18n/widen'
import type { clientsAr } from './ar'

export const clientsEn: Widen<typeof clientsAr> = {
  health: { good: 'Healthy', watch: 'Watch', risk: 'At risk' },
  clients: {
    title: 'Clients',
    count_one: '1 client',
    count: '{{count}} clients',
    add: 'New client',
    person: 'Individual',
    company: 'Company',
    city: 'City',
    localTime: 'Local time',
    identity: 'Billing identity',
    currency: 'Currency',
    health: 'Client health',
    revenue: 'Collected',
    outstanding: 'Outstanding',
    since: 'Client since',
    vault: 'Access vault',
    vaultHint: 'Encrypted logins — visible to you only',
    noVault: 'No saved logins',
    engagements: 'Engagements',
    invoices: 'Invoices',
    edit: 'Edit',
    notes: 'Notes',
    form: {
      editTitle: 'Edit client',
      hint: 'Only the name and currency are required; add the rest later.',
      name: 'Contact name',
      company: 'Company (optional)',
      email: 'Email',
      notes: 'Notes',
      created: 'Client added',
      updated: 'Changes saved',
      bad: {
        whatsapp: 'Digits only, with the country code, e.g. 967771234567',
        email: 'This email is not valid',
      },
    },
  },
}
