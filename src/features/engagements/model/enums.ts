export const ENGAGEMENT_TYPES = ['project', 'retainer', 'subscription'] as const
export const ENGAGEMENT_STATUSES = [
  'active',
  'paused',
  'completed',
  'cancelled',
] as const
export const ALLOWANCE_UNITS = [
  'revisions',
  'hours',
  'tickets',
  'days',
] as const
export const CYCLE_PERIODS = ['monthly', 'quarterly', 'yearly'] as const
export const CYCLE_DECISIONS = [
  'pending',
  'renewed',
  'grace',
  'stopped',
] as const
export const DELIVERABLE_ORIGINS = ['contract', 'change_scope'] as const
export const ROUND_SOURCES = ['owner', 'assistant', 'client_link'] as const
export const APPROVAL_SOURCES = ['client_link', 'owner'] as const
export const APPROVAL_DECISIONS = ['approved', 'changes_requested'] as const

export type EngagementType = (typeof ENGAGEMENT_TYPES)[number]
export type EngagementStatus = (typeof ENGAGEMENT_STATUSES)[number]
export type AllowanceUnit = (typeof ALLOWANCE_UNITS)[number]
export type CyclePeriod = (typeof CYCLE_PERIODS)[number]
export type CycleDecision = (typeof CYCLE_DECISIONS)[number]
export type DeliverableOrigin = (typeof DELIVERABLE_ORIGINS)[number]
export type RoundSource = (typeof ROUND_SOURCES)[number]
export type ApprovalSource = (typeof APPROVAL_SOURCES)[number]
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number]
