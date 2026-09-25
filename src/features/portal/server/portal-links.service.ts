import { newId } from '@/shared/db/new-id'
import { notFound } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'
import { findEngagement } from '@/features/engagements/server'
import { clientPortalLinks } from './portal-links.table'
import { hashToken, isWellFormedToken, newPortalToken } from './portal-token'

function revokeActive(ctx: Ctx, engagementId: string) {
  ctx.db
    .update(clientPortalLinks)
    .set({ revokedAt: ctx.now })
    .where(
      and(
        eq(clientPortalLinks.engagementId, engagementId),
        isNull(clientPortalLinks.revokedAt)
      )
    )
    .run()
}

/**
 * Opens the engagement's client link. One link is active at a time, so a
 * new link revokes the previous one. The token is returned once only.
 */
export function createPortalLink(ctx: Ctx, engagementId: string) {
  findEngagement(ctx, engagementId)
  revokeActive(ctx, engagementId)
  const { token, hash, hint } = newPortalToken()
  const id = newId('plink')
  ctx.db
    .insert(clientPortalLinks)
    .values({
      id,
      engagementId,
      tokenHash: hash,
      tokenHint: hint,
      createdBy: ctx.memberId,
      createdAt: ctx.now,
    })
    .run()
  return { id, token, tokenHint: hint }
}

export function revokePortalLink(ctx: Ctx, engagementId: string) {
  findEngagement(ctx, engagementId)
  revokeActive(ctx, engagementId)
  return { engagementId }
}

/**
 * The active link a URL token opens, or a 404 that says nothing about why
 * (unknown, revoked and expired look the same to the visitor).
 */
export function resolvePortalToken(ctx: Ctx, token: string) {
  const link = isWellFormedToken(token)
    ? ctx.db
        .select({
          id: clientPortalLinks.id,
          engagementId: clientPortalLinks.engagementId,
        })
        .from(clientPortalLinks)
        .where(
          and(
            eq(clientPortalLinks.tokenHash, hashToken(token)),
            isNull(clientPortalLinks.revokedAt),
            or(
              isNull(clientPortalLinks.expiresAt),
              gt(clientPortalLinks.expiresAt, ctx.now)
            )
          )
        )
        .get()
    : undefined
  if (!link) throw notFound('portal link', 'requested')
  return link
}

export function recordView(ctx: Ctx, linkId: string) {
  ctx.db
    .update(clientPortalLinks)
    .set({
      viewCount: sql`${clientPortalLinks.viewCount} + 1`,
      lastViewedAt: ctx.now,
    })
    .where(eq(clientPortalLinks.id, linkId))
    .run()
}
