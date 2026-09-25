import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { clientInput } from '../model/client.input'
import { createClient, updateClient } from './create-client'

export const clientsRoutes = new Hono<AppEnv>()
  .post('/clients', jsonBody(clientInput), (c) => {
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => createClient(ctx, input))), 201)
  })
  .put('/clients/:id', jsonBody(clientInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => updateClient(ctx, id, input))))
  })
