import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { logTimeInput } from '../model/time.schema'
import { billExtraHours } from './bill-hours.service'
import { logTime } from './time.service'

export const timeRoutes = new Hono<AppEnv>()
  .post('/time', jsonBody(logTimeInput), (c) => {
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => logTime(ctx, input))), 201)
  })
  .post('/engagements/:id/bill-hours', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => billExtraHours(ctx, id))), 201)
  })
