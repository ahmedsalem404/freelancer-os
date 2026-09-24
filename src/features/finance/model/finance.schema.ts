import { z } from 'zod'
import { isoDate, recordId } from '@/shared/model/schema'
import { moneyFieldsSchema } from '@/shared/money/money.schema'
import { EXPENSE_CATEGORIES, SUBSCRIPTION_PERIODS } from './enums'

export const expenseSchema = moneyFieldsSchema.extend({
  id: recordId,
  title: z.string(),
  category: z.enum(EXPENSE_CATEGORIES),
  spentOn: isoDate,
  ownSubscriptionId: recordId.optional(),
})

export const ownSubscriptionSchema = moneyFieldsSchema.extend({
  id: recordId,
  name: z.string(),
  period: z.enum(SUBSCRIPTION_PERIODS),
  nextRenewalOn: isoDate,
})

export type Expense = z.infer<typeof expenseSchema>
export type OwnSubscription = z.infer<typeof ownSubscriptionSchema>
