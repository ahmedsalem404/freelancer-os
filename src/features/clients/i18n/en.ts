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
  },
}
