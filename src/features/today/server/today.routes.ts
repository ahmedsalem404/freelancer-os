import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { addTaskInput, saveReflectionInput } from '../model/today.schema'
import { closeDay } from './close-day.service'
import { saveReflection } from './reflections.service'
import { addTask, carryOverTasks, toggleTask } from './tasks.service'

export const todayRoutes = new Hono<AppEnv>()
  .post('/tasks', jsonBody(addTaskInput), (c) => {
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => addTask(ctx, input))), 201)
  })
  .post('/tasks/carry-over', (c) =>
    c.json(success(c.var.run((ctx) => carryOverTasks(ctx))))
  )
  .post('/tasks/:id/toggle', (c) => {
    const id = c.req.param('id')
    return c.json(success(c.var.run((ctx) => toggleTask(ctx, id))))
  })
  .put('/reflections/today', jsonBody(saveReflectionInput), (c) => {
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => saveReflection(ctx, input))))
  })
  .post('/day/close', jsonBody(saveReflectionInput), (c) => {
    const input = c.req.valid('json')
    return c.json(success(c.var.run((ctx) => closeDay(ctx, input))))
  })
