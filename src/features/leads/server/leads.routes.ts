import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { convertLeadInput } from '../model/convert.input'
import { moveLeadInput } from '../model/lead.schema'
import { convertLead } from './convert-lead.service'
import { moveLead } from './leads.service'

export const leadsRoutes = new Hono<AppEnv>()
  .post('/leads/:id/convert', jsonBody(convertLeadInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => convertLead(ctx, id, input))), 201)
  })
  .post('/leads/:id/stage', jsonBody(moveLeadInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => moveLead(ctx, id, input))))
  })
