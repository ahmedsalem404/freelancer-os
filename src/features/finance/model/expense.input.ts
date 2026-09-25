import { z } from 'zod'
import { isoDate, optionalText } from '@/shared/model/schema'
import { currencySchema } from '@/shared/money/money.schema'
import { EXPENSE_CATEGORIES } from './enums'

/** Body of `POST /api/expenses` and `PUT /api/expenses/:id`. Minor units. */
export const expenseInput = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.enum(EXPENSE_CATEGORIES),
  amountMinor: z.number().int().positive(),
  currency: currencySchema,
  spentOn: isoDate,
  vendor: optionalText(120),
  note: optionalText(2000),
})

export type ExpenseInput = z.input<typeof expenseInput>
export type ExpenseFields = z.output<typeof expenseInput>
