import { addDaysIso } from '@/shared/model/dates'
import type { ImportantDate } from '@/features/calendar/model/calendar.schema'
import { currentCycle } from '@/features/engagements/model/cycles'
import type {
  Engagement,
  EngagementCycle,
} from '@/features/engagements/model/engagement.schema'
import type { OwnSubscription } from '@/features/finance/model/finance.schema'
import {
  invoiceBalance,
  isOpenInvoice,
} from '@/features/invoices/model/invoice-status'
import type { Invoice, Payment } from '@/features/invoices/model/invoice.schema'
import type { Lead } from '@/features/leads/model/lead.schema'
import type { ReminderKind } from './enums'
import { dedupeKey, type ReminderLogRow } from './reminder.schema'

/** A reminder the owner still has to send or dismiss. */
export type PendingReminder = {
  kind: ReminderKind
  targetId: string
  /** The date it is about (due date, cycle end, renewal…). */
  occurrenceOn: string
  /** Days from that date: +7 = a week late, −5 = five days before. */
  offsetDays: number
}

type ScheduleDb = {
  settings: { reminderOffsets: number[]; dueSoonDays: number }
  invoices: Invoice[]
  payments: Payment[]
  engagements: Engagement[]
  cycles: EngagementCycle[]
  leads: Lead[]
  importantDates: ImportantDate[]
  ownSubscriptions: OwnSubscription[]
  reminderLog: ReminderLogRow[]
}

const CLOSED_LEAD_STAGES = new Set(['won', 'lost'])

/** Invoices: only the latest reached offset asks (an unsent +0 gives way to +7). */
function invoiceReminders(db: ScheduleDb, today: string): PendingReminder[] {
  const offsets = [...db.settings.reminderOffsets].sort((a, b) => b - a)
  return db.invoices.flatMap((invoice) => {
    if (!isOpenInvoice(db, invoice, today) || invoiceBalance(db, invoice) <= 0)
      return []
    const reached = offsets.find((o) => addDaysIso(invoice.dueOn, o) <= today)
    return reached === undefined
      ? []
      : [
          {
            kind: 'invoice_due' as const,
            targetId: invoice.id,
            occurrenceOn: invoice.dueOn,
            offsetDays: reached,
          },
        ]
  })
}

/** Something due `before` days ahead of `on` asks from then on. */
const beforeDue = (
  kind: ReminderKind,
  targetId: string,
  on: string,
  before: number,
  today: string
): PendingReminder[] =>
  addDaysIso(on, -before) <= today
    ? [{ kind, targetId, occurrenceOn: on, offsetDays: -before }]
    : []

/**
 * Everything that needs a reminder today and has no logged decision yet.
 * Derived from the data (docs/database.md §3.9): pay an invoice, renew a
 * cycle or handle a date and its reminder simply stops.
 */
export function pendingReminders(
  db: ScheduleDb,
  today: string
): PendingReminder[] {
  const renewals = db.engagements.flatMap((e) => {
    if (e.type !== 'subscription' || e.status !== 'active') return []
    const cycle = currentCycle(db, e.id)
    return cycle
      ? beforeDue(
          'subscription_renewal',
          e.id,
          cycle.endsOn,
          db.settings.dueSoonDays,
          today
        )
      : []
  })
  const own = db.ownSubscriptions.flatMap((s) =>
    beforeDue(
      'own_subscription',
      s.id,
      s.nextRenewalOn,
      s.remindDaysBefore,
      today
    )
  )
  const dates = db.importantDates.flatMap((d) =>
    d.handledOn
      ? []
      : beforeDue('important_date', d.id, d.dueOn, d.remindDaysBefore, today)
  )
  const leads = db.leads.flatMap((l) =>
    l.nextFollowUpOn && !CLOSED_LEAD_STAGES.has(l.stage)
      ? beforeDue('lead_follow_up', l.id, l.nextFollowUpOn, 0, today)
      : []
  )
  const decided = new Set(db.reminderLog.map(dedupeKey))
  return [
    ...invoiceReminders(db, today),
    ...renewals,
    ...own,
    ...dates,
    ...leads,
  ]
    .filter((r) => !decided.has(dedupeKey(r)))
    .sort((a, b) =>
      addDaysIso(a.occurrenceOn, a.offsetDays).localeCompare(
        addDaysIso(b.occurrenceOn, b.offsetDays)
      )
    )
}
