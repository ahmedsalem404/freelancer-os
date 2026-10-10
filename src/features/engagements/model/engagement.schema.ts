import { z } from 'zod'
import { isoDate, isoDateTime, recordId } from '@/shared/model/schema'
import { moneyFieldsSchema } from '@/shared/money/money.schema'
import {
  ALLOWANCE_UNITS,
  CYCLE_DECISIONS,
  CYCLE_PERIODS,
  ENGAGEMENT_STATUSES,
  ENGAGEMENT_TYPES,
  PAYMENT_CHANNELS,
} from './enums'

export const engagementSchema = moneyFieldsSchema.extend({
  id: recordId,
  clientId: recordId,
  leadId: recordId.optional(),
  title: z.string(),
  type: z.enum(ENGAGEMENT_TYPES),
  status: z.enum(ENGAGEMENT_STATUSES),
  allowanceUnit: z.enum(ALLOWANCE_UNITS),
  /** Unused (0); projects use per-deliverable limits. */
  allowanceIncluded: z.number().nonnegative(),
  /** Minor units, in the engagement currency. */
  overageUnitPrice: z.number().int().nonnegative(),
  scopeAgreedDeliverables: z.number().int().nonnegative(),
  cyclePeriod: z.enum(CYCLE_PERIODS).optional(),
  graceDays: z.number().int().nonnegative().optional(),
  paymentChannel: z.enum(PAYMENT_CHANNELS).optional(),
  startOn: isoDate,
  endOn: isoDate.optional(),
  nextAction: z.string(),
  nextActionOn: isoDate.optional(),
  /** Set when hidden from lists; its records stay (see `isArchived`). */
  archivedAt: isoDateTime.optional(),
})

export const cycleSchema = z.object({
  id: recordId,
  engagementId: recordId,
  seq: z.number().int().positive(),
  startsOn: isoDate,
  endsOn: isoDate,
  /** Unused (0): subscriptions have no allowance. */
  includedUnits: z.number().nonnegative().default(0),
  graceDays: z.number().int().nonnegative(),
  graceExtendedDays: z.number().int().nonnegative(),
  decision: z.enum(CYCLE_DECISIONS),
  renewalInvoiceId: recordId.optional(),
})

export type Engagement = z.infer<typeof engagementSchema>
export type EngagementCycle = z.infer<typeof cycleSchema>
