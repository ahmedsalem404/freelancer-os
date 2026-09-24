import type { Database } from '@/shared/db/database'
import { loadCalendar } from '@/features/calendar/server/calendar.repo'
import { loadClients } from '@/features/clients/server/clients.repo'
import { loadEngagements } from '@/features/engagements/server/engagements.repo'
import { loadFiles } from '@/features/files/server/files.repo'
import { loadFinance } from '@/features/finance/server/finance.repo'
import { loadInvoices } from '@/features/invoices/server/invoices.repo'
import { loadLeads } from '@/features/leads/server/leads.repo'
import { loadRates } from '@/features/rates/server/rates.repo'
import { loadSettings } from '@/features/settings/server/settings.repo'
import { loadTime } from '@/features/time/server/time.repo'
import { loadToday } from '@/features/today/server/today.repo'

/**
 * Composes every feature's read slice into the one snapshot the UI parses
 * (ARCHITECTURE.md §4). Read in one transaction so the slices agree.
 */
export function loadSnapshot(db: Database) {
  return db.transaction((tx) => ({
    ...loadSettings(tx),
    ...loadRates(tx),
    ...loadClients(tx),
    ...loadLeads(tx),
    ...loadEngagements(tx),
    ...loadInvoices(tx),
    ...loadFinance(tx),
    ...loadTime(tx),
    ...loadToday(tx),
    ...loadCalendar(tx),
    ...loadFiles(tx),
  }))
}

export type Snapshot = ReturnType<typeof loadSnapshot>
