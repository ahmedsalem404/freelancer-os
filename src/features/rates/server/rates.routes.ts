import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { saveDailyRateInput } from '../model/rates.schema'
import { saveDailyRate } from './rates.service'

export const ratesRoutes = new Hono<AppEnv>().put(
  '/rates/today',
  jsonBody(saveDailyRateInput),
  (c) => {
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => saveDailyRate(ctx, input))))
  }
)
