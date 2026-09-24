import type { ZodType } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { failure } from './envelope'

/** JSON body validator that answers bad input with the standard envelope. */
export const jsonBody = <T extends ZodType>(schema: T) =>
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      const issue = result.error.issues[0]
      const where = issue?.path.join('.') || 'body'
      return c.json(
        failure('invalid_input', `${where}: ${issue?.message ?? 'invalid'}`),
        400
      )
    }
  })
