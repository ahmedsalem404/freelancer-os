import { newId } from '@/shared/db/new-id'
import { required } from '@/shared/http/errors'
import { money } from '@/shared/money/money'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import { latestRates } from '@/features/rates/server'
import type { ExpenseFields } from '../model/expense.input'
import { expenses } from './finance.table'

function columns(input: ExpenseFields, rateToBase: number) {
  return {
    title: input.title,
    category: input.category,
    ...money(input.amountMinor, input.currency, rateToBase),
    spentOn: input.spentOn,
    vendor: input.vendor ?? null,
    note: input.note ?? null,
  }
}

function findExpense(ctx: Ctx, id: string) {
  return required(
    ctx.db
      .select({ currency: expenses.currency, rateToBase: expenses.rateToBase })
      .from(expenses)
      .where(eq(expenses.id, id))
      .get(),
    'expense',
    id
  )
}

/** Records an expense at today's rate (the rate is snapshotted). */
export function createExpense(ctx: Ctx, input: ExpenseFields) {
  const id = newId('exp')
  const rate = latestRates(ctx.db)[input.currency]
  ctx.db
    .insert(expenses)
    .values({ id, ...columns(input, rate) })
    .run()
  return { id }
}

/**
 * Replaces an expense. Its rate snapshot stays unless the currency changes,
 * so editing a typo never revalues past spending.
 */
export function updateExpense(ctx: Ctx, id: string, input: ExpenseFields) {
  const current = findExpense(ctx, id)
  const rate =
    current.currency === input.currency
      ? current.rateToBase
      : latestRates(ctx.db)[input.currency]
  ctx.db
    .update(expenses)
    .set(columns(input, rate))
    .where(eq(expenses.id, id))
    .run()
  return { id }
}

export function deleteExpense(ctx: Ctx, id: string) {
  findExpense(ctx, id)
  ctx.db.delete(expenses).where(eq(expenses.id, id)).run()
  return { id }
}
