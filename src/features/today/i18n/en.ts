import type { Widen } from '@/shared/i18n/widen'
import type { todayAr } from './ar'

export const todayEn: Widen<typeof todayAr> = {
  today: {
    greeting: 'Good morning, {{name}}',
    subtitle: 'Here is what needs you today',
    tasks: "Today's tasks",
    tasksDone: '{{done}} of {{total}} done',
    addTask: 'Add a task for today…',
    unpaid: 'Waiting to be collected',
    unpaidCount_one: '1 invoice',
    unpaidCount: '{{count}} invoices',
    billable: 'Out-of-scope work',
    billableHint: 'Not billed yet',
    renewals: 'Renewals this week',
    nextActions: 'Next step per engagement',
    alerts: 'Needs a decision',
    noAlerts: 'Nothing stuck. Every engagement is within its limits.',
    wrapUp: 'Wrap up the day',
    upcoming: 'Upcoming',
  },
  reflection: {
    title: 'End of day',
    subtitle: 'Close today clearly and start tomorrow where you left off.',
    done: 'Done today',
    open: 'Still open',
    carry: 'Move all to tomorrow',
    notes: 'A note for tomorrow',
    notesPlaceholder: "Today's win, a lesson, or the first thing tomorrow…",
    complete: 'Complete day',
    saved: 'Day wrapped up',
  },
}
