import { required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import { engagementStages } from './work.table'

/** Marks a stage done, or reopens it. */
export function toggleStage(ctx: Ctx, stageId: string) {
  const stage = required(
    ctx.db
      .select({ completedAt: engagementStages.completedAt })
      .from(engagementStages)
      .where(eq(engagementStages.id, stageId))
      .get(),
    'stage',
    stageId
  )
  const completedAt = stage.completedAt ? null : ctx.now
  ctx.db
    .update(engagementStages)
    .set({ completedAt })
    .where(eq(engagementStages.id, stageId))
    .run()
  return { completedAt }
}
