import { success } from '@/shared/http/envelope'
import { rateLimit } from '@/shared/http/rate-limit'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { portalApproveInput, portalFeedbackInput } from '../model/portal.schema'
import { createPortalLink, revokePortalLink } from './portal-links.service'
import {
  approveViaPortal,
  loadPortalView,
  requestChangesViaPortal,
} from './portal-view.service'

/** Requests per minute one visitor may make to the public portal. */
const PORTAL_REQUESTS_PER_MINUTE = 60
const MINUTE_MS = 60_000

/**
 * Owner endpoints manage the link; `/portal/:token/*` is the public side
 * the client opens. Built per app so the rate limiter's state is per app.
 */
export function createPortalRoutes() {
  return new Hono<AppEnv>()
    .post('/engagements/:id/portal-link', (c) => {
      const id = c.req.param('id')
      const link = c.var.run((ctx) => createPortalLink(ctx, id))
      return c.json(success(link), 201)
    })
    .delete('/engagements/:id/portal-link', (c) => {
      const id = c.req.param('id')
      return c.json(success(c.var.run((ctx) => revokePortalLink(ctx, id))))
    })
    .use(
      '/portal/*',
      rateLimit({ max: PORTAL_REQUESTS_PER_MINUTE, windowMs: MINUTE_MS })
    )
    .get('/portal/:token', (c) => {
      const token = c.req.param('token')
      return c.json(success(c.var.run((ctx) => loadPortalView(ctx, token))))
    })
    .post(
      '/portal/:token/deliverables/:id/approval',
      jsonBody(portalApproveInput),
      (c) => {
        const { token, id } = c.req.param()
        const input = c.req.valid('json')
        const result = c.var.run((ctx) =>
          approveViaPortal(ctx, token, id, input)
        )
        return c.json(success(result), 201)
      }
    )
    .post(
      '/portal/:token/deliverables/:id/rounds',
      jsonBody(portalFeedbackInput),
      (c) => {
        const { token, id } = c.req.param()
        const input = c.req.valid('json')
        const result = c.var.run((ctx) =>
          requestChangesViaPortal(ctx, token, id, input)
        )
        return c.json(success(result), 201)
      }
    )
}
