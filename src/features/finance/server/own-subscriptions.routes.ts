import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { ownSubscriptionInput } from '../model/own-subscription.input'
import {
  cancelOwnSubscription,
  createOwnSubscription,
  deleteOwnSubscription,
  updateOwnSubscription,
} from './own-subscriptions.service'

export const ownSubscriptionsRoutes = new Hono<AppEnv>()
  .post('/own-subscriptions', jsonBody(ownSubscriptionInput), (c) => {
    const input = c.req.valid('json')
    const result = c.var.run((ctx) => createOwnSubscription(ctx, input))
    return c.json(success(result), 201)
  })
  .put('/own-subscriptions/:id', jsonBody(ownSubscriptionInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    const result = c.var.run((ctx) => updateOwnSubscription(ctx, id, input))
    return c.json(success(result))
  })
  .post('/own-subscriptions/:id/cancel', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => cancelOwnSubscription(ctx, id))))
  })
  .delete('/own-subscriptions/:id', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => deleteOwnSubscription(ctx, id))))
  })
