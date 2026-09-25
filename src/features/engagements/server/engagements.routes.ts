import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import {
  teamFeedbackInput,
  ownerApproveInput,
  changeScopeInput,
  extendGraceInput,
} from '../model/engagement.input'
import {
  openEngagementInput,
  updateEngagementInput,
  updateTermsInput,
} from '../model/terms.input'
import { extendGrace, renewCycle, stopCycle } from './cycles.service'
import {
  addFeedback,
  approveDeliverable,
  billOverageRounds,
} from './deliverables.service'
import {
  archiveEngagement,
  deleteEngagement,
  unarchiveEngagement,
} from './engagement-lifecycle'
import { createEngagement, updateEngagement } from './engagements.service'
import { changeScope } from './scope.service'
import { toggleStage } from './stages.service'
import { updateTerms } from './terms.service'

export const engagementsRoutes = new Hono<AppEnv>()
  .post('/engagements', jsonBody(openEngagementInput), (c) => {
    const input = c.req.valid('json')
    const result = c.var.run((ctx) => createEngagement(ctx, input))
    return c.json(success(result), 201)
  })
  .put('/engagements/:id', jsonBody(updateEngagementInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => updateEngagement(ctx, id, input))))
  })
  .put('/engagements/:id/terms', jsonBody(updateTermsInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => updateTerms(ctx, id, input))))
  })
  .post('/engagements/:id/archive', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => archiveEngagement(ctx, id))))
  })
  .post('/engagements/:id/unarchive', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => unarchiveEngagement(ctx, id))))
  })
  .delete('/engagements/:id', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => deleteEngagement(ctx, id))))
  })
  .post('/deliverables/:id/rounds', jsonBody(teamFeedbackInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    const result = c.var.run((ctx) => addFeedback(ctx, id, input))
    return c.json(success(result), 201)
  })
  .post('/deliverables/:id/approval', jsonBody(ownerApproveInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    const result = c.var.run((ctx) => approveDeliverable(ctx, id, input))
    return c.json(success(result), 201)
  })
  .post('/deliverables/:id/bill-overage', (c) => {
    const id = c.req.param('id')
    const result = c.var.run((ctx) => billOverageRounds(ctx, id))
    return c.json(success(result), 201)
  })
  .post('/engagements/:id/scope', jsonBody(changeScopeInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    const result = c.var.run((ctx) => changeScope(ctx, id, input))
    return c.json(success(result), 201)
  })
  .post('/engagements/:id/renew', (c) => {
    const id = c.req.param('id')
    const result = c.var.run((ctx) => renewCycle(ctx, id))
    return c.json(success(result), 201)
  })
  .post('/engagements/:id/grace', jsonBody(extendGraceInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => extendGrace(ctx, id, input))))
  })
  .post('/engagements/:id/stop', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => stopCycle(ctx, id))))
  })
  .post('/stages/:id/toggle', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => toggleStage(ctx, id))))
  })
