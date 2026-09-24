export const CLIENT_KINDS = ['person', 'company'] as const

export type ClientKind = (typeof CLIENT_KINDS)[number]
