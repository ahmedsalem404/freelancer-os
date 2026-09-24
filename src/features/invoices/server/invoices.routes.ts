import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { recordPaymentInput } from '../model/invoice.input'
import { recordPayment } from './record-payment'

export const invoicesRoutes = new Hono<AppEnv>().post(
  '/invoices/:id/payments',
  jsonBody(recordPaymentInput),
  (c) => {
    const invoiceId = c.req.param('id')
    const input = c.req.valid('json')
    const result = c.var.run((ctx) => recordPayment(ctx, invoiceId, input))
    return c.json(success(result), 201)
  }
)
