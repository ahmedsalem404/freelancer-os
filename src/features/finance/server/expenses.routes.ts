import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { expenseInput } from '../model/expense.input'
import { createExpense, deleteExpense, updateExpense } from './expenses.service'

export const expensesRoutes = new Hono<AppEnv>()
  .post('/expenses', jsonBody(expenseInput), (c) => {
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => createExpense(ctx, input))), 201)
  })
  .put('/expenses/:id', jsonBody(expenseInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => updateExpense(ctx, id, input))))
  })
  .delete('/expenses/:id', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => deleteExpense(ctx, id))))
  })
