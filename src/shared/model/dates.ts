import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  parseISO,
} from 'date-fns'

const ISO_DAY = 'yyyy-MM-dd'

/** `YYYY-MM-DD` + n days (n may be negative). */
export const addDaysIso = (day: string, n: number) =>
  format(addDays(parseISO(day), n), ISO_DAY)

/** `YYYY-MM-DD` + n calendar months (clamped to month end). */
export const addMonthsIso = (day: string, n: number) =>
  format(addMonths(parseISO(day), n), ISO_DAY)

/** Calendar days from `from` to `to` (negative when `to` is earlier). */
export const daysBetween = (from: string, to: string) =>
  differenceInCalendarDays(parseISO(to), parseISO(from))

/** Local calendar day of an instant. */
export const isoDay = (at: Date) => format(at, ISO_DAY)

/** Today on this device, `YYYY-MM-DD`. */
export const todayIso = () => isoDay(new Date())
