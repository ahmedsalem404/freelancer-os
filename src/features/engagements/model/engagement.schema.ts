import { z } from 'zod'
import { isoDate, recordId } from '@/shared/model/schema'
import { moneyFieldsSchema } from '@/shared/money/money.schema'
import {
  ALLOWANCE_UNITS,
  CYCLE_DECISIONS,
  CYCLE_PERIODS,
  ENGAGEMENT_STATUSES,
  ENGAGEMENT_TYPES,
} from './enums'

export const engagementSchema = moneyFieldsSchema.extend({
  id: recordId,
  clientId: recordId,
  leadId: recordId.optional(),
  title: z.string(),
  type: z.enum(ENGAGEMENT_TYPES),
  status: z.enum(ENGAGEMENT_STATUSES),
  allowanceUnit: z.enum(ALLOWANCE_UNITS),
  /** Units included per cycle (retainer) — projects use per-deliverable limits. */
  allowanceIncluded: z.number().nonnegative(),
  /** Minor units, in the engagement currency. */
  overageUnitPrice: z.number().int().nonnegative(),
  scopeAgreedDeliverables: z.number().int().nonnegative(),
  cyclePeriod: z.enum(CYCLE_PERIODS).optional(),
  graceDays: z.number().int().nonnegative().optional(),
  startOn: isoDate,
  endOn: isoDate.optional(),
  nextAction: z.string(),
  nextActionOn: isoDate.optional(),
})

export const cycleSchema = z.object({
  id: recordId,
  engagementId: recordId,
  seq: z.number().int().positive(),
  startsOn: isoDate,
  endsOn: isoDate,
  /** Retainer allowance for this cycle; subscriptions have none (0). */
  includedUnits: z.number().nonnegative().default(0),
  graceDays: z.number().int().nonnegative(),
  graceExtendedDays: z.number().int().nonnegative(),
  decision: z.enum(CYCLE_DECISIONS),
  renewalInvoiceId: recordId.optional(),
})

export type Engagement = z.infer<typeof engagementSchema>
export type EngagementCycle = z.infer<typeof cycleSchema>
