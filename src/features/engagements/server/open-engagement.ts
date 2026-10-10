import { newId } from '@/shared/db/new-id'
import { required } from '@/shared/http/errors'
import { addMonthsIso } from '@/shared/model/dates'
import type { Currency } from '@/shared/money/currency'
import { money } from '@/shared/money/money'
import type { Ctx } from '@/shared/server/context'
import { latestRates } from '@/features/rates/server'
import { settings } from '@/features/settings/server'
import type {
  AllowanceUnit,
  EngagementType,
  PaymentChannel,
} from '../model/enums'
import { engagementCycles } from './cycles.table'
import { engagements } from './engagements.table'

const UNIT: Record<EngagementType, AllowanceUnit> = {
  project: 'revisions',
  subscription: 'days',
}
const PERIOD_MONTHS = { monthly: 1, yearly: 12 } as const

export type NewEngagement = {
  clientId: string
  billingIdentityId: string
  leadId?: string
  title: string
  type: EngagementType
  paymentChannel?: PaymentChannel
  amountMinor: number
  currency: Currency
  startOn: string
  cyclePeriod?: keyof typeof PERIOD_MONTHS
}

/**
 * Opens an engagement with the shape its type requires (docs/database.md
 * §3); recurring engagements also get their first cycle.
 */
export function openEngagement(ctx: Ctx, input: NewEngagement) {
  const setup = required(ctx.db.select().from(settings).get(), 'settings', '1')
  const isRecurring = input.type !== 'project'
  const graceDays =
    input.type === 'subscription' ? setup.defaultGraceDays : null
  const id = newId('eng')
  ctx.db
    .insert(engagements)
    .values({
      id,
      clientId: input.clientId,
      billingIdentityId: input.billingIdentityId,
      leadId: input.leadId,
      type: input.type,
      status: 'active',
      title: input.title,
      paymentChannel: input.paymentChannel,
      startOn: input.startOn,
      allowanceUnit: UNIT[input.type],
      allowanceIncluded: 0,
      cyclePeriod: isRecurring ? input.cyclePeriod : null,
      graceDays,
      ...money(
        input.amountMinor,
        input.currency,
        latestRates(ctx.db)[input.currency]
      ),
    })
    .run()

  if (isRecurring && input.cyclePeriod) {
    ctx.db
      .insert(engagementCycles)
      .values({
        id: newId('cycle'),
        engagementId: id,
        seq: 1,
        startsOn: input.startOn,
        endsOn: addMonthsIso(input.startOn, PERIOD_MONTHS[input.cyclePeriod]),
        amount: input.amountMinor,
        graceDays: graceDays ?? setup.defaultGraceDays,
      })
      .run()
  }
  return { id }
}
