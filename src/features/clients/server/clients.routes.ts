import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { clientInput } from '../model/client.input'
import {
  archiveClient,
  deleteClient,
  unarchiveClient,
} from './client-lifecycle'
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
  .post('/clients/:id/archive', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => archiveClient(ctx, id))))
  })
  .post('/clients/:id/unarchive', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => unarchiveClient(ctx, id))))
  })
  .delete('/clients/:id', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => deleteClient(ctx, id))))
  })
