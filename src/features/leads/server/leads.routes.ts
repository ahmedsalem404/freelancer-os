import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { moveLeadInput } from '../model/lead.schema'
import { moveLead } from './leads.service'

export const leadsRoutes = new Hono<AppEnv>().post(
  '/leads/:id/stage',
  jsonBody(moveLeadInput),
  (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => moveLead(ctx, id, input))))
  }
)
