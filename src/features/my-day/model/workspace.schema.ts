import { z } from 'zod'
import {
  isoDate,
  isoDateTime,
  recordId,
  stripNulls,
} from '@/shared/model/schema'

/**
 * What an assistant sees (`GET /api/workspace`): their own tasks, time and
 * note, and only the titles of the engagements their tasks belong to.
 * No money, clients, invoices or settings (docs/database.md §3.1).
 */
export const workspaceSchema = z.object({
  today: isoDate,
  tasks: z.array(
    z.object({
      id: recordId,
      title: z.string(),
      engagementId: recordId.optional(),
      dueOn: isoDate.optional(),
      completedAt: isoDateTime.optional(),
    })
  ),
  engagements: z.array(z.object({ id: recordId, title: z.string() })),
  timeEntries: z.array(
    z.object({
      id: recordId,
      engagementId: recordId.optional(),
      description: z.string(),
      minutes: z.number().int(),
      workOn: isoDate,
    })
  ),
  reflection: z.string(),
})

/** Raw JSON (SQL NULLs) → validated workspace. */
export const workspaceResponse = z.preprocess(stripNulls, workspaceSchema)

export type Workspace = z.infer<typeof workspaceSchema>
