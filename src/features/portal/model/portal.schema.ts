import { z } from 'zod'
import { isoDate, isoDateTime, recordId } from '@/shared/model/schema'

/**
 * What a client link shows (docs/database.md §3.6): the engagement title,
 * its stages and deliverables. Never money, contacts or other clients.
 */
export const portalViewSchema = z.object({
  identity: z.object({
    name: z.string(),
    initials: z.string(),
    color: z.string(),
  }),
  engagement: z.object({ title: z.string() }),
  stages: z.array(
    z.object({ id: recordId, title: z.string(), isDone: z.boolean() })
  ),
  deliverables: z.array(
    z.object({
      id: recordId,
      title: z.string(),
      dueOn: isoDate.optional(),
      rounds: z.number().int().nonnegative(),
      isApproved: z.boolean(),
    })
  ),
})

/** The owner's list of active links — hint only, never the token. */
export const portalLinkSchema = z.object({
  id: recordId,
  engagementId: recordId,
  tokenHint: z.string(),
  viewCount: z.number().int().nonnegative(),
  lastViewedAt: isoDateTime.optional(),
  createdAt: isoDateTime,
})

/** Answer of `POST /api/engagements/:id/portal-link` — shown once. */
export const createdPortalLinkSchema = z.object({
  id: z.string(),
  token: z.string(),
  tokenHint: z.string(),
})

/** Body of `POST /api/portal/:token/deliverables/:id/approval`. */
export const portalApproveInput = z.object({
  signerName: z.string().trim().min(1).max(120).optional(),
})

/** Body of `POST /api/portal/:token/deliverables/:id/rounds`. */
export const portalFeedbackInput = z.object({
  note: z.string().trim().min(1).max(2000),
})

export type PortalView = z.infer<typeof portalViewSchema>
export type PortalLink = z.infer<typeof portalLinkSchema>
export type PortalApproveInput = z.infer<typeof portalApproveInput>
export type PortalFeedbackInput = z.infer<typeof portalFeedbackInput>
