import { newId } from '@/shared/db/new-id'
import type { Ctx } from '@/shared/server/context'
import type { SaveReflectionInput } from '../model/today.schema'
import { dailyReflections } from './today.table'

/** One reflection per member per day; saving again replaces the note. */
export function saveReflection(ctx: Ctx, input: SaveReflectionInput) {
  ctx.db
    .insert(dailyReflections)
    .values({
      id: newId('refl'),
      memberId: ctx.memberId,
      day: ctx.today,
      note: input.note,
    })
    .onConflictDoUpdate({
      target: [dailyReflections.memberId, dailyReflections.day],
      set: { note: input.note },
    })
    .run()
  return { day: ctx.today }
}
