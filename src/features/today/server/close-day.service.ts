import type { Ctx } from '@/shared/server/context'
import type { SaveReflectionInput } from '../model/today.schema'
import { saveReflection } from './reflections.service'
import { carryOverTasks } from './tasks.service'

/**
 * End of day in one transaction: save the reflection and move unfinished
 * tasks to tomorrow — either both happen or neither does.
 */
export function closeDay(ctx: Ctx, input: SaveReflectionInput) {
  const { day } = saveReflection(ctx, input)
  const { moved } = carryOverTasks(ctx)
  return { day, moved }
}
