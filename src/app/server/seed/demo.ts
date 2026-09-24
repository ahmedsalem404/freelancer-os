/**
 * Loads the demo data (the same data the mock UI showed) into SQLite.
 * Dates are relative to "today" so every state (due soon, overdue, grace…)
 * is visible right after a reset. Seed ids stay readable ('c-nakhla').
 */
import { subMonths, subYears, parseISO, format } from 'date-fns'
import { dailyRates, seedDb } from '@/mock/seed'
import type { Database } from '@/shared/db/database'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import { importantDates } from '@/features/calendar/server/calendar.table'
import { clients, vaultEntries } from '@/features/clients/server/clients.table'
import { engagementCycles } from '@/features/engagements/server/cycles.table'
import { engagements } from '@/features/engagements/server/engagements.table'
import {
  approvals,
  reviewRounds,
} from '@/features/engagements/server/rounds.table'
import {
  deliverables,
  engagementStages,
} from '@/features/engagements/server/work.table'
import { attachments } from '@/features/files/server/attachments.table'
import {
  expenses,
  ownSubscriptions,
} from '@/features/finance/server/finance.table'
import {
  invoiceItems,
  invoices,
} from '@/features/invoices/server/invoices.table'
import { payments } from '@/features/invoices/server/payments.table'
import { leads } from '@/features/leads/server/leads.table'
import { exchangeRates } from '@/features/rates/server/rates.table'
import {
  billingIdentities,
  paymentMethods,
} from '@/features/settings/server/identities.table'
import { settings } from '@/features/settings/server/settings.table'
import { teamMembers } from '@/features/settings/server/team.table'
import { timeEntries } from '@/features/time/server/time.table'
import { dailyReflections, tasks } from '@/features/today/server/today.table'

const OWNER = 'm-owner'

function insertAll<T extends SQLiteTable>(
  db: Database,
  table: T,
  rows: T['$inferInsert'][]
) {
  if (rows.length > 0) db.insert(table).values(rows).run()
}

const startedBefore = (renewsOn: string, period: 'monthly' | 'yearly') =>
  format(
    period === 'monthly'
      ? subMonths(parseISO(renewsOn), 1)
      : subYears(parseISO(renewsOn), 1),
    'yyyy-MM-dd'
  )

export function seedDemo(db: Database) {
  const demo = seedDb()
  const engagementAmount = new Map(
    demo.engagements.map((e) => [e.id, e.amount])
  )

  db.transaction((tx) => {
    // Identities first: settings.default_billing_identity_id references them.
    insertAll(tx, billingIdentities, demo.identities)
    insertAll(tx, settings, [
      { id: 1, ...demo.settings, defaultBillingIdentityId: 'bi-personal' },
    ])
    insertAll(tx, teamMembers, demo.team)
    insertAll(
      tx,
      paymentMethods,
      demo.paymentMethods.map((m, position) => ({ ...m, position }))
    )
    insertAll(
      tx,
      exchangeRates,
      dailyRates.map((r) => ({
        id: `rate-${r.day}`,
        effectiveOn: r.day,
        sarInYer: r.sarInYer,
        usdInYer: r.usdInYer,
      }))
    )
    insertAll(tx, clients, demo.clients)
    insertAll(tx, vaultEntries, demo.vault)
    insertAll(tx, engagements, demo.engagements)
    insertAll(
      tx,
      engagementCycles,
      demo.cycles.map((c) => ({
        ...c,
        amount: engagementAmount.get(c.engagementId) ?? 0,
      }))
    )
    insertAll(tx, engagementStages, demo.stages)
    insertAll(tx, deliverables, demo.deliverables)
    insertAll(
      tx,
      reviewRounds,
      demo.rounds.map((r) => ({
        ...r,
        createdBy: r.source === 'client_link' ? undefined : OWNER,
      }))
    )
    insertAll(
      tx,
      approvals,
      demo.approvals.map((a) => ({
        ...a,
        recordedBy: a.source === 'owner' ? OWNER : undefined,
      }))
    )
    insertAll(
      tx,
      leads,
      demo.leads.map((l, position) => ({
        ...l,
        position,
        closedAt:
          l.stage === 'won' || l.stage === 'lost'
            ? `${l.lastContactOn}T09:00:00.000Z`
            : undefined,
      }))
    )
    insertAll(
      tx,
      invoices,
      demo.invoices.map((i) => ({
        ...i,
        issuedAt:
          i.state === 'draft' ? undefined : `${i.issueOn}T09:00:00.000Z`,
        voidedAt: i.state === 'void' ? `${i.issueOn}T09:00:00.000Z` : undefined,
      }))
    )
    insertAll(
      tx,
      invoiceItems,
      demo.invoiceItems.map((it, position) => ({ ...it, position }))
    )
    insertAll(
      tx,
      payments,
      demo.payments.map((p) => ({
        ...p,
        confirmedAt:
          p.status === 'confirmed'
            ? `${p.receivedOn}T09:00:00.000Z`
            : undefined,
      }))
    )
    insertAll(
      tx,
      attachments,
      demo.attachments.map((a) => ({ ...a, uploadedBy: OWNER }))
    )
    insertAll(
      tx,
      ownSubscriptions,
      demo.ownSubscriptions.map((s) => ({
        ...s,
        startedOn: startedBefore(s.nextRenewalOn, s.period),
      }))
    )
    insertAll(tx, expenses, demo.expenses)
    insertAll(tx, timeEntries, demo.timeEntries)
    insertAll(tx, importantDates, demo.importantDates)
    insertAll(
      tx,
      tasks,
      demo.tasks.map((t) => ({ ...t, createdBy: t.assigneeId }))
    )
    insertAll(tx, dailyReflections, demo.reflections)
  })
}
