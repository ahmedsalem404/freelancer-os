import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import {
  assistantInput,
  newAssistantInput,
  resetPasswordInput,
} from '../model/team.input'
import { hashPassword } from './password'
import {
  addAssistant,
  resetAssistantPassword,
  setAssistantActive,
  updateAssistant,
} from './team.service'

/** Owner-only (not in the gate's ANY_MEMBER list). */
export const teamRoutes = new Hono<AppEnv>()
  .post('/team', jsonBody(newAssistantInput), async (c) => {
    const { password, ...input } = c.req.valid('json')
    const passwordHash = await hashPassword(password)
    const saved = c.var.run((ctx) =>
      addAssistant(ctx, { ...input, passwordHash })
    )
    return c.json(success(saved), 201)
  })
  .put('/team/:id', jsonBody(assistantInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => updateAssistant(ctx, id, input))))
  })
  .put('/team/:id/password', jsonBody(resetPasswordInput), async (c) => {
    const id = c.req.param('id')
    const passwordHash = await hashPassword(c.req.valid('json').password)
    return c.json(
      success(c.var.run((ctx) => resetAssistantPassword(ctx, id, passwordHash)))
    )
  })
  .post('/team/:id/deactivate', (c) => {
    const id = c.req.param('id')
    return c.json(
      success(c.var.run((ctx) => setAssistantActive(ctx, id, false)))
    )
  })
  .post('/team/:id/activate', (c) => {
    const id = c.req.param('id')
    return c.json(
      success(c.var.run((ctx) => setAssistantActive(ctx, id, true)))
    )
  })
