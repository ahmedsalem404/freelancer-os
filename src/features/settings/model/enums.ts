export const IDENTITY_KINDS = ['personal', 'business'] as const
export const PAYMENT_METHOD_KINDS = ['bank', 'kuraimi', 'usdt', 'cash'] as const
export const TEAM_ROLES = ['owner', 'assistant'] as const

export type IdentityKind = (typeof IDENTITY_KINDS)[number]
export type PaymentMethodKind = (typeof PAYMENT_METHOD_KINDS)[number]
export type TeamRole = (typeof TEAM_ROLES)[number]
