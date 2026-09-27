import type { Database } from '@/shared/db/database'
import { loadCalendar } from '@/features/calendar/server'
import { loadClients } from '@/features/clients/server'
import { loadEngagements } from '@/features/engagements/server'
import { loadFiles } from '@/features/files/server'
import { loadFinance } from '@/features/finance/server'
import { loadInvoices } from '@/features/invoices/server'
import { loadLeads } from '@/features/leads/server'
import { loadPortal } from '@/features/portal/server'
import { loadRates } from '@/features/rates/server'
import { loadReminders } from '@/features/reminders/server'
import { loadSettings } from '@/features/settings/server'
import { loadTime } from '@/features/time/server'
import { loadToday } from '@/features/today/server'

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
    ...loadPortal(tx),
    ...loadReminders(tx),
  }))
}

export type RawSnapshot = ReturnType<typeof loadSnapshot>
