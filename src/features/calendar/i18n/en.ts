import type { Widen } from '@/shared/i18n/widen'
import type { calendarAr } from './ar'

export const calendarEn: Widen<typeof calendarAr> = {
  calendar: {
    title: 'Calendar',
    subtitle:
      'Deliverables, renewals, domains and your own events in one place.',
    kinds: {
      event: 'Event',
      deliverable: 'Deliverable',
      renewal: 'Subscription renewal',
      invoice: 'Invoice due',
      domain: 'Domain',
      ssl: 'SSL',
      license: 'License',
      hosting: 'Hosting',
      other: 'Key date',
    },
    nothing: 'Nothing on this day',
    prev: 'Previous month',
    next: 'Next month',
    addEvent: 'Add event',
    editEvent: 'Edit event',
    eventTitle: 'Title',
    startsOn: 'Date',
    endsOn: 'Ends on (optional)',
    time: 'Time (optional)',
    noClient: 'No client',
    endBeforeStart: 'The end is before the start',
    eventSaved: 'Event saved',
    deleteEventHint: 'The event is removed from the calendar for good.',
    addDate: 'Key date',
    editDate: 'Edit key date',
    dateHint:
      'A domain, certificate or license — with a reminder before it lapses.',
    dateKind: 'Type',
    otherKind: 'Other',
    dueOn: 'Expires on',
    remindDays: 'Remind me (days before)',
    recurrence: 'Repeats',
    recurrences: { none: 'Once', monthly: 'Monthly', yearly: 'Yearly' },
    dateSaved: 'Date saved',
    handle: {
      none: 'Done',
      monthly: 'Renewed (next month)',
      yearly: 'Renewed (next year)',
    },
    handled: 'Done — moved to the next date',
    archiveTitle: 'Archive “{{name}}”?',
    archiveHint: 'It leaves the calendar and the reminders.',
  },
}
