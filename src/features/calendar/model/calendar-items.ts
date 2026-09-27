import { currentCycle } from '@/features/engagements/model/cycles'
import type {
  Engagement,
  EngagementCycle,
} from '@/features/engagements/model/engagement.schema'
import type { Deliverable } from '@/features/engagements/model/work.schema'
import { isOpenInvoice } from '@/features/invoices/model/invoice-status'
import type { Invoice, Payment } from '@/features/invoices/model/invoice.schema'
import type { CalendarEvent, ImportantDate } from './calendar.schema'

export type ItemKind =
  | 'event'
  | 'deliverable'
  | 'renewal'
  | 'invoice'
  | 'domain'
  | 'ssl'
  | 'license'
  | 'hosting'
  | 'other'

/** One entry on the calendar, whatever it comes from. */
export type CalendarItem = {
  id: string
  date: string
  kind: ItemKind
  title: string
  time?: string
  engagementId?: string
  invoiceId?: string
  /** Set for manual events: they can be edited here. */
  event?: CalendarEvent
  /** Set for important dates: they can be handled or edited here. */
  importantDate?: ImportantDate
}

type CalendarDb = {
  deliverables: Deliverable[]
  engagements: Engagement[]
  cycles: EngagementCycle[]
  invoices: Invoice[]
  payments: Payment[]
  importantDates: ImportantDate[]
  calendarEvents: CalendarEvent[]
}

/** Every day of an event from its start to its end (inclusive). */
function eventDays(event: CalendarEvent): string[] {
  const days = [event.startsOn]
  const end = event.endsOn ?? event.startsOn
  let day = new Date(`${event.startsOn}T00:00:00Z`)
  while (days[days.length - 1] < end) {
    day = new Date(day.getTime() + 86_400_000)
    days.push(day.toISOString().slice(0, 10))
  }
  return days
}

/**
 * The calendar is a derived view (docs/database.md §3.9): due dates of
 * deliverables, cycle ends, unpaid invoices and important dates, plus the
 * owner's manual events.
 */
export function calendarItems(db: CalendarDb, today: string): CalendarItem[] {
  const deliverables = db.deliverables.flatMap((d) =>
    d.dueOn
      ? [
          {
            id: d.id,
            date: d.dueOn,
            kind: 'deliverable' as const,
            title: d.title,
            engagementId: d.engagementId,
          },
        ]
      : []
  )
  const renewals = db.engagements.flatMap((e) => {
    const cycle = e.type === 'subscription' ? currentCycle(db, e.id) : undefined
    return cycle
      ? [
          {
            id: cycle.id,
            date: cycle.endsOn,
            kind: 'renewal' as const,
            title: e.title,
            engagementId: e.id,
          },
        ]
      : []
  })
  const invoices = db.invoices
    .filter((i) => isOpenInvoice(db, i, today))
    .map((i) => ({
      id: i.id,
      date: i.dueOn,
      kind: 'invoice' as const,
      title: i.number,
      invoiceId: i.id,
    }))
  const dates = db.importantDates
    .filter((d) => !d.handledOn)
    .map((d) => ({
      id: d.id,
      date: d.dueOn,
      kind: d.kind,
      title: d.title,
      importantDate: d,
    }))
  const events = db.calendarEvents.flatMap((event) =>
    eventDays(event).map((date) => ({
      id: `${event.id}:${date}`,
      date,
      kind: 'event' as const,
      title: event.title,
      time: event.startTime,
      engagementId: event.engagementId,
      event,
    }))
  )
  return [...events, ...deliverables, ...renewals, ...invoices, ...dates]
}
