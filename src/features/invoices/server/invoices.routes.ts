import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import {
  createInvoiceInput,
  recordPaymentInput,
  voidInvoiceInput,
} from '../model/invoice.input'
import { createInvoice } from './create-invoice'
import { recordPayment } from './record-payment'
import { voidInvoice } from './void-invoice'

export const invoicesRoutes = new Hono<AppEnv>()
  .post('/invoices', jsonBody(createInvoiceInput), (c) => {
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => createInvoice(ctx, input))), 201)
  })
  .post('/invoices/:id/payments', jsonBody(recordPaymentInput), (c) => {
    const invoiceId = c.req.param('id')
    const input = c.req.valid('json')
    const result = c.var.run((ctx) => recordPayment(ctx, invoiceId, input))
    return c.json(success(result), 201)
  })
  .post('/invoices/:id/void', jsonBody(voidInvoiceInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => voidInvoice(ctx, id, input))))
  })
