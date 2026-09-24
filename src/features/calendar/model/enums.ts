export const DATE_KINDS = [
  'domain',
  'ssl',
  'hosting',
  'license',
  'other',
] as const
export const DATE_RECURRENCES = ['none', 'monthly', 'yearly'] as const

export type DateKind = (typeof DATE_KINDS)[number]
export type DateRecurrence = (typeof DATE_RECURRENCES)[number]
