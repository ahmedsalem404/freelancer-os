import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import {
  calendarEventInput,
  importantDateInput,
} from '../model/calendar.schema'
import {
  addEvent,
  archiveImportantDate,
  deleteEvent,
  handleImportantDate,
  saveImportantDate,
  updateEvent,
} from './calendar.service'

/** Owner-only: manual events and important dates (domains, SSL…). */
export const calendarRoutes = new Hono<AppEnv>()
  .post('/calendar-events', jsonBody(calendarEventInput), (c) => {
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => addEvent(ctx, input))), 201)
  })
  .put('/calendar-events/:id', jsonBody(calendarEventInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => updateEvent(ctx, id, input))))
  })
  .delete('/calendar-events/:id', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => deleteEvent(ctx, id))))
  })
  .post('/important-dates', jsonBody(importantDateInput), (c) => {
    const input = c.req.valid('json')
    return c.json(
      success(c.var.run((ctx) => saveImportantDate(ctx, undefined, input))),
      201
    )
  })
  .put('/important-dates/:id', jsonBody(importantDateInput), (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    return c.json(
      success(c.var.run((ctx) => saveImportantDate(ctx, id, input)))
    )
  })
  .post('/important-dates/:id/handled', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => handleImportantDate(ctx, id))))
  })
  .post('/important-dates/:id/archive', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => archiveImportantDate(ctx, id))))
  })
