import type { Widen } from '@/shared/i18n/widen'
import type { myDayAr } from './ar'

export const myDayEn: Widen<typeof myDayAr> = {
  myDay: {
    hello: '{{name}}’s day',
    tasks: 'My tasks',
    noTasks: 'No tasks for today. Add one below.',
    later_one: 'Plus one task for later days',
    later: 'Plus {{count}} tasks for later days',
    time: 'My time',
    todayHours: 'Today {{h}} h',
    hours: 'Hours',
    what: 'What you did',
    log: 'Log time',
    logged: 'Time logged',
    closeHint: 'Unfinished tasks move to tomorrow.',
    closed_one: 'Day closed — one task moved to tomorrow',
    closed: 'Day closed — {{count}} tasks moved to tomorrow',
  },
}
