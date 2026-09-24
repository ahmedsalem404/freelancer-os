export const LEAD_STAGES = [
  'lead',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const

export type LeadStage = (typeof LEAD_STAGES)[number]
